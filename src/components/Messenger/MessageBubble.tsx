import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONFIGS } from '../../lib/theme';
import { Message, UserProfile } from '../../types';
import { CreatorBadge, VerifiedCheck } from '../Common/CreatorBadge';
import { isCreatorAccount } from '../../lib/creator';
import { getCleanAvatarUrl } from '../../lib/avatar';
import {
  Play,
  Pause,
  FileText,
  Download,
  Check,
  CheckCheck,
  Smile,
  Phone,
  PhoneOutgoing,
  Video,
  Reply,
  Pin,
  Trash2,
  Code2,
  Copy,
  Maximize2,
  Film
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  convId?: string;
  allUsers?: UserProfile[];
  onAddReaction: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onPin?: (message: Message) => void;
  onDeleteForMe?: (messageId: string) => void;
  onDeleteForEveryone?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onStartCall?: (callType: 'voice' | 'video') => void;
  onOpenMedia?: (payload: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption?: string;
    senderName?: string;
    createdAt?: number;
    fileName?: string;
    posterUrl?: string;
  }) => void;
}

const QUICK_REACTIONS = ['❤️', '🔥', '👍', '😂', '🚀', '👏', '⚡', '💡', '😍', '🎉'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  convId,
  allUsers = [],
  onAddReaction,
  onReply,
  onPin,
  onDeleteForMe,
  onDeleteForEveryone,
  onDelete,
  onStartCall,
  onOpenMedia,
}) => {
  const { user: currentUser, accentColor, language } = useAuth();
  const theme = THEME_CONFIGS[accentColor];

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentPlaySec, setCurrentPlaySec] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);

  // Live lookup for sender
  const liveSender =
    (currentUser && currentUser.uid === message.senderId ? currentUser : null) ||
    allUsers.find((u) => u.uid === message.senderId);

  const senderDisplayName = liveSender?.displayName || message.senderName || 'Собеседник';
  const senderHandle = liveSender?.handle || message.senderHandle || 'user';

  const isSenderCreator = liveSender
    ? isCreatorAccount(liveSender)
    : isCreatorAccount({
        handle: message.senderHandle,
        uid: message.senderId,
      });

  // Listen to global pause event to stop if another audio begins
  useEffect(() => {
    const handlePauseAll = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.exceptId !== message.id) {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          setIsPlayingAudio(false);
        }
      }
    };
    window.addEventListener('litenote-pause-all-audio', handlePauseAll);
    return () => {
      window.removeEventListener('litenote-pause-all-audio', handlePauseAll);
    };
  }, [message.id]);

  // Audio Playback Helpers
  const getEffectiveDuration = () => {
    if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      return audioRef.current.duration;
    }
    return Math.max(1, message.mediaDuration || 1);
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      // Notify other playing bubbles to pause
      window.dispatchEvent(
        new CustomEvent('litenote-pause-all-audio', { detail: { exceptId: message.id } })
      );
      audioRef.current.playbackRate = playbackRate;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlayingAudio(true);
          })
          .catch((err) => {
            console.warn('Audio play prevented / error:', err);
            setIsPlayingAudio(false);
          });
      }
    }
  };

  const handleCycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const dur = getEffectiveDuration();
    const cur = audioRef.current.currentTime || 0;
    setCurrentPlaySec(cur);
    setAudioProgress(Math.min(100, (cur / dur) * 100));
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setCurrentPlaySec(0);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!waveformRef.current || !audioRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = clickX / rect.width;
    const dur = getEffectiveDuration();
    const seekTime = percent * dur;

    audioRef.current.currentTime = seekTime;
    setCurrentPlaySec(seekTime);
    setAudioProgress(percent * 100);

    if (!isPlayingAudio) {
      toggleAudioPlay();
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatClockTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatSeconds = (secs: number) => {
    const s = Math.round(secs);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const formatCallDuration = (secs: number) => {
    if (!secs || secs === 0) return language === 'ru' ? 'Пропущен' : 'Missed';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m} мин ${s} сек`;
    return `${s} сек`;
  };

  const handleMediaClick = (type: 'image' | 'video') => {
    if (onOpenMedia && message.mediaUrl) {
      onOpenMedia({
        mediaUrl: message.mediaUrl,
        mediaType: type,
        caption: message.text,
        senderName: senderDisplayName,
        createdAt: message.createdAt,
        fileName: message.fileName,
        posterUrl: message.posterUrl || message.thumbnailUrl,
      });
    }
  };

  const rawWaveform =
    message.waveform && message.waveform.length > 0
      ? message.waveform
      : [30, 50, 75, 40, 85, 55, 70, 95, 60, 40, 75, 85, 55, 35, 80, 45, 65, 90, 35, 55];

  // Downsample/normalize waveform to 20 sleek vertical bars
  const defaultWaveform = rawWaveform.slice(0, 24);

  // Helper to detect code snippet
  const isCodeSnippet = message.text && (message.text.startsWith('```') || message.type === 'code');
  const codeContent = message.codeSnippet?.code || (message.text ? message.text.replace(/```[a-z]*\n?/g, '').trim() : '');

  // Total reactions aggregation
  const reactionEntries = Object.entries(message.reactions || {})
    .map(([emoji, val]) => ({
      emoji,
      count: Array.isArray(val) ? val.length : typeof val === 'number' ? val : 0,
      userList: Array.isArray(val) ? val : [],
    }))
    .filter((r) => r.count > 0);

  const isMediaMessage = message.type === 'image' || message.type === 'video' || message.type === 'video_note';

  return (
    <div
      id={`msg-${message.id}`}
      className={`flex flex-col group relative ${isOwn ? 'items-end' : 'items-start'} space-y-1 transition-all select-text`}
    >
      {/* Sender Header for Incoming Group/Direct Messages */}
      {!isOwn && (
        <div className="flex items-center gap-1.5 px-2 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">{senderDisplayName}</span>
          {liveSender ? (
            <VerifiedCheck user={liveSender} />
          ) : (
            <VerifiedCheck user={{ handle: senderHandle, uid: message.senderId }} />
          )}
          {isSenderCreator && (
            <CreatorBadge
              user={liveSender || { handle: senderHandle, uid: message.senderId }}
              size="sm"
              showLabel
            />
          )}
          <span className="text-slate-500 text-[10px]">@{senderHandle}</span>
        </div>
      )}

      {/* Main Bubble Row */}
      <div className="relative flex items-center max-w-[90%] sm:max-w-md md:max-w-lg">
        {/* Floating Actions Toolbar (Hover) */}
        <div
          className={`opacity-0 group-hover:opacity-100 ${
            showReactionPicker || showDeleteMenu ? 'opacity-100' : ''
          } flex items-center gap-0.5 bg-[#090D18]/95 border border-white/10 rounded-lg p-0.5 shadow-xl backdrop-blur-md transition-opacity duration-150 absolute ${
            isOwn ? '-left-24 sm:-left-28' : '-right-24 sm:-right-28'
          } top-1/2 -translate-y-1/2 z-30`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionPicker(!showReactionPicker);
              setShowDeleteMenu(false);
            }}
            className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
            title={language === 'ru' ? 'Реакция' : 'React'}
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {onReply && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReply(message);
              }}
              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-colors cursor-pointer"
              title={language === 'ru' ? 'Ответить' : 'Reply'}
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          )}

          {onPin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin(message);
              }}
              className={`p-1 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                message.isPinned ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'
              }`}
              title={message.isPinned ? 'Открепить' : 'Закрепить'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}

          {(isOwn || onDeleteForMe || onDeleteForEveryone || onDelete || isCreatorAccount(currentUser)) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteMenu(!showDeleteMenu);
                setShowReactionPicker(false);
              }}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
              title={language === 'ru' ? 'Удалить' : 'Delete'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Delete Menu Popover */}
        {showDeleteMenu && (
          <div
            className={`absolute ${
              isOwn ? 'right-0' : 'left-0'
            } -top-20 bg-[#0B0F19] border border-white/10 rounded-xl p-1 shadow-2xl z-50 flex flex-col gap-0.5 min-w-[160px] backdrop-blur-xl animate-in fade-in`}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => setShowDeleteMenu(false)}
          >
            {onDeleteForMe && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteForMe(message.id);
                  setShowDeleteMenu(false);
                }}
                className="px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Удалить у себя</span>
              </button>
            )}

            {(isOwn || isCreatorAccount(currentUser)) && (onDeleteForEveryone || onDelete) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteForEveryone) {
                    onDeleteForEveryone(message.id);
                  } else if (onDelete) {
                    onDelete(message.id);
                  }
                  setShowDeleteMenu(false);
                }}
                className="px-2.5 py-1.5 rounded-lg text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Удалить у всех</span>
              </button>
            )}
          </div>
        )}

        {/* Reaction Popover */}
        {showReactionPicker && (
          <div
            className={`absolute ${
              isOwn ? 'right-0' : 'left-0'
            } -top-11 bg-[#0A0F1D] border border-white/15 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-2xl z-50 animate-in fade-in backdrop-blur-xl`}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddReaction(message.id, emoji);
                  setShowReactionPicker(false);
                }}
                className="hover:scale-125 transition-transform text-sm p-0.5 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message Bubble Box */}
        <div
          onDoubleClick={() => onAddReaction(message.id, '❤️')}
          className={`text-xs leading-relaxed transition-all ${
            isMediaMessage
              ? `p-1 rounded-xl overflow-hidden ${
                  isOwn
                    ? 'bg-[#151D2F] text-white border border-indigo-500/30 rounded-br-xs'
                    : 'bg-[#0E1422] text-slate-100 border border-white/10 rounded-bl-xs'
                }`
              : `px-3.5 py-2.5 rounded-2xl ${
                  isOwn
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-xs shadow-sm border border-indigo-500/30'
                    : isSenderCreator
                    ? 'bg-[#0D1424] text-slate-100 border border-amber-500/30 rounded-bl-xs'
                    : 'bg-[#111726] text-slate-100 border border-white/5 rounded-bl-xs'
                }`
          }`}
        >
          {/* QUOTED REPLY PREVIEW */}
          {message.replyTo && (
            <div
              className={`mb-1.5 px-2.5 py-1.5 rounded-lg border-l-2 text-[11px] max-w-full truncate ${
                isOwn
                  ? 'bg-indigo-800/50 border-white text-indigo-100'
                  : 'bg-white/5 border-indigo-500 text-slate-300'
              }`}
            >
              <p className="font-semibold text-[10px] text-indigo-300">
                {message.replyTo.senderName}
              </p>
              <p className="truncate opacity-85 text-[11px]">{message.replyTo.text || 'Медиа'}</p>
            </div>
          )}

          {/* CALL LOG MESSAGE TYPE */}
          {message.type === 'call' && (
            <div className="flex items-center justify-between gap-4 py-1 min-w-[210px]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    message.callInfo?.callType === 'video'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {message.callInfo?.callType === 'video' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">
                    {message.callInfo?.callType === 'video' ? 'Видеозвонок' : 'Аудиозвонок'}
                  </p>
                  <p className="text-[11px] opacity-75 font-mono">
                    {formatCallDuration(message.callInfo?.durationSeconds || message.mediaDuration || 0)}
                  </p>
                </div>
              </div>

              {onStartCall && (
                <button
                  onClick={() => onStartCall(message.callInfo?.callType || 'voice')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    isOwn
                      ? 'bg-white text-indigo-600 hover:bg-slate-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  <PhoneOutgoing className="w-3 h-3" />
                  <span>{language === 'ru' ? 'Вызов' : 'Call'}</span>
                </button>
              )}
            </div>
          )}

          {/* CODE SNIPPET MESSAGE */}
          {isCodeSnippet && (
            <div className="space-y-1.5 min-w-[260px]">
              <div className="flex items-center justify-between text-[11px] text-slate-300 border-b border-white/10 pb-1">
                <span className="font-mono font-semibold flex items-center gap-1.5 text-emerald-400">
                  <Code2 className="w-3.5 h-3.5" />
                  {message.codeSnippet?.language || 'code'}
                </span>
                <button
                  onClick={() => handleCopyCode(codeContent)}
                  className="p-1 rounded text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-[#070A11] border border-white/5 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-56">
                <code>{codeContent}</code>
              </pre>
            </div>
          )}

          {/* STANDARD TEXT MESSAGE */}
          {message.type === 'text' && !isCodeSnippet && (
            <p className="whitespace-pre-wrap break-words leading-relaxed text-[13px]">{message.text}</p>
          )}

          {/* VOICE NOTE - TELEGRAM PRO WAVEFORM WITH SCRUBBING & RELIABLE AUDIO ENGINE */}
          {message.type === 'voice' && (
            <div className="flex items-center gap-3 py-1 min-w-[230px] sm:min-w-[260px] select-none">
              <audio
                ref={audioRef}
                src={message.mediaUrl}
                preload="metadata"
                onTimeUpdate={handleAudioTimeUpdate}
                onEnded={handleAudioEnded}
                onError={() => setIsPlayingAudio(false)}
                onPause={() => setIsPlayingAudio(false)}
                onPlay={() => setIsPlayingAudio(true)}
                className="hidden"
              />

              {/* Play/Pause Button */}
              <button
                onClick={toggleAudioPlay}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer shrink-0 shadow-sm ${
                  isOwn
                    ? 'bg-white text-indigo-600 hover:bg-slate-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
                title={isPlayingAudio ? 'Пауза' : 'Слушать'}
              >
                {isPlayingAudio ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Interactive Waveform Track */}
              <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                <div
                  ref={waveformRef}
                  onClick={handleWaveformClick}
                  className="flex items-center gap-[2.5px] h-6 cursor-pointer py-1"
                  title="Нажмите для перемотки"
                >
                  {defaultWaveform.map((val, idx) => {
                    const barPercent = (idx / defaultWaveform.length) * 100;
                    const isPlayed = audioProgress >= barPercent;

                    return (
                      <span
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-100 ${
                          isPlayed
                            ? isOwn
                              ? 'bg-white opacity-100'
                              : 'bg-indigo-400 opacity-100'
                            : isOwn
                            ? 'bg-indigo-300/40'
                            : 'bg-slate-700/80'
                        }`}
                        style={{ height: `${Math.max(25, (val / 100) * 100)}%` }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
                  <span>
                    {isPlayingAudio
                      ? `${formatSeconds(currentPlaySec)} / ${formatSeconds(getEffectiveDuration())}`
                      : formatSeconds(getEffectiveDuration())}
                  </span>
                  <button
                    onClick={handleCycleSpeed}
                    className={`px-1.5 py-0.2 rounded font-semibold cursor-pointer transition-colors ${
                      isOwn ? 'bg-indigo-800/60 text-white' : 'bg-white/10 text-indigo-300'
                    }`}
                    title="Скорость воспроизведения"
                  >
                    {playbackRate}x
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PHOTO MESSAGE */}
          {message.type === 'image' && (
            <div className="space-y-1 max-w-[280px] sm:max-w-[340px]">
              <div
                onClick={() => handleMediaClick('image')}
                className="relative rounded-lg overflow-hidden cursor-pointer group/img bg-black/40"
              >
                <img
                  src={message.mediaUrl}
                  alt={message.fileName || 'Photo'}
                  className="w-full max-h-[340px] object-cover rounded-lg transition-transform duration-200 group-hover/img:scale-[1.02]"
                  loading="lazy"
                />
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="p-2 rounded-full bg-black/70 text-white backdrop-blur-md">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>

                {message.fileSize && (
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] text-white font-mono">
                    {message.fileSize}
                  </span>
                )}
              </div>

              {message.text && (
                <p className="px-1 pt-1 text-[13px] whitespace-pre-wrap break-words leading-relaxed text-slate-100">
                  {message.text}
                </p>
              )}
            </div>
          )}

          {/* VIDEO MESSAGE */}
          {(message.type === 'video' || message.type === 'video_note') && (
            <div className="space-y-1 max-w-[280px] sm:max-w-[340px]">
              <div
                onClick={() => handleMediaClick('video')}
                className="relative rounded-lg overflow-hidden cursor-pointer group/vid bg-black/60"
              >
                {message.posterUrl || message.thumbnailUrl ? (
                  <img
                    src={message.posterUrl || message.thumbnailUrl}
                    alt="Video preview"
                    className="w-full max-h-[320px] object-cover rounded-lg group-hover/vid:scale-[1.02] transition-transform duration-200"
                  />
                ) : message.mediaUrl ? (
                  <video
                    src={message.mediaUrl}
                    className="w-full max-h-[320px] object-cover rounded-lg"
                    preload="metadata"
                  />
                ) : (
                  <div className="w-full h-40 bg-slate-900 rounded-lg flex items-center justify-center text-slate-500">
                    <Film className="w-7 h-7" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover/vid:bg-black/35 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg backdrop-blur-md">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] text-white font-mono flex items-center gap-1">
                    <Video className="w-3 h-3 text-indigo-400" />
                    <span>{message.mediaDuration ? `${message.mediaDuration}s` : 'Видео'}</span>
                  </span>
                </div>
              </div>

              {message.text && (
                <p className="px-1 pt-1 text-[13px] whitespace-pre-wrap break-words leading-relaxed text-slate-100">
                  {message.text}
                </p>
              )}
            </div>
          )}

          {/* FILE ATTACHMENT */}
          {message.type === 'file' && (
            <div className="flex items-center gap-3 py-1 min-w-[200px]">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isOwn ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs truncate">{message.fileName || 'Файл'}</p>
                <p className="text-[10px] opacity-75 font-mono">{message.fileSize || 'Документ'}</p>
              </div>
              {message.mediaUrl && (
                <a
                  href={message.mediaUrl}
                  download={message.fileName || 'download'}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white/10 hover:bg-white/15 text-indigo-400'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Footer Timestamp & Read Ticks */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
              isMediaMessage
                ? 'px-1.5 py-0.5 rounded bg-black/60 text-slate-300 w-fit ml-auto shadow border border-white/10 backdrop-blur-sm'
                : isOwn ? 'text-indigo-200' : 'text-slate-500'
            }`}
          >
            <span>{formatClockTime(message.createdAt)}</span>
            {isOwn && (
              <span
                className="inline-flex items-center ml-0.5"
                title={
                  (message.read || message.status === 'read' || (message.readBy && message.readBy.some((uid) => uid !== message.senderId)))
                    ? (language === 'ru' ? 'Прочитано' : 'Read')
                    : (language === 'ru' ? 'Отправлено' : 'Sent')
                }
              >
                {(message.read || message.status === 'read' || (message.readBy && message.readBy.some((uid) => uid !== message.senderId))) ? (
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-white/70 stroke-[2]" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reactions Badges */}
      {reactionEntries.length > 0 && (
        <div
          className={`flex items-center gap-1 mt-0.5 px-1 flex-wrap ${
            isOwn ? 'justify-end' : 'justify-start'
          }`}
        >
          {reactionEntries.map(({ emoji, count }) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                onAddReaction(message.id, emoji);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#0E1528] border border-white/10 text-[11px] text-white hover:border-indigo-500 transition-all cursor-pointer"
            >
              <span>{emoji}</span>
              {count > 1 && <span className="font-mono text-[10px] text-indigo-300 font-bold">{count}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

