// src/main.ts
import './styles.css';

// Modern AI Receptionist Client
class ReceptionistClient {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sessionId: string = "";
  private transcript: string = "";
  private isConnected: boolean = false;
  
  private readonly API_URL = "http://localhost:3001";

  constructor(
    private transcriptEl: HTMLElement,
    private statusEl: HTMLElement
  ) {}

  // 🎙️ Start receptionist session
  async start(): Promise<void> {
    try {
      this.sessionId = `session_${Date.now()}`;
      this.updateStatus("🔄 Connecting...", "connecting");

      // Get ephemeral token
      const tokenRes = await fetch(`${this.API_URL}/ephemeral-token`, {
        method: "POST",
      });

      if (!tokenRes.ok) {
        throw new Error(`Failed to get token: ${await tokenRes.text()}`);
      }

      const { client_secret } = await tokenRes.json();

      // Set up WebRTC
      this.pc = new RTCPeerConnection();

      // Handle incoming audio
      this.setupAudioPlayback();

      // Get user microphone
      await this.setupMicrophone();

      // Create data channel for events
      this.setupDataChannel();

      // Create and send offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI Realtime API
      const resp = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview",
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${client_secret}`,
            "Content-Type": "application/sdp",
          },
        }
      );

      if (!resp.ok) {
        throw new Error(`Realtime API error: ${resp.status}`);
      }

      const answerSDP = await resp.text();
      await this.pc.setRemoteDescription({ type: "answer", sdp: answerSDP });

      this.isConnected = true;
      this.updateStatus("✅ Connected - Start speaking!", "connected");
      this.addMessage("system", "Receptionist is ready. How can I help you?");
    } catch (err: any) {
      this.updateStatus(`❌ Error: ${err.message}`, "error");
      this.cleanup();
      throw err;
    }
  }

  // 🎧 Set up audio playback
  private setupAudioPlayback(): void {
    if (!this.pc) return;

    this.audioElement = document.createElement("audio");
    this.audioElement.autoplay = true;
    this.audioElement.style.display = "none";
    document.body.appendChild(this.audioElement);

    this.pc.ontrack = (event) => {
      if (this.audioElement && event.streams[0]) {
        this.audioElement.srcObject = event.streams[0];
      }
    };
  }

  // 🎤 Set up microphone input
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

  // 📡 Set up data channel for transcripts
  private setupDataChannel(): void {
    if (!this.pc) return;

    this.dataChannel = this.pc.createDataChannel("oai-events");

    this.dataChannel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Handle different event types
        switch (msg.type) {
          case "response.audio_transcript.delta":
            // Real-time transcript updates (optional)
            break;

          case "response.audio_transcript.done":
            // Complete AI response
            this.addMessage("ai", msg.transcript);
            break;

          case "conversation.item.input_audio_transcription.completed":
            // User's speech transcribed
            this.addMessage("user", msg.transcript);
            break;

          case "error":
            console.error("Realtime API error:", msg);
            this.updateStatus(`⚠️ ${msg.error?.message || "Unknown error"}`, "error");
            break;
        }
      } catch (err) {
        console.warn("Failed to parse message:", event.data);
      }
    };

    this.dataChannel.onerror = (err) => {
      console.error("Data channel error:", err);
      this.updateStatus("⚠️ Connection issue", "error");
    };
  }

  // 💬 Add message to transcript
  private addMessage(role: "user" | "ai" | "system", text: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const icon = role === "user" ? "🗣️" : role === "ai" ? "🤖" : "ℹ️";
    const label = role === "user" ? "You" : role === "ai" ? "Receptionist" : "System";

    const message = `[${timestamp}] ${icon} ${label}: ${text}`;
    this.transcript += message + "\n";

    const messageEl = document.createElement("div");
    messageEl.className = `message message-${role}`;
    messageEl.innerHTML = `
      <span class="timestamp">${timestamp}</span>
      <span class="icon">${icon}</span>
      <span class="label">${label}:</span>
      <span class="text">${this.escapeHtml(text)}</span>
    `;

    this.transcriptEl.appendChild(messageEl);
    this.transcriptEl.scrollTop = this.transcriptEl.scrollHeight;
  }

  // 🔄 Update status display
  private updateStatus(message: string, state: "connecting" | "connected" | "error" | "disconnected"): void {
    this.statusEl.textContent = message;
    this.statusEl.className = `status status-${state}`;
  }

  // 🛑 Stop session and save transcript
  async stop(): Promise<void> {
    this.updateStatus("🔄 Saving transcript...", "disconnected");

    // Save transcript to server
    if (this.transcript.trim()) {
      try {
        await fetch(`${this.API_URL}/save-transcript`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: this.transcript,
            sessionId: this.sessionId,
            metadata: {
              duration: Date.now() - parseInt(this.sessionId.split("_")[1]),
              ended: new Date().toISOString(),
            },
          }),
        });
        this.updateStatus("✅ Transcript saved", "disconnected");
      } catch (err: any) {
        console.error("Failed to save transcript:", err);
        this.updateStatus("⚠️ Transcript save failed", "error");
      }
    }

    this.cleanup();
  }

  // 🧹 Clean up resources
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

  // 🔒 Escape HTML to prevent XSS
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ✅ Check if connected
  isActive(): boolean {
    return this.isConnected;
  }
}

// 🎨 Initialize UI
function initUI() {
  const app = document.getElementById("app") || document.body;
  
  app.innerHTML = `
    <div class="receptionist-container">
      <div class="header">
        <h1>🏠 Tri-State Roofing AI Receptionist</h1>
        <p class="subtitle">Test your AI phone system</p>
      </div>

      <div class="status-bar">
        <div id="status" class="status status-disconnected">
          Ready to connect
        </div>
      </div>

      <div class="controls">
        <button id="startBtn" class="btn btn-primary">
          <span class="btn-icon">🎤</span>
          Start Call
        </button>
        <button id="stopBtn" class="btn btn-danger" disabled>
          <span class="btn-icon">⏹</span>
          End Call
        </button>
      </div>

      <div class="transcript-container">
        <div class="transcript-header">
          <h3>📝 Call Transcript</h3>
          <button id="clearBtn" class="btn-text">Clear</button>
        </div>
        <div id="transcript" class="transcript"></div>
      </div>
    </div>
  `;

  return {
    startBtn: document.getElementById("startBtn") as HTMLButtonElement,
    stopBtn: document.getElementById("stopBtn") as HTMLButtonElement,
    clearBtn: document.getElementById("clearBtn") as HTMLButtonElement,
    transcript: document.getElementById("transcript") as HTMLElement,
    status: document.getElementById("status") as HTMLElement,
  };
}

// 🚀 Main application
async function main() {
  const ui = initUI();
  const client = new ReceptionistClient(ui.transcript, ui.status);

  // Start button
  ui.startBtn.onclick = async () => {
    ui.startBtn.disabled = true;
    ui.stopBtn.disabled = false;

    try {
      await client.start();
    } catch (err) {
      ui.startBtn.disabled = false;
      ui.stopBtn.disabled = true;
    }
  };

  // Stop button
  ui.stopBtn.onclick = async () => {
    ui.stopBtn.disabled = true;
    await client.stop();
    ui.startBtn.disabled = false;
  };

  // Clear transcript
  ui.clearBtn.onclick = () => {
    if (!client.isActive() && confirm("Clear transcript?")) {
      ui.transcript.innerHTML = "";
    }
  };

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (client.isActive()) {
      client.stop();
    }
  });
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}