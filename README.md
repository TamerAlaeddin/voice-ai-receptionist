# 🎙️ Voice AI Receptionist

A full-stack AI voice receptionist built with **OpenAI Realtime API**, **Python (FastAPI)**, and **Next.js + TypeScript** frontend.  
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
```
voice-ai-receptionist/
├── backend/          # FastAPI server (API + ephemeral token + transcripts)
│   ├── app/
│   │   ├── main.py
│   │   └── config.py
│   ├── transcripts/
│   ├── pyproject.toml
│   └── uv.lock
├── frontend/         # Next.js + TypeScript web UI (voice interface)
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── next.config.ts
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repo
```bash
git clone https://github.com/TamerAlaeddin/voice-ai-receptionist.git
cd voice-ai-receptionist
```

### 2️⃣ Install uv (Python package manager)

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Or with pip:**
```bash
pip install uv
```

For more installation options, visit: https://github.com/astral-sh/uv

### 3️⃣ Install dependencies

**Backend (Python with uv):**
```bash
cd backend
uv sync
```

This will:
- Create a virtual environment automatically
- Install all dependencies from `pyproject.toml`
- Use Python >=3.13 (uv will handle this if available)

**Frontend (Node.js):**
```bash
cd ../frontend
npm install
```

### 4️⃣ Add your .env files

Create `backend/.env` (never commit this file):
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

**Note:** The frontend doesn't require a `.env` file as it uses the API URL from `lib/receptionist-client.ts`.

---

## ▶️ Run locally

### Backend

Using `uv run` (recommended):
```bash
cd backend
uv run python -m app.main
```

Or using `uv` to run uvicorn directly:
```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

The server will start on `http://localhost:3001` (or the PORT from `.env`)

### Frontend
```bash
cd frontend
npm run dev
```

Then open:  
👉 [http://localhost:3000](http://localhost:3000) (Next.js default port)

---

## 📝 Transcripts
Saved conversations appear under:
```
backend/transcripts/
```

Each session is timestamped and saved automatically when stopped.

---

## ⚠️ Security
- `.env` and dependency directories (`node_modules`, `.venv`, `__pycache__`) are ignored by `.gitignore`  
- The server issues ephemeral tokens, never exposing your OpenAI API key  
- Always revoke any previously leaked keys immediately  

---

## 🛠️ Development

### Backend Development with uv

- **Sync dependencies:** `uv sync`
- **Add a dependency:** `uv add package-name`
- **Remove a dependency:** `uv remove package-name`
- **Run commands in the project environment:** `uv run <command>`
- **Update dependencies:** `uv lock --upgrade`

The virtual environment is automatically managed by `uv` in `.venv` (ignored by git).

## 🧠 Future Improvements
- Add authentication for multi-agent sessions  
- Integrate Twilio or SIP routing  
- Add transcript dashboard with playback  
