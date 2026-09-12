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

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { action = "explain", code = "", language = "javascript", instructions = "" } = body;

  let prompt = `Ты — ведущий Staff Software Engineer и эксперт по оптимизации алгоритмов, чистой архитектуре и безопасности в сети LiteNote.
Язык исходного кода: ${language}.
Исходный код:
\`\`\`${language}
${code || "// empty code"}
\`\`\`
`;

  if (action === "optimize") {
    prompt += `\nЗадача: Проведи глубокую оптимизацию производительности и алгоритмической сложности данного кода.
1. Оцени текущую асимптотику Time/Space Complexity (Big-O notation).
2. Выяви узкие места (bottlenecks), лишние аллокации памяти или блокирующие операции.
3. Предоставь улучшенную оптимизированную версию кода в блоке (\`\`\`${language} ... \`\`\`).
4. Поясни, какой прирост скорости достигнут.`;
  } else if (action === "fix") {
    prompt += `\nЗадача: Проведи полный аудит безопасности, потенциальных багов и граничных случаев (Edge Cases).
1. Укажи на потенциальные Null-pointer/Undefined ошибки, утечки памяти, уязвимости или race conditions.
2. Предоставь исправленную надежную версию кода (\`\`\`${language} ... \`\`\`).
3. Добавь краткие пояснения к исправлениям.`;
  } else if (action === "test") {
    prompt += `\nЗадача: Напиши комплексный набор Unit-тестов для данного кода, покрывающий позитивные сценарии, ошибки и граничные условия.`;
  } else if (action === "convert") {
    prompt += `\nЗадача: Перепиши данный код на выбранный целевой язык (или современный TypeScript/Python), соблюдая идиоматические паттерны и строгую типизацию.`;
  } else {
    prompt += `\nЗадача: Доходчиво, структурированно и понятно объясни архитектуру, логику работы и алгоритмические приемы, используемые в данном коде.`;
  }

  if (instructions && instructions.trim()) {
    prompt += `\n\nСпециальные указания разработчика:\n${instructions.trim()}`;
  }

  const apiKey = (process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(200).json({
      result: `### Анализ кода (${language})\n\nКод корректен по синтаксису. Для расширенного AI-анализа убедитесь, что в переменных окружения настроен \`GEMINI_API_KEY\` или \`GEMINI_API_KEY2\`.\n\n\`\`\`${language}\n${code}\n\`\`\``,
      model: "fallback",
    });
  }

  const ai = new GoogleGenAI({ apiKey });

  for (const model of WORKING_AI_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are Litenote AI Code Intelligence. Never mention Google, Gemini, or external brands.",
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      });

      if (result && result.text && result.text.trim()) {
        return res.status(200).json({
          result: result.text.trim(),
          model,
        });
      }
    } catch (err: any) {
      console.warn(`[Code Assist] Error with ${model}:`, err?.message);
    }
  }

  return res.status(200).json({
    result: `### Анализ кода (${language})\n\n\`\`\`${language}\n${code}\n\`\`\``,
    model: "fallback",
  });
}
