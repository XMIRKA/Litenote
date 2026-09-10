import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuth } from '../../context/AuthContext';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language } = useAuth();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-2xl border border-amber-400/50"
        >
          <WifiOff className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>
            {language === 'ru'
              ? 'Офлайн режим — используются сохранённые данные'
              : 'Offline mode — using cached data'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
