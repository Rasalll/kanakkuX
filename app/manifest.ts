import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'kanakkuX',
    short_name: 'kanakkuX',
    description: 'Track expenses, income, and money owed.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf8ff',
    theme_color: '#005c55',
    icons: [
      {
        src: '/logos/logo mark.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logos/logo mark.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
