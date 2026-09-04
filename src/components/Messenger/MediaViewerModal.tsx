import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
  Calendar,
  User,
} from 'lucide-react';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  posterUrl?: string;
  caption?: string;
  senderName?: string;
  createdAt?: number;
  fileName?: string;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  posterUrl,
  caption,
  senderName,
  createdAt,
  fileName,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen, mediaUrl]);

  // Keyboard shortcut: Escape to close, Space to play/pause video
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' && mediaType === 'video') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mediaType]);

  if (!isOpen || !mediaUrl) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!duration && videoRef.current.duration && !isNaN(videoRef.current.duration) && isFinite(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
    }
  };

  const handleCycleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const defaultExt = mediaType === 'video' ? 'mp4' : 'jpg';
      const downloadName = fileName || `media_${Date.now()}.${defaultExt}`;

      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('Download error:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20">
        <div className="flex items-center gap-3 text-white">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Закрыть (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {senderName && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                {senderName}
              </span>
              {createdAt && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(createdAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {mediaType === 'image' && (
            <>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Увеличить"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Уменьшить"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Повернуть"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            title="Скачать на устройство"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Скачать</span>
          </button>
        </div>
      </div>

      {/* Center Media Viewport */}
      <div
        className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden relative"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {mediaType === 'image' ? (
          <div
            className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={mediaUrl}
              alt="Media"
              className="max-w-[92vw] max-h-[75vh] object-contain rounded-xl shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            />
          </div>
        ) : (
          <div className="relative max-w-[92vw] max-h-[75vh] flex items-center justify-center group">
            <video
              ref={videoRef}
              src={mediaUrl}
              poster={posterUrl}
              playsInline
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.duration && !isNaN(v.duration) && isFinite(v.duration)) {
                  setDuration(v.duration);
                }
              }}
              onEnded={() => setIsPlaying(false)}
              className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl object-contain cursor-pointer bg-black"
            />

            {/* Big Center Play/Pause Overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute w-20 h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-10"
              >
                <Play className="w-9 h-9 fill-current ml-1" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Information & Video Controller Bar */}
      <div className="p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20 space-y-3">
        {/* Video Scrubber & Playback Controls */}
        {mediaType === 'video' && (
          <div className="max-w-3xl mx-auto w-full bg-[#0A0F1D]/90 border border-slate-700/80 rounded-2xl p-3 backdrop-blur-xl shadow-2xl space-y-2">
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              {/* Progress Slider */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-300 w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[11px] font-mono text-slate-400 w-10">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Speed Controller */}
              <button
                onClick={handleCycleSpeed}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold font-mono cursor-pointer transition-colors"
                title="Скорость воспроизведения"
              >
                {playbackRate}x
              </button>

              {/* Mute Toggle */}
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title={isMuted ? 'Включить звук' : 'Выключить звук'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={handleToggleFullscreen}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="На весь экран"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Text Caption */}
        {caption && (
          <div className="max-w-2xl mx-auto text-center px-4 py-2 rounded-xl bg-[#0F172A]/80 border border-slate-800 backdrop-blur-md">
            <p className="text-sm text-slate-200 font-medium leading-relaxed break-words">{caption}</p>
          </div>
        )}
      </div>
    </div>
  );
};
