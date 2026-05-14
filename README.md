# BizzAR Prototype

WebAR business card experience — point phone at card → floating interactive panels appear.

## Stack
- Next.js 14 + TypeScript + Tailwind
- React Three Fiber (R3F) + Drei — 3D rendering
- 8th Wall OSS — image tracking
- Zustand — AR pose bridge
- Modules: vCard, Bio, Socials, GitHub graph, Image gallery, 3D model

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Get 8th Wall App Key (free)
1. Go to https://www.8thwall.com → Sign up
2. Create new app → Copy **App Key**
3. Whitelist domains: `localhost`, your ngrok URL
4. Create `.env.local`:
```
NEXT_PUBLIC_8THWALL_KEY=paste_your_key_here
```

### 3. Add your business card photo
Replace `public/card.jpg` with your actual business card photo.
- Min resolution: 400×200px
- Good contrast = better tracking
- JPG or PNG

### 4. Compile the image target (one-time)
```bash
npx @8thwall/image-target-cli compile public/card.jpg -o public/card.mind
```
The CLI prints a quality score. Aim for 70+. Low contrast cards score poorly.

### 5. Update your info in `src/lib/ar-config.ts`
Edit CARD_CONFIG with your name, email, socials, GitHub username etc.

### 6. Run dev server
```bash
npm run dev
```

### 7. Test on mobile
Camera permission requires HTTPS. Use ngrok:
```bash
npx ngrok http 3000
# Open https://xxx.ngrok.io/ar on your phone
```

## File Structure
```
src/
  app/ar/                   ← AR experience route
  components/
    ar/                     ← ARScene, CardAnchor, Panel
    modules/                ← VCard, Bio, Socials, GitHubGraph, ImageGallery, Model3D
  lib/
    ar-config.ts            ← ALL hardcoded data (edit this)
    vcf.ts                  ← vCard download generator
    github.ts               ← GitHub contributions API
  store/ar-store.ts         ← Zustand: 8th Wall → R3F bridge
public/
  card.jpg                  ← Your business card photo (replace this)
  card.mind                 ← Compiled by image-target-cli (gitignore this)
  gallery/1-4.jpg           ← Gallery images (replace with yours)
  model.glb                 ← Optional 3D model (add your own)
```

## Panel Layout (hardcoded in ar-config.ts)
```
         [TOP panel]
         VCard + Bio
    [LEFT]        [RIGHT]
  Socials +     Image Gallery
  GitHub Graph
              [3D Model floating]
```

## Transitioning to Platform
When moving to the SaaS platform:
- `ar-config.ts` hardcoded data → Supabase REST fetch
- Panel transforms → reused in R3F hub editor
- Module components → reused in both editor preview and AR viewer
- This prototype IS Phase 9 of the platform spec

## Troubleshooting

| Problem | Fix |
|---|---|
| "8th Wall failed to load" | Check NEXT_PUBLIC_8THWALL_KEY in .env.local |
| Camera doesn't open | Must be on HTTPS — use ngrok |
| Card not detected | Check card.mind exists, try better lighting |
| GitHub graph empty | Check username in ar-config.ts, API rate limit: 60 req/hr |
| 3D model missing | Add model.glb to /public — falls back to icosahedron |
