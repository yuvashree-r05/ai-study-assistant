// This client is ONLY used for embeddings — Groq (our chat client)
// doesn't offer an embedding API, so we bring in Gemini's free one
// just for this purpose. Chat generation still goes through Groq.

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = genAI;