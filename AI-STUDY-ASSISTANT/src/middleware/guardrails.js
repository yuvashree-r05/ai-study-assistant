// Basic guardrails: reject obviously bad input BEFORE it reaches an
// LLM call. This is cheap to check and prevents wasted API calls on
// requests that were never going to produce a useful answer anyway —
// like an empty question, or someone pasting 50,000 characters.

const MAX_QUESTION_LENGTH = 2000;

function validateQuestion(req, res, next) {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'Request body must include a non-empty "question" string.' });
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return res.status(400).json({
      error: `Question is too long — max ${MAX_QUESTION_LENGTH} characters allowed.`,
    });
  }

  next();
}

const MAX_INGEST_LENGTH = 20000;

function validateIngestText(req, res, next) {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Request body must include a non-empty "text" string.' });
  }

  if (text.length > MAX_INGEST_LENGTH) {
    return res.status(400).json({
      error: `Text is too long to ingest at once — max ${MAX_INGEST_LENGTH} characters allowed.`,
    });
  }

  next();
}

module.exports = { validateQuestion, validateIngestText };