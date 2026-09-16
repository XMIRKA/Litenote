import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Conversation, UserProfile } from '../../types';
import { getCleanAvatarUrl } from '../../lib/avatar';
import { playTapSound, setAudioMuted, getAudioMuted } from '../../lib/audioEffects';
import {
  Search,
  MessageSquare,
  Users,
  Compass,
  Bookmark,
  User,
  Settings,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
  Code,
  ArrowRight,
  Command,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  allUsers: UserProfile[];
  onSelectConversation: (convId: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenNewChat: () => void;
  onOpenCreatePost: () => void;
  onOpenDevTools?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  conversations,
  allUsers,
  onSelectConversation,
  onNavigateTab,
  onOpenNewChat,
  onOpenCreatePost,
  onOpenDevTools,
}) => {
  const { user, language } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isMuted, setIsMutedState] = useState(getAudioMuted());

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build searchable items
  interface PaletteItem {
    id: string;
    title: string;
    subtitle?: string;
    category: 'navigation' | 'chats' | 'users' | 'actions';
    icon?: React.ReactNode;
    avatarUrl?: string;
    action: () => void;
  }

  const navItems: PaletteItem[] = [
    {
      id: 'nav_feed',
      title: language === 'ru' ? 'Лента постов' : 'Feed',
      subtitle: language === 'ru' ? 'Главная лента и публикации' : 'Home feed & posts',
      category: 'navigation',
      icon: <Compass className="w-4 h-4 text-sky-400" />,
      action: () => onNavigateTab('feed'),
    },
    {
      id: 'nav_messenger',
      title: language === 'ru' ? 'Мессенджер' : 'Messenger',
      subtitle: language === 'ru' ? 'Чаты и диалоги' : 'Direct & group chats',
      category: 'navigation',
      icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
      action: () => onNavigateTab('messenger'),
    },
    {
      id: 'nav_people',
      title: language === 'ru' ? 'Люди и контакты' : 'People',
      subtitle: language === 'ru' ? 'Поиск пользователей платформы' : 'Find creators & friends',
      category: 'navigation',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      action: () => onNavigateTab('people'),
    },
    {
      id: 'nav_bookmarks',
      title: language === 'ru' ? 'Закладки' : 'Bookmarks',
      subtitle: language === 'ru' ? 'Сохраненные посты' : 'Saved items',
      category: 'navigation',
      icon: <Bookmark className="w-4 h-4 text-amber-400" />,
      action: () => onNavigateTab('bookmarks'),
    },
    {
      id: 'nav_profile',
      title: language === 'ru' ? 'Мой профиль' : 'My Profile',
      subtitle: language === 'ru' ? 'Настройки личной страницы' : 'View your profile',
      category: 'navigation',
      icon: <User className="w-4 h-4 text-purple-400" />,
      action: () => onNavigateTab('profile'),
    },
    {
      id: 'nav_settings',
      title: language === 'ru' ? 'Настройки и темы' : 'Settings',
      subtitle: language === 'ru' ? 'Кастомизация и оформление' : 'Preferences & appearance',
      category: 'navigation',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      action: () => onNavigateTab('settings'),
    },
  ];

  const actionItems: PaletteItem[] = [
    {
      id: 'action_create_post',
      title: language === 'ru' ? 'Создать публикацию' : 'Create Post',
      subtitle: language === 'ru' ? 'Опубликовать пост с кодом или медиа' : 'Share snippet, poll or thoughts',
      category: 'actions',
      icon: <Plus className="w-4 h-4 text-indigo-400" />,
      action: () => onOpenCreatePost(),
    },
    {
      id: 'action_new_chat',
      title: language === 'ru' ? 'Новый чат / группа' : 'New Chat / Group',
      subtitle: language === 'ru' ? 'Начать диалог или создать канал' : 'Start direct chat or create channel',
      category: 'actions',
      icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
      action: () => onOpenNewChat(),
    },
    {
      id: 'action_toggle_audio',
      title: isMuted
        ? language === 'ru' ? 'Включить звуковые микро-эффекты' : 'Enable sound effects'
        : language === 'ru' ? 'Отключить звуковые микро-эффекты' : 'Mute sound effects',
      subtitle: language === 'ru' ? 'Тактильные звуки кликов и сообщений' : 'Web Audio UI synthesizers',
      category: 'actions',
      icon: isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />,
      action: () => {
        const next = !isMuted;
        setAudioMuted(next);
        setIsMutedState(next);
      },
    },
  ];

  if (onOpenDevTools) {
    actionItems.push({
      id: 'action_devtools',
      title: language === 'ru' ? 'Инструменты разработчика' : 'Developer Tools',
      subtitle: language === 'ru' ? 'Консоль архитектора Litenote' : 'DevTeam debug dashboard',
      category: 'actions',
      icon: <Code className="w-4 h-4 text-amber-400" />,
      action: () => onOpenDevTools(),
    });
  }

  // Chats
  const chatItems: PaletteItem[] = conversations.slice(0, 10).map((conv) => {
    const isAi = conv.type === 'ai_bot';
    const otherUid = user ? conv.participants.find((p) => p !== user.uid) : null;
    const otherUser = allUsers.find((u) => u.uid === otherUid);
    const title = isAi ? 'Litenote AI' : conv.name || otherUser?.displayName || 'Диалог';
    const avatar = isAi ? '' : getCleanAvatarUrl(title, conv.avatarUrl || otherUser?.avatarUrl);

    return {
      id: `chat_${conv.id}`,
      title,
      subtitle: conv.lastMessage?.text || (isAi ? 'Умный ИИ-помощник' : 'Личный чат'),
      category: 'chats',
      icon: isAi ? <Sparkles className="w-4 h-4 text-indigo-400" /> : undefined,
      avatarUrl: avatar,
      action: () => {
        onNavigateTab('messenger');
        onSelectConversation(conv.id);
      },
    };
  });

  // Users
  const userItems: PaletteItem[] = allUsers
    .filter(
      (u) =>
        u &&
        u.uid &&
        u.uid !== 'undefined' &&
        u.uid !== 'null' &&
        u.handle !== 'undefined' &&
        (Boolean(u.handle) || Boolean(u.displayName)) &&
        (!user || u.uid !== user.uid)
    )
    .slice(0, 10)
    .map((u) => {
      const handle = (u.handle || 'user').replace(/^@/, '');
      const name = u.displayName || u.handle || 'User';
      const statusText = u.status === 'online' ? (language === 'ru' ? 'В сети' : 'Online') : (language === 'ru' ? 'Не в сети' : 'Offline');
      return {
        id: `user_${u.uid}`,
        title: name,
        subtitle: `@${handle} • ${u.bio || statusText}`,
        category: 'users',
        avatarUrl: getCleanAvatarUrl(handle || name, u.avatarUrl),
        action: () => {
          onNavigateTab('messenger');
          // Check if direct conversation exists
          const existing = conversations.find(
            (c) => c.type === 'direct' && user && c.participants.includes(user.uid) && c.participants.includes(u.uid)
          );
          if (existing) {
            onSelectConversation(existing.id);
          } else {
            onOpenNewChat();
          }
        },
      };
    });

  const allItems: PaletteItem[] = [...actionItems, ...navItems, ...chatItems, ...userItems];

  const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');
  const filteredItems = cleanQuery
    ? allItems.filter((item) => {
        const titleMatch = item.title.toLowerCase().replace(/^@/, '').includes(cleanQuery);
        const subMatch = item.subtitle ? item.subtitle.toLowerCase().replace(/^@/, '').includes(cleanQuery) : false;
        return titleMatch || subMatch;
      })
    : allItems;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        playTapSound();
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-[12vh] bg-black/75 backdrop-blur-md animate-in fade-in-20 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0B101D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 p-3.5 border-b border-white/10 bg-[#0E1527]">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={language === 'ru' ? 'Быстрый переход или поиск (начните вводить)...' : 'Quick jump or command (type to search)...'}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400 border border-white/10">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    playTapSound();
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.title}
                          className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-white/10"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-white/20' : 'bg-white/5 border border-white/10'
                          }`}
                        >
                          {item.icon}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate">{item.title}</div>
                      {item.subtitle && (
                        <div
                          className={`text-[11px] truncate ${
                            isSelected ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-200 shrink-0">
                      <span>Enter</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-2.5 px-3.5 border-t border-white/10 bg-[#080C16] flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↓</kbd>
              <span>{language === 'ru' ? 'выбор' : 'navigate'}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↵</kbd>
              <span>{language === 'ru' ? 'открыть' : 'open'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-indigo-400 font-medium">
            <Command className="w-3 h-3" />
            <span>Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};
