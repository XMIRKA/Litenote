import { GoogleGenAI } from "@google/genai";

const WORKING_AI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
];

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = (process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured",
      text: "Ключ GEMINI_API_KEY / GEMINI_API_KEY2 не настроен в Vercel Environment Variables."
    });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { prompt } = body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const ai = new GoogleGenAI({ apiKey });

  for (const model of WORKING_AI_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt.trim() }] }],
        config: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      if (result && result.text) {
        return res.status(200).json({
          text: result.text.trim(),
          model,
        });
      }
    } catch (err: any) {
      // try next model
    }
  }

  return res.status(502).json({ error: "AI generation failed" });
}
