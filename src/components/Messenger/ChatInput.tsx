import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { Message } from '../../types';
import { MediaSendModal } from './MediaSendModal';
import {
  Send,
  Mic,
  Paperclip,
  Smile,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  FileText,
  X,
  Reply,
  Check,
  Film
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, replyTo?: Message['replyTo']) => void;
  onStartVoice: () => void;
  onSendMedia: (payload: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption: string;
    fileName: string;
    fileSize: string;
    duration?: number;
    posterUrl?: string;
  }) => Promise<void> | void;
  onSendFile: (fileName: string, fileUrl: string, fileSize: string) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  recentMessages?: string[];
  conversationId?: string;
}

const EMOJI_CATEGORIES = {
  popular: ['👍', '❤️', '🔥', '😂', '✨', '🚀', '😍', '👏', '🎉', '⚡', '💯', '🙌'],
  faces: ['😀', '😎', '🤩', '🤔', '🥳', '😇', '😴', '🤯', '😭', '😡', '👀', '🤝'],
  gestures: ['✌️', '👌', '💪', '👋', '🙏', '🤙', '✊', '🤛', '🤜', '👆', '👇', '👉'],
  objects: ['💻', '📱', '🎮', '📸', '🎧', '⚡', '☕', '💡', '🔒', '🛡️', '🏆', '🎯'],
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStartVoice,
  onSendMedia,
  onSendFile,
  replyingTo,
  onCancelReply,
  recentMessages = [],
  conversationId,
}) => {
  const { accentColor, language } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('popular');
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isLoadingSmartReplies, setIsLoadingSmartReplies] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

  // Selected file for Photo/Video Preview Modal before sending
  const [pendingMediaFile, setPendingMediaFile] = useState<File | null>(null);

  const photoVideoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  // Restore draft when conversation changes
  useEffect(() => {
    if (conversationId) {
      const savedDraft = localStorage.getItem(`draft_${conversationId}`);
      if (savedDraft) {
        setText(savedDraft);
      } else {
        setText('');
      }
    }
  }, [conversationId]);

  // Save draft on change
  useEffect(() => {
    if (conversationId) {
      if (text.trim()) {
        localStorage.setItem(`draft_${conversationId}`, text);
      } else {
        localStorage.removeItem(`draft_${conversationId}`);
      }
    }
  }, [text, conversationId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    if (showEmojiPicker || showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showAttachmentMenu]);

  const handleSend = () => {
    if (!text.trim()) return;

    let replyPayload: Message['replyTo'] = undefined;
    if (replyingTo) {
      replyPayload = {
        id: replyingTo.id,
        senderName: replyingTo.senderName,
        text: replyingTo.text || (replyingTo.type === 'voice' ? 'Голосовое сообщение' : replyingTo.type === 'image' ? 'Фото' : replyingTo.type === 'video' ? 'Видео' : 'Медиа'),
        type: replyingTo.type,
      };
    }

    onSendMessage(text.trim(), replyPayload);
    setText('');
    setSmartReplies([]);
    if (conversationId) {
      localStorage.removeItem(`draft_${conversationId}`);
    }
    if (onCancelReply) {
      onCancelReply();
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Photo / Video File Select Handler
  const handlePhotoVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingMediaFile(file);
    setShowAttachmentMenu(false);
    if (photoVideoInputRef.current) {
      photoVideoInputRef.current.value = '';
    }
  };

  // Generic File Upload handler
  const handleRealFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowAttachmentMenu(false);

    // If user selected an image or video via generic file input, open rich media sender
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setPendingMediaFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    let formattedSize = `${(file.size / 1024).toFixed(1)} KB`;
    if (file.size > 1024 * 1024) {
      formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    setUploadingFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSendFile(file.name, dataUrl, formattedSize);
      setUploadingFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setUploadingFileName(null);
    };
    reader.readAsDataURL(file);
  };

  const handleInsertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFetchSmartReplies = async () => {
    if (recentMessages.length === 0) {
      setSmartReplies(
        language === 'ru'
          ? ['Отлично, спасибо!', 'Понял, сделаем 👍', 'Привет! Как дела?', 'Давай созвонимся 📞']
          : ['Sounds good!', 'Got it, on it 👍', 'Hey, how are you?', "Let's call 📞"]
      );
      return;
    }

    setIsLoadingSmartReplies(true);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate 3 short, natural, conversational quick replies in ${
            language === 'ru' ? 'Russian' : 'English'
          } for a messaging app, based on the last messages:\n${recentMessages.join(
            '\n'
          )}\nReturn ONLY a valid JSON array of 3 strings. Example: ["Да, конечно!", "Супер, спасибо 👍", "Сейчас гляну"]`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const jsonMatch = data.text?.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            setSmartReplies(parsed.slice(0, 3));
          }
        } else {
          setSmartReplies(
            language === 'ru'
              ? ['Отлично 👍', 'Договорились!', 'Спасибо!']
              : ['Awesome 👍', 'Agreed!', 'Thank you!']
          );
        }
      } else {
        setSmartReplies(
          language === 'ru'
            ? ['Отлично 👍', 'Договорились!', 'Спасибо!']
            : ['Awesome 👍', 'Agreed!', 'Thank you!']
        );
      }
    } catch (e) {
      setSmartReplies(
        language === 'ru'
          ? ['Отлично 👍', 'Договорились!', 'Спасибо!']
          : ['Awesome 👍', 'Agreed!', 'Thank you!']
      );
    } finally {
      setIsLoadingSmartReplies(false);
    }
  };

  return (
    <div className="p-2 sm:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-[#080C16]/95 backdrop-blur-xl border-t border-[#192236] relative z-20 space-y-2 shrink-0">
      {/* Hidden File Inputs */}
      <input
        ref={photoVideoInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handlePhotoVideoSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleRealFileSelect}
        className="hidden"
      />

      {/* Media Send Preview Modal */}
      {pendingMediaFile && (
        <MediaSendModal
          isOpen={!!pendingMediaFile}
          file={pendingMediaFile}
          onClose={() => setPendingMediaFile(null)}
          onSend={async (payload) => {
            await onSendMedia(payload);
            setPendingMediaFile(null);
          }}
        />
      )}

      {/* AI Smart Replies Suggestions Bar */}
      {smartReplies.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none animate-in fade-in">
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold px-2 shrink-0">
            <Sparkles className="w-3 h-3" />
            <span>AI:</span>
          </div>
          {smartReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => {
                setText(reply);
                setSmartReplies([]);
                if (textareaRef.current) textareaRef.current.focus();
              }}
              className="px-3 py-1 rounded-full bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-200 text-xs whitespace-nowrap transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              {reply}
            </button>
          ))}
          <button
            onClick={() => setSmartReplies([])}
            className="p-1 text-slate-400 hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Quoted Message Reply Header */}
      {replyingTo && (
        <div className="px-3 py-2 bg-[#0C1222] border-l-4 border-indigo-500 rounded-r-xl flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-indigo-300 text-[11px]">
                {replyingTo.senderName}
              </span>
              <p className="text-slate-400 truncate text-[11px]">
                {replyingTo.text || (replyingTo.type === 'voice' ? '🎤 Голосовое' : replyingTo.type === 'image' ? '🖼 Фото' : replyingTo.type === 'video' ? '📹 Видео' : 'Медиа')}
              </p>
            </div>
          </div>
          {onCancelReply && (
            <button
              onClick={onCancelReply}
              className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Main Input Control Bar */}
      <div className="flex items-end gap-1.5 sm:gap-2 bg-[#050811] border border-slate-800/90 rounded-2xl p-1 sm:p-1.5 focus-within:border-indigo-500/80 transition-colors shadow-inner">
        {/* Attachment Menu Trigger */}
        <div className="relative" ref={attachmentMenuRef}>
          <button
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            disabled={!!uploadingFileName}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
              showAttachmentMenu
                ? 'text-indigo-400 bg-indigo-500/15'
                : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60'
            }`}
            title="Прикрепить"
          >
            {uploadingFileName ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>

          {/* Attachment Type Popover */}
          {showAttachmentMenu && (
            <div className="absolute bottom-12 left-0 w-48 bg-[#0B1020] border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 z-40 animate-in zoom-in-95 backdrop-blur-xl flex flex-col gap-1">
              <button
                onClick={() => {
                  photoVideoInputRef.current?.click();
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-indigo-600/20 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block">Фото или видео</span>
                  <span className="text-[10px] text-slate-400 block">Медиагалерея</span>
                </div>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-indigo-600/20 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold block">Документ</span>
                  <span className="text-[10px] text-slate-400 block">Любые файлы</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Quick Photo/Video Button */}
        <button
          onClick={() => photoVideoInputRef.current?.click()}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Отправить фото или видео"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Emoji Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
              showEmojiPicker
                ? 'text-amber-400 bg-amber-500/15'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/60'
            }`}
            title="Эмодзи"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Emoji Popover */}
          {showEmojiPicker && (
            <div
              ref={pickerRef}
              className="fixed sm:absolute bottom-16 sm:bottom-12 left-2 sm:left-0 right-2 sm:right-auto sm:w-80 bg-[#0B1020] border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-40 animate-in zoom-in-95 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-300">
                  {language === 'ru' ? 'Эмодзи' : 'Emojis'}
                </span>
                <div className="flex items-center gap-1 text-[11px]">
                  {(['popular', 'faces', 'gestures', 'objects'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveEmojiCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg capitalize transition-colors ${
                        activeEmojiCategory === cat
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat === 'popular'
                        ? '🔥'
                        : cat === 'faces'
                        ? '😀'
                        : cat === 'gestures'
                        ? '✌️'
                        : '💻'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1">
                {EMOJI_CATEGORIES[activeEmojiCategory].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleInsertEmoji(emoji)}
                    className="p-1.5 text-xl hover:scale-125 transition-transform hover:bg-slate-800/60 rounded-xl cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={
            language === 'ru'
              ? 'Напишите сообщение... (Enter для отправки)'
              : 'Write a message... (Enter to send)'
          }
          className="flex-1 min-w-0 bg-transparent text-white text-base sm:text-xs placeholder:text-slate-500 resize-none py-2 px-1 focus:outline-none max-h-32 leading-relaxed"
        />

        {/* AI Smart Replies Trigger Button */}
        {recentMessages.length > 0 && !text && (
          <button
            onClick={handleFetchSmartReplies}
            disabled={isLoadingSmartReplies}
            className="p-1.5 sm:p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
            title="AI быстрые ответы"
          >
            {isLoadingSmartReplies ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Dynamic Action: Send Button OR Voice Recorder Trigger */}
        {text.trim() ? (
          <button
            onClick={handleSend}
            className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Отправить сообщение"
          >
            <Send className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            {/* Voice Message Button */}
            <button
              onClick={onStartVoice}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/30 rounded-xl transition-all cursor-pointer active:scale-95"
              title="Записать голосовое"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

