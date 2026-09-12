// Splits a long piece of text into smaller overlapping chunks.
//
// Why overlap matters: if we cut chunks with zero overlap, a sentence
// that happens to sit right at a chunk boundary gets split in half,
// and neither half makes full sense on its own. A small overlap (the
// last bit of chunk N also appears at the start of chunk N+1) means
// that boundary-straddling ideas usually survive intact in at least
// one chunk.
//
// This is a simple CHARACTER-based chunker (not word- or
// sentence-aware) — good enough to learn the concept. Real-world
// chunkers often split on paragraph/sentence boundaries instead, but
// that's a refinement, not a different idea.

function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move forward by (chunkSize - overlap) so the next chunk
    // re-includes the last `overlap` characters of this one.
    start += chunkSize - overlap;
  }

  return chunks;
}

module.exports = { chunkText };