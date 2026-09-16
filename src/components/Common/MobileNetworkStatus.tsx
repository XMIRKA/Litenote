import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export const MobileNetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [justReconnected, setJustReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setShowBanner(true);
      triggerHaptic('success');
      const timer = setTimeout(() => {
        setShowBanner(false);
        setJustReconnected(false);
      }, 3200);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
      setShowBanner(true);
      triggerHaptic('warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) return null;

  return (
    <AnimatePresence>
      {(showBanner || !isOnline) && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="fixed top-14 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-xl border text-xs font-mono shadow-xl ${
              isOnline
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/90 border-amber-500/50 text-amber-300'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Сеть восстановлена</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Офлайн • Сохранение в LiteNote Storage</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
