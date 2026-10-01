import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kholona',
    short_name: 'Kholona',
    description: 'Little gifts, big feelings. Make a small interactive gift and send it as one link.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf7f2',
    theme_color: '#faf7f2',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
