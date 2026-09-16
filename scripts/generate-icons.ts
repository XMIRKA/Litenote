import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Standalone Standard App Icon SVG (512x512)
const createStandardIconSvg = (size: number) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050B14"/>
      <stop offset="40%" stop-color="#081426"/>
      <stop offset="100%" stop-color="#02050A"/>
    </linearGradient>

    <radialGradient id="centerGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#00DF89" stop-opacity="0.32"/>
      <stop offset="45%" stop-color="#00F0FF" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#00DF89" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#006644" stop-opacity="0.3"/>
    </linearGradient>

    <linearGradient id="emblemGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="60%" stop-color="#00DF89"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>

    <linearGradient id="emblemGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#0E7490"/>
    </linearGradient>

    <linearGradient id="facetDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0C2538"/>
      <stop offset="100%" stop-color="#06131F"/>
    </linearGradient>

    <linearGradient id="glassSheen" x1="0%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.15"/>
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>

    <!-- Drop Shadows & Glow Filters -->
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur1"/>
      <feGaussianBlur stdDeviation="24" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.8"/>
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00DF89" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Base App Tile Background -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)"/>
  <rect width="512" height="512" rx="120" fill="url(#centerGlow)"/>

  <!-- Subtle Cyber Grid Backdrop Accent -->
  <g opacity="0.08" stroke="#00DF89" stroke-width="1.5">
    <line x1="96" y1="96" x2="416" y2="96"/>
    <line x1="96" y1="192" x2="416" y2="192"/>
    <line x1="96" y1="288" x2="416" y2="288"/>
    <line x1="96" y1="384" x2="416" y2="384"/>
    <line x1="96" y1="96" x2="96" y2="416"/>
    <line x1="192" y1="96" x2="192" y2="416"/>
    <line x1="288" y1="96" x2="288" y2="416"/>
    <line x1="384" y1="96" x2="384" y2="416"/>
  </g>

  <!-- Outer Rounded Border -->
  <rect x="6" y="6" width="500" height="500" rx="114" fill="none" stroke="url(#borderGrad)" stroke-width="3.5" opacity="0.75"/>

  <!-- Central Glowing LiteNote Emblem -->
  <g filter="url(#shadow3D)">
    <!-- Base Note / Monogram Tile -->
    <path d="M152 136C152 122.745 162.745 112 176 112H296L368 184V376C368 389.255 357.255 400 344 400H176C162.745 400 152 389.255 152 376V136Z" 
          fill="url(#facetDark)" 
          stroke="url(#borderGrad)" 
          stroke-width="4"/>

    <!-- Folded Corner Geometry -->
    <path d="M296 112V168C296 176.837 303.163 184 312 184H368" 
          fill="#081B2B" 
          stroke="url(#emblemGrad1)" 
          stroke-width="4"/>

    <!-- Stylized "L" + "N" & Lightning Quill Energy Lines -->
    <!-- Stylized 'L' bar -->
    <path d="M196 172V340H268" 
          fill="none" 
          stroke="url(#emblemGrad1)" 
          stroke-width="18" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          filter="url(#neonGlow)"/>

    <!-- Stylized 'N' diagonal laser beam linking the note -->
    <path d="M246 220L316 340V220" 
          fill="none" 
          stroke="url(#emblemGrad1)" 
          stroke-width="18" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          filter="url(#neonGlow)"/>

    <!-- Glowing Cyber Core Pulse Nodes -->
    <circle cx="196" cy="172" r="7" fill="#FFFFFF" filter="url(#neonGlow)"/>
    <circle cx="316" cy="220" r="7" fill="#00F0FF" filter="url(#neonGlow)"/>
    <circle cx="316" cy="340" r="7" fill="#00DF89" filter="url(#neonGlow)"/>
    <circle cx="268" cy="340" r="7" fill="#FFFFFF" filter="url(#neonGlow)"/>
  </g>

  <!-- Top Glass Horizon Sheen (iOS Luxury Finish) -->
  <path d="M6 120C6 57.0396 57.0396 6 120 6H392C454.96 6 506 57.0396 506 120V230C410 270 290 280 6 220V120Z" fill="url(#glassSheen)"/>
</svg>
`;

// Maskable Icon SVG (512x512 with safe area margin)
const createMaskableIconSvg = (size: number) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#040810"/>
      <stop offset="50%" stop-color="#081426"/>
      <stop offset="100%" stop-color="#02050A"/>
    </linearGradient>
    <radialGradient id="centerGlowMask" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00DF89" stop-opacity="0.38"/>
      <stop offset="50%" stop-color="#00F0FF" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="emblemGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="50%" stop-color="#00DF89"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="borderGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="100%" stop-color="#00DF89"/>
    </linearGradient>
    <filter id="neonGlowMask" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="blur1"/>
      <feGaussianBlur stdDeviation="20" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Full bleed background for adaptive Android launcher icon masking -->
  <rect width="512" height="512" fill="url(#bgGradMask)"/>
  <rect width="512" height="512" fill="url(#centerGlowMask)"/>

  <!-- Centered Scaled Emblem inside 80% safe zone -->
  <g transform="translate(256, 256) scale(0.78) translate(-256, -256)">
    <!-- Base Note Frame -->
    <path d="M152 136C152 122.745 162.745 112 176 112H296L368 184V376C368 389.255 357.255 400 344 400H176C162.745 400 152 389.255 152 376V136Z" 
          fill="#091824" 
          stroke="url(#borderGradMask)" 
          stroke-width="5"/>

    <!-- Corner Fold -->
    <path d="M296 112V168C296 176.837 303.163 184 312 184H368" 
          fill="#06101E" 
          stroke="url(#emblemGradMask)" 
          stroke-width="5"/>

    <!-- Glowing Monogram LN Lines -->
    <path d="M196 172V340H268" 
          fill="none" 
          stroke="url(#emblemGradMask)" 
          stroke-width="20" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          filter="url(#neonGlowMask)"/>

    <path d="M246 220L316 340V220" 
          fill="none" 
          stroke="url(#emblemGradMask)" 
          stroke-width="20" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          filter="url(#neonGlowMask)"/>

    <circle cx="196" cy="172" r="8" fill="#FFFFFF" filter="url(#neonGlowMask)"/>
    <circle cx="316" cy="220" r="8" fill="#00F0FF" filter="url(#neonGlowMask)"/>
    <circle cx="316" cy="340" r="8" fill="#00DF89" filter="url(#neonGlowMask)"/>
    <circle cx="268" cy="340" r="8" fill="#FFFFFF" filter="url(#neonGlowMask)"/>
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');

  console.log('Generating vector icons...');
  
  // 1. Write pristine favicon.svg
  const standardSvg = createStandardIconSvg(512);
  const maskableSvg = createMaskableIconSvg(512);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardSvg);

  // 2. Generate 512x512 standard PWA icon
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 3. Generate 192x192 standard PWA icon
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 4. Generate 180x180 Apple Touch Icon
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 5. Generate 512x512 Maskable PWA icon
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('All PWA and mobile icons generated successfully!');
}

generate().catch(console.error);
