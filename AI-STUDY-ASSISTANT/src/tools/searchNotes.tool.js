// A "tool" has two halves:
//   1. DEFINITION — a description we hand to the LLM, in a strict
//      JSON schema shape it understands. This is how the model knows
//      the tool exists, what it's for, and what input it needs.
//   2. EXECUTE — the actual JS function that really runs when the
//      model asks for this tool. The model NEVER runs this itself —
//      it only ever asks for it; our code does the real work.

const { embedText } = require('../services/embedding.service');
const { search } = require('../services/vectorStore.service');

const definition = {
  type: 'function',
  function: {
    name: 'search_notes',
    description:
      "Searches the user's own ingested study notes for relevant information. Use this when the question might be answered by the user's personal notes rather than general knowledge.",
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query — usually the user\'s question, or a rephrased version of it.',
        },
      },
      required: ['query'],
    },
  },
};

async function execute({ query }) {
  const queryVector = await embedText(query);
  const matches = search(queryVector, 3);

  if (matches.length === 0 || matches[0].score < 0.4) {
    return 'No relevant notes were found for this query.';
  }

  return matches
    .map((m, i) => {
      const dateNote = m.ingestedAt
        ? ` (added to your notes on ${m.ingestedAt.split('T')[0]})`
        : '';
      return `[Excerpt ${i + 1}, similarity ${m.score.toFixed(2)}]${dateNote} ${m.text}`;
    })
    .join('\n\n');
}

module.exports = { definition, execute };