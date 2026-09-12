// This is the "service" layer — the ONLY place in our app that
// actually knows how to call the LLM API.

const groq = require('../config/groqClient');

const SYSTEM_PROMPT = `You are a friendly, patient study tutor who can help
with any subject the student asks about.
Explain concepts in simple, clear language, as if teaching a beginner.
Use short paragraphs and plain text — avoid heavy Markdown formatting
like tables or multiple headers unless the user specifically asks for
a structured breakdown.
Use a small example when it helps (a code snippet, a formula, a
diagram described in words — whatever fits the subject), but keep
answers focused and not overly long.

If you are asked about a specific fact you are not confident about —
such as exact version numbers, specific people's names, dates, or the
current status of something — say so plainly instead of guessing. It
is better to say "I'm not certain of the exact details" than to state
a specific-sounding fact you might be wrong about.`;

// temperature: controls randomness. 0 = focused/deterministic,
//   1+ = more varied/creative. Groq's range is typically 0–2.
// top_p: nucleus sampling — the model only considers tokens whose
//   cumulative probability adds up to top_p. Lower = safer/narrower
//   word choices, higher (closer to 1) = wider variety considered.
//
// We default to fairly focused settings, but let the caller override
// them per-request so we can actually SEE the difference in practice.
async function askLLM(question, { temperature = 0.7, top_p = 1, max_tokens = 1024 } = {}) {
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: question },
    ],
    max_completion_tokens: max_tokens,
    reasoning_effort: 'low',
    temperature,
    top_p,
  });

  // Every Groq response includes real usage numbers — logging them
  // gives you visibility into what each question actually costs,
  // instead of that being invisible until a bill surprises you.
  if (completion.usage) {
    console.log(
      `[tokens] prompt=${completion.usage.prompt_tokens} completion=${completion.usage.completion_tokens} total=${completion.usage.total_tokens}`
    );
  }

  return completion.choices[0].message.content;
}

// This is a SEPARATE function (not a mode flag on askLLM) on purpose —
// structured output needs its own system prompt (with the exact JSON
// shape spelled out) and its own API setting (response_format) to tell
// Groq to enforce valid JSON. Mixing this into askLLM would make that
// function harder to reason about.
const STRUCTURED_SYSTEM_PROMPT = `You are a JSON-only study tutor API that
can explain concepts from any subject.
For every question, respond with ONLY a single valid JSON object — no
extra text before or after it — matching exactly this shape:

{
  "topic": string,        // short name of the concept being explained
  "difficulty": string,   // one of: "beginner", "intermediate", "advanced"
  "explanation": string,  // a clear explanation, a few sentences
  "example": string,      // one short example as a plain string (code, a formula, or a worked example, whichever fits the subject)
  "keyPoints": string[]   // 2-4 short bullet-style takeaways
}`;

async function askLLMStructured(question) {
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: STRUCTURED_SYSTEM_PROMPT },
      { role: 'user', content: question },
    ],
    max_completion_tokens: 1024,
    reasoning_effort: 'low',
    temperature: 0.5,
    // This tells Groq to constrain the output to valid JSON. It's not
    // magic — we still have to describe the exact shape in the system
    // prompt above — but it stops the model from wrapping the JSON in
    // ```json fences or adding "Sure, here's your answer:" before it.
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0].message.content;

  // Even with JSON mode, always parse defensively — malformed JSON
  // from an LLM is a real, common failure mode, not a hypothetical one.
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Model returned invalid JSON: ${raw}`);
  }
}

module.exports = { askLLM, askLLMStructured };

// A THIRD, separate function for RAG — it needs its own system prompt
// (one that tells the model to answer ONLY from the given context,
// and to admit when the context doesn't cover the question) instead
// of reusing the general tutor persona above.
const RAG_SYSTEM_PROMPT = `You are a study assistant that answers
questions using ONLY the provided context from the user's own notes.

Rules:
- Base your answer strictly on the context given below. Do not use
  outside knowledge, even if you know more about the topic.
- If the context does not contain enough information to answer the
  question, say clearly: "I couldn't find that in your notes." Do not
  guess or fill gaps with general knowledge.
- Keep the answer clear and concise, in plain language.`;

async function askLLMWithContext(question, context) {
  // We build one combined user message: the retrieved context first,
  // then the actual question. This IS the "augmentation" step of RAG
  // — prompt = question + context + instructions (the instructions
  // live in the system prompt above).
  const userMessage = `Context from the user's notes:
"""
${context}
"""

Question: ${question}`;

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: RAG_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    max_completion_tokens: 1024,
    reasoning_effort: 'low',
    temperature: 0.3, // lower temperature — we want it sticking to the facts, not being creative
  });

  return completion.choices[0].message.content;
}

module.exports.askLLMWithContext = askLLMWithContext;