/* Plain anchors on purpose: the home page boots an imperative engine that needs a full page load. */
/* eslint-disable @next/next/no-html-link-for-pages */
import '@/app/legal.css';

export default function NotFound() {
  return (
    <div className="legal">
      <div className="legal-center">
        <h1>This page lost its ribbon.</h1>
        <p>We couldn’t find what you were looking for.</p>
        <a className="legal-cta" href="/">Make a little gift instead</a>
      </div>
    </div>
  );
}
