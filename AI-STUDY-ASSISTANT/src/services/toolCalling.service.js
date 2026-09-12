// This is the heart of "tool calling":
//
//   1. We send the question to the model, ALONG WITH a list of tools
//      it's allowed to use (just descriptions — not the real code).
//   2. The model replies with EITHER a normal text answer, OR a
//      request like "call search_notes with query: X".
//   3. If it requested a tool, WE run the real function, then send
//      the result back to the model as a new message.
//   4. The model sees that result and either answers now, or asks
//      for another tool. We loop until it gives a final text answer.
//
// The model never executes anything itself — it only ever asks. Our
// code is what actually does the work, every single time.

const groq = require('../config/groqClient');
const searchNotesTool = require('../tools/searchNotes.tool');
const getCurrentDatetimeTool = require('../tools/getCurrentDatetime.tool');

// A lookup table so we can find the right execute() function by the
// name the model asked for.
const TOOLS_BY_NAME = {
  search_notes: searchNotesTool,
  get_current_datetime: getCurrentDatetimeTool,
};

const TOOL_DEFINITIONS = [searchNotesTool.definition, getCurrentDatetimeTool.definition];

const SYSTEM_PROMPT = `You are a helpful study assistant with access to tools.
Use search_notes when a question might be answered by the user's own
study notes. Use get_current_datetime only if the question depends on
today's date or time. If neither tool is needed, just answer directly
from your own knowledge. Only call a tool when it's actually useful —
don't call tools unnecessarily.`;

async function executeToolCall(toolCall) {
  const tool = TOOLS_BY_NAME[toolCall.function.name];

  if (!tool) {
    return `Error: unknown tool "${toolCall.function.name}"`;
  }

  // Arguments arrive from the model as a JSON STRING, not an object —
  // we have to parse them before passing them to the real function.
  const args = JSON.parse(toolCall.function.arguments || '{}');
  return tool.execute(args);
}

async function askWithTools(question, maxIterations = 5) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question },
  ];

  const toolCallLog = []; // so we can show the user which tools got used, for learning visibility

  let iterations = 0;

  while (iterations < maxIterations) {
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto', // let the model decide whether/which tool to use
      max_completion_tokens: 1024,
      reasoning_effort: 'low',
      temperature: 0.3,
    });

    const responseMessage = completion.choices[0].message;

    // If there's no tool_calls, the model gave a final answer — we're done.
    if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
      return { answer: responseMessage.content, toolCallsUsed: toolCallLog };
    }

    // The model wants to use one or more tools. Record its request in
    // the conversation history, then run each one for real.
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      const result = await executeToolCall(toolCall);

      toolCallLog.push({
        tool: toolCall.function.name,
        arguments: toolCall.function.arguments,
      });

      // The result gets added as a "tool" role message, linked back
      // to the specific tool_call.id it's answering.
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: String(result),
      });
    }

    iterations++;
  }

  return {
    answer: "I wasn't able to reach a final answer after several tool calls.",
    toolCallsUsed: toolCallLog,
  };
}

module.exports = { askWithTools };