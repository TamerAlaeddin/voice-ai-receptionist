type Message = {
  role: 'user' | 'ai' | 'system';
  text: string;
};

type ClientOptions = {
  onMessage: (role: Message['role'], text: string) => void;
  onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
};

export class ReceptionistClient {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sessionId: string = '';
  private transcript: string = '';
  private isConnected: boolean = false;

  private readonly API_URL = 'http://localhost:3001';
  private onMessage: ClientOptions['onMessage'];
  private onStatusChange: ClientOptions['onStatusChange'];

  constructor(options: ClientOptions) {
    this.onMessage = options.onMessage;
    this.onStatusChange = options.onStatusChange;
  }

  async start(): Promise<void> {
    try {
      this.sessionId = `session_${Date.now()}`;
      this.onStatusChange('connecting');

      const tokenRes = await fetch(`${this.API_URL}/ephemeral-token`, {
        method: 'POST',
      });

      if (!tokenRes.ok) {
        throw new Error(`Failed to get token: ${await tokenRes.text()}`);
      }

      const { client_secret } = await tokenRes.json();

      this.pc = new RTCPeerConnection();
      this.setupAudioPlayback();
      await this.setupMicrophone();
      this.setupDataChannel();

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const resp = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview',
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${client_secret}`,
            'Content-Type': 'application/sdp',
          },
        }
      );

      if (!resp.ok) {
        throw new Error(`Realtime API error: ${resp.status}`);
      }

      const answerSDP = await resp.text();
      await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSDP });

      this.isConnected = true;
      this.onStatusChange('connected');
      this.onMessage('system', 'Receptionist is ready. How can I help you?');
    } catch (err: any) {
      this.onStatusChange('error');
      this.cleanup();
      throw err;
    }
  }

  private setupAudioPlayback(): void {
    if (!this.pc) return;

    this.audioElement = document.createElement('audio');
    this.audioElement.autoplay = true;
    this.audioElement.style.display = 'none';
    document.body.appendChild(this.audioElement);

    this.pc.ontrack = (event) => {
      if (this.audioElement && event.streams[0]) {
        this.audioElement.srcObject = event.streams[0];
      }
    };
  }

  private async setupMicrophone(): Promise<void> {
    if (!this.pc) return;

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    for (const track of this.localStream.getTracks()) {
      this.pc.addTrack(track, this.localStream);
    }
  }

  private setupDataChannel(): void {
    if (!this.pc) return;

    this.dataChannel = this.pc.createDataChannel('oai-events');

    this.dataChannel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'response.audio_transcript.done':
            this.addToTranscript('ai', msg.transcript);
            this.onMessage('ai', msg.transcript);
            break;

          case 'conversation.item.input_audio_transcription.completed':
            this.addToTranscript('user', msg.transcript);
            this.onMessage('user', msg.transcript);
            break;

          case 'error':
            console.error('Realtime API error:', msg);
            this.onStatusChange('error');
            this.onMessage('system', msg.error?.message || 'Unknown error');
            break;
        }
      } catch (err) {
        console.warn('Failed to parse message:', event.data);
      }
    };

    this.dataChannel.onerror = (err) => {
      console.error('Data channel error:', err);
      this.onStatusChange('error');
    };
  }

  private addToTranscript(role: 'user' | 'ai', text: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const label = role === 'user' ? 'You' : 'Receptionist';
    this.transcript += `[${timestamp}] ${label}: ${text}\n`;
  }

  async stop(): Promise<void> {
    this.onStatusChange('disconnected');

    if (this.transcript.trim()) {
      try {
        await fetch(`${this.API_URL}/save-transcript`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: this.transcript,
            sessionId: this.sessionId,
            metadata: {
              duration: Date.now() - parseInt(this.sessionId.split('_')[1]),
              ended: new Date().toISOString(),
            },
          }),
        });
      } catch (err: any) {
        console.error('Failed to save transcript:', err);
      }
    }

    this.cleanup();
  }

  private cleanup(): void {
    this.isConnected = false;

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.audioElement) {
      this.audioElement.remove();
      this.audioElement = null;
    }
  }

  isActive(): boolean {
    return this.isConnected;
  }
}
