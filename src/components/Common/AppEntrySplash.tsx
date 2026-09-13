import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getIntroVideo } from '../../lib/cacheManager';
import { VideoIntroCanvas } from './VideoIntroCanvas';
import { Volume2, VolumeX, Play } from 'lucide-react';

interface AppEntrySplashProps {
  onComplete: () => void;
  userName?: string;
}

export const AppEntrySplash: React.FC<AppEntrySplashProps> = ({ onComplete }) => {
  const [videoSrc, setVideoSrc] = useState<string>('/intro.mp4');
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [needsUserClick, setNeedsUserClick] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);

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

      // 2. Default to /intro.mp4
      if (isMounted) {
        setVideoSrc('/intro.mp4');
      }
    }

    initVideo();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Autoplay & Sound Policy
  useEffect(() => {
    if (videoRef.current && !videoFailed) {
      const vid = videoRef.current;
      vid.currentTime = 0;

      // Try autoplay with sound first
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setNeedsUserClick(false);
          })
          .catch(() => {
            // If sound was blocked, retry autoplay muted so video begins immediately without freezing
            vid.muted = true;
            setIsMuted(true);
            vid.play().catch(() => {
              setNeedsUserClick(true);
            });
          });
      }
    }
  }, [videoSrc, videoFailed]);

  const handleUnmute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.play().catch(() => {});
      setNeedsUserClick(false);
    }
  };

  const handleStartPlay = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.play().then(() => {
        setNeedsUserClick(false);
      }).catch(() => {});
    }
  };

  const handleEnded = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  const handleVideoError = () => {
    // If /intro.mp4 failed, try fallback path /intro-video.mp4 before falling back to canvas
    if (videoSrc === '/intro.mp4') {
      setVideoSrc('/intro-video.mp4');
    } else {
      setVideoFailed(true);
    }
  };

  // Canvas timer fallback in case video completely fails to load
  useEffect(() => {
    if (!videoFailed) return;

    const startTime = Date.now();
    const TOTAL_INTRO_DURATION = 9200;

    const timer = setInterval(() => {
      const currentElapsed = (Date.now() - startTime) / 1000;
      setElapsed(currentElapsed);

      if (Date.now() - startTime >= TOTAL_INTRO_DURATION && !completedRef.current) {
        completedRef.current = true;
        clearInterval(timer);
        onComplete();
      }
    }, 30);

    return () => {
      clearInterval(timer);
    };
  }, [videoFailed, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(16px)' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black text-white select-none overflow-hidden"
    >
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {!videoFailed ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              playsInline
              controls={false}
              onEnded={handleEnded}
              onError={handleVideoError}
              className="w-full h-full object-contain bg-black"
            />

            {/* Subtle Unmute floating badge if browser started playback in muted mode */}
            {isMuted && !needsUserClick && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleUnmute}
                className="absolute top-6 right-6 px-4 py-2 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 text-xs font-mono flex items-center gap-2 backdrop-blur-md cursor-pointer transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] z-50 animate-pulse"
              >
                <VolumeX className="w-4 h-4 text-cyan-400" />
                <span>ВКЛЮЧИТЬ ЗВУК</span>
              </motion.button>
            )}

            {/* If autoplay was blocked entirely by browser */}
            <AnimatePresence>
              {needsUserClick && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 cursor-pointer"
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
          </>
        ) : (
          <VideoIntroCanvas elapsed={elapsed} />
        )}
      </div>
    </motion.div>
  );
};
