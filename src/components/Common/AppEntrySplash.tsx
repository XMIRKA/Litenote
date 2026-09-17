import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { getIntroVideo } from '../../lib/cacheManager';
import { VideoIntroCanvas } from './VideoIntroCanvas';

interface AppEntrySplashProps {
  onComplete: () => void;
  userName?: string;
}

export const AppEntrySplash: React.FC<AppEntrySplashProps> = ({ onComplete }) => {
  const [videoSrc, setVideoSrc] = useState<string>('/intro.mp4');
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
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

  // Seamless Autoplay & Global Invisible Sound Activation
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || videoFailed) return;

    vid.currentTime = 0;

    // 1. Try unmuted autoplay first
    vid.muted = false;
    const playPromise = vid.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 2. If sound was restricted by browser policy, play muted immediately without any UI buttons
        vid.muted = true;
        vid.play().catch(() => {});
      });
    }

    // 3. Invisible global listener: Any tap, click, or keypress anywhere on the screen silently unmutes the video
    const enableSoundSilently = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        // Smooth audio gain if needed
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', enableSoundSilently, { capture: true, passive: true });
    window.addEventListener('touchstart', enableSoundSilently, { capture: true, passive: true });
    window.addEventListener('keydown', enableSoundSilently, { capture: true, passive: true });
    window.addEventListener('click', enableSoundSilently, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', enableSoundSilently, { capture: true });
      window.removeEventListener('touchstart', enableSoundSilently, { capture: true });
      window.removeEventListener('keydown', enableSoundSilently, { capture: true });
      window.removeEventListener('click', enableSoundSilently, { capture: true });
    };
  }, [videoSrc, videoFailed]);

  const handleEnded = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      try {
        localStorage.setItem('litenote_last_intro_time', String(Date.now()));
      } catch {}
      onComplete();
    }
  };

  const handleSkip = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      try {
        localStorage.setItem('litenote_last_intro_time', String(Date.now()));
      } catch {}
      if (videoRef.current) {
        videoRef.current.pause();
      }
      onComplete();
    }
  };

  // Allow ESC key to skip intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleVideoError = () => {
    if (videoSrc === '/intro.mp4') {
      setVideoSrc('/intro-video.mp4');
    } else {
      setVideoFailed(true);
    }
  };

  // Canvas timer fallback only in case video format is completely unsupported
  useEffect(() => {
    if (!videoFailed) return;

    const startTime = Date.now();
    const TOTAL_INTRO_DURATION = 9200;

    const timer = setInterval(() => {
      const currentElapsed = (Date.now() - startTime) / 1000;
      setElapsed(currentElapsed);

      if (Date.now() - startTime >= TOTAL_INTRO_DURATION && !completedRef.current) {
        completedRef.current = true;
        try {
          localStorage.setItem('litenote_last_intro_time', String(Date.now()));
        } catch {}
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
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(16px)' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black text-white select-none overflow-hidden"
    >
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {!videoFailed ? (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            playsInline
            controls={false}
            onEnded={handleEnded}
            onError={handleVideoError}
            className="w-full h-full object-cover sm:object-contain bg-black pointer-events-none transform max-sm:scale-105 transition-transform"
          />
        ) : (
          <VideoIntroCanvas elapsed={elapsed} />
        )}

        {/* Sleek Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-50 px-4 py-2 rounded-full bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md text-xs font-mono font-medium transition-all shadow-lg flex items-center gap-2 cursor-pointer hover:border-emerald-500/50"
        >
          <span>Пропустить</span>
          <span className="text-[10px] text-slate-500 font-normal border border-slate-700 px-1.5 py-0.5 rounded">ESC</span>
        </button>
      </div>
    </motion.div>
  );
};
