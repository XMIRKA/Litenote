import { GoogleGenAI } from "@google/genai";

const WORKING_AI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
];

const NATURAL_LITENOTE_AI_INSTRUCTION =
  "You are Litenote AI — a smart, genuine, natural companion in the LiteNote network.\n\n" +
  "IMPORTANT BEHAVIOR GUIDELINES:\n" +
  "1. BE NATURAL & CONCISE: In casual dialogue (greetings, 'как дела', 'как тебя зовут', 'кто ты', small talk), respond briefly and naturally in 1-2 sentences, exactly like a real person in a messenger. NEVER write huge paragraphs or unprompted bulleted lists of your capabilities.\n" +
  "2. NO SALES PITCHES: Never give canned lists of what you can do (e.g., '1. Код 2. Творчество 3. Продуктивность') unless the user explicitly asks 'что ты умеешь?'. Answer only what was asked.\n" +
  "3. IDENTITY: You are Litenote AI. Never mention Google, Gemini, OpenAI, or other brands. You are part of the LiteNote community.\n" +
  "4. IN-DEPTH ONLY WHEN REQUESTED: If the user asks for code, debugging, architecture, or an in-depth explanation, provide high-quality, detailed technical answers. Otherwise, keep it conversational, warm, and concise.\n" +
  "5. LANGUAGE: Match the user's language (primarily Russian or English). Speak naturally, without robotic or overly formal phrasing.";

function sanitizeMessages(messages: any[]): any[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [{ role: "user", parts: [{ text: "Привет!" }] }];
  }

  const rawContents = messages
    .filter((m) => m && typeof m.text === "string" && m.text.trim())
    .map((m) => {
      const role = m.role === "model" || m.role === "assistant" ? "model" : "user";
      return {
        role,
        parts: [{ text: m.text.trim() }],
      };
    });

  const merged: any[] = [];
  for (const item of rawContents) {
    if (merged.length > 0 && merged[merged.length - 1].role === item.role) {
      merged[merged.length - 1].parts[0].text += "\n" + item.parts[0].text;
    } else {
      merged.push({ role: item.role, parts: [{ text: item.parts[0].text }] });
    }
  }

  if (merged.length > 0 && merged[0].role === "model") {
    merged.shift();
  }

  if (merged.length === 0) {
    merged.push({ role: "user", parts: [{ text: "Привет!" }] });
  }

  return merged;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
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
      text: "Внимание: на сервере Vercel не настроен GEMINI_API_KEY / GEMINI_API_KEY2. Добавьте его в настройках проекта Vercel (Project Settings -> Environment Variables)."
    });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { messages, systemInstruction } = body;
  const sanitized = sanitizeMessages(messages);

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const model of WORKING_AI_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: sanitized,
        config: {
          systemInstruction: systemInstruction || NATURAL_LITENOTE_AI_INSTRUCTION,
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      if (result && result.text && result.text.trim()) {
        return res.status(200).json({
          text: result.text.trim(),
          model,
        });
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  return res.status(502).json({
    error: "AI generation temporarily failed",
    details: lastError?.message || "All models timed out",
  });
}
