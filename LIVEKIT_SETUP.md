# LiveKit Setup Guide

Your voice AI receptionist has been successfully migrated to use LiveKit with an STT-LLM-TTS pipeline!

## What Changed

### Backend
- Replaced OpenAI Realtime API direct connection with LiveKit Agents framework
- Added LiveKit token generation endpoint (`/token`)
- Created `agent.py` with voice pipeline using:
  - **STT**: AssemblyAI Universal-Streaming
  - **LLM**: OpenAI GPT-4.1 mini
  - **TTS**: Cartesia Sonic-3
  - **VAD**: Silero Voice Activity Detection
  - **Turn Detection**: Multilingual Model
  - **Noise Cancellation**: BVC (Best Voice Cancellation)

### Frontend
- Replaced direct OpenAI WebRTC connection with LiveKit Room client
- Created new `LiveKitReceptionistClient` that maintains the same interface
- Updated page to use LiveKit client

## Setup Instructions

### 1. Update Your Environment Variables

Edit `backend/.env` and add your LiveKit credentials:

```bash
# LiveKit Cloud Configuration
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
LIVEKIT_URL=wss://your-project.livekit.cloud

# OpenAI API Key (still needed for GPT-4 in the pipeline)
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
BUSINESS_PHONE=(555) 123-4567
```

**To get your LiveKit credentials:**
1. Sign up at https://cloud.livekit.io (free tier available)
2. Create a new project
3. Go to Settings > Keys to get your API key and secret
4. Your URL will be something like `wss://your-project-name.livekit.cloud`

### 2. Run the LiveKit Agent

The agent must be running to handle voice interactions. In a terminal:

```bash
cd backend
uv run python agent.py dev
```

This starts the agent in development mode and connects it to LiveKit Cloud. You should see:
```
✅ Agent is ready and waiting for calls
```

### 3. Run the Backend API Server

In a new terminal:

```bash
cd backend
uv run python -m app.main
```

This starts the FastAPI server on `http://localhost:3001` and provides:
- `/token` - LiveKit token generation
- `/save-transcript` - Transcript saving
- `/transcripts` - List saved transcripts

### 4. Run the Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### 5. Test Your Voice Receptionist

1. Open `http://localhost:3000` in your browser
2. Click "Start Call"
3. Allow microphone access when prompted
4. The agent should greet you within a few seconds
5. Start speaking to test the conversation
6. Click "End Call" when done
7. Check `backend/transcripts/` for saved conversation logs

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │◄───────►│   Backend    │◄───────►│  LiveKit     │
│  (Next.js)  │  HTTP   │   (FastAPI)  │  Token  │   Cloud      │
└─────────────┘         └──────────────┘         └──────────────┘
       │                                                  │
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

## Troubleshooting

### Agent Won't Start
- Check that all dependencies are installed: `cd backend && uv sync`
- Verify model files are downloaded: `uv run python agent.py download-files`
- Check that environment variables are set correctly

### Frontend Can't Connect
- Ensure all three components are running (agent, backend, frontend)
- Check browser console for errors
- Verify `LIVEKIT_URL` in .env matches your LiveKit Cloud project

### No Audio or Transcriptions
- Check microphone permissions in browser
- Verify your LiveKit Cloud project is active
- Check agent logs for errors
- Ensure OPENAI_API_KEY is valid

### Connection Issues
- Check that LIVEKIT_URL starts with `wss://` (not `https://`)
- Verify API keys are correct
- Check LiveKit Cloud dashboard for room activity

## Benefits of LiveKit

1. **Better Audio Quality**: Enhanced noise cancellation and audio processing
2. **Telephony Ready**: Easy integration with SIP/PSTN for phone calls
3. **Scalable**: Built for production with LiveKit Cloud infrastructure
4. **Flexible**: Use different models for STT, LLM, and TTS
5. **Observable**: Better logging, metrics, and debugging tools
6. **Recording**: Built-in session recording capabilities

## Next Steps

- **Deploy to Production**: Use `lk agent create` to deploy to LiveKit Cloud
- **Add Telephony**: Integrate with LiveKit SIP for phone calls
- **Customize Models**: Try different STT/TTS providers
- **Add Features**: Implement function calling, memory, RAG, etc.

## Documentation

- [LiveKit Agents Docs](https://docs.livekit.io/agents/)
- [Voice AI Quickstart](https://docs.livekit.io/agents/quickstart/)
- [Building Voice Agents](https://docs.livekit.io/agents/building/)

## Support

If you encounter issues:
1. Check the agent logs for errors
2. Review the LiveKit Cloud dashboard
3. Consult the LiveKit docs
4. Open an issue on the project repo
