import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { UserProfile, Friendship, Follow } from '../../types';
import { CreatorBadge, CoFounderBadge, VerifiedCheck } from '../Common/CreatorBadge';
import { isCreatorAccount, isCoFounderAccount } from '../../lib/creator';
import { getCleanAvatarUrl } from '../../lib/avatar';
import {
  Users,
  Search,
  UserPlus,
  UserCheck,
  MessageSquare,
  Check,
  X,
  Sparkles,
  Crown,
  Gem,
  Code2,
  Shield,
  Plus,
  Trash2,
  UserX,
  Award,
} from 'lucide-react';

interface CustomDeveloper {
  uid: string;
  roleTitle: string;
  addedAt: number;
}

interface PeopleDirectoryProps {
  allUsers: UserProfile[];
  friendships: Friendship[];
  follows: Follow[];
  onSendFriendRequest: (recipientId: string) => void;
  onAcceptFriendRequest: (friendshipId: string) => void;
  onDeclineFriendRequest: (friendshipId: string) => void;
  onToggleFollow: (targetUserId: string) => void;
  onStartDirectChat: (targetUser: UserProfile) => void;
}

// Built-in Patrick Jane Co-Founder user definition
export const PATRICK_JANE_USER: UserProfile = {
  uid: 'patrick_jane_cofounder_uid',
  email: 'patrick.jane@litenote.dev',
  displayName: 'Patrick Jane',
  handle: 'patrickjane',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  bannerUrl: '',
  bio: 'Co-Founder & Chief System Architect • Core Security & Platform Engineering',
  status: 'online',
  accentColor: 'cyan',
  language: 'ru',
  role: 'admin',
  createdAt: 1704067200000,
  badges: ['cofounder', 'matrix_architect', 'cyber_pioneer'],
  privacy: {
    profileVisibility: 'all',
    allowDMs: 'all',
    showOnlineStatus: true,
  },
  stats: {
    postsCount: 42,
    friendsCount: 128,
    followersCount: 1024,
    followingCount: 16,
  },
};

