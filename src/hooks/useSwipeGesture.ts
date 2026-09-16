import { useEffect, useRef } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  maxPerpendicularDistance?: number;
  disabled?: boolean;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 65,
  maxPerpendicularDistance = 55,
  disabled = false,
}: SwipeGestureOptions) {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const target = e.target as HTMLElement | null;
      // Do not trigger if interacting with interactive form controls or horizontal scrollers
      if (
        target?.closest('input') ||
        target?.closest('textarea') ||
        target?.closest('select') ||
        target?.closest('button') ||
        target?.closest('[data-no-swipe]') ||
        target?.closest('.no-swipe') ||
        target?.closest('.overflow-x-auto') ||
        target?.closest('pre') ||
        target?.closest('code')
      ) {
        touchStartX.current = 0;
        touchStartY.current = 0;
        return;
      }

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX.current || !touchStartY.current) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const elapsedTime = Date.now() - touchStartTime.current;

      const diffX = touchEndX - touchStartX.current;
      const diffY = touchEndY - touchStartY.current;

      touchStartX.current = 0;
      touchStartY.current = 0;

      // Ignore slow drags (> 450ms) or mostly vertical swipes
      if (elapsedTime > 450) return;
      if (Math.abs(diffY) > maxPerpendicularDistance) return;

      if (diffX < -minSwipeDistance) {
        // Swiped Left -> Go to Next Tab
        triggerHaptic('light');
        onSwipeLeft?.();
      } else if (diffX > minSwipeDistance) {
        // Swiped Right -> Go to Prev Tab
        triggerHaptic('light');
        onSwipeRight?.();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, minSwipeDistance, maxPerpendicularDistance, disabled]);
}
