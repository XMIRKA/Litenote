import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Loader2,
  Image as ImageIcon,
  Video,
  Smile,
  Play,
  Pause,
  Sparkles,
} from 'lucide-react';

interface MediaSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onSend: (payload: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption: string;
    fileName: string;
    fileSize: string;
    duration?: number;
    posterUrl?: string;
  }) => Promise<void>;
}

export const MediaSendModal: React.FC<MediaSendModalProps> = ({
  isOpen,
  onClose,
  file,
  onSend,
}) => {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [duration, setDuration] = useState<number>(0);
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const [sendStage, setSendStage] = useState<'idle' | 'processing' | 'sending'>('idle');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Process file on select
  useEffect(() => {
    if (!isOpen || !file) {
      setPreviewUrl('');
      setCaption('');
      setPosterUrl('');
      setDuration(0);
      setSendStage('idle');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setIsProcessing(true);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    if (isVideo) {
      // Extract video duration and poster frame
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = objectUrl;
      tempVideo.muted = true;
      tempVideo.playsInline = true;

      tempVideo.onloadedmetadata = () => {
        const d = Math.round(tempVideo.duration) || 0;
        setDuration(d);
        tempVideo.currentTime = Math.min(1.0, (tempVideo.duration || 1) / 2);
      };

      tempVideo.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 640;
          let w = tempVideo.videoWidth || 480;
          let h = tempVideo.videoHeight || 360;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            const posterData = canvas.toDataURL('image/jpeg', 0.8);
            setPosterUrl(posterData);
          }
        } catch (e) {
          console.warn('Poster extraction notice:', e);
        } finally {
          setIsProcessing(false);
        }
      };

      tempVideo.onerror = () => {
        setIsProcessing(false);
      };
    } else {
      setIsProcessing(false);
    }

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSend = async () => {
    if (!file || isSending) return;
    setIsSending(true);
    setSendStage('processing');

    try {
      if (mediaType === 'image') {
        // Compress image for ultra fast and reliable delivery
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              const rawDataUrl = e.target?.result as string;
              const img = new Image();
              img.onload = async () => {
                try {
                  const canvas = document.createElement('canvas');
                  const MAX_DIM = 1280;
                  let width = img.width;
                  let height = img.height;

                  if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) {
                      height = Math.round((height * MAX_DIM) / width);
                      width = MAX_DIM;
                    } else {
                      width = Math.round((width * MAX_DIM) / height);
                      height = MAX_DIM;
                    }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  let finalDataUrl = rawDataUrl;
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    finalDataUrl = canvas.toDataURL('image/jpeg', 0.80);
                  }

                  setSendStage('sending');
                  await onSend({
                    mediaUrl: finalDataUrl,
                    mediaType: 'image',
                    caption: caption.trim(),
                    fileName: file.name,
                    fileSize: formatFileSize(file.size),
                    posterUrl: finalDataUrl,
                  });
                  resolve();
                } catch (err) {
                  reject(err);
                }
              };
              img.onerror = () => {
                setSendStage('sending');
                onSend({
                  mediaUrl: rawDataUrl,
                  mediaType: 'image',
                  caption: caption.trim(),
                  fileName: file.name,
                  fileSize: formatFileSize(file.size),
                }).then(resolve).catch(reject);
              };
              img.src = rawDataUrl;
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      } else {
        // Video: Convert to base64 data URL and send with poster thumbnail
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              const videoDataUrl = e.target?.result as string;
              setSendStage('sending');
              await onSend({
                mediaUrl: videoDataUrl,
                mediaType: 'video',
                caption: caption.trim(),
                fileName: file.name,
                fileSize: formatFileSize(file.size),
                duration,
                posterUrl,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }
    } catch (err) {
      console.error('Error sending media upload:', err);
    } finally {
      setIsSending(false);
      setSendStage('idle');
      onClose();
    }
  };

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (isPlayingVideo) {
      videoRef.current.pause();
      setIsPlayingVideo(false);
    } else {
      videoRef.current.play().then(() => setIsPlayingVideo(true)).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
      <div className="bg-[#090E1B] border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0C1324]/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              {mediaType === 'video' ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {mediaType === 'video' ? 'Отправить видео' : 'Отправить фото'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {file.name} • {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Preview Stage */}
        <div className="flex-1 min-h-[220px] max-h-[360px] bg-black/60 flex items-center justify-center p-4 relative overflow-hidden">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-medium">Подготовка файла...</span>
            </div>
          ) : mediaType === 'image' ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-[320px] max-w-full object-contain rounded-xl shadow-lg"
            />
          ) : (
            <div className="relative flex items-center justify-center group cursor-pointer" onClick={toggleVideoPlayback}>
              <video
                ref={videoRef}
                src={previewUrl}
                playsInline
                className="max-h-[320px] max-w-full rounded-xl object-contain shadow-lg"
                onEnded={() => setIsPlayingVideo(false)}
              />
              {!isPlayingVideo && (
                <div className="absolute w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caption & Send Bar */}
        <div className="p-4 bg-[#0B1120] border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2 bg-[#050811] border border-slate-700/80 rounded-2xl px-3 py-2 focus-within:border-indigo-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Добавить подпись..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || isProcessing}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{sendStage === 'processing' ? 'Обработка...' : 'Отправка...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Отправить</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
