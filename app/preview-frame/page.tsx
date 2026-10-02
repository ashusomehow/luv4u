import type { Metadata } from 'next';
import { LegacyApp } from '@/components/LegacyApp';

// The phone mockup on the unlock screen plays the real gift engine in here. This page holds no data of its
// own: it only shows the gift its parent window (same origin) hands it, so it reveals nothing to anyone else.
export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } };

export default function PreviewFramePage() {
  return <LegacyApp />;
}
