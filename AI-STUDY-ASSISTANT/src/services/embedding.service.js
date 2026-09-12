// This is the ONLY file that knows how to turn text into an
// embedding (a vector — just a long list of numbers representing
// the MEANING of that text, not the exact words).
//
// Two pieces of text with similar meaning end up with vectors that
// point in a similar "direction" in that number-space — that's the
// entire trick behind semantic search.

const genAI = require('../config/geminiClient');

async function embedText(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values; // an array of numbers, e.g. [0.012, -0.034, ...]
}

module.exports = { embedText };