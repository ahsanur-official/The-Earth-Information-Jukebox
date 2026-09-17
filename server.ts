import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json());

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Earth Jukebox API",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    nasaConfigured: Boolean(process.env.NASA_API_KEY),
  });
});

// NASA Data Proxy / Status endpoint
app.get("/api/nasa/status", async (_req: Request, res: Response) => {
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
  const baseUrl = process.env.NASA_API_BASE_URL || "https://api.nasa.gov";

  try {
    // Ping NASA EONET (Earth Observatory Natural Event Tracker) or basic endpoint
    const response = await fetch(`${baseUrl}/planetary/apod?api_key=${apiKey}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      res.json({
        available: true,
        source: "NASA Open APIs (Live)",
        mode: "LIVE_NASA",
      });
    } else {
      res.json({
        available: false,
        source: "Calibrated NASA Demo Data (Offline Mode)",
        mode: "DEMO_DATA",
        reason: `NASA API returned status ${response.status}`,
      });
    }
  } catch (err: any) {
    res.json({
      available: false,
      source: "Calibrated NASA Demo Data (Offline Mode)",
      mode: "DEMO_DATA",
      reason: err.message || "Network timeout or offline sandbox",
    });
  }
});

// AI Earth Sound Narrator endpoint
app.post("/api/narrate", async (req: Request, res: Response) => {
  const { variableName, year, rawValue, unit, normalizedValue, audioParams, baseline } = req.body;

  const ai = getGenAI();

  if (!ai) {
    // High-fidelity scientific fallback narration when Gemini API key is not configured
    const norm = typeof normalizedValue === "number" ? normalizedValue : 0.5;
    const pitchDesc = norm > 0.7 ? "elevated pitch and bright harmonic presence" : norm < 0.3 ? "subdued, lower frequencies" : "balanced mid-range tonal register";
    const intensityDesc = norm > 0.6 ? "moderate to high acoustic energy" : "calm, steady sonic resonance";

    return res.json({
      narration: `In ${year}, ${variableName} registered at ${rawValue} ${unit} (normalized index: ${(norm * 100).toFixed(1)}%). In the sonification pipeline, this value maps to an audio frequency with ${pitchDesc}, producing ${intensityDesc}. This auditory representation helps convey the magnitude of departure from the ${baseline || "historical baseline"} without relying solely on visual charts.`,
      isAiGenerated: false,
      attribution: "Earth Jukebox Heuristic Signal Analysis",
    });
  }

  try {
    const prompt = `You are the AI Earth Sound Narrator for "Earth Jukebox", a NASA Space Apps Challenge 2026 project.
Analyze the following environmental data point and its real-time sonification parameter mapping:
- Environmental Variable: ${variableName}
- Year: ${year}
- Value: ${rawValue} ${unit}
- Baseline / Reference: ${baseline || "1951-1980 NASA Climatology"}
- Normalized Value [0 to 1]: ${normalizedValue}
- Audio Parameters: ${JSON.stringify(audioParams || {})}

Write a concise, engaging, and scientifically accurate plain-language explanation (2 to 3 sentences, maximum 65 words) answering:
1. What does the sound you are hearing right now represent about this environmental variable?
2. How does the pitch, timbre, or rhythm reflect the data compared to historical baselines?

Rules:
- Do NOT claim the sound "proves" climate change or that Earth literally sounds like this in space.
- Clearly emphasize that this is a mathematical data-to-sound translation (sonification).
- Keep it accessible to non-scientists and visually impaired listeners.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const text = response.text || "Sonification active: Audio parameters reflect the selected environmental baseline.";
    res.json({
      narration: text.trim(),
      isAiGenerated: true,
      attribution: "Gemini 3.8 Flash Sound Narrator",
    });
  } catch (err: any) {
    console.error("AI narration error:", err);
    res.json({
      narration: `Current ${variableName} value in ${year} is ${rawValue} ${unit}. The sonification synthesizes this into an acoustic profile with normalized intensity of ${(Number(normalizedValue || 0.5) * 100).toFixed(0)}%, translating data variations into audible pitch and harmonic contours.`,
      isAiGenerated: false,
      attribution: "Earth Jukebox Fallback Engine",
    });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Earth Jukebox server running on http://0.0.0.0:${PORT}`);
  });
}

start();
