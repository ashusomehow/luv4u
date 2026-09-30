'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="legal">
      <div className="legal-center">
        <h1>Something tangled.</h1>
        <p>That didn’t work. Your drafts are safe in this browser. Please try again.</p>
        <button type="button" onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
