import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home-screen icon: the heart with a spark, on the paper background. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf7f2' }}>
        <svg width="132" height="132" viewBox="0 0 32 32">
          <path
            d="M16 25.5 C15.5 25.5 6 19.5 4 14.5 C2 9.5 5.5 5.5 10 5.5 C12.8 5.5 14.8 7.2 16 9 C17.2 7.2 19.2 5.5 22 5.5 C26.5 5.5 30 9.5 28 14.5 C26 19.5 16.5 25.5 16 25.5 Z"
            fill="#aa5265"
          />
          <path d="M23 6 L24 4 L25 6 L27 7 L25 8 L24 10 L23 8 L21 7 Z" fill="#ebbe71" />
        </svg>
      </div>
    ),
    size,
  );
}
