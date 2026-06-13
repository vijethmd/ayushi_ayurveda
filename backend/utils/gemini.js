/**
 * Shared Gemini helper — working model + transient-error retry.
 */
// gemini-2.5-flash has a larger free-tier daily quota than gemini-flash-latest (→3.5-flash, 20/day).
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const withRetry = async (fn, attempts = 3) => {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      const transient = /\b(429|500|502|503|504|overloaded|high demand|unavailable)\b/i.test(err.message || '');
      if (!transient || i === attempts - 1) throw err;
      await sleep(1200 * (i + 1));
    }
  }
  throw lastErr;
};

const getGeminiResponse = (prompt) => withRetry(async () => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
});

const getGeminiJSON = (prompt) => withRetry(async () => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 4096 },
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try { return JSON.parse(text); }
  catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    throw new Error('Model did not return valid JSON');
  }
});

module.exports = { GEMINI_MODEL, withRetry, getGeminiResponse, getGeminiJSON };
