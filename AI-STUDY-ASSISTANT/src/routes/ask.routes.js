// The "routes" layer just wires a URL + HTTP method to a controller
// function. It should stay this thin forever — no logic here.

const express = require('express');
const { handleAsk, handleAskStructured, handleAskRag, handleAskWithTools } = require('../controllers/ask.controller');
const { handleIngest } = require('../controllers/ingest.controller');
const { handleLangChainIngest, handleLangChainRag, handleLangGraphAgent } = require('../controllers/langchain.controller');
const { validateQuestion, validateIngestText } = require('../middleware/guardrails');

const router = express.Router();

router.post('/ask', validateQuestion, handleAsk);
router.post('/ask/structured', validateQuestion, handleAskStructured);
router.post('/ask/rag', validateQuestion, handleAskRag);
router.post('/ask/tools', validateQuestion, handleAskWithTools);
router.post('/ingest', validateIngestText, handleIngest);

// Phase 5 — LangChain/LangGraph versions, for direct comparison
router.post('/langchain/ingest', validateIngestText, handleLangChainIngest);
router.post('/langchain/ask/rag', validateQuestion, handleLangChainRag);
router.post('/langchain/ask/agent', validateQuestion, handleLangGraphAgent);

module.exports = router;