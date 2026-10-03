'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Georgia, serif', background: '#faf7f2', color: '#432d32', textAlign: 'center', padding: '15vh 24px' }}>
        <h1 style={{ fontWeight: 400 }}>Something tangled.</h1>
        <p style={{ color: '#5b4549' }}>Please try again in a moment.</p>
        <button type="button" onClick={reset} style={{ minHeight: 48, padding: '0 24px', borderRadius: 999, border: 0, background: '#bb4161', color: '#fffaf5', fontSize: 16 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