export const PeopleDirectory: React.FC<PeopleDirectoryProps> = ({
  allUsers,
  friendships,
  follows,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onToggleFollow,
  onStartDirectChat,
}) => {
  const { user, accentColor, language, setSelectedUserId, setActiveTab } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [activeTabFilter, setActiveTabFilter] = useState<'devs' | 'friends' | 'pending'>('devs');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom added developers state persisted locally
  const [customDevelopers, setCustomDevelopers] = useState<CustomDeveloper[]>(() => {
    try {
      const saved = localStorage.getItem('litenote_custom_developers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddDevModalOpen, setIsAddDevModalOpen] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('');
  const [customRoleTitle, setCustomRoleTitle] = useState('Core Developer');
  const [devAccessCode, setDevAccessCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  const isCurrentUserCreator = isCreatorAccount(user);

  const saveCustomDevelopers = (devs: CustomDeveloper[]) => {
    setCustomDevelopers(devs);
    try {
      localStorage.setItem('litenote_custom_developers', JSON.stringify(devs));
    } catch (e) {
      console.error(e);
    }
  };

  // Pending inbound requests for current user
  const inboundRequests = friendships.filter(
    (f) => f.recipientId === user?.uid && f.status === 'pending'
  );

  // Accepted friends for current user
  const acceptedFriendIds = friendships
    .filter(
      (f) =>
        f.status === 'accepted' && (f.requesterId === user?.uid || f.recipientId === user?.uid)
    )
    .map((f) => (f.requesterId === user?.uid ? f.recipientId : f.requesterId));

  const followedUserIds = follows
    .filter((f) => f.followerId === user?.uid)
    .map((f) => f.followingId);

  // Deduplicate allUsers and ensure no duplicate Patrick Jane exists
  const mergedUsers: UserProfile[] = (() => {
    const list: UserProfile[] = [];
    const seenUids = new Set<string>();
    const seenHandles = new Set<string>();
    let seenPatrick = false;

    // Add all existing real registered users first, merging with fresh user state
    for (const rawUser of allUsers) {
      if (!rawUser || !rawUser.uid) continue;
      const u = (user && rawUser.uid === user.uid) ? { ...rawUser, ...user } : rawUser;
      const normalizedHandle = (u.handle || '').toLowerCase().trim().replace(/^@/, '');
      const normalizedName = (u.displayName || '').toLowerCase().trim();

      const isPatrick =
        isCoFounderAccount(u) ||
        normalizedHandle.includes('patrick') ||
        normalizedName.includes('patrick');

      if (isPatrick) {
        if (seenPatrick) {
          continue; // Prevent duplicate Patrick in All users tab
        }
        seenPatrick = true;
      }

      if (seenUids.has(u.uid) || (normalizedHandle && seenHandles.has(normalizedHandle))) {
        continue;
      }
      seenUids.add(u.uid);
      if (normalizedHandle) seenHandles.add(normalizedHandle);
      list.push(u);
    }

    // Ensure current user is present
    if (user && !seenUids.has(user.uid)) {
      list.unshift(user);
    }

    return list;
  })();

  // Core Developers List: Creator + Patrick Jane + Added Developers
  const devTeamUsers: (UserProfile & { customRole?: string })[] = (() => {
    const team: (UserProfile & { customRole?: string })[] = [];

    // 1. Current user if creator
    if (user && isCurrentUserCreator) {
      team.push({
        ...user,
        customRole: language === 'ru' ? 'Основатель & Lead Developer' : 'Founder & Lead Developer',
      });
    } else {
      // Find creator in all users or provide default
      const foundCreator = mergedUsers.find((u) => isCreatorAccount(u));
      if (foundCreator) {
        team.push({
          ...foundCreator,
          customRole: language === 'ru' ? 'Основатель & Lead Developer' : 'Founder & Lead Developer',
        });
      } else {
        team.push({
          uid: 'creator_mirkamol_core',
          email: 'mirkamolaliserov87@gmail.com',
          displayName: 'Mirkamol (Creator)',
          handle: 'mirkamol',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=mirkamol',
          bio: 'Официальный создатель и главный архитектор платформы Litenote',
          status: 'online',
          customRole: language === 'ru' ? 'Основатель & Lead Developer' : 'Founder & Lead Developer',
        } as any);
      }
    }

    // 2. Patrick Jane (Co-Founder) - from allUsers/current user or default
    const foundPatrick =
      (user && isCoFounderAccount(user) ? user : null) ||
      mergedUsers.find((u) => isCoFounderAccount(u)) ||
      allUsers.find((u) => isCoFounderAccount(u)) ||
      allUsers.find(
        (u) =>
          (u.handle || '').toLowerCase().includes('patrick') ||
          (u.displayName || '').toLowerCase().includes('patrick')
      ) ||
      PATRICK_JANE_USER;

    const effectivePatrick: UserProfile = {
      ...foundPatrick,
      avatarUrl: (user && isCoFounderAccount(user) && user.avatarUrl) ? user.avatarUrl : (foundPatrick.avatarUrl || PATRICK_JANE_USER.avatarUrl),
    };

    if (
      !team.some(
        (u) =>
          u.uid === effectivePatrick.uid ||
          (u.handle &&
            effectivePatrick.handle &&
            u.handle.toLowerCase().replace(/^@/, '') ===
              effectivePatrick.handle.toLowerCase().replace(/^@/, ''))
      )
    ) {
      team.push({
        ...effectivePatrick,
        customRole: language === 'ru' ? 'Сооснователь & System Architect' : 'Co-Founder & System Architect',
      });
    }

    // 3. Custom developers added by creator or code
    customDevelopers.forEach((cd) => {
      const found = mergedUsers.find((u) => u.uid === cd.uid);
      if (found && !team.some((t) => t.uid === found.uid)) {
        team.push({
          ...found,
          customRole: cd.roleTitle || (language === 'ru' ? 'Разработчик команды' : 'Team Developer'),
        });
      }
    });

    return team;
  })();

  const handleAddDeveloper = () => {
    if (!selectedUserToAdd) return;
    if (customDevelopers.some((d) => d.uid === selectedUserToAdd)) return;

    // Verify secret authorization code M20102508 strictly for all attempts
    if (devAccessCode.trim() !== 'M20102508') {
      setCodeError(
        language === 'ru'
          ? 'Неверный код доступа. В доступе отказано.'
          : 'Invalid access code. Access denied.'
      );
      return;
    }

    setCodeError(null);
    const updated = [
      ...customDevelopers,
      {
        uid: selectedUserToAdd,
        roleTitle: customRoleTitle.trim() || 'Core Developer',
        addedAt: Date.now(),
      },
    ];
    saveCustomDevelopers(updated);
    setIsAddDevModalOpen(false);
    setSelectedUserToAdd('');
    setCustomRoleTitle('Core Developer');
    setDevAccessCode('');
  };

  const handleRemoveDeveloper = (uid: string) => {
    const updated = customDevelopers.filter((d) => d.uid !== uid);
    saveCustomDevelopers(updated);
  };

  // Get active list to render based on tab
  const getDisplayUsers = () => {
    let sourceList: (UserProfile & { customRole?: string })[] = [];

    if (activeTabFilter === 'devs') {
      sourceList = devTeamUsers;
    } else if (activeTabFilter === 'friends') {
      sourceList = mergedUsers.filter((u) => acceptedFriendIds.includes(u.uid) && u.uid !== user?.uid);
    } else if (activeTabFilter === 'pending') {
      sourceList = mergedUsers.filter((u) => inboundRequests.some((r) => r.requesterId === u.uid));
    } else {
      sourceList = devTeamUsers;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return sourceList.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(q) ||
          u.handle?.toLowerCase().includes(q) ||
          u.bio?.toLowerCase().includes(q) ||
          u.customRole?.toLowerCase().includes(q)
      );
    }

    return sourceList;
  };

  const displayUsers = getDisplayUsers();

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-6">
      {/* Directory Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0C121E] border border-[#1A2337] shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/10">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-base sm:text-lg text-white">
                {language === 'ru' ? 'Разработчики и команда' : 'Developers & Team'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                LITENOTE CORE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'ru'
                ? 'Официальный состав разработчиков платформы и сообщество кодеров'
                : 'Official platform core team and developer community'}
            </p>
          </div>
        </div>

        {/* Action button: Add developer with passcode authorization */}
        <button
          onClick={() => {
            setCodeError(null);
            setIsAddDevModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'ru' ? 'Добавить разработчика' : 'Add Developer'}</span>
        </button>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation Tabs (Without All Users) */}
        <div className="flex items-center gap-1.5 bg-[#090E17] p-1.5 rounded-2xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTabFilter('devs')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTabFilter === 'devs'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'ru' ? 'Разработчики' : 'Dev Team'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] text-indigo-200">
              {devTeamUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTabFilter('friends')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTabFilter === 'friends'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'ru' ? 'Друзья' : 'Friends'}</span>
            {acceptedFriendIds.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300">
                {acceptedFriendIds.length}
              </span>
            )}
          </button>

          {inboundRequests.length > 0 && (
            <button
              onClick={() => setActiveTabFilter('pending')}
              className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTabFilter === 'pending'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ru' ? 'Запросы' : 'Requests'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] text-amber-300">
                {inboundRequests.length}
              </span>
            </button>
          )}
        </div>

        {/* Search Field */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ru' ? 'Поиск по имени или роли...' : 'Search by name or role...'}
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#0C121E] text-slate-100 placeholder:text-slate-500 border border-[#1A2337] rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayUsers.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-[#0C121E] border border-[#1A2337] text-xs text-slate-400 space-y-3">
            <Code2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-300">
              {language === 'ru' ? 'Разработчики не найдены' : 'No users found matching query'}
            </p>
            {activeTabFilter === 'devs' && isCurrentUserCreator && (
              <button
                onClick={() => setIsAddDevModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ru' ? 'Добавить в команду' : 'Add to Dev Team'}</span>
              </button>
            )}
          </div>
        ) : (
          displayUsers.map((target) => {
            const isOwn = user?.uid === target.uid;
            const isTargetCreator = isCreatorAccount(target) || (isOwn && isCurrentUserCreator);
            const isTargetCoFounder = isCoFounderAccount(target);
            const isFriend = acceptedFriendIds.includes(target.uid);
            const isFollowing = followedUserIds.includes(target.uid);
            const pendingIn = inboundRequests.find((r) => r.requesterId === target.uid);
            const pendingOut = friendships.find(
              (f) => f.requesterId === user?.uid && f.recipientId === target.uid && f.status === 'pending'
            );
            const isCustomDev = customDevelopers.some((d) => d.uid === target.uid);

            return (
              <div
                key={target.uid}
                className={`p-5 rounded-2xl transition-all space-y-4 flex flex-col justify-between shadow-md relative overflow-hidden ${
                  isTargetCreator
                    ? 'bg-gradient-to-b from-[#11182A] to-[#0A0F1D] border-2 border-amber-500/50 shadow-[0_4px_25px_rgba(245,158,11,0.12)]'
                    : isTargetCoFounder
                    ? 'bg-gradient-to-b from-[#0B1A2E] to-[#08101E] border-2 border-cyan-500/50 shadow-[0_4px_25px_rgba(6,182,212,0.12)]'
                    : 'bg-[#0C121E] border border-[#1A2337] hover:border-slate-700'
                }`}
              >
                {/* Accent Banner for Creator / Co-Founder */}
                {isTargetCreator && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-amber-500/30 to-transparent border-b border-l border-amber-500/40 rounded-bl-xl text-[10px] font-mono font-extrabold text-amber-300 flex items-center gap-1 tracking-wider">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>FOUNDER</span>
                  </div>
                )}
                {isTargetCoFounder && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-cyan-500/30 to-transparent border-b border-l border-cyan-500/40 rounded-bl-xl text-[10px] font-mono font-extrabold text-cyan-300 flex items-center gap-1 tracking-wider">
                    <Gem className="w-3 h-3 text-cyan-400" />
                    <span>CO-FOUNDER</span>
                  </div>
                )}

                {/* Profile Info Header */}
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0 group">
                    <div
                      onClick={() => {
                        if (!isOwn) {
                          setSelectedUserId(target.uid);
                          setActiveTab('profile');
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <img
                        src={getCleanAvatarUrl(target.handle || target.displayName, target.avatarUrl)}
                        alt={target.displayName}
                        className={`w-13 h-13 rounded-2xl object-cover bg-slate-800 transition-all group-hover:scale-105 ${
                          isTargetCreator
                            ? 'border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                            : isTargetCoFounder
                            ? 'border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            : 'border border-slate-700 group-hover:border-indigo-500'
                        }`}
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0C121E] ${
                          target.status === 'online'
                            ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                            : target.status === 'busy'
                            ? 'bg-rose-500'
                            : 'bg-amber-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-12">
                    <div
                      onClick={() => {
                        if (!isOwn) {
                          setSelectedUserId(target.uid);
                          setActiveTab('profile');
                        }
                      }}
                      className="cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors truncate">
                          {target.displayName}
                        </h3>
                        <VerifiedCheck user={target} />
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-xs text-emerald-400/90 font-mono">@{target.handle}</span>
                        {isTargetCreator && <CreatorBadge user={target} size="sm" showLabel />}
                        {isTargetCoFounder && <CoFounderBadge user={target} size="sm" showLabel />}
                      </div>
                    </div>

                    {/* Custom Role Title */}
                    {target.customRole && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                        <Award className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{target.customRole}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                      {target.bio || (language === 'ru' ? 'Разработчик Litenote' : 'Litenote Developer')}
                    </p>
                  </div>
                </div>

                {/* Footer Controls & Actions */}
                <div className="pt-3 border-t border-[#1A2337]/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* If own account */}
                    {isOwn ? (
                      <span className="px-3 py-1 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-950/40 border border-indigo-500/30">
                        {language === 'ru' ? 'Ваш профиль' : 'Your Profile'}
                      </span>
                    ) : (
                      <>
                        {/* Friend Request Action Button */}
                        {isFriend ? (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{language === 'ru' ? 'Друзья' : 'Friends'}</span>
                          </span>
                        ) : pendingIn ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onAcceptFriendRequest(pendingIn.id)}
                              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{language === 'ru' ? 'Принять' : 'Accept'}</span>
                            </button>
                            <button
                              onClick={() => onDeclineFriendRequest(pendingIn.id)}
                              className="p-1 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : pendingOut ? (
                          <span className="px-2.5 py-1 rounded-xl text-xs text-slate-400 bg-slate-800/60 border border-slate-700">
                            {language === 'ru' ? 'Заявка отправлена' : 'Request Sent'}
                          </span>
                        ) : (
                          <button
                            onClick={() => onSendFriendRequest(target.uid)}
                            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{language === 'ru' ? 'В друзья' : 'Add Friend'}</span>
                          </button>
                        )}

                        {/* Follow Toggle */}
                        <button
                          onClick={() => onToggleFollow(target.uid)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors border cursor-pointer ${
                            isFollowing
                              ? 'border-indigo-500/40 text-indigo-300 bg-indigo-950/30'
                              : 'border-[#1A2337] text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {isFollowing
                            ? (language === 'ru' ? 'Подписан ✓' : 'Following')
                            : (language === 'ru' ? 'Подписаться' : 'Follow')}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Right side: Chat button & Delete from team if custom dev */}
                  <div className="flex items-center gap-1.5">
                    {/* Remove from Dev Team button for creator */}
                    {isCurrentUserCreator && isCustomDev && (
                      <button
                        onClick={() => handleRemoveDeveloper(target.uid)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-[#1A2337] transition-colors cursor-pointer"
                        title={language === 'ru' ? 'Исключить из разработчиков' : 'Remove from Dev Team'}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}

                    {/* Chat button */}
                    {!isOwn && (
                      <button
                        onClick={() => onStartDirectChat(target)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title={language === 'ru' ? 'Написать сообщение' : 'Direct Message'}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{language === 'ru' ? 'Чат' : 'Message'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Developer Modal (Creator only) */}
      {isAddDevModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0C121E] border border-slate-700/90 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {language === 'ru' ? 'Добавить в команду разработчиков' : 'Add to Developer Team'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddDevModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {language === 'ru' ? 'Выберите пользователя' : 'Select User'}
                </label>
                <select
                  value={selectedUserToAdd}
                  onChange={(e) => setSelectedUserToAdd(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080C16] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">
                    {language === 'ru' ? '-- Выберите из сообщества --' : '-- Choose from community --'}
                  </option>
                  {mergedUsers
                    .filter(
                      (u) =>
                        u.uid !== user?.uid &&
                        !isCreatorAccount(u) &&
                        !isCoFounderAccount(u) &&
                        !customDevelopers.some((d) => d.uid === u.uid)
                    )
                    .map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.displayName} (@{u.handle})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {language === 'ru' ? 'Должность / Специализация' : 'Role Title / Specialization'}
                </label>
                <input
                  type="text"
                  value={customRoleTitle}
                  onChange={(e) => setCustomRoleTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Architect, Security Engineer"
                  className="w-full px-3 py-2 bg-[#080C16] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  <span>{language === 'ru' ? 'Секретный код доступа' : 'Access Code (Password)'}</span>
                </label>
                <input
                  type="password"
                  value={devAccessCode}
                  onChange={(e) => {
                    setDevAccessCode(e.target.value);
                    setCodeError(null);
                  }}
                  placeholder={language === 'ru' ? 'Введите код доступа...' : 'Enter access code...'}
                  className="w-full px-3 py-2 bg-[#080C16] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                {codeError && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                    <span>⚠️</span> {codeError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddDevModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                {language === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
              <button
                onClick={handleAddDeveloper}
                disabled={!selectedUserToAdd}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                {language === 'ru' ? 'Назначить разработчиком' : 'Assign Developer Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
