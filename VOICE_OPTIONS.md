# Voice Options Guide

## Current Configuration

**File:** `backend/agent.py` (line 25)

Currently using: `tts="cartesia/sonic-turbo"` (Default Cartesia female voice)

## How to Change the Voice

Edit `backend/agent.py` and change line 25 to one of the options below, then restart the agent with `./start_agent.sh`

---

## Available Cartesia Voices

### Female Voices

```python
# Default Female (Sonic Turbo) - Balanced, professional
tts="cartesia/sonic-turbo"

# British Lady - British accent, sophisticated
tts="cartesia/sonic-3:694f9389-aac1-45b6-b726-9d9369183238"

# Calm Woman - Soothing, gentle
tts="cartesia/sonic-3:41534e16-2966-4c6b-9670-111411def906"

# Friendly Woman - Warm, conversational
tts="cartesia/sonic-3:a0e99841-438c-4a64-b679-ae501e7d6091"

# Professional Woman - Business-like, clear
tts="cartesia/sonic-3:638efaaa-4d0c-442e-b701-3fae16aad012"

# Upbeat Woman - Energetic, enthusiastic
tts="cartesia/sonic-3:2ee87190-8f84-4925-97da-e52547f9462c"
```

### Male Voices

```python
# Default Male - Balanced, professional
tts="cartesia/sonic-3:726d5ae5-055f-4c3d-8355-d9677de68937"

# Friendly Guy - Casual, approachable
tts="cartesia/sonic-3:50d6beb4-80ea-4802-8387-6c948fe84208"

# Professional Man - Business-like, confident
tts="cartesia/sonic-3:fb26447f-308b-471e-8b00-8e9f04284eb5"

# British Man - British accent, distinguished
tts="cartesia/sonic-3:79a125e8-cd45-4c13-8a67-188112f4dd22"
```

---

## How the AI Chooses Its Name

The AI has been instructed to:
1. Listen to its own voice
2. Choose an appropriate name that matches (e.g., Sarah/Emily/Jessica for female, Mike/David/Alex for male)
3. Introduce itself naturally in the greeting

So if you change to a male voice, the AI might say:
> "Hey there! This is Mike at Tri-State Roofing. How can I help you today?"

And if female:
> "Hey there! This is Sarah at Tri-State Roofing. How can I help you today?"

---

## Quick Change Guide

1. **Edit the voice:**
   ```bash
   # Open agent.py
   nano backend/agent.py

   # Find line 25 and change to your preferred voice
   tts="cartesia/sonic-turbo"  # Change this line
   ```

2. **Restart the agent:**
   ```bash
   cd backend
   ./start_agent.sh
   ```

3. **Test it:**
   - Refresh your browser at http://localhost:3000
   - Click "Start Call"
   - Listen to the new voice!

---

## Alternative TTS Providers

### OpenAI TTS (simpler, good quality)

```python
# Female voices
tts="openai/tts-1:alloy"    # Neutral female
tts="openai/tts-1:nova"     # Young, energetic female
tts="openai/tts-1:shimmer"  # Warm, friendly female

# Male voices
tts="openai/tts-1:echo"     # Male voice
tts="openai/tts-1:fable"    # British male
tts="openai/tts-1:onyx"     # Deep male voice
```

**Note:** OpenAI TTS costs about the same as Cartesia (~$0.015 per 1000 characters)

### ElevenLabs (Premium, ultra-realistic)

```python
# Requires ELEVENLABS_API_KEY in .env
tts="elevenlabs/..." # Various voices available
```

**Note:** ElevenLabs is 3x more expensive (~$0.30 per 1000 characters) but sounds extremely realistic.

---

## Current Setup

- **Provider:** Cartesia Sonic-Turbo (default female)
- **Cost:** ~$0.10 per 1000 characters (~$0.005-0.01 per minute)
- **Quality:** High quality, natural sounding
- **Latency:** Very low (good for real-time conversations)

---

## Troubleshooting

**Voice sounds robotic:**
- Try switching to a different voice ID
- Cartesia Sonic-Turbo usually has the best quality

**Wrong gender voice:**
- Double-check the voice ID in agent.py
- Make sure you restarted the agent after changing

**AI uses wrong name:**
- The AI chooses its own name based on the voice
- Wait for the greeting to see what name it picks
- It should automatically match the voice gender

**No sound:**
- Check browser console for errors
- Verify microphone permissions
- Make sure all 3 services are running (agent, backend, frontend)
