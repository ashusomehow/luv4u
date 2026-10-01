import { OG_SIZE, ogCard } from '@/lib/og-card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Kholona: little gifts, big feelings';

export default function Image() {
  return ogCard({
    eyebrow: 'Small link. Big feelings.',
    title: 'Little gifts, big feelings',
    subtitle: 'Interactive gift websites for birthdays, love, apologies, anniversaries and more.',
  });
}
