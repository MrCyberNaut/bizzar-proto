// lib/ar-config.ts
// ALL hardcoded prototype data. When we move to platform, this comes from Supabase.

// ── Multi-card inventory ────────────────────────────────────────────────────────
// Each card maps to one target in the compiled .mind file (0-indexed).
// To add a new card:
//   1. Drop the image in public/ (e.g. card2.jpg)
//   2. Open /compiler.html, add ALL card images in ORDER (card1, card2, card3...)
//   3. Compile → download → replace public/card.mind
//   4. Update CARDS array below — index must match compilation order

export const CARDS: { index: number; name: string; image: string }[] = [
  { index: 0, name: 'E-Cell MIT',  image: '/card1.jpg' },
  { index: 1, name: 'Card 2',      image: '/card2.jpg' },
  { index: 2, name: 'Card 3',      image: '/card3.jpg' },
]

export const CARD_CONFIG = {
  mindFile: '/card.mind',
  // Legacy single-card reference — used by ContactCard thumbnail
  cardImage: CARDS[0].image,

  owner: {
    name: 'Arnav Sawant',
    title: 'Founder',
    company: 'BizzAR',
    email: 'arnavsawant.as@gmail.com',
    phone: '+91 9167788424',
    website: 'https://arnavsawant.me',
    github: 'MrCyberNaut',
    twitter: 'https://x.com/MrCyberNaut',
    linkedin: 'https://linkedin.com/in/arnavsawant',
  },

  bio: 'Building BizzAR — business cards that come alive in AR.\nMumbai · shipping fast 🚀',

  socials: [
    { platform: 'twitter', label: 'X / Twitter', url: 'https://x.com/MrCyberNaut' },
    { platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/arnavsawant' },
    { platform: 'github', label: 'GitHub', url: 'https://github.com/MrCyberNaut' },
  ],

  video: {
    type: 'youtube' as const,
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'BizzAR Demo',
  },

  gallery: [
    '/gallery/1.jpg',
    '/gallery/2.jpg',
    '/gallery/3.jpg',
    '/gallery/4.jpg',
  ],

  model3d: '/model.glb',
}

// ARAnchor local space — react-three-mind normalizes target width to 1 unit.
// Card = 1 unit wide, ~0.63 unit tall (85mm × 54mm aspect).
// +Z toward camera, +Y up on card face.
export const PANEL_TRANSFORMS = {
  overlay: {
    position: [0, 0, 0.01] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  top: {
    position: [0, 0.9, 0.3] as [number, number, number],
    rotation: [-0.3, 0, 0] as [number, number, number],
  },
  left: {
    position: [-1.1, 0.1, 0.2] as [number, number, number],
    rotation: [0, 0.3, 0] as [number, number, number],
  },
  right: {
    position: [1.1, 0.1, 0.2] as [number, number, number],
    rotation: [0, -0.3, 0] as [number, number, number],
  },
  model: {
    position: [0, 0, 0.5] as [number, number, number],
  },
}
