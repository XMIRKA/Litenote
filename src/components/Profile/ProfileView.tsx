import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { UserProfile, Post, Comment, Friendship, Follow } from '../../types';
import { PostCard } from '../Feed/PostCard';
import { EditProfileModal } from './EditProfileModal';
import { CreatorBadge, VerifiedCheck } from '../Common/CreatorBadge';
import { isCreatorAccount } from '../../lib/creator';
import { getCleanAvatarUrl, AVATAR_FRAMES } from '../../lib/avatar';
import {
  User,
  Shield,
  MapPin,
  Globe,
  Github,
  Calendar,
  Edit3,
  UserPlus,
  UserCheck,
  MessageSquare,
  LayoutGrid,
  List,
  Check,
  Image as ImageIcon,
  Crown,
  Sparkles,
  Send,
  Code,
  Zap,
  Activity,
  Layers,
  Palette,
  Camera,
  Settings
} from 'lucide-react';

interface ProfileViewProps {
  targetUser: UserProfile;
  userPosts: Post[];
  comments: Record<string, Comment[]>;
  bookmarkedPostIds: string[];
  friendship?: Friendship;
  isFollowing: boolean;
  onSendFriendRequest: (recipientId: string) => void;
  onAcceptFriendRequest: (friendshipId: string) => void;
  onToggleFollow: (targetUserId: string) => void;
  onStartDirectChat: (targetUser: UserProfile) => void;
  onToggleReaction: (postId: string, emoji: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, content: string, parentId?: string) => void;
  onVotePoll?: (postId: string, optionIndex: number) => void;
  onDeletePost?: (postId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  targetUser,
  userPosts,
  comments,
  bookmarkedPostIds,
  friendship,
  isFollowing,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onToggleFollow,
  onStartDirectChat,
  onToggleReaction,
  onToggleBookmark,
  onAddComment,
  onVotePoll,
  onDeletePost,
}) => {
  const { user, accentColor, language, setActiveTab: setGlobalActiveTab } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[targetUser.accentColor || accentColor] || THEME_CONFIGS.emerald;

  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'about'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwnProfile = user?.uid === targetUser.uid;
  const effectiveUser = isOwnProfile && user ? { ...targetUser, ...user } : targetUser;
  const isTargetCreator = isCreatorAccount(effectiveUser);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isFriend = friendship?.status === 'accepted';
  const isPendingOutbound = friendship?.status === 'pending' && friendship.requesterId === user?.uid;
  const isPendingInbound = friendship?.status === 'pending' && friendship.recipientId === user?.uid;

  const mediaPosts = userPosts.filter((p) => Boolean(p.mediaUrl));

  const userFrame = AVATAR_FRAMES.find(
    (f) => f.id === effectiveUser.customization?.avatarFrame
  ) || (isTargetCreator ? AVATAR_FRAMES[5] : AVATAR_FRAMES[0]);

  const techStack = effectiveUser.customization?.techStack || [];
  const socialLinks = effectiveUser.customization?.socialLinks || {};

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-3 sm:p-6 space-y-6">
      {/* Banner & Identity Header */}
      <div
        className={`rounded-3xl overflow-hidden bg-[#0A101C] border relative shadow-xl ${
          isTargetCreator ? 'border-amber-500/40' : 'border-[#172338]'
        }`}
      >
        {/* Cover Banner */}
        <div className="h-44 sm:h-60 w-full relative bg-slate-900 overflow-hidden group/banner">
          <img
            src={
              effectiveUser.bannerUrl ||
              (isTargetCreator
                ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop'
                : 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop')
            }
            alt="Profile Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A101C] via-[#0A101C]/30 to-transparent" />
          
          {/* Own Profile Quick Banner Change */}
          {isOwnProfile && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 backdrop-blur-md opacity-0 group-hover/banner:opacity-100 transition-all cursor-pointer shadow-lg"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'ru' ? 'Изменить баннер' : 'Edit Banner'}</span>
            </button>
          )}

          {/* Creator Watermark banner */}
          {isTargetCreator && (
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/50 flex items-center gap-1.5 text-amber-300 text-xs font-bold shadow-lg">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{language === 'ru' ? 'Основатель Litenote' : 'Litenote Creator'}</span>
            </div>
          )}
        </div>

        {/* Profile Card Body */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative">
          {/* Avatar Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="relative shrink-0 group/avatar">
              <img
                src={getCleanAvatarUrl(effectiveUser.handle || effectiveUser.displayName, effectiveUser.avatarUrl)}
                alt={effectiveUser.displayName}
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-2xl bg-slate-900 ${userFrame.className}`}
              />

              {isOwnProfile && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute inset-0 rounded-2xl bg-black/65 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition-all cursor-pointer gap-1"
                  title={language === 'ru' ? 'Сменить фото или аватар' : 'Change Avatar'}
                >
                  <Camera className="w-6 h-6 text-emerald-400" />
                  <span className="text-[11px] font-bold">{language === 'ru' ? 'Сменить лого' : 'Change Logo'}</span>
                </button>
              )}

              <span
                className={`absolute bottom-1 right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border-2 border-[#0A101C] ${
                  effectiveUser.status === 'online'
                    ? 'bg-emerald-400 ring-2 ring-emerald-500/20'
                    : effectiveUser.status === 'busy'
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
                title={`Status: ${effectiveUser.status}`}
              />
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'ru' ? 'Настроить профиль' : 'Customize Profile'}</span>
                  </button>

                  <button
                    onClick={() => setGlobalActiveTab('settings')}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#0E1526] hover:bg-[#142036] text-slate-200 hover:text-white border border-[#1E293B] hover:border-emerald-500/40 flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'ru' ? 'Настройки' : 'Settings'}</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Friend Request Button */}
                  {isFriend ? (
                    <span className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" />
                      <span>{language === 'ru' ? 'В друзьях' : 'Friends'}</span>
                    </span>
                  ) : isPendingInbound ? (
                    <button
                      onClick={() => friendship && onAcceptFriendRequest(friendship.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>{language === 'ru' ? 'Принять заявку' : 'Accept Request'}</span>
                    </button>
                  ) : isPendingOutbound ? (
                    <span className="px-3 py-2 rounded-xl text-xs text-slate-400 bg-[#121A2A] border border-[#1C283F]">
                      {language === 'ru' ? 'Заявка отправлена' : 'Pending'}
                    </span>
                  ) : (
                    <button
                      onClick={() => onSendFriendRequest(effectiveUser.uid)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{language === 'ru' ? 'Добавить в друзья' : 'Add Friend'}</span>
                    </button>
                  )}

                  {/* Follow Button */}
                  <button
                    onClick={() => onToggleFollow(effectiveUser.uid)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                      isFollowing
                        ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30'
                        : 'border-[#1E293B] text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {isFollowing
                      ? (language === 'ru' ? 'Подписан ✓' : 'Following')
                      : (language === 'ru' ? 'Подписаться' : 'Follow')}
                  </button>

                  {/* Message Button */}
                  <button
                    onClick={() => onStartDirectChat(effectiveUser)}
                    className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                    title={language === 'ru' ? 'Написать сообщение' : 'Message'}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Bio & Meta Details */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {effectiveUser.displayName}
                </h1>
                <VerifiedCheck user={effectiveUser} />
                <CreatorBadge user={effectiveUser} size="md" showLabel />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-mono text-emerald-400 font-medium">@{effectiveUser.handle}</p>
                {effectiveUser.customStatus && (
                  <span className="text-xs text-slate-300 font-mono bg-[#111A2C] px-2.5 py-0.5 rounded-lg border border-[#1A2842] flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>{effectiveUser.customStatus}</span>
                  </span>
                )}
              </div>
            </div>

            {effectiveUser.bio && (
              <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
                {effectiveUser.bio}
              </p>
            )}

            {/* Badges List */}
            {effectiveUser.badges && effectiveUser.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {effectiveUser.badges.map((b) => (
                  <span
                    key={b}
                    className="px-2.5 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1 shadow-sm uppercase tracking-wider"
                  >
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>{b.replace(/_/g, ' ')}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Tech Stack Chips */}
            {techStack.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Стек:</span>
                </span>
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-0.5 rounded-lg bg-[#111A2B] border border-[#1C2C47] text-xs font-semibold text-slate-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Profile Meta Links & Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-[#172338]">
              {effectiveUser.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{effectiveUser.location}</span>
                </div>
              )}

              {(effectiveUser.website || socialLinks.website) && (
                <a
                  href={
                    (effectiveUser.website || socialLinks.website)!.startsWith('http')
                      ? (effectiveUser.website || socialLinks.website)!
                      : `https://${effectiveUser.website || socialLinks.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{(effectiveUser.website || socialLinks.website)!.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              {(effectiveUser.github || socialLinks.github) && (
                <a
                  href={`https://github.com/${(effectiveUser.github || socialLinks.github)!.replace(/^https?:\/\/github\.com\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-300 hover:text-white"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>github.com/{(effectiveUser.github || socialLinks.github)!.replace(/^https?:\/\/github\.com\//, '')}</span>
                </a>
              )}

              {socialLinks.telegram && (
                <a
                  href={`https://t.me/${socialLinks.telegram.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>t.me/{socialLinks.telegram.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '')}</span>
                </a>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {language === 'ru' ? 'Регистрация:' : 'Joined'} {formatDate(targetUser.createdAt || Date.now())}
                </span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-6 pt-3 border-t border-[#172338] text-xs">
              <div>
                <span className="font-bold text-white text-sm">
                  {userPosts.length}
                </span>
                <span className="text-slate-400 ml-1.5">
                  {language === 'ru' ? 'публикаций' : 'posts'}
                </span>
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  {targetUser.stats?.friendsCount || 0}
                </span>
                <span className="text-slate-400 ml-1.5">
                  {language === 'ru' ? 'друзей' : 'friends'}
                </span>
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  {targetUser.stats?.followersCount || 0}
                </span>
                <span className="text-slate-400 ml-1.5">
                  {language === 'ru' ? 'подписчиков' : 'followers'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content Tabs */}
      <div className="flex items-center justify-between border-b border-[#172338] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#0E1524]'
            }`}
          >
            {language === 'ru' ? 'Все публикации' : 'Posts'} ({userPosts.length})
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'media'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#0E1524]'
            }`}
          >
            {language === 'ru' ? 'Фото и медиа' : 'Media'} ({mediaPosts.length})
          </button>
        </div>
      </div>

      {/* Posts or Media List */}
      <div className="space-y-4">
        {activeTab === 'posts' ? (
          userPosts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0A101C] border border-[#172338] text-slate-400 text-xs">
              {language === 'ru' ? 'Пользователь еще не опубликовал ни одной записи' : 'No posts published yet'}
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                comments={comments[post.id] || []}
                isBookmarked={bookmarkedPostIds.includes(post.id)}
                onToggleReaction={onToggleReaction}
                onToggleBookmark={onToggleBookmark}
                onAddComment={onAddComment}
                onVotePoll={onVotePoll}
                onDeletePost={onDeletePost}
              />
            ))
          )
        ) : (
          mediaPosts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0A101C] border border-[#172338] text-slate-400 text-xs">
              {language === 'ru' ? 'Медиафайлы отсутствуют' : 'No media files uploaded'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mediaPosts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl overflow-hidden border border-[#172338] aspect-square bg-slate-900 group relative cursor-pointer"
                >
                  <img
                    src={p.mediaUrl}
                    alt={p.content}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
};
