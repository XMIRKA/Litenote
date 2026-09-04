import React, { useEffect, useRef } from 'react';

interface CyberNetworkBackgroundProps {
  interactive?: boolean;
  opacity?: number;
  nodeCount?: number;
  className?: string;
}

export const CyberNetworkBackground: React.FC<CyberNetworkBackgroundProps> = ({
  interactive = true,
  opacity = 0.65,
  nodeCount = 65,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const updateDimensions = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Mouse coordinates
    const mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      radius: 180,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Nodes
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseRadius: number;
      radius: number;
      color: string;
      pulsePhase: number;
      label?: string;
    }

    interface Packet {
      fromIndex: number;
      toIndex: number;
      progress: number;
      speed: number;
      color: string;
    }

    const labels = [
      'mesh://192.168.1.1',
      'matrix.root.net',
      'TCP/WASM',
      'LITENOTE_CORE',
      'AI_GEMINI_NODE',
      'TLS_v1.3',
      'KERNEL_SYS',
      'SYN_ACK',
      'NODE_SECURE',
      'WEBRTC_MESH',
    ];

    const colors = ['#10B981', '#06B6D4', '#8B5CF6', '#34D399'];

    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const r = Math.random() * 2.2 + 1.2;
      nodes.push({
        x: Math.random() * (width || 1200),
        y: Math.random() * (height || 800),
        vx: (Math.random() - 0.5) * 0.95,
        vy: (Math.random() - 0.5) * 0.95,
        baseRadius: r,
        radius: r,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulsePhase: Math.random() * Math.PI * 2,
        label: Math.random() > 0.72 ? labels[Math.floor(Math.random() * labels.length)] : undefined,
      });
    }

    // Dynamic data packets moving across lines
    const packets: Packet[] = [];
    const maxPackets = 16;

    let time = 0;

    // Animation Loop
    const render = () => {
      time += 0.025;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.09;
      mouse.y += (mouse.targetY - mouse.y) * 0.09;

      // Draw faint cyber grid backdrop
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = (time * 10) % gridSize; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Update & Draw Connections
      const activeConnections: { p1: Node; p2: Node; idx1: number; idx2: number }[] = [];

      for (let i = 0; i < nodes.length; i++) {
        const p1 = nodes[i];

        // Move node continuously
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Pulsing radius
        p1.pulsePhase += 0.04;
        p1.radius = p1.baseRadius + Math.sin(p1.pulsePhase) * 0.7;

        // Bounce on boundaries smoothly
        if (p1.x < 0) {
          p1.x = 0;
          p1.vx *= -1;
        } else if (p1.x > width) {
          p1.x = width;
          p1.vx *= -1;
        }

        if (p1.y < 0) {
          p1.y = 0;
          p1.vy *= -1;
        } else if (p1.y > height) {
          p1.y = height;
          p1.vy *= -1;
        }

        // Connect with nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const p2 = nodes[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 155) {
            activeConnections.push({ p1, p2, idx1: i, idx2: j });
            const alpha = (1 - dist / 155) * 0.4 * opacity;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = dist < 80 ? 1 : 0.6;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Connect with mouse cursor
        if (interactive) {
          const mdx = p1.x - mouse.x;
          const mdy = p1.y - mouse.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < mouse.radius) {
            const mAlpha = (1 - mDist / mouse.radius) * 0.7 * opacity;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(6, 182, 212, ${mAlpha})`;
            ctx.lineWidth = 1.3;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        // Draw node glow & point
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, Math.max(1, p1.radius), 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.shadowColor = p1.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw cyber label
        if (p1.label) {
          ctx.font = '8.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillStyle = 'rgba(52, 211, 153, 0.6)';
          ctx.fillText(p1.label, p1.x + 8, p1.y - 4);
        }
      }

      // Manage Data Packets travelling on connections
      if (activeConnections.length > 0 && packets.length < maxPackets && Math.random() < 0.15) {
        const randConn = activeConnections[Math.floor(Math.random() * activeConnections.length)];
        packets.push({
          fromIndex: randConn.idx1,
          toIndex: randConn.idx2,
          progress: 0,
          speed: Math.random() * 0.02 + 0.012,
          color: Math.random() > 0.5 ? '#34D399' : '#38BDF8',
        });
      }

      // Draw Packets
      for (let k = packets.length - 1; k >= 0; k--) {
        const pkt = packets[k];
        pkt.progress += pkt.speed;

        const n1 = nodes[pkt.fromIndex];
        const n2 = nodes[pkt.toIndex];

        if (pkt.progress >= 1 || !n1 || !n2) {
          packets.splice(k, 1);
          continue;
        }

        const px = n1.x + (n2.x - n1.x) * pkt.progress;
        const py = n1.y + (n2.y - n1.y) * pkt.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = pkt.color;
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [interactive, opacity, nodeCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none w-full h-full ${className}`}
      style={{ opacity }}
    />
  );
};
