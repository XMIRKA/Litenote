import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import {
  X,
  Search,
  MessageSquare,
  Sparkles,
  Users,
  Radio,
  Check,
  CheckCircle2,
  Plus,
  Image as ImageIcon,
  Shield,
  Smile
} from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: UserProfile[];
  onSelectUser?: (targetUser: UserProfile) => void;
  onStartChat?: (targetUser: UserProfile) => void;
  onCreateGroup?: (
    name: string,
    members: UserProfile[],
    description?: string,
    avatarUrl?: string,
    type?: 'group' | 'channel'
  ) => void;
  onStartAiChat?: () => void;
}

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/identicon/svg?seed=RocketGroup',
  'https://api.dicebear.com/7.x/identicon/svg?seed=CyberTeam',
  'https://api.dicebear.com/7.x/identicon/svg?seed=DevHubCode',
  'https://api.dicebear.com/7.x/identicon/svg?seed=MatrixCore',
  'https://api.dicebear.com/7.x/identicon/svg?seed=PixelGuild',
  'https://api.dicebear.com/7.x/identicon/svg?seed=AlphaSquad',
];

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  allUsers,
  onSelectUser,
  onStartChat,
  onCreateGroup,
  onStartAiChat,
}) => {
  const { user, language } = useAuth();
  const [activeTab, setActiveTab] = useState<'direct' | 'group' | 'channel'>('direct');
  const [searchQuery, setSearchQuery] = useState('');

  // Group creation form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartDirect = (target: UserProfile) => {
    if (onSelectUser) onSelectUser(target);
    else if (onStartChat) onStartChat(target);
    onClose();
  };

  const otherUsers = allUsers.filter((u) => u.uid !== user?.uid);
  const filteredUsers = otherUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.handle.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q)
    );
  });

  const toggleMemberSelection = (uid: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const selectedMembers = otherUsers.filter((u) => selectedMemberIds.includes(u.uid));
    setIsSubmitting(true);

    try {
      if (onCreateGroup) {
        await onCreateGroup(
          groupName.trim(),
          selectedMembers,
          groupDescription.trim(),
          selectedAvatarUrl,
          activeTab === 'channel' ? 'channel' : 'group'
        );
      }
      onClose();
    } catch (err) {
      console.error('Error creating group chat:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0C1220] border border-[#1E2D4A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#080D18] border-b border-[#1A263D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {activeTab === 'direct' ? (
                <MessageSquare className="w-5 h-5" />
              ) : activeTab === 'group' ? (
                <Users className="w-5 h-5" />
              ) : (
                <Radio className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {activeTab === 'direct'
                  ? language === 'ru'
                    ? 'Новый диалог'
                    : 'New Direct Chat'
                  : activeTab === 'group'
                  ? language === 'ru'
                    ? 'Создать группу'
                    : 'Create Group Chat'
                  : language === 'ru'
                  ? 'Создать инфо-канал'
                  : 'Create Channel'}
              </h3>
              <p className="text-xs text-slate-400">
                {activeTab === 'direct'
                  ? language === 'ru'
                    ? 'Выберите пользователя или бота'
                    : 'Select a developer or bot'
                  : language === 'ru'
                  ? 'Объедините участников в общий чат'
                  : 'Add members to start chatting'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Direct / Group / Channel */}
        <div className="flex p-1.5 mx-4 mt-3 bg-[#060A13] rounded-xl border border-[#162238] gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{language === 'ru' ? 'Личные' : 'Direct'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'group'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{language === 'ru' ? 'Группа' : 'Group'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('channel')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'channel'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{language === 'ru' ? 'Канал' : 'Channel'}</span>
          </button>
        </div>

        {/* Tab 1: Direct Chat Selector */}
        {activeTab === 'direct' && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search */}
            <div className="p-3 border-b border-[#18263D]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ru' ? 'Поиск контактов...' : 'Search contacts...'}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#070B14] text-white placeholder-slate-500 border border-[#1A2842] rounded-xl focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Contacts list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-800/40">
              {/* Gemini AI Bot Option */}
              <div
                onClick={() => {
                  if (onStartAiChat) onStartAiChat();
                  onClose();
                }}
                className="p-3 rounded-xl flex items-center gap-3 hover:bg-[#111A2E] cursor-pointer transition-colors border border-transparent hover:border-indigo-500/30 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors">
                      AI Ассистент (Gemini Flash)
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      AI BOT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {language === 'ru' ? 'Всегда в сети • Генерация кода, ответы на любые вопросы' : 'Always online • Fast answers & coding'}
                  </p>
                </div>
              </div>

              {/* Users list */}
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  {language === 'ru' ? 'Контакты не найдены' : 'No users found'}
                </div>
              ) : (
                filteredUsers.map((target) => (
                  <div
                    key={target.uid}
                    onClick={() => handleStartDirect(target)}
                    className="p-3 rounded-xl flex items-center gap-3 hover:bg-[#111A2E] cursor-pointer transition-colors border border-transparent hover:border-slate-700 group"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={target.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${target.handle}`}
                        alt={target.displayName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0F172A] ${
                          target.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors truncate">
                          {target.displayName}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        @{target.handle} {target.bio ? `• ${target.bio}` : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2 & 3: Group / Channel Creator */}
        {(activeTab === 'group' || activeTab === 'channel') && (
          <form onSubmit={handleCreateGroupSubmit} className="flex flex-col flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {/* Group Name & Avatar Preview */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                {activeTab === 'group'
                  ? language === 'ru'
                    ? 'Название группы *'
                    : 'Group Name *'
                  : language === 'ru'
                  ? 'Название канала *'
                  : 'Channel Name *'}
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={selectedAvatarUrl}
                  alt="Group Avatar"
                  className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/50 bg-[#070B14] shrink-0 p-1 shadow-md"
                />
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedAvatarUrl(
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                          e.target.value.trim()
                        )}`
                      );
                    }
                  }}
                  placeholder={
                    activeTab === 'group'
                      ? language === 'ru'
                        ? 'Например: Frontend Devs, Backend Core...'
                        : 'e.g. Frontend Core, Web3 Builders...'
                      : language === 'ru'
                      ? 'Например: LiteNote News & Updates...'
                      : 'e.g. Tech News & Releases...'
                  }
                  className="flex-1 px-3 py-2 text-xs bg-[#070B14] text-white placeholder-slate-500 border border-[#1A2842] rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Avatar Presets Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 block">
                {language === 'ru' ? 'Выберите аватарку группы:' : 'Choose group icon:'}
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatarUrl(preset)}
                    className={`w-9 h-9 rounded-xl p-1 shrink-0 bg-[#070B14] border transition-all cursor-pointer ${
                      selectedAvatarUrl === preset
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-[#1E2D4A] hover:border-slate-500'
                    }`}
                  >
                    <img src={preset} alt="Preset" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>

            {/* Description / Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                {language === 'ru' ? 'Описание / Тема (необязательно)' : 'Description / Topic (optional)'}
              </label>
              <textarea
                rows={2}
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder={
                  language === 'ru'
                    ? 'О чем этот чат? Правила, ссылки или цели группы...'
                    : 'What is this group about?'
                }
                className="w-full px-3 py-2 text-xs bg-[#070B14] text-white placeholder-slate-500 border border-[#1A2842] rounded-xl focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Member Selection Section */}
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'ru' ? 'Добавить участников' : 'Add Members'}
                </label>
                <span className="text-[11px] font-mono text-emerald-400">
                  {language === 'ru'
                    ? `Выбрано: ${selectedMemberIds.length}`
                    : `Selected: ${selectedMemberIds.length}`}
                </span>
              </div>

              {/* Member Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ru' ? 'Поиск участников...' : 'Search members...'}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-[#070B14] text-white placeholder-slate-500 border border-[#1A2842] rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Members Checklist */}
              <div className="max-h-40 overflow-y-auto space-y-1 bg-[#070B14] p-2 rounded-xl border border-[#1A2842]">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-3">
                    {language === 'ru' ? 'Нет доступных пользователей' : 'No users available'}
                  </p>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedMemberIds.includes(u.uid);
                    return (
                      <div
                        key={u.uid}
                        onClick={() => toggleMemberSelection(u.uid)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border border-emerald-500/30'
                            : 'hover:bg-[#101828] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.handle}`}
                            alt={u.displayName}
                            className="w-7 h-7 rounded-lg object-cover border border-slate-700 bg-slate-800"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {u.displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">@{u.handle}</p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'border-slate-600 bg-slate-800/40'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!groupName.trim() || isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? language === 'ru'
                      ? 'Создание...'
                      : 'Creating...'
                    : activeTab === 'group'
                    ? language === 'ru'
                      ? `Создать группу (${selectedMemberIds.length + 1} уч.)`
                      : `Create Group (${selectedMemberIds.length + 1} members)`
                    : language === 'ru'
                    ? 'Создать канал'
                    : 'Create Channel'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

