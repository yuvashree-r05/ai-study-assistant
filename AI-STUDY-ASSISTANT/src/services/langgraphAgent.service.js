// This is the SAME think -> act -> observe -> think-again loop as
// toolCalling.service.js — but instead of our hand-written `while`
// loop, LangGraph gives us a prebuilt function that already IS that
// loop. This is literally the "ReAct" pattern we named earlier,
// pre-built as one function call.

const { ChatGroq } = require('@langchain/groq');
const { tool } = require('@langchain/core/tools');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { z } = require('zod'); // used to describe each tool's expected input, same job as our "parameters" JSON schema

const { embedText } = require('./embedding.service');
const { search } = require('./vectorStore.service'); // reusing our OWN hand-built vector store here on purpose

// This is the LangChain equivalent of searchNotes.tool.js — same
// description, same execute logic, just wrapped in LangChain's
// `tool()` helper instead of our own { definition, execute } shape.
const searchNotesTool = tool(
  async ({ query }) => {
    const queryVector = await embedText(query);
    const matches = search(queryVector, 3);

    if (matches.length === 0 || matches[0].score < 0.4) {
      return 'No relevant notes were found for this query.';
    }

    return matches
      .map((m, i) => {
        const dateNote = m.ingestedAt ? ` (added on ${m.ingestedAt.split('T')[0]})` : '';
        return `[Excerpt ${i + 1}, similarity ${m.score.toFixed(2)}]${dateNote} ${m.text}`;
      })
      .join('\n\n');
  },
  {
    name: 'search_notes',
    description:
      "Searches the user's own ingested study notes for relevant information. Use this when the question might be answered by the user's personal notes rather than general knowledge.",
    schema: z.object({
      query: z.string().describe("The search query — usually the user's question, or a rephrased version of it."),
    }),
  }
);

// Equivalent of getCurrentDatetime.tool.js.
const getCurrentDatetimeTool = tool(
  async () => new Date().toString(),
  {
    name: 'get_current_datetime',
    description: "Returns the current date and time. Use this if the user asks what today's date is, what time it is, or anything relative to 'now'.",
    schema: z.object({}),
  }
);

async function askWithLangGraphAgent(question) {
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'openai/gpt-oss-20b',
    temperature: 0.3,
  });

  // THIS ONE FUNCTION replaces our entire hand-written `while`
  // loop, executeToolCall(), and message-pushing logic in
  // toolCalling.service.js. createReactAgent builds a LangGraph
  // "graph" that already knows how to: call the model, check for
  // tool calls, execute them, feed results back, and repeat until
  // a final answer — the exact loop we drew in the flowchart earlier.
  const agent = createReactAgent({
    llm: model,
    tools: [searchNotesTool, getCurrentDatetimeTool],
  });

  const result = await agent.invoke({
    messages: [{ role: 'user', content: question }],
  });

  // The agent returns the FULL message history, including every
  // tool call and result along the way — same information our
  // `toolCallsUsed` array captured, just in LangGraph's own shape.
  const finalMessage = result.messages[result.messages.length - 1];

  const toolCallsUsed = result.messages
    .filter((m) => m.tool_calls && m.tool_calls.length > 0)
    .flatMap((m) => m.tool_calls.map((tc) => ({ tool: tc.name, arguments: tc.args })));

  return { answer: finalMessage.content, toolCallsUsed };
}

module.exports = { askWithLangGraphAgent };