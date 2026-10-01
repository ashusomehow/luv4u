import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };

/** A branded 1200x630 share card. Uses only shapes and system fonts, so it renders anywhere. */
export function ogCard({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #fbf5eb 0%, #f2dfd9 100%)',
          color: '#432d32',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 40, letterSpacing: -1 }}>
          <span style={{ display: 'flex' }}>
            khol<span style={{ color: '#aa5265' }}>o</span>na
          </span>
          <svg width="34" height="34" viewBox="0 0 24 24">
            <path
              d="M12 21s-7.5-4.6-9.4-9.4C1.2 8 3.3 4.8 6.7 4.8c2 0 3.5 1.1 5.3 3.2 1.8-2.1 3.3-3.2 5.3-3.2 3.4 0 5.5 3.2 4.1 6.8C19.5 16.4 12 21 12 21z"
              fill="#aa5265"
            />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 4, textTransform: 'uppercase', color: '#aa5265' }}>{eyebrow}</div>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
          <div style={{ display: 'flex', fontSize: 34, lineHeight: 1.35, color: '#6b5559', maxWidth: 900 }}>{subtitle}</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
