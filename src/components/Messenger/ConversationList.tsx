import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { Conversation, UserProfile } from '../../types';
import { VerifiedCheck, CreatorBadge } from '../Common/CreatorBadge';
import { isCreatorAccount } from '../../lib/creator';
import { getCleanAvatarUrl } from '../../lib/avatar';
import {
  MessageSquare,
  Search,
  Plus,
  Bot,
  Users,
  Sparkles,
  Lock,
  UserCheck,
  Check,
  CheckCheck,
  Mic,
  Video,
  FileText,
  Phone,
  X
} from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConvId: string | null;
  allUsers?: UserProfile[];
  onSelectConversation: (convId: string) => void;
  onNewChatClick?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConvId,
  allUsers = [],
  onSelectConversation,
  onNewChatClick,
}) => {
  const { user, accentColor, language } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'group' | 'ai'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const findLiveUser = (uid?: string): UserProfile | null => {
    if (!uid) return null;
    if (user && user.uid === uid) return user;
    return allUsers.find((u) => u.uid === uid) || null;
  };

  const filtered = conversations.filter((c) => {
    if (activeFilter === 'direct' && c.type !== 'direct') return false;
    if (activeFilter === 'group' && c.type !== 'group' && c.type !== 'channel') return false;
    if (activeFilter === 'ai' && c.type !== 'ai_bot') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.name?.toLowerCase().includes(q);
      const otherUid = user ? c.participants.find((p) => p !== user.uid) : null;
      const liveOther = findLiveUser(otherUid || undefined);

      const liveNameMatch =
        liveOther?.displayName?.toLowerCase().includes(q) ||
        liveOther?.handle?.toLowerCase().includes(q);

      const participantMatch = Object.values(c.participantDetails || {}).some(
        (p: any) =>
          p?.displayName?.toLowerCase().includes(q) || p?.handle?.toLowerCase().includes(q)
      );
      return nameMatch || liveNameMatch || participantMatch;
    }
    return true;
  });

  const formatLastTime = (ts?: number) => {
    if (!ts) return '';
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return language === 'ru' ? 'сейчас' : 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)} ${language === 'ru' ? 'м' : 'm'}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${language === 'ru' ? 'ч' : 'h'}`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  };

  const getConvTitle = (conv: Conversation) => {
    if (conv.type === 'ai_bot') return 'AI Core (Gemini)';
    if (conv.name) return conv.name;
    if (!user) return 'Диалог';

    const otherUid = conv.participants.find((p) => p !== user.uid);
    const liveOther = findLiveUser(otherUid);
    if (liveOther?.displayName) return liveOther.displayName;

    if (otherUid && conv.participantDetails && conv.participantDetails[otherUid]) {
      return conv.participantDetails[otherUid].displayName;
    }
    return 'Чат';
  };

  const getOtherUser = (conv: Conversation): UserProfile | any => {
    if (!user || conv.type !== 'direct') return null;
    const otherUid = conv.participants.find((p) => p !== user.uid);
    const liveOther = findLiveUser(otherUid);
    if (liveOther) return liveOther;

    if (otherUid && conv.participantDetails && conv.participantDetails[otherUid]) {
      return conv.participantDetails[otherUid];
    }
    return null;
  };

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === 'ai_bot') return null;
    if (conv.avatarUrl) return getCleanAvatarUrl(conv.name, conv.avatarUrl);
    if (!user) return '';

    const otherUid = conv.participants.find((p) => p !== user.uid);
    const liveOther = findLiveUser(otherUid);
    if (liveOther) return getCleanAvatarUrl(liveOther.handle || liveOther.displayName, liveOther.avatarUrl);

    if (otherUid && conv.participantDetails && conv.participantDetails[otherUid]) {
      const p = conv.participantDetails[otherUid];
      return getCleanAvatarUrl(p.handle || p.displayName, p.avatarUrl);
    }
    return getCleanAvatarUrl(conv.name || 'group');
  };

  const getOtherStatus = (conv: Conversation) => {
    if (!user) return 'offline';
    const otherUid = conv.participants.find((p) => p !== user.uid);
    const liveOther = findLiveUser(otherUid);
    if (liveOther?.status) return liveOther.status;

    if (otherUid && conv.participantDetails && conv.participantDetails[otherUid]) {
      return conv.participantDetails[otherUid].status || 'offline';
    }
    return 'offline';
  };

  const renderLastMessageSnippet = (conv: Conversation) => {
    const msg = conv.lastMessage;
    if (!msg) return <span className="text-slate-500">{language === 'ru' ? 'Нет сообщений' : 'No messages'}</span>;

    const isOwnLast = user && msg.senderId === user.uid;

    return (
      <span className="flex items-center gap-1 min-w-0 truncate text-slate-400">
        {isOwnLast && (
          <span className="text-indigo-400 font-medium shrink-0">
            {language === 'ru' ? 'Вы: ' : 'You: '}
          </span>
        )}
        {msg.type === 'voice' ? (
          <span className="flex items-center gap-1 text-indigo-300 shrink-0 font-medium">
            <Mic className="w-3 h-3" />
            <span>{language === 'ru' ? 'Голосовое' : 'Voice'}</span>
          </span>
        ) : msg.type === 'video_note' ? (
          <span className="flex items-center gap-1 text-purple-300 shrink-0 font-medium">
            <Video className="w-3 h-3" />
            <span>{language === 'ru' ? 'Видеокружок' : 'Video note'}</span>
          </span>
        ) : msg.type === 'call' ? (
          <span className="flex items-center gap-1 text-emerald-300 shrink-0 font-medium">
            <Phone className="w-3 h-3" />
            <span>{msg.text || (language === 'ru' ? 'Звонок' : 'Call')}</span>
          </span>
        ) : msg.type === 'file' ? (
          <span className="flex items-center gap-1 text-sky-300 shrink-0 font-medium">
            <FileText className="w-3 h-3" />
            <span>{msg.fileName || (language === 'ru' ? 'Файл' : 'File')}</span>
          </span>
        ) : (
          <span className="truncate">{msg.text}</span>
        )}
      </span>
    );
  };

  return (
    <div className="w-full bg-[#080B14] flex flex-col h-full shrink-0 select-none min-h-0 overflow-hidden border-r border-[#151D2D]">
      {/* Top Header */}
      <div className="p-3 border-b border-[#151D2D] space-y-2.5 bg-[#080B14] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-white tracking-tight">
              {language === 'ru' ? 'Чаты' : 'Chats'}
            </h2>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
              {conversations.length}
            </span>
          </div>

          {onNewChatClick && (
            <button
              onClick={onNewChatClick}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow flex items-center gap-1 text-xs font-medium px-2.5 active:scale-95"
              title={language === 'ru' ? 'Новый чат' : 'New chat'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ru' ? 'Чат' : 'New'}</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0D121F] rounded-lg border border-white/5 text-xs">
          {[
            { id: 'all', label: language === 'ru' ? 'Все' : 'All' },
            { id: 'direct', label: language === 'ru' ? 'Личные' : 'Direct' },
            { id: 'group', label: language === 'ru' ? 'Группы' : 'Groups' },
            { id: 'ai', label: 'AI' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`flex-1 py-1 text-center font-medium rounded-md transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-white/10 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ru' ? 'Поиск...' : 'Search...'}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#0D121F] text-white placeholder-slate-500 border border-white/5 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5 pb-20 md:pb-2">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="font-medium text-slate-300">
              {language === 'ru' ? 'Диалогов пока нет' : 'No chats yet'}
            </p>
            {onNewChatClick && (
              <button
                onClick={onNewChatClick}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ru' ? 'Создать чат' : 'Start chat'}</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = selectedConvId === conv.id;
            const title = getConvTitle(conv);
            const avatar = getConvAvatar(conv);
            const status = getOtherStatus(conv);
            const otherUser = getOtherUser(conv);
            const isOtherCreator = otherUser ? isCreatorAccount(otherUser) : false;
            const unread = user && conv.unreadCount ? conv.unreadCount[user.uid] || 0 : 0;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group p-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all relative ${
                  isSelected
                    ? 'bg-white/[0.08] text-white border-l-2 border-indigo-500'
                    : isOtherCreator
                    ? 'bg-[#0E1424]/40 hover:bg-white/[0.04] border border-amber-500/20'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {conv.type === 'ai_bot' ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  ) : avatar ? (
                    <img
                      src={avatar}
                      alt={title}
                      className={`w-10 h-10 rounded-xl object-cover bg-slate-800 ${
                        isOtherCreator
                          ? 'border-2 border-amber-400/80'
                          : isSelected
                          ? 'border border-indigo-400'
                          : 'border border-white/10'
                      }`}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 font-bold text-xs">
                      {title ? title.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}

                  {conv.type !== 'ai_bot' && (
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080B14] ${
                        status === 'online'
                          ? 'bg-emerald-400'
                          : status === 'busy'
                          ? 'bg-rose-500'
                          : 'bg-slate-600'
                      }`}
                    />
                  )}
                </div>

                {/* Conversation Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1 min-w-0 truncate">
                      <span
                        className={`font-semibold text-xs truncate ${
                          isSelected ? 'text-white' : 'text-slate-200'
                        }`}
                      >
                        {title}
                      </span>
                      {otherUser && <VerifiedCheck user={otherUser} />}
                      {isOtherCreator && <CreatorBadge user={otherUser} size="sm" />}
                      {conv.type === 'ai_bot' && (
                        <span className="text-[9px] font-bold px-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          AI
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {formatLastTime(conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] truncate max-w-[170px]">
                      {renderLastMessageSnippet(conv)}
                    </div>

                    {unread > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

