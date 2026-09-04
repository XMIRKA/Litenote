import React, { useState, useRef, useEffect } from 'react';

export type DeviceType = 'phone' | 'tablet' | 'laptop' | 'browser';
export type DeviceTheme = 'dark' | 'titanium' | 'silver' | 'cyber';

export interface DeviceProps {
  type?: DeviceType;
  children?: React.ReactNode;
  image?: string;
  scale?: number;
  isScrollable?: boolean;
  enableParallax?: boolean;
  parallaxStrength?: number;
  enableRotate?: boolean;
  rotateStrength?: number;
  autoAnimate?: boolean;
  theme?: DeviceTheme;
  className?: string;
  screenClassName?: string;
  statusBar?: boolean;
  timeText?: string;
  batteryLevel?: number;
  urlBarText?: string;
}

export const Device: React.FC<DeviceProps> = ({
  type = 'phone',
  children,
  image,
  scale = 1,
  isScrollable = true,
  enableParallax = true,
  parallaxStrength = 10,
  enableRotate = true,
  rotateStrength = 8,
  autoAnimate = true,
  theme = 'cyber',
  className = '',
  screenClassName = '',
  statusBar = true,
  timeText = '09:41',
  batteryLevel = 100,
  urlBarText = 'litenote.network',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // Handle Mouse Move for 3D Tilt and Glare
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || (!enableRotate && !enableParallax)) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    setGlarePos({ x: percentX, y: percentY });

    if (enableRotate) {
      const calcRotateY = ((x - centerX) / centerX) * rotateStrength;
      const calcRotateX = -((y - centerY) / centerY) * rotateStrength;
      setRotateX(calcRotateX);
      setRotateY(calcRotateY);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Continuous floating 3D auto-animation when not hovered
  useEffect(() => {
    if (!autoAnimate) return;
    let animFrame: number;
    let angle = 0;

    const animateLoop = () => {
      if (!isHovered) {
        angle += 0.025;
        const currentRotY = Math.sin(angle) * (rotateStrength * 0.55);
        const currentRotX = Math.cos(angle * 0.7) * (rotateStrength * 0.4);
        setRotateY(currentRotY);
        setRotateX(currentRotX);
        setGlarePos({
          x: 50 + Math.sin(angle) * 25,
          y: 45 + Math.cos(angle * 0.8) * 20,
        });
      }
      animFrame = requestAnimationFrame(animateLoop);
    };

    animFrame = requestAnimationFrame(animateLoop);
    return () => cancelAnimationFrame(animFrame);
  }, [autoAnimate, isHovered, rotateStrength]);

  // Frame colors with glowing cyber reflections
  const frameBorderClass = {
    dark: 'border-[#1E293B] bg-[#0B0F17] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.12)]',
    titanium: 'border-[#334155] bg-[#0F172A] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_25px_rgba(56,189,248,0.15)]',
    silver: 'border-[#94A3B8] bg-[#1E293B] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]',
    cyber: 'border-emerald-500/40 bg-[#060D17] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(16,185,129,0.25)]',
  }[theme];

  return (
    <div
      className={`relative inline-block transition-transform duration-300 ease-out select-none ${className}`}
      style={{
        perspective: '1200px',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Rotatable Device Body */}
      <div
        className="relative transition-all duration-150 ease-out will-change-transform"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ===================== PHONE MOCKUP ===================== */}
        {type === 'phone' && (
          <div
            className={`relative w-[300px] sm:w-[335px] h-[580px] sm:h-[630px] rounded-[46px] p-3 sm:p-3.5 border-[6px] sm:border-[7px] ${frameBorderClass} transition-shadow`}
          >
            {/* Side hardware buttons (Volume + Power) */}
            <div className="absolute -left-[8px] top-24 w-[3px] h-9 bg-slate-700 rounded-l-md" />
            <div className="absolute -left-[8px] top-36 w-[3px] h-9 bg-slate-700 rounded-l-md" />
            <div className="absolute -right-[8px] top-28 w-[3px] h-14 bg-slate-700 rounded-r-md" />

            {/* Screen Inner Frame */}
            <div className="relative w-full h-full bg-[#070B12] rounded-[36px] overflow-hidden flex flex-col border border-white/10 shadow-inner">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-2.5 inset-x-0 z-30 flex justify-center pointer-events-none">
                <div className="h-5 px-3 rounded-full bg-black/90 border border-slate-800/80 flex items-center gap-2 shadow-md">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#050505] ring-1 ring-slate-800 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-indigo-950/80" />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/90 animate-pulse" />
                </div>
              </div>

              {/* Status Bar */}
              {statusBar && (
                <div className="h-8 px-6 pt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-300 z-20 shrink-0 select-none bg-gradient-to-b from-[#070B12] to-transparent">
                  <span className="font-semibold">{timeText}</span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-emerald-400 font-bold">5G</span>
                    <div className="w-4 h-2 rounded-[2px] border border-slate-400 p-[1px] flex items-center">
                      <div
                        className="h-full bg-emerald-400 rounded-[1px]"
                        style={{ width: `${Math.min(100, Math.max(10, batteryLevel))}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Screen Content Container */}
              <div
                className={`flex-1 relative overflow-hidden ${
                  isScrollable ? 'overflow-y-auto' : ''
                } ${screenClassName}`}
              >
                {image ? (
                  <img
                    src={image}
                    alt="Device Screen"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  children
                )}
              </div>

              {/* Home Indicator Bar */}
              <div className="h-4 flex items-center justify-center shrink-0 z-20 pointer-events-none bg-gradient-to-t from-[#070B12] to-transparent">
                <div className="w-28 h-1 rounded-full bg-white/40" />
              </div>

              {/* Glass Glare Overlay */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-30"
                style={{
                  background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.14) 0%, transparent 60%)`,
                  opacity: isHovered ? 1 : 0.4,
                }}
              />
            </div>
          </div>
        )}

        {/* ===================== LAPTOP MOCKUP ===================== */}
        {type === 'laptop' && (
          <div className="flex flex-col items-center">
            {/* Screen Lid */}
            <div
              className={`relative w-[340px] sm:w-[480px] md:w-[580px] h-[220px] sm:h-[310px] md:h-[370px] rounded-t-2xl p-2.5 sm:p-3 border-[4px] sm:border-[5px] ${frameBorderClass}`}
            >
              {/* Webcam */}
              <div className="absolute top-1.5 inset-x-0 flex justify-center pointer-events-none z-30">
                <div className="w-2 h-2 rounded-full bg-[#050505] ring-1 ring-slate-700 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-emerald-400" />
                </div>
              </div>

              {/* Screen Display */}
              <div className="relative w-full h-full bg-[#070B12] rounded-lg overflow-hidden flex flex-col border border-white/5 shadow-inner">
                <div
                  className={`flex-1 relative overflow-hidden ${
                    isScrollable ? 'overflow-y-auto' : ''
                  } ${screenClassName}`}
                >
                  {image ? (
                    <img
                      src={image}
                      alt="Laptop Screen"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    children
                  )}
                </div>

                {/* Glare Reflection */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-30"
                  style={{
                    background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.1) 0%, transparent 60%)`,
                    opacity: isHovered ? 1 : 0.35,
                  }}
                />
              </div>
            </div>

            {/* Laptop Base */}
            <div className="w-[370px] sm:w-[530px] md:w-[640px] h-3.5 sm:h-4 bg-gradient-to-b from-[#334155] via-[#1E293B] to-[#0F172A] rounded-b-xl shadow-2xl relative border-t border-slate-600 flex items-start justify-center">
              <div className="w-16 sm:w-20 h-1.5 bg-[#0B0F17] rounded-b-md" />
            </div>
          </div>
        )}

        {/* ===================== BROWSER MOCKUP ===================== */}
        {type === 'browser' && (
          <div
            className={`relative w-[340px] sm:w-[500px] md:w-[620px] rounded-2xl border-[3px] ${frameBorderClass} overflow-hidden flex flex-col shadow-2xl`}
          >
            <div className="h-10 bg-[#0E1626] border-b border-slate-800/90 px-3.5 flex items-center justify-between gap-3 shrink-0 z-20">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 max-w-sm h-6 px-2.5 rounded-lg bg-[#060A12] border border-slate-800 flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-300 truncate shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate text-slate-400">https://</span>
                <span className="text-emerald-300 font-semibold truncate">{urlBarText}</span>
              </div>
              <div className="w-6 shrink-0" />
            </div>
            <div
              className={`relative h-[260px] sm:h-[340px] bg-[#070B12] overflow-hidden ${
                isScrollable ? 'overflow-y-auto' : ''
              } ${screenClassName}`}
            >
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Device;
