import { Room, RoomEvent, Track } from 'livekit-client';

type Message = {
  role: 'user' | 'ai' | 'system';
  text: string;
};

type ClientOptions = {
  onMessage: (role: Message['role'], text: string) => void;
  onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
};

export class LiveKitReceptionistClient {
  private room: Room | null = null;
  private sessionId: string = '';
  private transcript: string = '';
  private isConnected: boolean = false;
  private roomName: string = '';

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

      // Get LiveKit token from backend
      const tokenRes = await fetch(`${this.API_URL}/token`, {
        method: 'POST',
      });

      if (!tokenRes.ok) {
        throw new Error(`Failed to get token: ${await tokenRes.text()}`);
      }

      const { token, url, room: roomName } = await tokenRes.json();
      this.roomName = roomName;

      // Create and configure room
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up event listeners
      this.setupRoomListeners();

      // Connect to the room
      await this.room.connect(url, token);

      // Enable microphone - THIS WAS MISSING!
      await this.room.localParticipant.setMicrophoneEnabled(true);

      this.isConnected = true;
      this.onStatusChange('connected');
      this.onMessage('system', 'Connected! The receptionist will greet you shortly.');
    } catch (err: any) {
      console.error('Failed to start LiveKit client:', err);
      this.onStatusChange('error');
      this.cleanup();
      throw err;
    }
  }

  private setupRoomListeners(): void {
    if (!this.room) return;

    // Handle when the agent starts speaking
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio && participant.isAgent) {
        // Agent is speaking
        const audioElement = track.attach();
        audioElement.play();
      }
    });

    // Handle transcriptions
    this.room.on(RoomEvent.TranscriptionReceived, (transcriptions, participant) => {
      transcriptions.forEach((transcription) => {
        const text = transcription.text;
        if (!text) return;

        // Only show final transcriptions, not incremental updates
        if (!transcription.final) return;

        if (participant?.isAgent) {
          // Agent's response
          this.addToTranscript('ai', text);
          this.onMessage('ai', text);
        } else {
          // User's speech
          this.addToTranscript('user', text);
          this.onMessage('user', text);
        }
      });
    });

    // Handle connection state changes
    this.room.on(RoomEvent.Connected, () => {
      this.onStatusChange('connected');
    });

    this.room.on(RoomEvent.Disconnected, () => {
      this.onStatusChange('disconnected');
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      this.onStatusChange('connecting');
      this.onMessage('system', 'Reconnecting...');
    });

    this.room.on(RoomEvent.Reconnected, () => {
      this.onStatusChange('connected');
      this.onMessage('system', 'Reconnected successfully.');
    });

    // Handle errors
    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      if (quality === 'poor') {
        this.onMessage('system', 'Connection quality is poor. Audio may be affected.');
      }
    });
  }

  private addToTranscript(role: 'user' | 'ai', text: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const label = role === 'user' ? 'You' : 'Receptionist';
    this.transcript += `[${timestamp}] ${label}: ${text}\n`;
  }

  async stop(): Promise<void> {
    this.onStatusChange('disconnected');

    // Save transcript if there's content
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
              room: this.roomName,
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

    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
  }

  isActive(): boolean {
    return this.isConnected && this.room !== null;
  }
}
