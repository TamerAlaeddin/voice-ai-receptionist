# 🎙️ Voice AI Receptionist

A full-stack AI voice receptionist built with **OpenAI Realtime API**, **Node.js (Express)**, and **Vite + TypeScript** frontend.  
It listens, speaks, and saves conversation transcripts — just like a real receptionist.

---

## 🚀 Features
- 🎧 Live two-way voice with GPT-4o-realtime
- 💬 Natural speech transcription and AI responses
- 🗂️ Transcript auto-saving to `/backend/transcripts`
- 🔒 Secure ephemeral token generation (no API key leaks)
- 🌍 English by default (auto-switches if caller requests another language)

---

## 🧩 Project Structure
\`\`\`
voice-ai/
├── backend/          # Express server (API + ephemeral token + transcripts)
│   ├── src/server.ts
│   ├── transcripts/
│   ├── .env.example
│   └── package.json
├── frontend/         # Vite + TypeScript web UI (voice interface)
│   ├── src/main.ts
│   ├── index.html
│   ├── .env.example
│   └── package.json
└── README.md
\`\`\`

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repo
\`\`\`bash
git clone https://github.com/TamerAlaeddin/voice-ai-receptionist.git
cd voice-ai-receptionist
\`\`\`

### 2️⃣ Install dependencies
\`\`\`bash
cd backend && npm install
cd ../frontend && npm install
\`\`\`

### 3️⃣ Add your .env files
Create \`backend/.env\` (never commit this file):
\`\`\`env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
\`\`\`

Create \`frontend/.env\`:
\`\`\`env
VITE_API_URL=http://localhost:3001
\`\`\`

---

## ▶️ Run locally

### Backend
\`\`\`bash
cd backend
npm run dev
\`\`\`

### Frontend
\`\`\`bash
cd ../frontend
npm run dev
\`\`\`

Then open:  
👉 [http://localhost:5173](http://localhost:5173)

---

## 📝 Transcripts
Saved conversations appear under:
\`\`\`
backend/transcripts/
\`\`\`

Each session is timestamped and saved automatically when stopped.

---

## ⚠️ Security
- .env and node_modules are ignored by .gitignore  
- The server issues ephemeral tokens, never exposing your OpenAI API key  
- Always revoke any previously leaked keys immediately  

---

## 🧠 Future Improvements
- Add authentication for multi-agent sessions  
- Integrate Twilio or SIP routing  
- Add transcript dashboard with playback  
