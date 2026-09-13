import React, { useEffect, useRef } from 'react';

export type CosmicPhase = 'zoom-out' | 'zoom-in' | 'boom';

interface CosmicSpaceCanvasProps {
  phase: CosmicPhase;
  progress: number; // 0 to 100
  boomTriggered: boolean;
}

interface Star3D {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  size: number;
  color: string;
  angle: number;
  radius: number;
  speed: number;
}

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  sparkle: number;
  length: number;
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  hue: number;
  vx: number;
  vy: number;
  alpha: number;
  scale: number;
}

const NEON_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981', // emerald
  '#fbbf24', // amber
  '#f43f5e', // rose
  '#ffffff', // bright white
];

export const CosmicSpaceCanvas: React.FC<CosmicSpaceCanvasProps> = ({
  phase,
  progress,
  boomTriggered,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const explosionParticlesRef = useRef<ExplosionParticle[]>([]);
  const shockwavesRef = useRef<{ radius: number; maxRadius: number; color: string; width: number; alpha: number }[]>([]);
  const boomHandledRef = useRef(false);

  // Trigger massive Supernova Boom particles when boom starts
  useEffect(() => {
    if (boomTriggered && !boomHandledRef.current) {
      boomHandledRef.current = true;
      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : window.innerWidth;
      const h = canvas ? canvas.height : window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      // 1. Create 220 high-velocity explosion particles
      const newParticles: ExplosionParticle[] = [];
      const particleCount = 220;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 22 + 4; // powerful blast velocity
        newParticles.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.5),
          vy: Math.sin(angle) * speed * (0.8 + Math.random() * 0.5),
          size: Math.random() * 4 + 1.5,
          color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
          alpha: 1,
          decay: Math.random() * 0.012 + 0.008,
          sparkle: Math.random() * 10,
          length: Math.random() * 15 + 5,
        });
      }
      explosionParticlesRef.current = newParticles;

      // 2. Spawn 5 supersonic expanding chromatic shockwaves
      shockwavesRef.current = [
        { radius: 10, maxRadius: Math.max(w, h) * 1.2, color: '#ffffff', width: 6, alpha: 1 },
        { radius: 5, maxRadius: Math.max(w, h) * 1.1, color: '#06b6d4', width: 4, alpha: 0.9 },
        { radius: 0, maxRadius: Math.max(w, h) * 1.0, color: '#ec4899', width: 5, alpha: 0.85 },
        { radius: 0, maxRadius: Math.max(w, h) * 0.9, color: '#8b5cf6', width: 3, alpha: 0.8 },
        { radius: 0, maxRadius: Math.max(w, h) * 0.8, color: '#fbbf24', width: 2, alpha: 0.75 },
      ];
    }
  }, [boomTriggered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse interactive tilt
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - width / 2) * 0.05;
      targetMouseY = (e.clientY - height / 2) * 0.05;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 1. Generate 3D Spiral Galaxy & Starfield
    const STAR_COUNT = 550;
    const stars: Star3D[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const armIndex = i % 3;
      const armAngle = (armIndex * 2 * Math.PI) / 3;
      const distFromCenter = Math.pow(Math.random(), 0.7) * (width * 1.2);
      const spiralAngle = armAngle + (distFromCenter * 0.0035);

      stars.push({
        x: Math.cos(spiralAngle) * distFromCenter + (Math.random() - 0.5) * 120,
        y: Math.sin(spiralAngle) * distFromCenter + (Math.random() - 0.5) * 120,
        z: Math.random() * width + 50,
        prevZ: Math.random() * width + 50,
        size: Math.random() * 2.2 + 0.6,
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
        angle: spiralAngle,
        radius: distFromCenter,
        speed: Math.random() * 0.002 + 0.001,
      });
    }

    // 2. Generate Nebula Cosmic Clouds
    const NEBULA_COUNT = 14;
    const nebulas: NebulaCloud[] = [];
    for (let i = 0; i < NEBULA_COUNT; i++) {
      nebulas.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        radius: Math.random() * 260 + 150,
        hue: i % 2 === 0 ? 270 + Math.random() * 45 : 185 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.14 + 0.05,
        scale: 1,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.016;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Calculate smooth cinematic camera zoom and camera shake based on progress & phase
      let cameraZoom = 1;
      let cameraShakeX = 0;
      let cameraShakeY = 0;
      let starZSpeed = 1;

      if (phase === 'zoom-out') {
        // Progress 0% -> 33%: Zoom from 3.8 down to 0.5 (Camera flying out to show the huge galaxy)
        const localT = Math.min(1, Math.max(0, progress / 33));
        const easeT = 1 - Math.pow(1 - localT, 2.5);
        cameraZoom = 3.8 - easeT * (3.8 - 0.55);
        starZSpeed = 1.2;
      } else if (phase === 'zoom-in') {
        // Progress 33% -> 66%: Rush forward! Zoom from 0.55 up to 4.8! (Hyper warp acceleration)
        const localT = Math.min(1, Math.max(0, (progress - 33) / 33));
        const easeT = Math.pow(localT, 3.2); // exponential acceleration
        cameraZoom = 0.55 + easeT * (4.8 - 0.55);
        starZSpeed = 4 + easeT * 38; // extreme star streaks

        // Camera violent sci-fi vibration as speed approaches light speed
        const shakeIntensity = easeT * 9;
        cameraShakeX = (Math.random() - 0.5) * shakeIntensity;
        cameraShakeY = (Math.random() - 0.5) * shakeIntensity;
      } else {
        // Phase: 'boom' (66% -> 100%): Camera stabilizes into a majestic spacious vantage point
        const localT = Math.min(1, Math.max(0, (progress - 66) / 34));
        cameraZoom = 1.05 + Math.sin(localT * Math.PI) * 0.08;
        starZSpeed = 2.0;
        // Minor residual shock rumble that quickly fades
        const boomShake = Math.max(0, 1 - localT * 4) * 14;
        cameraShakeX = (Math.random() - 0.5) * boomShake;
        cameraShakeY = (Math.random() - 0.5) * boomShake;
      }

      const centerX = width / 2 + mouseX + cameraShakeX;
      const centerY = height / 2 + mouseY + cameraShakeY;

      // Dark Cosmic Void Background
      const bgGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        10 * cameraZoom,
        width / 2,
        height / 2,
        Math.max(width, height)
      );

      if (phase === 'boom' && progress < 72) {
        // Flash glow during immediate supernova explosion
        bgGrad.addColorStop(0, '#2e1065');
        bgGrad.addColorStop(0.3, '#1e1b4b');
        bgGrad.addColorStop(1, '#020308');
      } else if (phase === 'zoom-in') {
        // Charging hyper-blue void
        bgGrad.addColorStop(0, '#0c1538');
        bgGrad.addColorStop(0.4, '#050a1f');
        bgGrad.addColorStop(1, '#020308');
      } else {
        // Mystical purple deep singularity
        bgGrad.addColorStop(0, '#100c28');
        bgGrad.addColorStop(0.5, '#040714');
        bgGrad.addColorStop(1, '#020308');
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Expanding/Compressing Nebula Dust
      nebulas.forEach((nebula) => {
        nebula.x += nebula.vx;
        nebula.y += nebula.vy;

        const screenX = nebula.x * cameraZoom + centerX;
        const screenY = nebula.y * cameraZoom + centerY;
        const radius = nebula.radius * cameraZoom;

        if (screenX < -radius || screenX > width + radius || screenY < -radius || screenY > height + radius) return;

        const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
        grad.addColorStop(0, `hsla(${nebula.hue}, 95%, 60%, ${nebula.alpha})`);
        grad.addColorStop(0.5, `hsla(${nebula.hue + 25}, 90%, 45%, ${nebula.alpha * 0.4})`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Spiral Galaxy Arms & Starfield
      ctx.save();
      stars.forEach((star) => {
        // Galaxy orbital rotation
        star.angle += star.speed * (phase === 'zoom-in' ? 2.5 : 1);
        const originalX = Math.cos(star.angle) * star.radius;
        const originalY = Math.sin(star.angle) * star.radius;

        star.prevZ = star.z;
        star.z -= starZSpeed;

        if (star.z <= 0) {
          star.z = width;
          star.prevZ = star.z;
        }

        // Apply camera zoom to 3D projection
        const k = (320 / star.z) * cameraZoom;
        const px = originalX * k + centerX;
        const py = originalY * k + centerY;

        if (px < -150 || px > width + 150 || py < -150 || py > height + 150) return;

        const prevK = (320 / star.prevZ) * cameraZoom;
        const prevPx = originalX * prevK + centerX;
        const prevPy = originalY * prevK + centerY;

        const size = Math.max(0.6, (1 - star.z / width) * star.size * cameraZoom);
        const alpha = Math.min(1, (1 - star.z / width) * 1.4);

        // Draw Warp Speed Streak Lines during zoom-in
        if (starZSpeed > 5) {
          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = star.color;
          ctx.lineWidth = Math.min(4, size * 1.5);
          ctx.globalAlpha = alpha * 0.85;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Star Core
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = starZSpeed > 8 ? 10 : 3;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });
      ctx.restore();

      // 3. Central Gravitational Rings & Energy Torus (adapts to camera zoom)
      const ringCount = 4;
      for (let r = 1; r <= ringCount; r++) {
        const ringRadius = (r * 90 + Math.sin(time * 3 + r) * 12) * cameraZoom;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time * (r % 2 === 0 ? 0.4 : -0.35) * (phase === 'zoom-in' ? 3 : 1));

        ctx.beginPath();
        ctx.ellipse(0, 0, ringRadius, ringRadius * 0.42, (r * Math.PI) / 4, 0, Math.PI * 2);
        const ringHue = phase === 'zoom-in' ? 180 + r * 40 : 250 + r * 30;
        ctx.strokeStyle = `hsla(${ringHue}, 90%, 65%, ${phase === 'boom' ? 0.35 : 0.2})`;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([6 + r * 3, 10 + r * 4]);
        ctx.stroke();

        // Photonic orbiting node
        const nodeAngle = time * (1.5 / r);
        const nx = Math.cos(nodeAngle) * ringRadius;
        const ny = Math.sin(nodeAngle) * ringRadius * 0.42;
        ctx.beginPath();
        ctx.arc(nx, ny, 3 * cameraZoom, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      }

      // 4. Supernova Shockwaves (Phase 'boom')
      if (shockwavesRef.current.length > 0) {
        shockwavesRef.current.forEach((sw) => {
          sw.radius += 18;
          sw.alpha *= 0.96;

          if (sw.alpha > 0.02 && sw.radius < sw.maxRadius) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, sw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = sw.width;
            ctx.globalAlpha = sw.alpha;
            ctx.shadowColor = sw.color;
            ctx.shadowBlur = 16;
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
          }
        });
      }

      // 5. Explosion Particles (Phase 'boom')
      if (explosionParticlesRef.current.length > 0) {
        for (let i = explosionParticlesRef.current.length - 1; i >= 0; i--) {
          const p = explosionParticlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.96; // drag friction
          p.vy *= 0.96;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            explosionParticlesRef.current.splice(i, 1);
            continue;
          }

          // Draw radiant light spark
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.globalAlpha = p.alpha;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 14;
          ctx.stroke();

          // Particle Head
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [phase, progress]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
