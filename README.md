# 🎙️ Voice AI Receptionist with LiveKit

A production-ready AI voice receptionist built with **LiveKit Agents**, **Python (FastAPI)**, and **Next.js + TypeScript**.
Features an STT-LLM-TTS pipeline with enhanced audio quality, noise cancellation, and telephony support.

---

## 🚀 Features

- 🎧 **High-quality voice pipeline** using AssemblyAI + GPT-4 + Cartesia
- 🔊 **Enhanced noise cancellation** for crystal-clear audio
- 💬 **Natural conversation** with intelligent turn detection
- 🗂️ **Auto-saved transcripts** to `/backend/transcripts`
- 📞 **Telephony ready** - easy SIP/PSTN integration via LiveKit
- 🔒 **Secure tokens** - no API key exposure to frontend
- 📈 **Production scalable** with LiveKit Cloud infrastructure

---

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │◄───────►│   Backend    │◄───────►│  LiveKit     │
│  (Next.js)  │  HTTP   │   (FastAPI)  │  Token  │   Cloud      │
└─────────────┘         └──────────────┘         └──────────────┘
       │                                                  │
       │              WebRTC Audio & Transcriptions      │
       └──────────────────────────────────────────────────┘
                                 │
                                 ▼
                        ┌──────────────┐
                        │  LiveKit     │
                        │   Agent      │
                        │  (Python)    │
                        └──────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
               ┌────────┐  ┌─────────┐  ┌────────┐
               │  STT   │  │   LLM   │  │  TTS   │
               │Assembly│  │ GPT-4.1 │  │Cartesia│
               └────────┘  └─────────┘  └────────┘
```

---

## 🧩 Project Structure

```
voice-ai-receptionist/
├── backend/              # Python backend
│   ├── app/
│   │   ├── main.py       # FastAPI server (token generation, transcripts)
│   │   └── config.py     # Business context and configuration
│   ├── agent.py          # LiveKit voice agent (STT-LLM-TTS pipeline)
│   ├── start_agent.sh    # Helper script to start agent
│   ├── transcripts/      # Saved conversation logs
│   ├── pyproject.toml    # Python dependencies
│   └── .env             # Environment variables (create this)
├── frontend/             # Next.js frontend
│   ├── app/
│   │   └── page.tsx      # Main UI
│   ├── lib/
│   │   └── livekit-receptionist-client.ts  # LiveKit client
│   ├── components/       # UI components
│   └── package.json
├── README.md
└── LIVEKIT_SETUP.md     # Detailed setup guide
```

---

## ⚙️ Setup Instructions

### 1️⃣ Prerequisites

1. **Python 3.13+** - [Download](https://www.python.org/downloads/)
2. **Node.js 20+** - [Download](https://nodejs.org/)
3. **LiveKit Cloud Account** - [Sign up](https://cloud.livekit.io) (free tier available)
4. **OpenAI API Key** - [Get key](https://platform.openai.com/api-keys)

### 2️⃣ Install uv (Python package manager)

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 3️⃣ Clone and Install Dependencies

```bash
# Clone the repo
git clone https://github.com/TamerAlaeddin/voice-ai-receptionist.git
cd voice-ai-receptionist

# Install backend dependencies
cd backend
uv sync

# Download AI model files (VAD, turn detection, noise cancellation)
uv run python agent.py download-files

# Install frontend dependencies
cd ../frontend
npm install
```

### 4️⃣ Configure Environment Variables

Create `backend/.env`:

```env
# LiveKit Cloud (get from https://cloud.livekit.io)
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud

# OpenAI (used by GPT-4 in the pipeline)
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=3001
BUSINESS_PHONE=(555) 123-4567
```

See `.env.example` for reference.

---

## ▶️ Run Locally

You need **3 terminal windows** running simultaneously:

### Terminal 1 - LiveKit Agent
```bash
cd backend
./start_agent.sh
```
Wait for: `✅ registered worker`

### Terminal 2 - Backend API
```bash
cd backend
uv run python -m app.main
```
Wait for: `🚀 Server running on http://localhost:3001`

### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```
Wait for: `✓ Ready in ...`

### Test It!

1. Open **http://localhost:3000** in your browser
2. Click **"Start Call"**
3. Allow microphone access
4. The receptionist will greet you - start speaking!
5. Click **"End Call"** when finished
6. Check `backend/transcripts/` for saved conversation

---

## 🎯 Voice Pipeline

| Component | Provider | Model | Purpose |
|-----------|----------|-------|---------|
| **STT** | AssemblyAI | Universal-Streaming | Real-time speech recognition |
| **LLM** | OpenAI | GPT-4.1 mini | Natural language understanding |
| **TTS** | Cartesia | Sonic-3 | Natural voice synthesis |
| **VAD** | Silero | - | Voice activity detection |
| **Turn Detection** | LiveKit | Multilingual | Conversation flow |
| **Noise Cancellation** | LiveKit | BVC | Audio enhancement |

---

## 📝 API Endpoints

- `POST /token` - Generate LiveKit access token for client
- `POST /save-transcript` - Save conversation transcript
- `GET /transcripts` - List all saved transcripts
- `GET /health` - Health check

---

## 🔧 Customization

### Change AI Models

Edit `backend/agent.py`:

```python
session = AgentSession(
    stt="assemblyai/universal-streaming:en",  # Change STT
    llm="openai/gpt-4.1-mini",                # Change LLM
    tts="cartesia/sonic-3:...",               # Change TTS
    ...
)
```

### Update Business Context

Edit `backend/app/config.py`:

```python
BUSINESS_CONTEXT = {
    "name": "Your Business Name",
    "services": ["service1", "service2"],
    ...
}
```

### Modify Instructions

Edit the `RECEPTIONIST_INSTRUCTIONS` in `backend/app/config.py` to change how the AI behaves.

---

## 🚀 Deploy to Production

Deploy the agent to LiveKit Cloud:

```bash
cd backend
lk agent create
```

See [LIVEKIT_SETUP.md](./LIVEKIT_SETUP.md) for detailed deployment instructions.

---

## 🛠️ Development

### Backend (uv commands)
- `uv sync` - Install/sync dependencies
- `uv add package-name` - Add dependency
- `uv remove package-name` - Remove dependency
- `uv run python -m app.main` - Run backend server

### Frontend (npm commands)
- `npm install` - Install dependencies
- `npm run dev` - Development server
- `npm run build` - Production build

---

## 🐛 Troubleshooting

### Agent won't connect
- Run: `python3 -m pip install --upgrade certifi` (fixes SSL issues on macOS)
- Use `./start_agent.sh` instead of `uv run python agent.py dev`

### No audio
- Check microphone permissions in browser
- Verify LiveKit Cloud project is active
- Check agent logs for errors

### Port already in use
- Kill existing processes: `lsof -ti:3001 | xargs kill -9`

See [LIVEKIT_SETUP.md](./LIVEKIT_SETUP.md) for more troubleshooting.

---

## 📚 Documentation

- [LiveKit Agents](https://docs.livekit.io/agents/)
- [Voice AI Quickstart](https://docs.livekit.io/agents/quickstart/)
- [Building Voice Agents](https://docs.livekit.io/agents/building/)

---

## 🎯 Next Steps

- ✅ Basic voice receptionist working
- 📞 Add telephony via LiveKit SIP
- 📊 Build transcript dashboard
- 🔧 Add function calling for booking/scheduling
- 💾 Implement conversation memory/RAG
- 🌍 Multi-language support

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Credits

Built with:
- [LiveKit](https://livekit.io) - Real-time voice infrastructure
- [OpenAI](https://openai.com) - GPT-4 language model
- [AssemblyAI](https://assemblyai.com) - Speech-to-text
- [Cartesia](https://cartesia.ai) - Text-to-speech
- [FastAPI](https://fastapi.tiangolo.com) - Backend framework
- [Next.js](https://nextjs.org) - Frontend framework
