import { useState, useRef, useEffect } from 'react';
import Message from './components/Message.jsx';
import IngestPanel from './components/IngestPanel.jsx';

const API_BASE = 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY; // read from client/.env, one source of truth

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIngest, setShowIngest] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ask/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'Something went wrong.', isError: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer, toolCallsUsed: data.toolCallsUsed },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Couldn't reach the backend. Make sure your Express server is running on port 3000.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="masthead">
        <h1>Study Notebook</h1>
        <p>Ask a question. It'll check your notes first, and tell you when it does.</p>
      </div>

      <div className="toggle-row">
        <button className={showIngest ? 'active' : ''} onClick={() => setShowIngest((v) => !v)}>
          {showIngest ? 'hide notebook editor' : '+ add notes'}
        </button>
      </div>

      {showIngest && <IngestPanel />}

      {messages.length === 0 && (
        <p className="empty-state">
          Nothing here yet. Add some notes above, then ask a question about them — or just ask
          anything and it'll answer from general knowledge if your notes don't cover it.
        </p>
      )}

      <div className="thread">
        {messages.map((m, i) => (
          <Message key={i} {...m} />
        ))}
        {loading && (
          <div className="thinking">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="composer">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ask something…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}