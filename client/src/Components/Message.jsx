import ReactMarkdown from 'react-markdown';

export default function Message({ role, content, toolCallsUsed, isError }) {
  if (role === 'user') {
    return (
      <div className="entry user">
        <div className="bubble user">{content}</div>
      </div>
    );
  }

  return (
    <div className="entry assistant">
      <div className={`bubble assistant${isError ? ' error' : ''}`}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      {toolCallsUsed && toolCallsUsed.length > 0 && (
        <div className="tags-row">
          {toolCallsUsed.map((t, i) => (
            <span key={i} className="chip tool">
              {t.tool}
            </span>
          ))}
        </div>
      )}
      {toolCallsUsed && toolCallsUsed.length === 0 && (
        <div className="tags-row">
          <span className="chip general">general knowledge</span>
        </div>
      )}
    </div>
  );
}