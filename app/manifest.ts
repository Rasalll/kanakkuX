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
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logos/KanakkuX logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
