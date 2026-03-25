'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: 'monospace', padding: '2rem', background: '#0a0f1e', color: '#f8fafc' }}>
        <h2 style={{ color: '#ef4444' }}>Something went wrong</h2>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-all',
          background: '#1e293b', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {error.message}
          {'\n\n'}
          {error.stack}
          {error.digest ? `\n\nDigest: ${error.digest}` : ''}
        </pre>
        <button 
          onClick={() => reset()}
          style={{ 
            marginTop: '1rem', 
            padding: '0.5rem 1rem', 
            background: '#22c55e', 
            color: '#000', 
            border: 'none', 
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
