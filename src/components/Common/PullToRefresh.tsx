import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
}

const PULL_THRESHOLD = 64;
const MAX_PULL = 110;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const hasTriggeredHaptic = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    const container = containerRef.current;
    if (!container) return;

    // Only allow pull if scrolled to top
    if (container.scrollTop <= 2) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
      hasTriggeredHaptic.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 2) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    if (diff > 0) {
      // Apply logarithmic-like drag damping
      const damped = Math.min(MAX_PULL, diff * 0.42);
      setPullDistance(damped);

      if (damped >= PULL_THRESHOLD && !hasTriggeredHaptic.current) {
        triggerHaptic('medium');
        hasTriggeredHaptic.current = true;
      } else if (damped < PULL_THRESHOLD && hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = false;
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || disabled || isRefreshing) return;
    isPulling.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      triggerHaptic('success');
      setPullDistance(PULL_THRESHOLD);

      try {
        await onRefresh();
        setIsSuccess(true);
        triggerHaptic('light');
        setTimeout(() => {
          setIsSuccess(false);
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      } catch {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full overflow-y-auto overscroll-y-contain custom-scrollbar"
    >
      {/* Visual Pull Refresh Spinner */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: 1,
              y: Math.min(pullDistance, PULL_THRESHOLD),
              scale: isRefreshing ? 1 : 0.8 + progress * 0.25,
            }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-2 left-0 right-0 z-30 flex justify-center pointer-events-none"
          >
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#081524]/90 backdrop-blur-xl border border-emerald-500/40 shadow-[0_4px_20px_rgba(0,223,137,0.25)] text-xs font-mono text-emerald-300">
              {isSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Обновлено</span>
                </>
              ) : isRefreshing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#00DF89] animate-spin" />
                  <span>Обновление...</span>
                </>
              ) : (
                <>
                  <ArrowDown
                    style={{ transform: `rotate(${progress * 180}deg)` }}
                    className="w-3.5 h-3.5 text-[#00DF89] transition-transform duration-100"
                  />
                  <span>{progress >= 1 ? 'Отпустите для обновления' : 'Потяните вниз'}</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : 'none',
          transition: isPulling.current ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
