const { chunkText } = require('../services/chunking.service');
const { embedText } = require('../services/embedding.service');
const { addEntries } = require('../services/vectorStore.service');

async function handleIngest(req, res) {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      error: 'Request body must include a "text" string to ingest.',
    });
  }

  try {
    const chunks = chunkText(text);

    // Embed every chunk. We do this one at a time (not in parallel)
    // to keep it simple and stay comfortably within free-tier rate
    // limits — for a study-notes-sized document, this is fast enough.
    const ingestedAt = new Date().toISOString();
    const entries = [];
    for (const chunk of chunks) {
      const vector = await embedText(chunk);
      // Recording WHEN this chunk was added is what makes a question
      // like "when did I last study X" answerable at all — without
      // this, there's no time information anywhere in the system.
      entries.push({ text: chunk, vector, ingestedAt });
    }

    const totalChunks = addEntries(entries);

    return res.status(200).json({
      message: 'Document ingested successfully.',
      chunksAdded: entries.length,
      totalChunksInStore: totalChunks,
    });
  } catch (err) {
    console.error('Error during ingestion:', err.message);
    return res.status(500).json({
      error: 'Something went wrong while ingesting the document.',
    });
  }
}

module.exports = { handleIngest };