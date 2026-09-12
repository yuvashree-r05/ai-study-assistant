// A deliberately simple "vector database" — just a JSON file holding
// an array of { text, vector } entries, plus a function to find the
// closest matches to a given query vector.
//
// Real vector databases (Pinecone, Chroma, etc.) do the exact same
// core idea — compare vectors, return the closest ones — just with
// indexing tricks so it stays fast at millions of entries. At the
// scale of a few study documents, a JSON file + a loop is plenty,
// and it makes the underlying math visible instead of hidden inside
// a library.

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../../data/vectorStore.json');

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) {
    return [];
  }
  const raw = fs.readFileSync(STORE_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveStore(entries) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(entries, null, 2));
}

function addEntries(newEntries) {
  const existing = loadStore();
  const updated = existing.concat(newEntries);
  saveStore(updated);
  return updated.length; // total chunk count after adding
}

// Cosine similarity: measures the ANGLE between two vectors, not
// their raw distance. A result of 1 means "pointing in exactly the
// same direction" (very similar meaning), 0 means "unrelated",
// negative means "opposite meaning". This is the standard way to
// compare embeddings.
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

// Finds the topK entries whose stored vector is most similar to
// the given query vector.
function search(queryVector, topK = 4) {
  const entries = loadStore();

  const scored = entries.map((entry) => ({
    text: entry.text,
    ingestedAt: entry.ingestedAt, // may be undefined for chunks added before we tracked this
    score: cosineSimilarity(queryVector, entry.vector),
  }));

  scored.sort((a, b) => b.score - a.score); // highest similarity first

  return scored.slice(0, topK);
}

module.exports = { addEntries, search, loadStore };