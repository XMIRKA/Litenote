import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { Conversation, Message, UserProfile } from '../../types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { VoiceRecorder } from './VoiceRecorder';
import { MediaViewerModal } from './MediaViewerModal';
import { CreatorBadge, VerifiedCheck } from '../Common/CreatorBadge';
import { isCreatorAccount } from '../../lib/creator';
import { getCleanAvatarUrl } from '../../lib/avatar';
import { GroupSettingsModal } from './GroupSettingsModal';
import {
  Send,
  Paperclip,
  Mic,
  Smile,
  Bot,
  User,
  MoreVertical,
  ArrowLeft,
  Sparkles,
  Loader2,
  Users,
  VolumeX,
  Clock,
  Phone,
  Video,
  Search,
  Pin,
  X,
  ChevronUp,
  ChevronDown,
  Shield,
  Info,
  Lock,
  ArrowDown,
  Settings,
  UserPlus,
  Trash2,
  Eraser,
  LogOut,
  Image as ImageIcon
} from 'lucide-react';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  allUsers?: UserProfile[];
  onSendMessage: (text: string, replyTo?: Message['replyTo']) => void;
  onSendVoiceNote: (audioUrl: string, duration: number, waveform: number[]) => void;
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
  onSendCallLog?: (callType: 'voice' | 'video', durationSeconds: number) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onPinMessage?: (message: Message | null) => void;
  onDeleteMessage?: (messageId: string) => void;
  onDeleteForMe?: (messageId: string) => void;
  onDeleteForEveryone?: (messageId: string) => void;
  onClearChat?: () => Promise<void>;
  onDeleteChat?: () => Promise<void>;
  onUpdateGroupInfo?: (updates: {
    name?: string;
    description?: string;
    avatarUrl?: string;
    permissions?: {
      onlyAdminsCanPost?: boolean;
      onlyAdminsCanEditInfo?: boolean;
      onlyAdminsCanInvite?: boolean;
    };
  }) => Promise<void>;
  onAddMembers?: (newMembers: UserProfile[]) => Promise<void>;
  onRemoveMember?: (memberUid: string) => Promise<void>;
  onToggleAdmin?: (memberUid: string, isAdmin: boolean) => Promise<void>;
  onStartCall?: (recipient: UserProfile, callType: 'voice' | 'video') => void;
  onBackMobile?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  allUsers = [],
  onSendMessage,
  onSendVoiceNote,
  onSendMedia,
  onSendFile,
  onSendCallLog,
  onAddReaction,
  onPinMessage,
  onDeleteMessage,
  onDeleteForMe,
  onDeleteForEveryone,
  onClearChat,
  onDeleteChat,
  onUpdateGroupInfo,
  onAddMembers,
  onRemoveMember,
  onToggleAdmin,
  onStartCall,
  onBackMobile,
}) => {
  const { user, accentColor, language, setSelectedUserId, setActiveTab } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);

  // Active Lightbox Modal for Fullscreen Image/Video viewing
  const [activeMediaViewer, setActiveMediaViewer] = useState<{
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption?: string;
    senderName?: string;
    createdAt?: number;
    fileName?: string;
    posterUrl?: string;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'clear' | 'delete';
    title: string;
    message: string;
    confirmText: string;
    danger?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // Search in Chat State
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Reply State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length, isAiThinking]);

  // Handle scroll detection for "Scroll to bottom" button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 300);
  };

  // Find other participant live profile
  const otherUid = user ? conversation.participants.find((p) => p !== user.uid) : null;
  const liveOther: UserProfile | null = otherUid
    ? allUsers.find((u) => u.uid === otherUid) ||
      (conversation.participantDetails && conversation.participantDetails[otherUid]
        ? ({
            uid: otherUid,
            displayName: conversation.participantDetails[otherUid].displayName,
            handle: conversation.participantDetails[otherUid].handle,
            avatarUrl: conversation.participantDetails[otherUid].avatarUrl,
            status: conversation.participantDetails[otherUid].status || 'offline',
            email: '',
            bio: '',
            role: 'member',
            isVerified: false,
            badges: [],
            stats: { postsCount: 0, likesReceived: 0, followersCount: 0, followingCount: 0 },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            settings: { emailNotifications: true, pushNotifications: true, isPrivate: false, language: 'ru', theme: 'indigo' },
          } as unknown as UserProfile)
        : null)
    : null;

  const isOtherCreator = liveOther ? isCreatorAccount(liveOther) : false;

  const chatTitle =
    conversation.type === 'ai_bot'
      ? 'AI Ассистент (Gemini)'
      : conversation.name || liveOther?.displayName || 'Чат';

  const chatSubtitle =
    conversation.type === 'ai_bot'
      ? 'Gemini 3.7 Flash Engine'
      : liveOther
      ? `@${liveOther.handle} • ${
          liveOther.status === 'online'
            ? language === 'ru'
              ? 'В сети'
              : 'Online'
            : language === 'ru'
            ? 'Был(а) недавно'
            : 'Offline'
        }`
      : 'Зашифрованный диалог';

  // Search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = messages
      .filter((m) => m.text && m.text.toLowerCase().includes(q))
      .map((m) => m.id);
    setSearchResults(matches);
    setCurrentSearchIndex(0);

    if (matches.length > 0) {
      scrollToMessage(matches[0]);
    }
  }, [searchQuery, messages]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-indigo-950/50', 'p-1.5', 'rounded-2xl', 'transition-all');
      setTimeout(() => {
        el.classList.remove('bg-indigo-950/50', 'p-1.5');
      }, 2000);
    }
  };

  const handleNextSearch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIdx);
    scrollToMessage(searchResults[nextIdx]);
  };

  const handlePrevSearch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIdx);
    scrollToMessage(searchResults[prevIdx]);
  };

  const handleTriggerCall = (type: 'voice' | 'video') => {
    if (onStartCall) {
      if (conversation.type === 'group' || conversation.type === 'channel') {
        const dummyGroupUser: UserProfile = {
          uid: `group_${conversation.id}`,
          displayName: conversation.name || 'Групповой звонок',
          handle: 'group',
          avatarUrl: conversation.avatarUrl || '',
          bannerUrl: '',
          bio: '',
          status: 'online',
          accentColor: 'indigo',
          language: 'ru',
          role: 'user',
          badges: [],
          privacy: {
            profileVisibility: 'all',
            allowDMs: 'all',
            showOnlineStatus: true,
          },
          stats: { postsCount: 0, friendsCount: 0, followersCount: 0, followingCount: 0 },
          createdAt: Date.now(),
          email: '',
        };
        onStartCall(dummyGroupUser, type);
      } else if (liveOther) {
        onStartCall(liveOther, type);
      }
    }
  };

  // Check if current user is currently muted
  const isMuted =
    user?.penalty?.type === 'mute' &&
    (user.penalty.expiresAt === 0 || user.penalty.expiresAt > Date.now());

  const formatRemainingPenalty = (expiresAt: number) => {
    if (expiresAt === 0) return language === 'ru' ? 'Навсегда' : 'Permanent';
    const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    const d = Math.floor(diff / 86400);
    const h = Math.floor((diff % 86400) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (d > 0) return `${d}д ${h}ч ${m}м`;
    if (h > 0) return `${h}ч ${m}м ${s}с`;
    return `${m}м ${s}с`;
  };

  // Find pinned message if any
  const pinnedMessage =
    conversation.pinnedMessage ||
    (conversation.pinnedMessageId
      ? messages.find((m) => m.id === conversation.pinnedMessageId)
      : undefined);

  // Group messages by date (Telegram/Instagram style)
  const renderMessagesWithDateHeaders = () => {
    let lastDateStr = '';
    const rendered: React.ReactNode[] = [];

    // Filter out messages deleted for current user
    const visibleMessages = messages.filter(
      (msg) => !user || !msg.deletedFor || !msg.deletedFor.includes(user.uid)
    );

    visibleMessages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dateStr = '';
      if (msgDate.toDateString() === today.toDateString()) {
        dateStr = language === 'ru' ? 'Сегодня' : 'Today';
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        dateStr = language === 'ru' ? 'Вчера' : 'Yesterday';
      } else {
        dateStr = msgDate.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
          day: 'numeric',
          month: 'long',
        });
      }

      if (dateStr !== lastDateStr) {
        lastDateStr = dateStr;
        rendered.push(
          <div key={`date-${msg.createdAt}-${dateStr}`} className="flex justify-center my-3">
            <span className="px-3 py-0.5 rounded-full bg-[#0E1528]/80 border border-slate-800 text-[11px] font-medium text-slate-400 backdrop-blur-md shadow-sm">
              {dateStr}
            </span>
          </div>
        );
      }

      rendered.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          convId={conversation.id}
          allUsers={allUsers}
          isOwn={user ? msg.senderId === user.uid : false}
          onAddReaction={onAddReaction}
          onReply={(m) => setReplyingTo(m)}
          onPin={onPinMessage ? (m) => onPinMessage(m) : undefined}
          onDelete={onDeleteMessage}
          onDeleteForMe={onDeleteForMe}
          onDeleteForEveryone={onDeleteForEveryone}
          onStartCall={handleTriggerCall}
          onOpenMedia={(payload) => setActiveMediaViewer(payload)}
        />
      );
    });

    return rendered;
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full bg-[#060810] relative overflow-hidden select-none">
      {/* Subtle Chat Wallpaper Pattern */}
      <div className="absolute inset-0 chat-pattern-bg pointer-events-none opacity-25" />

      {/* Top Header */}
      <div className="px-3 sm:px-4 py-2.5 bg-[#080B14] border-b border-[#151D2D] flex items-center justify-between z-10 shrink-0 min-h-[52px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => {
              if (conversation.type === 'group' || conversation.type === 'channel') {
                setShowGroupSettings(true);
              } else if (otherUid) {
                setSelectedUserId(otherUid);
                setActiveTab('profile');
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
          >
            {conversation.type === 'ai_bot' ? (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
            ) : (conversation.type === 'group' || conversation.type === 'channel') ? (
              <div className="relative shrink-0">
                <img
                  src={getCleanAvatarUrl(conversation.name || 'group', conversation.avatarUrl)}
                  alt={chatTitle}
                  className="w-9 h-9 rounded-xl object-cover bg-slate-800 border border-white/10"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080B14] bg-indigo-500" />
              </div>
            ) : (
              <div className="relative shrink-0">
                <img
                  src={getCleanAvatarUrl(
                    liveOther?.handle || liveOther?.displayName || chatTitle,
                    liveOther?.avatarUrl
                  )}
                  alt={chatTitle}
                  className={`w-9 h-9 rounded-xl object-cover bg-slate-800 ${
                    isOtherCreator
                      ? 'border-2 border-amber-400/80'
                      : 'border border-white/10'
                  }`}
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080B14] ${
                    liveOther?.status === 'online'
                      ? 'bg-emerald-400'
                      : liveOther?.status === 'busy'
                      ? 'bg-rose-500'
                      : 'bg-slate-600'
                  }`}
                />
              </div>
            )}

            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors truncate">
                  {chatTitle}
                </span>
                {liveOther && <VerifiedCheck user={liveOther} />}
                {isOtherCreator && <CreatorBadge user={liveOther} size="sm" showLabel />}
                {conversation.type === 'ai_bot' && (
                  <span className="text-[9px] font-bold px-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    AI
                  </span>
                )}
                {(conversation.type === 'group' || conversation.type === 'channel') && (
                  <span className="text-[9px] text-slate-300 bg-white/10 px-1.5 py-0.2 rounded border border-white/10">
                    {language === 'ru' ? 'Группа' : 'Group'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                {(conversation.type === 'group' || conversation.type === 'channel')
                  ? `${conversation.participants.length} ${
                      language === 'ru' ? 'участников' : 'members'
                    }`
                  : chatSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Tools: Search, Audio Call, Video Call */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Search Toggle */}
          <button
            onClick={() => {
              setIsSearching(!isSearching);
              if (isSearching) setSearchQuery('');
            }}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isSearching
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Поиск по сообщениям"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Voice Call Trigger */}
          {conversation.type !== 'ai_bot' && (liveOther || conversation.type === 'group' || conversation.type === 'channel') && (
            <button
              onClick={() => handleTriggerCall('voice')}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-lg transition-all cursor-pointer active:scale-95"
              title={conversation.type === 'group' ? 'Групповой аудиозвонок' : 'Аудиозвонок'}
            >
              <Phone className="w-4 h-4" />
            </button>
          )}

          {/* Video Call Trigger */}
          {conversation.type !== 'ai_bot' && (liveOther || conversation.type === 'group' || conversation.type === 'channel') && (
            <button
              onClick={() => handleTriggerCall('video')}
              className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-950/30 rounded-lg transition-all cursor-pointer active:scale-95"
              title={conversation.type === 'group' ? 'Групповой видеозвонок' : 'Видеозвонок'}
            >
              <Video className="w-4 h-4" />
            </button>
          )}

          {/* More Options Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowChatMenu(!showChatMenu)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                showChatMenu ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Меню чата"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showChatMenu && (
              <div
                className="absolute right-0 top-10 bg-[#0E1424] border border-[#1E293B] rounded-xl p-1 shadow-2xl z-40 flex flex-col gap-0.5 min-w-[200px]"
                onMouseLeave={() => setShowChatMenu(false)}
              >
                {/* Group Management */}
                {(conversation.type === 'group' || conversation.type === 'channel') && (
                  <>
                    <button
                      onClick={() => {
                        setShowGroupSettings(true);
                        setShowChatMenu(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{language === 'ru' ? 'Информация о группе' : 'Group Info'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowGroupSettings(true);
                        setShowChatMenu(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'ru' ? 'Добавить участников' : 'Add Members'}</span>
                    </button>
                    <div className="h-px bg-white/5 my-0.5" />
                  </>
                )}

                {/* Clear Chat */}
                {onClearChat && (
                  <button
                    onClick={() => {
                      setShowChatMenu(false);
                      setConfirmDialog({
                        isOpen: true,
                        type: 'clear',
                        title: language === 'ru' ? 'Очистить историю сообщений?' : 'Clear message history?',
                        message: language === 'ru'
                          ? 'Все сообщения в этом чате будут удалены для всех участников.'
                          : 'All messages in this chat will be cleared for everyone.',
                        confirmText: language === 'ru' ? 'Очистить историю' : 'Clear History',
                        danger: false,
                        onConfirm: onClearChat,
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-left text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Eraser className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'ru' ? 'Очистить историю' : 'Clear History'}</span>
                  </button>
                )}

                {/* Delete Chat */}
                {onDeleteChat && (
                  <button
                    onClick={() => {
                      setShowChatMenu(false);
                      setConfirmDialog({
                        isOpen: true,
                        type: 'delete',
                        title: language === 'ru' ? 'Удалить этот чат навсегда?' : 'Delete this chat permanently?',
                        message: language === 'ru'
                          ? 'Чат и вся переписка будут безвозвратно удалены.'
                          : 'The chat and all messages will be permanently deleted.',
                        confirmText: language === 'ru' ? 'Удалить навсегда' : 'Delete Permanently',
                        danger: true,
                        onConfirm: onDeleteChat,
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>{language === 'ru' ? 'Удалить чат' : 'Delete Chat'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Security Badge */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 bg-white/5 px-2.5 py-0.5 rounded border border-white/5">
            <Lock className="w-3 h-3 text-indigo-400" />
            <span>{language === 'ru' ? 'E2E Защита' : 'E2E'}</span>
          </div>
        </div>
      </div>

      {/* Inline Search Bar */}
      {isSearching && (
        <div className="px-3 sm:px-4 py-2 bg-[#0A0F1D] border-b border-[#192236] flex items-center justify-between gap-2 sm:gap-3 animate-in fade-in-50 z-10 shrink-0">
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ru' ? 'Поиск в этой переписке...' : 'Search in this chat...'}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#060810] border border-slate-700 text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            {searchResults.length > 0 && (
              <span className="text-[11px] font-mono mr-1 text-indigo-300">
                {currentSearchIndex + 1} / {searchResults.length}
              </span>
            )}
            <button
              onClick={handlePrevSearch}
              disabled={searchResults.length === 0}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextSearch}
              disabled={searchResults.length === 0}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pinned Message Banner (Telegram Style) */}
      {pinnedMessage && (
        <div className="px-3 sm:px-4 py-2 bg-[#0B1020]/95 backdrop-blur-md border-b border-indigo-500/30 flex items-center justify-between gap-3 text-xs animate-in fade-in z-10 shrink-0">
          <div
            onClick={() => scrollToMessage(pinnedMessage.id)}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
              <Pin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-200 text-[11px]">
                {language === 'ru' ? 'Закрепленное сообщение' : 'Pinned message'}
              </span>
              <p className="text-slate-400 truncate text-[11px]">
                {pinnedMessage.text || (pinnedMessage.type === 'voice' ? '🎤 Голосовое' : 'Медиа')}
              </p>
            </div>
          </div>

          {onPinMessage && (
            <button
              onClick={() => onPinMessage(null)}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-md cursor-pointer"
              title="Открепить"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Penalty Warning Banner if Muted */}
      {isMuted && (
        <div className="px-3 sm:px-4 py-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <VolumeX className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {language === 'ru'
                ? `Ваш аккаунт временно замьючен. Причина: ${user?.penalty?.reason || 'Нарушение правил'}`
                : `Account muted. Reason: ${user?.penalty?.reason || 'Rule violation'}`}
            </span>
          </div>
          <div className="flex items-center gap-1 font-semibold shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRemainingPenalty(user?.penalty?.expiresAt || 0)}</span>
          </div>
        </div>
      )}

      {/* Messages Stream Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-3 relative overscroll-contain"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-md">
              <Shield className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-200">
                {language === 'ru' ? 'Диалог защищен сквозным шифрованием' : 'End-to-End Encrypted Chat'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                {language === 'ru'
                  ? 'Сообщения, голосовые заметки и звонки доступны только участникам переписки.'
                  : 'Your messages, audio notes, and calls are securely routed directly between devices.'}
              </p>
            </div>
          </div>
        ) : (
          renderMessagesWithDateHeaders()
        )}

        {/* AI Typing Indicator */}
        {isAiThinking && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 w-fit animate-in fade-in shadow-md">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span className="font-medium">
              {language === 'ru' ? 'AI формирует ответ...' : 'Gemini AI is responding...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-20 right-6 p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/40 transition-all active:scale-95 cursor-pointer z-20 animate-in fade-in"
          title="Вниз"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Voice Recorder Overlay / Input Bar */}
      {isMuted ? (
        <div className="p-4 bg-[#080C16] border-t border-[#192236] text-center text-xs text-slate-500">
          {language === 'ru'
            ? 'Отправка сообщений ограничена на время действия мута'
            : 'Sending messages is disabled during active mute'}
        </div>
      ) : isRecordingVoice ? (
        <div className="p-3 bg-[#080C16] border-t border-[#192236] z-20">
          <VoiceRecorder
            onSendVoice={(audioUrl, duration, wave) => {
              onSendVoiceNote(audioUrl, duration, wave);
              setIsRecordingVoice(false);
            }}
            onCancel={() => setIsRecordingVoice(false)}
          />
        </div>
      ) : (
        <ChatInput
          onSendMessage={(text, replyTo) => {
            onSendMessage(text, replyTo);
            setReplyingTo(null);
          }}
          onStartVoice={() => setIsRecordingVoice(true)}
          onSendMedia={async (payload) => {
            await onSendMedia(payload);
          }}
          onSendFile={onSendFile}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          conversationId={conversation.id}
          recentMessages={messages.slice(-5).map((m) => m.text || '')}
        />
      )}

      {/* Media Lightbox Viewer Modal for Fullscreen Photos and Videos */}
      {activeMediaViewer && (
        <MediaViewerModal
          isOpen={!!activeMediaViewer}
          onClose={() => setActiveMediaViewer(null)}
          mediaUrl={activeMediaViewer.mediaUrl}
          mediaType={activeMediaViewer.mediaType}
          posterUrl={activeMediaViewer.posterUrl}
          caption={activeMediaViewer.caption}
          senderName={activeMediaViewer.senderName}
          createdAt={activeMediaViewer.createdAt}
          fileName={activeMediaViewer.fileName}
        />
      )}

      {/* Group Management & Admin Settings Modal */}
      {showGroupSettings && (
        <GroupSettingsModal
          isOpen={showGroupSettings}
          conversation={conversation}
          allUsers={allUsers}
          onClose={() => setShowGroupSettings(false)}
          onUpdateGroupInfo={onUpdateGroupInfo || (async () => {})}
          onAddMembers={onAddMembers || (async () => {})}
          onRemoveMember={onRemoveMember || (async () => {})}
          onToggleAdmin={onToggleAdmin || (async () => {})}
          onClearChat={onClearChat}
          onDeleteChat={onDeleteChat}
        />
      )}

      {/* In-App Confirmation Dialog for Safe Deletion and Clearing */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-20">
          <div className="bg-[#0D1322] border border-slate-700/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmDialog.danger
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {confirmDialog.danger ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <Eraser className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={isExecutingAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {language === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsExecutingAction(true);
                    await confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  } catch (e) {
                    console.error('Confirmation action error:', e);
                  } finally {
                    setIsExecutingAction(false);
                  }
                }}
                disabled={isExecutingAction}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-lg disabled:opacity-50 ${
                  confirmDialog.danger
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                }`}
              >
                {isExecutingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmDialog.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
