import React, { useEffect, useRef } from 'react';

interface VideoIntroCanvasProps {
  elapsed: number; // in seconds (0.0 to 9.2)
}

interface ShatteredLetter {
  char: string;
  angle: number;
  speed: number;
  rotateSpeed: number;
  scale: number;
  x: number;
  y: number;
  rot: number;
}

export const VideoIntroCanvas: React.FC<VideoIntroCanvasProps> = ({ elapsed }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lettersRef = useRef<ShatteredLetter[]>([]);

  // Initialize scattered letters for Scene 1 (0.0s - 1.8s)
  useEffect(() => {
    const chars = ['L', 'i', 't', 'e', 'n', 'o', 't', 'e'];
    lettersRef.current = chars.map((char, i) => {
      const angle = (i / chars.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      return {
        char,
        angle,
        speed: 160 + Math.random() * 80,
        rotateSpeed: (Math.random() - 0.5) * 4,
        scale: 1 + Math.random() * 0.4,
        x: 0,
        y: 0,
        rot: 0,
      };
    });
  }, []);

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

    const render = () => {
      const cx = width / 2;
      const cy = height / 2;

      // Pure pitch black background matching the video
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // ==========================================
      // SCENE 1: 0.0s - 1.8s (Chromatic Shatter)
      // ==========================================
      if (elapsed >= 0 && elapsed < 1.8) {
        const t = elapsed;
        ctx.save();
        ctx.translate(cx, cy);

        if (t < 0.6) {
          // Centered "LiteNote" text with prism chromatic aberration
          const glitchX = (Math.random() - 0.5) * (t * 6);
          const glitchY = (Math.random() - 0.5) * (t * 4);

          // Red channel offset
          ctx.font = '700 52px "Times New Roman", Georgia, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.fillStyle = 'rgba(255, 40, 80, 0.7)';
          ctx.fillText('LiteNote', glitchX - 5, glitchY);

          // Cyan channel offset
          ctx.fillStyle = 'rgba(40, 220, 255, 0.7)';
          ctx.fillText('LiteNote', glitchX + 5, glitchY);

          // Center white text
          ctx.fillStyle = '#ffffff';
          ctx.fillText('LiteNote', glitchX, glitchY);

          // Subtle rainbow horizontal streak
          const grad = ctx.createLinearGradient(-150, 0, 150, 0);
          grad.addColorStop(0, 'rgba(255,0,128,0)');
          grad.addColorStop(0.3, 'rgba(255,100,0,0.4)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
          grad.addColorStop(0.7, 'rgba(0,200,255,0.4)');
          grad.addColorStop(1, 'rgba(128,0,255,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(-160, -3, 320, 6);
        } else {
          // Explosion outwards (0.6s - 1.8s)
          const explodeT = (t - 0.6) / 1.2; // 0 to 1
          const easeExplode = 1 - Math.pow(1 - explodeT, 2.2);

          lettersRef.current.forEach((l, idx) => {
            const dist = l.speed * easeExplode * 2.2;
            const px = Math.cos(l.angle) * dist;
            const py = Math.sin(l.angle) * dist;
            const rot = l.rotateSpeed * easeExplode;
            const alpha = Math.max(0, 1 - explodeT * 0.9);

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(rot);
            ctx.scale(l.scale, l.scale);

            // Rainbow trail behind each flying letter
            const trailCount = 5;
            for (let tr = 1; tr <= trailCount; tr++) {
              const trDist = (dist * (1 - tr * 0.08));
              const trX = Math.cos(l.angle) * (trDist - dist);
              const trY = Math.sin(l.angle) * (trDist - dist);
              ctx.font = '700 48px "Times New Roman", Georgia, serif';
              ctx.fillStyle = tr % 2 === 0 ? `rgba(255, 50, 120, ${alpha * 0.3})` : `rgba(40, 200, 255, ${alpha * 0.3})`;
              ctx.fillText(l.char, trX, trY);
            }

            ctx.font = '700 48px "Times New Roman", Georgia, serif';
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 12;
            ctx.fillText(l.char, 0, 0);
            ctx.restore();
          });
        }
        ctx.restore();
      }

      // ==========================================
      // SCENE 2: 1.8s - 3.6s (Metallic Slabs & Star Flare)
      // ==========================================
      else if (elapsed >= 1.8 && elapsed < 3.6) {
        const t = elapsed - 1.8;
        ctx.save();
        ctx.translate(cx, cy);

        const fadeIn = Math.min(1, t * 3);
        const scale = 0.95 + t * 0.05;
        ctx.scale(scale, scale);
        ctx.globalAlpha = fadeIn;

        // Angular Parallelogram Backdrop Plates
        ctx.fillStyle = 'rgba(210, 215, 225, 0.9)';
        ctx.beginPath();
        ctx.moveTo(-160, -32);
        ctx.lineTo(130, -32);
        ctx.lineTo(80, -10);
        ctx.lineTo(-210, -10);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-100, 10);
        ctx.lineTo(190, 10);
        ctx.lineTo(140, 32);
        ctx.lineTo(-150, 32);
        ctx.closePath();
        ctx.fill();

        // Serif Center Metallic Logo
        ctx.font = 'bold 54px "Times New Roman", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillText('LiteNote', 0, 0);

        // 4-Point Starlight Optical Flare at the center
        const flarePulse = 1 + Math.sin(t * 8) * 0.2;
        const flareLength = 110 * flarePulse;
        const flareWidth = 3;

        // Vertical spike
        const flareGradV = ctx.createLinearGradient(0, -flareLength, 0, flareLength);
        flareGradV.addColorStop(0, 'rgba(255,255,255,0)');
        flareGradV.addColorStop(0.5, 'rgba(255,255,255,1)');
        flareGradV.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = flareGradV;
        ctx.fillRect(-flareWidth / 2, -flareLength, flareWidth, flareLength * 2);

        // Horizontal spike
        const flareGradH = ctx.createLinearGradient(-flareLength, 0, flareLength, 0);
        flareGradH.addColorStop(0, 'rgba(255,255,255,0)');
        flareGradH.addColorStop(0.5, 'rgba(255,255,255,1)');
        flareGradH.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = flareGradH;
        ctx.fillRect(-flareLength, -flareWidth / 2, flareLength * 2, flareWidth);

        // Diagonal soft spikes
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = flareGradV;
        ctx.fillRect(-flareWidth / 3, -flareLength * 0.5, flareWidth * 0.6, flareLength);
        ctx.restore();

        // Central white orb
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 24;
        ctx.fill();

        ctx.restore();
      }

      // ==========================================
      // SCENE 3: 3.6s - 5.4s (Futuristic LITENOTE & Ray Burst)
      // ==========================================
      else if (elapsed >= 3.6 && elapsed < 5.4) {
        const t = elapsed - 3.6;
        ctx.save();
        ctx.translate(cx, cy);

        // Burst Zoom Snap
        const snapScale = t < 0.3 ? 0.4 + t * 2.2 : 1.05 + (t - 0.3) * 0.08;
        ctx.scale(snapScale, snapScale);

        // Radiating 8 Sharp Light Spike Needles
        const spikeCount = 8;
        const spikeLen = 140 + t * 40;
        for (let s = 0; s < spikeCount; s++) {
          const sAngle = (s * Math.PI * 2) / spikeCount + t * 0.1;
          ctx.save();
          ctx.rotate(sAngle);
          const spikeGrad = ctx.createLinearGradient(0, 0, 0, spikeLen);
          spikeGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
          spikeGrad.addColorStop(0.4, 'rgba(100,220,255,0.6)');
          spikeGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = spikeGrad;
          ctx.beginPath();
          ctx.moveTo(-2.5, 0);
          ctx.lineTo(2.5, 0);
          ctx.lineTo(0.5, spikeLen);
          ctx.lineTo(-0.5, spikeLen);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Italic Bold Wireframe/Filled LITENOTE Text
        ctx.font = 'italic 900 64px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Chromatic split offset
        ctx.fillStyle = 'rgba(255, 30, 80, 0.8)';
        ctx.fillText('LITENOTE', -4, 0);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.fillText('LITENOTE', 4, 0);

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18;
        ctx.fillText('LITENOTE', 0, 0);

        // Outline sweep
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeText('LITENOTE', 0, 0);

        ctx.restore();
      }

      // ==========================================
      // SCENE 4: 5.4s - 6.6s (Deep Black & Typewriter "MADE")
      // ==========================================
      else if (elapsed >= 5.4 && elapsed < 6.6) {
        const t = elapsed - 5.4;
        ctx.save();
        ctx.translate(cx, cy);

        // Typewriter "MADE" with solid cursor block
        ctx.font = '900 36px "Courier New", monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let text = 'MADE';
        if (t < 0.3) text = 'M';
        else if (t < 0.6) text = 'MA';
        else if (t < 0.9) text = 'MAD';
        else text = 'MADE';

        const cursorBlink = Math.floor(t * 5) % 2 === 0;

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, -12, 0);

        // White block cursor
        if (cursorBlink) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(48, -14, 22, 28);
        }

        ctx.restore();
      }

      // ==========================================
      // SCENE 5: 6.6s - 9.2s (Volumetric Light Rays & "MA Developer")
      // ==========================================
      else if (elapsed >= 6.6) {
        const t = elapsed - 6.6;
        ctx.save();
        ctx.translate(cx, cy);

        const rayRot = t * 0.45; // Gentle cinematic beam rotation
        const rayCount = 10;
        const maxRadius = Math.max(width, height) * 0.9;
        const innerHole = 110;

        // Draw 10 volumetric bright light beams passing through the circular mask aperture
        for (let i = 0; i < rayCount; i++) {
          const angle = (i * Math.PI * 2) / rayCount + rayRot;
          const beamWidth = 0.18 + Math.sin(t * 2 + i) * 0.03;

          const p1x = Math.cos(angle - beamWidth) * innerHole;
          const p1y = Math.sin(angle - beamWidth) * innerHole;
          const p2x = Math.cos(angle + beamWidth) * innerHole;
          const p2y = Math.sin(angle + beamWidth) * innerHole;

          const p3x = Math.cos(angle + beamWidth * 1.6) * maxRadius;
          const p3y = Math.sin(angle + beamWidth * 1.6) * maxRadius;
          const p4x = Math.cos(angle - beamWidth * 1.6) * maxRadius;
          const p4y = Math.sin(angle - beamWidth * 1.6) * maxRadius;

          const beamGrad = ctx.createRadialGradient(0, 0, innerHole, 0, 0, maxRadius);
          beamGrad.addColorStop(0, 'rgba(230, 245, 255, 0.85)');
          beamGrad.addColorStop(0.3, 'rgba(200, 230, 240, 0.45)');
          beamGrad.addColorStop(0.7, 'rgba(150, 190, 210, 0.15)');
          beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineTo(p3x, p3y);
          ctx.lineTo(p4x, p4y);
          ctx.closePath();
          ctx.fill();
        }

        // Circular stencil aperture rim
        ctx.beginPath();
        ctx.arc(0, 0, innerHole, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Foreground Signature: "MA Developer"
        const textFadeIn = Math.min(1, t * 1.8);
        ctx.globalAlpha = textFadeIn;

        // "MA"
        ctx.font = 'italic 700 40px "Times New Roman", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 12;
        ctx.fillText('MA', 0, -14);

        // "Developer" in stylish script/gothic handwritten font
        ctx.font = '300 28px "Brush Script MT", "Caveat", "Segoe Script", cursive, sans-serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.shadowColor = 'rgba(200, 230, 255, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fillText('Developer', 0, 24);

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [elapsed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 bg-black"
    />
  );
};
