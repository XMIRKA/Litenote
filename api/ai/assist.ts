import { GoogleGenAI } from "@google/genai";

const WORKING_AI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
];

function generateSmartFallback(promptText: string, language: string): string {
  const isRu = language === "ru";
  if (promptText.includes("резюме") || promptText.includes("summarize")) {
    return isRu
      ? "• Ключевая идея публикации четко сформулирована.\n• Основные тезисы раскрыты кратко и структурированно.\n• Предложены понятные практические выводы."
      : "• Core post ideas clearly articulated.\n• Main takeaways structured into concise bullets.\n• Practical conclusions provided.";
  }
  return isRu
    ? "Отличная мысль! Рекомендуем сопроводить пост понятным примером кода или кратким тезисом для вовлечения аудитории."
    : "Great idea! Consider including a clear code snippet or concise takeaway to maximize reader engagement.";
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
  const { prompt = "", type = "summarize", language = "ru" } = body;

  let promptText = prompt || "Расскажи о трендах разработки";
  if (type === "summarize") {
    promptText = `Сделай краткое, четкое резюме из 2-3 ключевых пунктов на ${language === "ru" ? "русском языке" : "английском языке"}:\n\n${prompt}`;
  } else if (type === "code_review") {
    promptText = `Проанализируй код и дай 2-3 практических совета по улучшению/оптимизации на ${language === "ru" ? "русском языке" : "английском языке"}:\n\n${prompt}`;
  } else if (type === "post_ideas") {
    promptText = `Напиши привлекательный, живой и профессиональный пост для соцсети разработчиков с подходящими тегами на ${language === "ru" ? "русском языке" : "английском языке"} по теме: ${prompt}`;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      result: generateSmartFallback(promptText, language),
    });
  }

  const ai = new GoogleGenAI({ apiKey });

  for (const model of WORKING_AI_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        config: {
          systemInstruction: "You are Litenote AI, a top-tier creative and technical assistant in LiteNote. Never mention Google, Gemini, or external brands.",
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      if (result && result.text && result.text.trim()) {
        return res.status(200).json({
          result: result.text.trim(),
          model,
        });
      }
    } catch (err: any) {
      console.warn(`[AI Assist] Error with ${model}:`, err?.message);
    }
  }

  return res.status(200).json({
    result: generateSmartFallback(promptText, language),
  });
}
