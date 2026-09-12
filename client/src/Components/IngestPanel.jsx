import { useState } from 'react';

const API_BASE = 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY; // read from client/.env, one source of truth

export default function IngestPanel({ onClose }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!text.trim()) return;
    setBusy(true);
    setStatus('adding to your notebook…');

    try {
      const res = await fetch(`${API_BASE}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(`couldn't add that: ${data.error || 'unknown error'}`);
      } else {
        setStatus(`added ${data.chunksAdded} chunk${data.chunksAdded === 1 ? '' : 's'} — ${data.totalChunksInStore} total in your notebook`);
        setText('');
      }
    } catch (err) {
      setStatus('could not reach the backend — is it running on port 3000?');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ingest-panel">
      <textarea
        placeholder="Paste study notes here to add them to your notebook…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="row">
        <span className="ingest-status">{status}</span>
        <button onClick={handleAdd} disabled={busy}>
          {busy ? 'adding…' : 'Add to notebook'}
        </button>
      </div>
    </div>
  );
}