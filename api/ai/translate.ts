import { GoogleGenAI } from "@google/genai";

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

async function translateViaGoogleWeb(text: string, targetLang: string): Promise<string | null> {
  try {
    const url = `https://translate.google.com/m?tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(text)}`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
      },
    });
    if (r.ok) {
      const html = await r.text();
      const match = html.match(/class="result-container">([\s\S]*?)<\/div>/);
      if (match && match[1]) {
        const cleaned = decodeHtmlEntities(match[1].trim());
        if (cleaned) return cleaned;
      }
    }
  } catch (err) {
    console.warn("Google web translate fallback note:", err);
  }
  return null;
}

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

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { text = "", targetLang = "ru" } = body;

  if (!text || !text.trim()) {
    return res.status(200).json({ translatedText: "" });
  }

  const cleanTargetLang = targetLang === "en" ? "en" : "ru";
  const apiKey = (process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY || "").trim();

  // 1. Try Gemini AI translation if API key is present
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.6-flash"];
    const prompt = `Translate the following post text into ${cleanTargetLang === "ru" ? "Russian" : "English"} naturally and fluently. Preserve formatting, emojis, hashtags, and code snippets exactly as intended. Return ONLY the translated text, with no introductory text, no quotes, and no commentary.\n\nText:\n${text}`;

    for (const model of modelsToTry) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        });

        if (result && result.text && result.text.trim()) {
          return res.status(200).json({
            translatedText: result.text.trim(),
            model,
          });
        }
      } catch (err: any) {
        console.warn(`[Translate] Model ${model} failed, checking next:`, err?.message);
      }
    }
  }

  // 2. High-reliability fallback via direct neural translation
  const fallbackTranslation = await translateViaGoogleWeb(text, cleanTargetLang);
  if (fallbackTranslation) {
    return res.status(200).json({
      translatedText: fallbackTranslation,
      model: "neural-fallback",
    });
  }

  // 3. Last-resort fallback
  return res.status(200).json({
    translatedText: text,
    fallback: true,
  });
}
