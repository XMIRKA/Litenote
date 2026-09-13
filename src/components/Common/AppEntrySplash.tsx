import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getIntroVideo, saveIntroVideo } from '../../lib/cacheManager';
import { Play } from 'lucide-react';

interface AppEntrySplashProps {
  onComplete: () => void;
  userName?: string;
}

export const AppEntrySplash: React.FC<AppEntrySplashProps> = ({ onComplete }) => {
  const [videoSrc, setVideoSrc] = useState<string>('/intro.mp4');
  const [needsUserPlay, setNeedsUserPlay] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function initVideo() {
      // 1. Check IndexedDB cached video
      const cached = await getIntroVideo();
      if (cached && isMounted) {
        setVideoSrc(cached);
        return;
      }

      // 2. Default to /intro.mp4 or fallback to /intro-video.mp4
      if (isMounted) {
        setVideoSrc('/intro.mp4');
      }
    }

    initVideo();

    return () => {
      isMounted = false;
    };
  }, []);

  // Try to autoplay video on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setNeedsUserPlay(false);
          })
          .catch(() => {
            // Autoplay with sound was blocked by browser policy; prompt user click or play muted
            setNeedsUserPlay(true);
          });
      }
    }
  }, [videoSrc]);

  const handleStartPlay = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().then(() => {
        setNeedsUserPlay(false);
      }).catch(() => {});
    }
  };

  const handleEnded = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(16px)' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black text-white select-none overflow-hidden"
    >
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          playsInline
          controls={false}
          onEnded={handleEnded}
          onError={() => {
            // If /intro.mp4 fails, try /intro-video.mp4
            if (videoSrc === '/intro.mp4') {
              setVideoSrc('/intro-video.mp4');
            }
          }}
          className="w-full h-full object-contain bg-black"
        />

        {/* If browser requires user interaction to enable sound/playback */}
        <AnimatePresence>
          {needsUserPlay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-50 cursor-pointer"
              onClick={handleStartPlay}
            >
              <button
                type="button"
                onClick={handleStartPlay}
                className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono text-base font-bold shadow-[0_0_50px_rgba(6,182,212,0.6)] flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-cyan-400/50"
              >
                <Play className="w-6 h-6 fill-white" />
                <span>НАЖМИТЕ ДЛЯ СТАРТА ИНТРО</span>
              </button>
              <p className="mt-3 text-xs font-mono text-cyan-300/80">
                (Включение звука и оригинального видео)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
