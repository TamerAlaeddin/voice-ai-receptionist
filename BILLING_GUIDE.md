# Billing & Cost Tracking Guide

## Where to Check Your Costs

### 1. LiveKit Cloud Dashboard
**URL:** https://cloud.livekit.io

**What to check:**
- Go to your project dashboard
- Click **"Usage"** or **"Billing"** in the sidebar
- You'll see:
  - Minutes of voice/video used
  - Number of participants
  - Bandwidth consumed
  - Current month costs
  - Historical usage

**LiveKit Free Tier:**
- 50 GB bandwidth/month
- Up to 10,000 participant minutes/month
- After that: ~$0.008 per participant minute

**Typical costs for voice AI:**
- ~$0.008 per minute of conversation
- Example: 100 hours of calls/month = ~$48

### 2. OpenAI Usage Dashboard
**URL:** https://platform.openai.com/usage

**What to check:**
- Click **"Usage"** in the left sidebar
- See costs for:
  - GPT-4.1 mini (LLM) - used for understanding and responses
  - Costs shown per day/month

**OpenAI Pricing (approximate):**
- GPT-4.1 mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- For voice AI: expect ~$0.01-0.05 per minute of conversation

### 3. AssemblyAI Dashboard (STT)
**URL:** https://www.assemblyai.com/app/account/billing

**What to check:**
- Real-time transcription costs
- Audio minutes processed
- Free tier includes some minutes

**AssemblyAI Pricing:**
- Real-time streaming: ~$0.47 per hour ($0.0078/min)
- Or included in LiveKit Inference credits

### 4. Cartesia Dashboard (TTS)
**URL:** https://cartesia.ai (check billing section)

**What to check:**
- Text-to-speech character usage
- Voice generation minutes

**Cartesia Pricing:**
- Typically ~$0.10 per 1000 characters spoken
- Or included in LiveKit Inference credits

---

## Cost Breakdown Per Minute of Conversation

Here's what you're paying for each minute a customer talks to your AI receptionist:

| Service | Cost/Minute | What It Does |
|---------|-------------|--------------|
| **LiveKit** | ~$0.008 | Real-time audio infrastructure, connection |
| **AssemblyAI (STT)** | ~$0.008 | Speech-to-text transcription |
| **OpenAI GPT-4** | ~$0.01-0.05 | AI understanding and responses |
| **Cartesia (TTS)** | ~$0.005-0.01 | Text-to-speech voice generation |
| **TOTAL** | **~$0.03-0.08/min** | **Complete conversation** |

**Example monthly costs:**
- **100 calls x 5 min average** = 500 minutes = ~$15-40/month
- **1,000 calls x 5 min average** = 5,000 minutes = ~$150-400/month

---

## How to Monitor Costs

### Set Up Billing Alerts

**LiveKit:**
1. Go to https://cloud.livekit.io
2. Click your project → Settings → Billing
3. Set up usage alerts (email when reaching thresholds)

**OpenAI:**
1. Go to https://platform.openai.com/account/limits
2. Set hard limits on monthly spend
3. Enable email notifications

### Daily Monitoring
Check these dashboards daily when starting out:
- LiveKit: Usage page
- OpenAI: Usage page
- Look for unusual spikes

### Cost Optimization Tips

1. **Limit max conversation length**
   - Set a max duration per call (e.g., 10 minutes)
   - Implement timeout logic

2. **Use cheaper LLM for simple queries**
   - GPT-4.1 mini is already cheap
   - Could use GPT-3.5-turbo for even lower cost

3. **Optimize prompts**
   - Shorter responses = less TTS cost
   - Current config already aims for 1-2 sentence responses

4. **Monitor free tiers**
   - LiveKit: 10,000 participant minutes/month free
   - OpenAI: No free tier, but cheap with GPT-4.1 mini

5. **Cache common responses**
   - For frequently asked questions
   - Pre-generate audio for standard greetings

---

## Current Configuration Costs

Your current setup:
- **STT:** AssemblyAI Universal-Streaming (~$0.008/min)
- **LLM:** GPT-4.1 mini (very affordable, ~$0.01-0.05/min)
- **TTS:** Cartesia Sonic-3 (~$0.005-0.01/min)
- **Infrastructure:** LiveKit (~$0.008/min)

**Total: ~$0.03-0.08 per minute**

This is quite cost-effective for a production voice AI!

---

## Alternative Voice Options (and their costs)

If you want to change voices, here are options in `agent.py`:

### Cartesia Voices (current provider)

```python
# Current: Friendly Woman
tts="cartesia/sonic-3:a0e99841-438c-4a64-b679-ae501e7d6091"

# Other options:
tts="cartesia/sonic-3:694f9389-aac1-45b6-b726-9d9369183238"  # British Lady
tts="cartesia/sonic-3:41534e16-2966-4c6b-9670-111411def906"  # Calm Woman
tts="cartesia/sonic-3:638efaaa-4d0c-442e-b701-3fae16aad012"  # Professional Woman
tts="cartesia/sonic-3:726d5ae5-055f-4c3d-8355-d9677de68937"  # Friendly Man
```

All Cartesia voices cost the same (~$0.10 per 1000 characters).

### ElevenLabs (alternative TTS)
More expensive but ultra-realistic:
- Cost: ~$0.30 per 1000 characters (3x Cartesia)
- Better for premium applications
- To use: `tts="elevenlabs/..." ` (requires ElevenLabs API key)

### OpenAI TTS (alternative)
- Cost: ~$0.015 per 1000 characters
- Good quality, middle pricing
- To use: `tts="openai/tts-1"`

---

## Quick Cost Check Commands

### Check LiveKit usage (via CLI)
```bash
lk cloud usage
```

### Check OpenAI usage (via API)
```bash
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

## Summary

**To check your costs:**
1. **LiveKit:** https://cloud.livekit.io → Usage/Billing
2. **OpenAI:** https://platform.openai.com/usage
3. **Set up alerts** on both platforms
4. **Expect:** ~$0.03-0.08 per minute of conversation

**Your current setup is cost-optimized:**
- Using GPT-4.1 mini (cheapest GPT-4 model)
- Using efficient STT/TTS providers
- Short responses to minimize TTS costs

For 500 minutes/month of calls, expect **~$15-40/month** total.
