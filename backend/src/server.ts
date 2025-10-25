import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Constants
const TRANSCRIPT_DIR = path.resolve("transcripts");
const PORT = parseInt(process.env.PORT || "3001", 10);

// Tri-State Roofing business context
const BUSINESS_CONTEXT = {
  name: "Tri-State Roofing and Chimneys",
  services: [
    "roof inspections",
    "gutter installation and repair",
    "concrete work",
    "siding installation",
    "chimney services",
    "damage roofing repair",
  ],
  guarantee: "100% satisfaction guarantee",
  phone: process.env.BUSINESS_PHONE || "(555) 123-4567",
  hours: "Monday-Friday 8am-6pm, Saturday 9am-4pm",
};

// System instructions for your roofing business
const RECEPTIONIST_INSTRUCTIONS = `
You are the receptionist for ${BUSINESS_CONTEXT.name}, a professional roofing and chimney company.

**Your role:**
- Greet callers warmly and professionally
- Answer questions about our services: ${BUSINESS_CONTEXT.services.join(", ")}
- Schedule appointments or take messages for callbacks
- Mention our ${BUSINESS_CONTEXT.guarantee}
- Provide business hours: ${BUSINESS_CONTEXT.hours}
- Never mention you're an AI - you're part of the team

**Communication style:**
- Natural, conversational, and brief (1-2 sentences per response)
- Professional but friendly - like a experienced receptionist
- Use varied greetings (mix up "Hello," "Good morning," "Thanks for calling," etc.)
- Default to English unless caller uses another language
- Ask clarifying questions when needed (location, type of service, urgency)

**Common scenarios:**
- Emergency repairs: Prioritize and offer same-day/next-day service
- Estimates: Let them know we provide free inspections
- Service area: We serve the tri-state area
- If you don't know something specific, offer to have someone call them back
`.trim();

// Ensure transcript directory exists
await fs.mkdir(TRANSCRIPT_DIR, { recursive: true });

// 🎧 Generate ephemeral token for realtime voice API (most cost-effective)
app.post("/ephemeral-token", async (_req, res) => {
  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview", // 🔥 Much cheaper than gpt-4o-realtime
        voice: "alloy", // Natural, professional voice
        instructions: RECEPTIONIST_INSTRUCTIONS,
        temperature: 0.8, // Slightly varied responses
        max_response_output_tokens: 150, // Keep responses concise
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create session");
    }

    const data = await response.json();
    
    if (!data?.client_secret?.value) {
      throw new Error("Missing client secret in response");
    }

    res.json({ 
      client_secret: data.client_secret.value,
      expires_at: data.expires_at 
    });
  } catch (err: any) {
    console.error("Ephemeral token error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 💬 Text chat + TTS endpoint (backup for non-realtime)
app.post("/receptionist", async (req, res) => {
  try {
    const { text, sessionId } = req.body;
    
    if (!text?.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Use cheaper model for text-based interactions
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Most cost-effective
      messages: [
        { role: "system", content: RECEPTIONIST_INSTRUCTIONS },
        { role: "user", content: text },
      ],
      temperature: 0.8,
      max_tokens: 150, // Keep responses concise
    });

    const reply = completion.choices[0]?.message?.content?.trim() || 
                  `Thank you for calling ${BUSINESS_CONTEXT.name}. How can I help you today?`;

    // Save transcript asynchronously
    const timestamp = Date.now();
    const transcriptPath = path.join(
      TRANSCRIPT_DIR, 
      `${sessionId || timestamp}_transcript.txt`
    );
    
    fs.appendFile(
      transcriptPath,
      `[${new Date().toISOString()}]\nUser: ${text}\nAI: ${reply}\n\n`
    ).catch(err => console.error("Failed to save transcript:", err));

    // Generate audio with cheaper TTS model
    const ttsRes = await openai.audio.speech.create({
      model: "tts-1", // 🔥 Cheaper and faster than gpt-4o-mini-tts
      voice: "alloy",
      input: reply,
      speed: 1.0,
    });

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    const audioPath = path.join(
      TRANSCRIPT_DIR,
      `${sessionId || timestamp}_audio.mp3`
    );
    
    await fs.writeFile(audioPath, audioBuffer);

    res.json({
      success: true,
      text: reply,
      audio: path.basename(audioPath),
      sessionId: sessionId || timestamp.toString(),
    });
  } catch (err: any) {
    console.error("Receptionist error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 💾 Save complete conversation transcript
app.post("/save-transcript", async (req, res) => {
  try {
    const { text, sessionId, metadata } = req.body;
    
    if (!text?.trim()) {
      return res.status(400).json({ error: "Transcript text is required" });
    }

    const timestamp = Date.now();
    const filename = `${sessionId || timestamp}_complete.txt`;
    const filePath = path.join(TRANSCRIPT_DIR, filename);
    
    // Add metadata header
    const header = metadata 
      ? `Session: ${sessionId}\nDate: ${new Date().toISOString()}\nMetadata: ${JSON.stringify(metadata)}\n\n`
      : `Session: ${sessionId}\nDate: ${new Date().toISOString()}\n\n`;
    
    await fs.writeFile(filePath, header + text);
    
    res.json({ 
      success: true, 
      file: filename,
      path: filePath 
    });
  } catch (err: any) {
    console.error("Save transcript error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📊 Get transcript list (useful for review/training)
app.get("/transcripts", async (_req, res) => {
  try {
    const files = await fs.readdir(TRANSCRIPT_DIR);
    const transcripts = files
      .filter(f => f.endsWith(".txt"))
      .map(f => ({
        filename: f,
        path: path.join(TRANSCRIPT_DIR, f),
      }));
    
    res.json({ transcripts });
  } catch (err: any) {
    console.error("List transcripts error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: BUSINESS_CONTEXT.name });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ ${BUSINESS_CONTEXT.name} AI Receptionist`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Transcripts saved to: ${TRANSCRIPT_DIR}`);
});