// The "controller" layer's job: handle the HTTP request/response.

const { askLLM, askLLMStructured } = require('../services/llm.service');
const { answerFromNotes } = require('../services/rag.service');
const { askWithTools } = require('../services/toolCalling.service');

async function handleAsk(req, res) {
  const { question, temperature, top_p, max_tokens } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      error: 'Request body must include a "question" string.',
    });
  }

  try {
    // temperature/top_p are optional — if the caller doesn't send
    // them, askLLM() falls back to its own defaults.
    const answer = await askLLM(question, { temperature, top_p, max_tokens });
    return res.status(200).json({ answer });
  } catch (err) {
    console.error('Error calling LLM:', err.message);
    return res.status(500).json({
      error: 'Something went wrong while getting a response from the model.',
    });
  }
}

async function handleAskStructured(req, res) {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      error: 'Request body must include a "question" string.',
    });
  }

  try {
    const structuredAnswer = await askLLMStructured(question);
    // Notice: we return the object directly, not wrapped in { answer: ... }
    // — the whole point of this step is that the response IS the structure.
    return res.status(200).json(structuredAnswer);
  } catch (err) {
    console.error('Error calling LLM (structured):', err.message);
    return res.status(500).json({
      error: 'Something went wrong while getting a structured response from the model.',
    });
  }
}

module.exports = { handleAsk, handleAskStructured, handleAskRag, handleAskWithTools };

async function handleAskRag(req, res) {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      error: 'Request body must include a "question" string.',
    });
  }

  try {
    const result = await answerFromNotes(question);
    return res.status(200).json(result); // { answer, sources }
  } catch (err) {
    console.error('Error during RAG:', err.message);
    return res.status(500).json({
      error: 'Something went wrong while answering from your notes.',
    });
  }
}

async function handleAskWithTools(req, res) {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      error: 'Request body must include a "question" string.',
    });
  }

  try {
    const result = await askWithTools(question);
    return res.status(200).json(result); // { answer, toolCallsUsed }
  } catch (err) {
    console.error('Error during tool calling:', err.message);
    return res.status(500).json({
      error: 'Something went wrong while answering with tools.',
    });
  }
}