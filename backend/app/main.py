from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import json
from pathlib import Path
from datetime import datetime

from .config import (
    OPENAI_API_KEY,
    BUSINESS_CONTEXT,
    RECEPTIONIST_INSTRUCTIONS,
    PORT
)

app = FastAPI(
    title="Tri-State Roofing AI Receptionist",
    description="FastAPI backend for AI voice receptionist",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure transcript directory exists
TRANSCRIPT_DIR = Path("transcripts")
TRANSCRIPT_DIR.mkdir(exist_ok=True)


# Pydantic models
class TranscriptRequest(BaseModel):
    text: str
    sessionId: str
    metadata: Optional[dict] = None


@app.get("/")
async def root():
    return {
        "service": BUSINESS_CONTEXT["name"],
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": BUSINESS_CONTEXT["name"]
    }


@app.post("/ephemeral-token")
async def create_ephemeral_token():
    """Generate ephemeral token for OpenAI Realtime API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/realtime/sessions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini-realtime-preview",
                    "voice": "alloy",
                    "instructions": RECEPTIONIST_INSTRUCTIONS,
                    "temperature": 0.8,
                    "max_response_output_tokens": 150,
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_data = response.json()
                error_message = error_data.get("error", {}).get("message", "Failed to create session")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_message
                )
            
            data = response.json()
            
            if not data.get("client_secret", {}).get("value"):
                raise HTTPException(
                    status_code=500,
                    detail="Missing client secret in response"
                )
            
            return {
                "client_secret": data["client_secret"]["value"],
                "expires_at": data.get("expires_at")
            }
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Request failed: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/save-transcript")
async def save_transcript(request: TranscriptRequest):
    """Save complete conversation transcript"""
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(
                status_code=400,
                detail="Transcript text is required"
            )
        
        timestamp = int(datetime.now().timestamp() * 1000)
        filename = f"{request.sessionId or timestamp}_complete.txt"
        file_path = TRANSCRIPT_DIR / filename
        
        # Build header
        header_lines = [
            f"Session: {request.sessionId}",
            f"Date: {datetime.now().isoformat()}",
        ]
        
        if request.metadata:
            header_lines.append(f"Metadata: {json.dumps(request.metadata)}")
        
        header = "\n".join(header_lines) + "\n\n"
        
        # Write file
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(header + request.text)
        
        return {
            "success": True,
            "file": filename,
            "path": str(file_path)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/transcripts")
async def list_transcripts():
    """Get list of all transcripts"""
    try:
        files = sorted(
            TRANSCRIPT_DIR.glob("*.txt"),
            key=lambda f: f.stat().st_mtime,
            reverse=True
        )
        
        transcripts = [
            {
                "filename": f.name,
                "path": str(f),
                "created": datetime.fromtimestamp(f.stat().st_ctime).isoformat(),
                "size": f.stat().st_size
            }
            for f in files
        ]
        
        return {"transcripts": transcripts}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print(f"✅ {BUSINESS_CONTEXT['name']} AI Receptionist")
    print(f"🚀 Server running on http://localhost:{PORT}")
    print(f"📁 Transcripts saved to: {TRANSCRIPT_DIR.absolute()}")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=PORT,
        reload=True
    )
