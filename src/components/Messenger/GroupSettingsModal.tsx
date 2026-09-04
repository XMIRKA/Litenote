import React, { useState } from 'react';
import { Conversation, UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { isCreatorAccount, isCoFounderAccount } from '../../lib/creator';
import { CreatorBadge, CoFounderBadge, VerifiedCheck } from '../Common/CreatorBadge';
import {
  X,
  Users,
  Shield,
  ShieldAlert,
  UserPlus,
  Trash2,
  Image as ImageIcon,
  Check,
  Search,
  Settings,
  Crown,
  LogOut,
  Eraser,
  Lock,
  MessageSquare,
  UserX
} from 'lucide-react';

interface GroupSettingsModalProps {
  isOpen: boolean;
  conversation: Conversation;
  allUsers: UserProfile[];
  onClose: () => void;
  onUpdateGroupInfo: (updates: {
    name?: string;
    description?: string;
    avatarUrl?: string;
    permissions?: {
      onlyAdminsCanPost?: boolean;
      onlyAdminsCanEditInfo?: boolean;
      onlyAdminsCanInvite?: boolean;
    };
  }) => Promise<void>;
  onAddMembers: (newMembers: UserProfile[]) => Promise<void>;
  onRemoveMember: (memberUid: string) => Promise<void>;
  onToggleAdmin: (memberUid: string, isAdmin: boolean) => Promise<void>;
  onClearChat?: () => Promise<void>;
  onDeleteChat?: () => Promise<void>;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80',
];

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  isOpen,
  conversation,
  allUsers,
  onClose,
  onUpdateGroupInfo,
  onAddMembers,
  onRemoveMember,
  onToggleAdmin,
  onClearChat,
  onDeleteChat,
}) => {
  const { user, language } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'permissions' | 'danger'>('info');

  const [name, setName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [avatarUrl, setAvatarUrl] = useState(
    conversation.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${conversation.name || 'group'}`
  );

  const [onlyAdminsCanPost, setOnlyAdminsCanPost] = useState(
    conversation.permissions?.onlyAdminsCanPost || false
  );
  const [onlyAdminsCanEditInfo, setOnlyAdminsCanEditInfo] = useState(
    conversation.permissions?.onlyAdminsCanEditInfo ?? true
  );
  const [onlyAdminsCanInvite, setOnlyAdminsCanInvite] = useState(
    conversation.permissions?.onlyAdminsCanInvite || false
  );

  const [memberSearch, setMemberSearch] = useState('');
  const [selectedNewUsers, setSelectedNewUsers] = useState<UserProfile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmText: string;
    danger?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  if (!isOpen) return null;

  const groupOwnerUid = conversation.ownerId || conversation.participants?.[0];
  const isOwner = user?.uid === groupOwnerUid || isCreatorAccount(user);
  const isAdmin = isOwner || (user && conversation.admins?.includes(user.uid));

  // Eligible users to invite (not already in group)
  const existingUids = new Set(conversation.participants || []);
  const nonMembers = allUsers.filter((u) => !existingUids.has(u.uid) && u.uid !== user?.uid);
  const filteredNonMembers = nonMembers.filter((u) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return u.displayName.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q);
  });

  const handleToggleSelectNewUser = (candidate: UserProfile) => {
    if (selectedNewUsers.some((u) => u.uid === candidate.uid)) {
      setSelectedNewUsers((prev) => prev.filter((u) => u.uid !== candidate.uid));
    } else {
      setSelectedNewUsers((prev) => [...prev, candidate]);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateGroupInfo({
        name: name.trim(),
        description: description.trim(),
        avatarUrl,
        permissions: {
          onlyAdminsCanPost,
          onlyAdminsCanEditInfo,
          onlyAdminsCanInvite,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save group settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmAddMembers = async () => {
    if (selectedNewUsers.length === 0) return;
    setIsSaving(true);
    try {
      await onAddMembers(selectedNewUsers);
      setSelectedNewUsers([]);
      setMemberSearch('');
      setActiveTab('members');
    } catch (err) {
      console.error('Failed to add members:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#080C14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {conversation.name || 'Группа'}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {conversation.participants.length} участн.
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {conversation.type === 'channel' ? 'Управление каналом' : 'Управление группой'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800/80 bg-[#080C14] overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'info'
                ? 'text-indigo-400 border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            📝 Информация
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'text-indigo-400 border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            👥 Участники ({conversation.participants.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('permissions')}
              className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'text-indigo-400 border-indigo-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              🔒 Права доступа
            </button>
          )}
          <button
            onClick={() => setActiveTab('danger')}
            className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'danger'
                ? 'text-rose-400 border-rose-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            ⚙️ Действия
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: GROUP INFO */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              {/* Group Avatar Preview & Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Аватар группы</label>
                <div className="flex items-center gap-4">
                  <img
                    src={avatarUrl}
                    alt="Group Avatar"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 bg-slate-800 shadow-md"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      disabled={!isAdmin}
                      className="w-full px-3 py-1.5 bg-[#050811] text-xs text-white border border-slate-700 rounded-xl focus:border-indigo-500 outline-none"
                    />
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(preset)}
                          className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 transition-colors shrink-0 cursor-pointer"
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Название группы</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                  required
                  placeholder="Название сообщества..."
                  className="w-full px-3.5 py-2 bg-[#050811] text-sm text-white border border-slate-700 rounded-xl focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Group Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Описание / Тема чата</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isAdmin}
                  rows={3}
                  placeholder="О чем этот чат..."
                  className="w-full px-3.5 py-2 bg-[#050811] text-xs text-white border border-slate-700 rounded-xl focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {isAdmin && (
                <div className="pt-2 flex items-center justify-between">
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Настройки успешно сохранены!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving || !name.trim()}
                    className="ml-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: MEMBERS & INVITE */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              {/* Add New Members Section */}
              {(!conversation.permissions?.onlyAdminsCanInvite || isAdmin) && (
                <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-indigo-400" />
                      Добавить участников в группу
                    </h3>
                    {selectedNewUsers.length > 0 && (
                      <span className="text-[11px] text-indigo-400 font-mono font-bold">
                        Выбрано: {selectedNewUsers.length}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Поиск по имени или @handle..."
                      className="w-full pl-9 pr-3 py-1.5 bg-[#050811] text-xs text-white border border-slate-700 rounded-xl focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Candidate List */}
                  {filteredNonMembers.length > 0 && (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {filteredNonMembers.slice(0, 8).map((candidate) => {
                        const isSelected = selectedNewUsers.some((u) => u.uid === candidate.uid);
                        return (
                          <div
                            key={candidate.uid}
                            onClick={() => handleToggleSelectNewUser(candidate)}
                            className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                                : 'bg-[#090D17] border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={candidate.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${candidate.handle}`}
                                alt={candidate.displayName}
                                className="w-6 h-6 rounded-lg object-cover bg-slate-800"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate">{candidate.displayName}</p>
                                <p className="text-[10px] text-slate-500">@{candidate.handle}</p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center border text-xs ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-400 text-white'
                                  : 'border-slate-700 bg-slate-800 text-transparent'
                              }`}
                            >
                              ✓
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedNewUsers.length > 0 && (
                    <button
                      onClick={handleConfirmAddMembers}
                      disabled={isSaving}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
                    >
                      {isSaving ? 'Добавление...' : `Добавить ${selectedNewUsers.length} участников`}
                    </button>
                  )}
                </div>
              )}

              {/* Current Group Participants List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300">
                  {language === 'ru' ? 'Список участников' : 'Members List'}
                </h3>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {conversation.participants.map((uid) => {
                    const profile =
                      allUsers.find((u) => u.uid === uid) ||
                      (conversation.participantDetails && conversation.participantDetails[uid]);

                    const isMemberOwner = uid === groupOwnerUid;
                    const isMemberAdmin = isMemberOwner || (conversation.admins || []).includes(uid);
                    const isCreator = isCreatorAccount(profile);
                    const isCoFounder = isCoFounderAccount(profile);

                    const displayName = profile?.displayName || (uid === user?.uid ? user.displayName : 'Пользователь');
                    const handle = profile?.handle || (uid === user?.uid ? user.handle : 'user');
                    const avatar = profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`;

                    return (
                      <div
                        key={uid}
                        className="p-2.5 rounded-xl bg-[#090D17] border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={avatar}
                            alt={displayName}
                            className="w-8 h-8 rounded-xl object-cover bg-slate-800 border border-slate-700"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-white truncate">
                                {displayName} {uid === user?.uid && '(Вы)'}
                              </span>
                              <VerifiedCheck user={{ handle, uid, displayName }} />
                              {isCreator && <CreatorBadge user={{ handle, uid }} size="sm" showLabel />}
                              {isCoFounder && <CoFounderBadge user={{ handle, uid }} size="sm" showLabel />}
                              {isMemberOwner && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  <span>{language === 'ru' ? 'Владелец' : 'Owner'}</span>
                                </span>
                              )}
                              {isMemberAdmin && !isMemberOwner && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/40 flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-indigo-400" />
                                  <span>{language === 'ru' ? 'Админ' : 'Admin'}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">@{handle}</p>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        {isAdmin && uid !== user?.uid && !isMemberOwner && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => onToggleAdmin(uid, !isMemberAdmin)}
                              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                isMemberAdmin
                                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                              }`}
                              title={isMemberAdmin ? 'Снять статус админа' : 'Назначить администратором'}
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onRemoveMember(uid)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Исключить из группы"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERMISSIONS */}
          {activeTab === 'permissions' && isAdmin && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#070B14] border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Настройка прав участников
                </h3>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-white">Только админы могут писать сообщения</p>
                    <p className="text-[10px] text-slate-400">Превращает группу в информационный канал</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={onlyAdminsCanPost}
                    onChange={(e) => setOnlyAdminsCanPost(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-white">Только админы могут менять инфо группы</p>
                    <p className="text-[10px] text-slate-400">Защищает название, описание и аватар от изменений</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={onlyAdminsCanEditInfo}
                    onChange={(e) => setOnlyAdminsCanEditInfo(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-white">Только админы могут приглашать участников</p>
                    <p className="text-[10px] text-slate-400">Закрытая группа по приглашениям</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={onlyAdminsCanInvite}
                    onChange={(e) => setOnlyAdminsCanInvite(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveInfo}
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  {isSaving ? 'Сохранение...' : 'Применить права'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DANGER ZONE / ACTIONS */}
          {activeTab === 'danger' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
                <h3 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  {language === 'ru' ? 'Действия и безопасность' : 'Actions & Danger Zone'}
                </h3>

                {onClearChat && (
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {language === 'ru' ? 'Очистить историю сообщений' : 'Clear Message History'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {language === 'ru' ? 'Удалит все сообщения в этом чате' : 'Deletes all messages in this chat'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          title: language === 'ru' ? 'Очистить историю сообщений?' : 'Clear Message History?',
                          description: language === 'ru'
                            ? 'Все сообщения группы будут удалены для всех участников.'
                            : 'All group messages will be deleted for everyone.',
                          confirmText: language === 'ru' ? 'Очистить' : 'Clear',
                          danger: false,
                          onConfirm: async () => {
                            await onClearChat();
                            onClose();
                          },
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      {language === 'ru' ? 'Очистить чат' : 'Clear Chat'}
                    </button>
                  </div>
                )}

                {/* Leave Group */}
                <div className="flex items-center justify-between pt-2 border-t border-rose-900/30">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {language === 'ru' ? 'Покинуть группу' : 'Leave Group'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {language === 'ru' ? 'Вы перестанете получать новые сообщения' : 'You will stop receiving new messages'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) return;
                      setConfirmModal({
                        title: language === 'ru' ? 'Покинуть группу?' : 'Leave Group?',
                        description: language === 'ru'
                          ? 'Вы выйдете из списка участников этой группы.'
                          : 'You will leave the member list of this group.',
                        confirmText: language === 'ru' ? 'Выйти' : 'Leave',
                        danger: true,
                        onConfirm: async () => {
                          await onRemoveMember(user.uid);
                          onClose();
                        },
                      });
                    }}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {language === 'ru' ? 'Выйти из группы' : 'Leave Group'}
                  </button>
                </div>

                {/* Delete Entire Group (Owner/Creator Only) */}
                {isOwner && onDeleteChat && (
                  <div className="flex items-center justify-between pt-2 border-t border-rose-900/30">
                    <div>
                      <p className="text-xs font-semibold text-rose-400">
                        {language === 'ru' ? 'Удалить группу навсегда' : 'Delete Group Permanently'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {language === 'ru' ? 'Безвозвратно удаляет группу и всех участников' : 'Permanently deletes group and all data'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          title: language === 'ru' ? 'Удалить группу навсегда?' : 'Delete Group Permanently?',
                          description: language === 'ru'
                            ? 'ВНИМАНИЕ: Это действие безвозвратно удалит группу и всю историю сообщений для всех участников!'
                            : 'WARNING: This will permanently delete the group and all message history for all members!',
                          confirmText: language === 'ru' ? 'Удалить группу' : 'Delete Group',
                          danger: true,
                          onConfirm: async () => {
                            await onDeleteChat();
                            onClose();
                          },
                        });
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {language === 'ru' ? 'Удалить группу' : 'Delete Group'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0E1424] border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div>
                <h4 className="font-bold text-sm text-white">{confirmModal.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{confirmModal.description}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  disabled={isProcessingAction}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsProcessingAction(true);
                      await confirmModal.onConfirm();
                      setConfirmModal(null);
                    } catch (e) {
                      console.error('Error executing group action:', e);
                    } finally {
                      setIsProcessingAction(false);
                    }
                  }}
                  disabled={isProcessingAction}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer shadow-lg disabled:opacity-50 ${
                    confirmModal.danger
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  }`}
                >
                  {isProcessingAction ? '...' : confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
