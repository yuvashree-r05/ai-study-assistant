// This is the SAME retrieve -> augment -> generate idea as
// rag.service.js — using LangChain's components for the parts that
// are stable (embeddings, prompts, chain composition, the LLM call),
// while reusing OUR OWN vector store for storage/search underneath.
//
// Why not use LangChain's own vector store class? Its in-memory
// vector store option has been shifting/unstable across recent
// LangChain versions — a good real-world lesson: frameworks evolve
// fast, and sometimes the hand-built piece you already trust is the
// more reliable choice to keep, even while adopting the framework
// elsewhere.

const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { ChatGroq } = require('@langchain/groq');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');

const { chunkText } = require('./chunking.service');
const { addEntries, search } = require('./vectorStore.service');

// LangChain's embeddings wrapper — same job as our embedding.service.js,
// just a library object instead of a plain function.
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-embedding-001',
});

async function ingestWithLangChain(text) {
  // Reusing OUR chunker — LangChain has splitters too, but there's no
  // need to swap out something that already works.
  const chunks = chunkText(text);

  // embedDocuments() embeds a whole batch at once — same result as
  // our one-at-a-time loop, just a built-in convenience method.
  const vectors = await embeddings.embedDocuments(chunks);

  const ingestedAt = new Date().toISOString();
  const entries = chunks.map((chunk, i) => ({
    text: chunk,
    vector: vectors[i],
    ingestedAt,
  }));

  addEntries(entries); // our own vectorStore.service.js — unchanged
  return chunks.length;
}

async function answerFromNotesWithLangChain(question) {
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'openai/gpt-oss-20b',
    temperature: 0.3,
  });

  const prompt = ChatPromptTemplate.fromTemplate(`You are a study assistant that answers
questions using ONLY the provided context from the user's own notes.
If the context does not contain enough information, say clearly:
"I couldn't find that in your notes."

Context:
{context}

Question: {question}`);

  // Our own retrieval step, wrapped as a small function so it can
  // slot into a LangChain chain just like a built-in retriever would.
  async function retrieveContext(question) {
    const queryVector = await embeddings.embedQuery(question);
    const matches = search(queryVector, 4); // our own cosine similarity search
    return matches.map((m, i) => `[Excerpt ${i + 1}] ${m.text}`).join('\n\n');
  }

  // THIS is "LCEL" — LangChain Expression Language. Read it top to
  // bottom: retrieve context (and pass the question through
  // unchanged) -> format into the prompt -> call the model -> parse
  // the output as plain text. Each step's output feeds the next.
  const chain = RunnableSequence.from([
    {
      context: retrieveContext,
      question: new RunnablePassthrough(),
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  const answer = await chain.invoke(question);

  // Also return the raw sources, same as our hand-built version.
  const queryVector = await embeddings.embedQuery(question);
  const matches = search(queryVector, 4);

  return {
    answer,
    sources: matches.map((m) => ({ text: m.text, score: m.score })),
  };
}

module.exports = { ingestWithLangChain, answerFromNotesWithLangChain };