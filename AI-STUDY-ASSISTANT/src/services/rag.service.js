// This is the orchestration layer for RAG — it doesn't do any of the
// actual work itself, it just calls the right services in the right
// order:
//
//   1. RETRIEVAL   — embed the question, search the vector store
//   2. AUGMENTATION — combine the retrieved chunks into one context block
//   3. GENERATION   — hand that context + the question to the LLM
//
// Keeping this separate from the controller means the controller
// stays a thin HTTP layer, and this function could be reused later
// (e.g. by a future agent/tool-calling step) without touching Express
// at all.

const { embedText } = require('./embedding.service');
const { search } = require('./vectorStore.service');
const { askLLMWithContext } = require('./llm.service');

async function answerFromNotes(question, topK = 4) {
  // 1. RETRIEVAL
  const queryVector = await embedText(question);
  const matches = search(queryVector, topK);

  // 2. AUGMENTATION — join the matched chunks into one context string.
  // We separate them clearly so the model can tell where one chunk
  // ends and another begins.
  const context = matches
    .map((match, i) => `[Excerpt ${i + 1}] ${match.text}`)
    .join('\n\n');

  // 3. GENERATION
  const answer = await askLLMWithContext(question, context);

  return {
    answer,
    // Returning the matched chunks too (not just the answer) is
    // genuinely useful — it lets you SEE what the retrieval step
    // actually found, which is the best way to debug "why did it
    // answer wrong" (bad retrieval vs. bad generation are very
    // different problems).
    sources: matches.map((m) => ({ text: m.text, score: m.score })),
  };
}

module.exports = { answerFromNotes };