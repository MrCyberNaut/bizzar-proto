// lib/ar-config.ts
// ALL hardcoded prototype data. When we move to platform, this comes from Supabase.

export const CARD_CONFIG = {
  mindFile: '/card.mind',
  cardImage: '/card1.jpg',

  owner: {
    name: 'Arnav Sawant',
    title: 'Founder',
    company: 'BizzAR',
    email: 'arnavsawant.as@gmail.com',
    phone: '+91 98765 43210',
    website: 'https://bizzar.app',
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

// CSS3DObject transforms — children of anchor.group (MindAR pixel-scale local space).
// Card ~500 units wide, ~315 units tall. +Z toward camera, +Y up on card face.
// CSS panel sizes (px) are the actual DOM element dimensions fed to CSS3DRenderer.
export const PANEL_TRANSFORMS = {
  overlay: {
    position: [0, 0, 15] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  top: {
    position: [0, 380, 200] as [number, number, number],
    rotation: [-0.25, 0, 0] as [number, number, number],
  },
  left: {
    position: [-520, 30, 150] as [number, number, number],
    rotation: [0, 0.3, 0] as [number, number, number],
  },
  right: {
    position: [520, 30, 150] as [number, number, number],
    rotation: [0, -0.3, 0] as [number, number, number],
  },
}
