'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', background: '#1e293b', borderRadius: '0.5rem', margin: '2rem' }}>
      <h2 style={{ color: '#ef4444' }}>Page Error</h2>
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-all',
        background: '#0f172a', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        color: '#fbbf24'
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
    </div>
  );
}
