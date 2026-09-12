const { ingestWithLangChain, answerFromNotesWithLangChain } = require('../services/langchainRag.service');
const { askWithLangGraphAgent } = require('../services/langgraphAgent.service');

async function handleLangChainIngest(req, res) {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Request body must include a "text" string.' });
  }

  try {
    const chunkCount = await ingestWithLangChain(text);
    return res.status(200).json({ message: 'Ingested via LangChain.', chunksAdded: chunkCount });
  } catch (err) {
    console.error('Error during LangChain ingestion:', err.message);
    return res.status(500).json({ error: 'Something went wrong during LangChain ingestion.' });
  }
}

async function handleLangChainRag(req, res) {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Request body must include a "question" string.' });
  }

  try {
    const result = await answerFromNotesWithLangChain(question);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error during LangChain RAG:', err.message);
    return res.status(500).json({ error: 'Something went wrong during LangChain RAG.' });
  }
}

async function handleLangGraphAgent(req, res) {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Request body must include a "question" string.' });
  }

  try {
    const result = await askWithLangGraphAgent(question);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error during LangGraph agent:', err.message);
    return res.status(500).json({ error: 'Something went wrong during the LangGraph agent.' });
  }
}

module.exports = { handleLangChainIngest, handleLangChainRag, handleLangGraphAgent };