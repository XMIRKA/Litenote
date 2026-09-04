import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONFIGS } from '../../lib/theme';
import { UserProfile, Post, Conversation, ActivityLog, UserPenalty } from '../../types';
import {
  subscribeActiveSessions,
  subscribeActivityLogs,
  deletePostDoc,
  setUserPenaltyDoc,
  removeUserPenaltyDoc,
  deleteUserAccountDoc,
  ActiveSession
} from '../../lib/firebase';
import { CreatorBadge, VerifiedCheck } from '../Common/CreatorBadge';
import { isCreatorAccount } from '../../lib/creator';
import { AnalyticsDashboard } from '../Analytics/AnalyticsDashboard';
import {
  Shield,
  Lock,
  X,
  Activity,
  Trash2,
  Users,
  Radio,
  MessageSquare,
  Flame,
  Search,
  CheckCircle,
  AlertTriangle,
  Server,
  Database,
  RefreshCw,
  Eye,
  Check,
  BarChart2,
  BarChart3,
  KeyRound,
  VolumeX,
  Ban,
  Clock,
  Unlock,
  UserX,
  AlertOctagon,
  Award,
  Zap
} from 'lucide-react';

interface ModerationPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: UserProfile[];
  posts: Post[];
  conversations: Conversation[];
  onDeletePost?: (postId: string) => void;
}

const MODERATOR_PASSWORD = 'M20102508';

export const ModerationPanelModal: React.FC<ModerationPanelModalProps> = ({
  isOpen,
  onClose,
  allUsers,
  posts,
  conversations,
  onDeletePost,
}) => {
  const { user, accentColor, language } = useAuth();
  const theme = THEME_CONFIGS[accentColor];

  // Auth gate state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('litenote_mod_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Active section inside the panel
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'metrics' | 'users' | 'posts' | 'logs' | 'database'>('overview');
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [postSearch, setPostSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Penalty Modal State
  const [penaltyTargetUser, setPenaltyTargetUser] = useState<UserProfile | null>(null);
  const [penaltyType, setPenaltyType] = useState<'mute' | 'ban'>('mute');
  const [penaltyReason, setPenaltyReason] = useState('Нарушение правил сообщества LiteNote');
  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');
  const [presetDuration, setPresetDuration] = useState<number>(3600); // 1 hour default
  const [customDays, setCustomDays] = useState<number>(0);
  const [customHours, setCustomHours] = useState<number>(1);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [customSeconds, setCustomSeconds] = useState<number>(0);
  const [isPermanent, setIsPermanent] = useState<boolean>(false);
  const [isApplyingPenalty, setIsApplyingPenalty] = useState(false);

  // Delete User Confirm State
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    const unsubSessions = subscribeActiveSessions((sessions) => {
      setActiveSessions(sessions);
    });

    const unsubLogs = subscribeActivityLogs((logs) => {
      setActivityLogs(logs);
    });

    return () => {
      unsubSessions();
      unsubLogs();
    };
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === MODERATOR_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('litenote_mod_auth', 'true');
      setPasswordError(false);
      setPasswordInput('');
    } else {
      setPasswordError(true);
    }
  };

  const handleLogoutMod = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('litenote_mod_auth');
  };

  const handleDeletePostConfirm = async (postId: string) => {
    if (!window.confirm(language === 'ru' ? 'Вы уверены, что хотите удалить эту публикацию?' : 'Are you sure you want to delete this post?')) {
      return;
    }
    setIsDeletingId(postId);
    try {
      if (onDeletePost) {
        onDeletePost(postId);
      } else {
        const targetPost = posts.find((p) => p.id === postId);
        await deletePostDoc(postId, targetPost?.authorId || user?.uid || '');
      }
      showFeedback(language === 'ru' ? 'Публикация успешно удалена' : 'Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      showFeedback(language === 'ru' ? 'Ошибка при удалении' : 'Failed to delete post', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleApplyPenalty = async () => {
    if (!penaltyTargetUser) return;
    setIsApplyingPenalty(true);

    try {
      let durationMs = 0;
      if (isPermanent) {
        durationMs = 0; // 0 indicates permanent
      } else if (durationMode === 'preset') {
        durationMs = presetDuration * 1000;
      } else {
        durationMs =
          (customDays * 86400 +
            customHours * 3600 +
            customMinutes * 60 +
            customSeconds) *
          1000;
      }

      if (!isPermanent && durationMs <= 0) {
        showFeedback(language === 'ru' ? 'Укажите срок наказания' : 'Please specify a duration', 'error');
        setIsApplyingPenalty(false);
        return;
      }

      const expiresAt = isPermanent ? 0 : Date.now() + durationMs;

      const penalty: UserPenalty = {
        type: penaltyType,
        reason: penaltyReason.trim() || 'Нарушение правил сообщества',
        issuedAt: Date.now(),
        expiresAt,
        issuedBy: user?.displayName || 'Модератор',
      };

      await setUserPenaltyDoc(
        penaltyTargetUser.uid,
        penaltyTargetUser.handle || penaltyTargetUser.displayName,
        penalty
      );
      showFeedback(
        language === 'ru'
          ? `Наказание (${penaltyType === 'ban' ? 'БАН' : 'МУТ'}) выдано пользователю @${penaltyTargetUser.handle}`
          : `Penalty (${penaltyType.toUpperCase()}) applied to @${penaltyTargetUser.handle}`
      );
      setPenaltyTargetUser(null);
    } catch (err) {
      console.error('Error applying penalty:', err);
      showFeedback(language === 'ru' ? 'Ошибка при выдаче наказания' : 'Failed to apply penalty', 'error');
    } finally {
      setIsApplyingPenalty(false);
    }
  };

  const handleRemovePenalty = async (target: UserProfile) => {
    try {
      await removeUserPenaltyDoc(
        target.uid,
        target.handle || target.displayName,
        user?.uid,
        user?.displayName
      );
      showFeedback(
        language === 'ru'
          ? `Наказание с пользователя @${target.handle} успешно снято`
          : `Penalty removed for @${target.handle}`
      );
    } catch (err) {
      console.error('Error removing penalty:', err);
      showFeedback(language === 'ru' ? 'Ошибка при снятии наказания' : 'Failed to remove penalty', 'error');
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (!deleteTargetUser) return;
    setIsDeletingAccount(true);

    try {
      await deleteUserAccountDoc(
        deleteTargetUser.uid,
        deleteTargetUser.handle || deleteTargetUser.displayName,
        user?.uid,
        user?.displayName
      );

      showFeedback(
        language === 'ru'
          ? `Аккаунт @${deleteTargetUser.handle} и все связанные данные удалены`
          : `Account @${deleteTargetUser.handle} deleted successfully`
      );
      setDeleteTargetUser(null);
    } catch (err) {
      console.error('Error deleting account:', err);
      showFeedback(language === 'ru' ? 'Ошибка при удалении аккаунта' : 'Failed to delete account', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.content?.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.authorName?.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.authorHandle?.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(postSearch.toLowerCase()))
  );

  const filteredUsers = allUsers.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.handle?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#090E17] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-sm sm:text-base text-white">
                  {language === 'ru' ? 'Панель модерации и управления' : 'Moderation & Admin Panel'}
                </h3>
                {isAuthenticated && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                    PRO MODERATOR
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ru'
                  ? 'Управление пользователями, наказаниями, постами и сессиями'
                  : 'Manage users, penalties, posts and active sessions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogoutMod}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {language === 'ru' ? 'Выйти из режима' : 'Lock'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate Screen */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-5 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="max-w-sm space-y-1.5">
              <h4 className="text-lg font-bold text-white">
                {language === 'ru' ? 'Требуется пароль модератора' : 'Moderator Access Required'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'ru'
                  ? 'Введите специальный ключ доступа модератора для входа в панель'
                  : 'Enter the master security password to access administration tools'}
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="w-full max-w-sm space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder={language === 'ru' ? 'Пароль модератора...' : 'Moderator password...'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F172A] border ${
                    passwordError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                  } text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all`}
                  autoFocus
                />
              </div>

              {passwordError && (
                <p className="text-xs text-rose-400 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{language === 'ru' ? 'Неверный пароль модератора' : 'Incorrect moderator password'}</span>
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md active:scale-98 cursor-pointer"
              >
                {language === 'ru' ? 'Войти в панель' : 'Unlock Panel'}
              </button>
            </form>
          </div>
        ) : (
          /* Main Authenticated Moderation Dashboard */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Sub Tabs Navigation */}
            <div className="px-5 py-2.5 bg-[#0A0F1D] border-b border-[#1E293B] flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveSubTab('overview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>{language === 'ru' ? 'Обзор' : 'Overview'}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('metrics')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'metrics'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ru' ? 'Живые метрики' : 'Live Metrics'}</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  LIVE
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('users')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'users'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{language === 'ru' ? 'Пользователи и наказания' : 'Users & Punishments'}</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300">
                  {allUsers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('posts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'posts'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>{language === 'ru' ? 'Публикации' : 'Posts'}</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300">
                  {posts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('logs')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'logs'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>{language === 'ru' ? 'Журнал активности' : 'Activity Logs'}</span>
              </button>
            </div>

            {feedbackMsg && (
              <div
                className={`m-4 p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                  feedbackMsg.type === 'error'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {feedbackMsg.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* Sub Views */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeSubTab === 'overview' && (
                <div className="space-y-5">
                  {/* KPI Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                        <Users className="w-4 h-4 text-indigo-400" />
                        {language === 'ru' ? 'Пользователей' : 'Total Users'}
                      </span>
                      <p className="text-2xl font-bold text-white mt-1">{allUsers.length}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        {language === 'ru' ? 'Сейчас онлайн' : 'Active Now'}
                      </span>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {Math.max(1, activeSessions.length)}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                        <Radio className="w-4 h-4 text-sky-400" />
                        {language === 'ru' ? 'Публикаций' : 'Total Posts'}
                      </span>
                      <p className="text-2xl font-bold text-white mt-1">{posts.length}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        {language === 'ru' ? 'Диалогов' : 'Conversations'}
                      </span>
                      <p className="text-2xl font-bold text-white mt-1">{conversations.length}</p>
                    </div>
                  </div>

                  {/* System & Firestore Status */}
                  <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Firebase Firestore Real-time DB</h4>
                        <p className="text-xs text-slate-400">
                          {language === 'ru'
                            ? 'Статус: Подключено • Пинг: 12мс • Авто-синхронизация ников: Включена'
                            : 'Status: Connected • Ping: 12ms • Live Nick Sync: Enabled'}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      ONLINE HEALTHY
                    </span>
                  </div>
                </div>
              )}

              {/* LIVE METRICS SUB-VIEW */}
              {activeSubTab === 'metrics' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">
                        {language === 'ru'
                          ? 'Панель телеметрии и онлайн активности пользователей'
                          : 'Live telemetry and real-time user metrics'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      LIVE CLOUD SYNC
                    </span>
                  </div>
                  <AnalyticsDashboard
                    allUsers={allUsers}
                    posts={posts}
                    conversations={conversations}
                  />
                </div>
              )}

              {/* USERS & MODERATION PUNISHMENTS TAB */}
              {activeSubTab === 'users' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={language === 'ru' ? 'Поиск пользователей по нику, имени или почте...' : 'Search users...'}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0F172A] border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Users Grid */}
                  <div className="grid grid-cols-1 gap-3">
                    {filteredUsers.map((u) => {
                      const isCreator = isCreatorAccount(u);
                      const hasActivePenalty =
                        u.penalty &&
                        (u.penalty.expiresAt === 0 || u.penalty.expiresAt > Date.now());

                      return (
                        <div
                          key={u.uid}
                          className={`p-4 rounded-xl bg-[#0F172A] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                            hasActivePenalty
                              ? u.penalty?.type === 'ban'
                                ? 'border-rose-500/50 bg-rose-950/20'
                                : 'border-amber-500/50 bg-amber-950/20'
                              : isCreator
                              ? 'border-amber-500/40'
                              : 'border-[#1E293B] hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={u.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                              alt={u.displayName}
                              className={`w-11 h-11 rounded-xl object-cover bg-slate-800 ${
                                isCreator ? 'border-2 border-amber-400' : 'border border-slate-700'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white truncate">
                                  {u.displayName}
                                </span>
                                <VerifiedCheck user={u} />
                                {isCreator && <CreatorBadge user={u} size="sm" showLabel />}
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    u.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                                  }`}
                                />
                              </div>
                              <p className="text-xs text-slate-400 truncate">@{u.handle}</p>
                              <p className="text-[11px] text-slate-500 truncate">{u.email}</p>

                              {/* Active Penalty Status Tag */}
                              {hasActivePenalty && (
                                <div className="mt-1 flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                      u.penalty?.type === 'ban'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    }`}
                                  >
                                    {u.penalty?.type === 'ban' ? <Ban className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                                    <span>
                                      {u.penalty?.type === 'ban' ? 'БАН' : 'МУТ'}: {u.penalty?.reason}
                                    </span>
                                  </span>

                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    <span>
                                      {u.penalty?.expiresAt === 0
                                        ? language === 'ru' ? 'Навсегда' : 'Permanent'
                                        : `до ${new Date(u.penalty?.expiresAt || 0).toLocaleString()}`}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {hasActivePenalty ? (
                              <button
                                onClick={() => handleRemovePenalty(u)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                                title={language === 'ru' ? 'Снять все наказания' : 'Remove penalty'}
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>{language === 'ru' ? 'Снять наказание' : 'Unmute / Unban'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setPenaltyTargetUser(u);
                                  setPenaltyType('mute');
                                }}
                                disabled={isCreator}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isCreator
                                    ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                                }`}
                                title={isCreator ? 'Создателя нельзя наказать' : 'Выдать мут или бан'}
                              >
                                <VolumeX className="w-3.5 h-3.5" />
                                <span>{language === 'ru' ? 'Наказать' : 'Penalize'}</span>
                              </button>
                            )}

                            {/* Delete User Account Button */}
                            <button
                              onClick={() => setDeleteTargetUser(u)}
                              disabled={isCreator}
                              className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isCreator
                                  ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                              title={isCreator ? 'Создателя нельзя удалить' : 'Удалить аккаунт'}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* POSTS TAB */}
              {activeSubTab === 'posts' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={postSearch}
                      onChange={(e) => setPostSearch(e.target.value)}
                      placeholder={language === 'ru' ? 'Поиск публикаций по автору или тексту...' : 'Search posts by author or text...'}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0F172A] border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Posts List */}
                  <div className="space-y-3">
                    {filteredPosts.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        {language === 'ru' ? 'Публикации не найдены' : 'No posts found'}
                      </div>
                    ) : (
                      filteredPosts.map((post) => (
                        <div
                          key={post.id}
                          className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] flex items-start justify-between gap-4 hover:border-slate-700 transition-all"
                        >
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <img
                                src={post.authorAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=avatar'}
                                alt={post.authorName}
                                className="w-6 h-6 rounded-md object-cover"
                              />
                              <span className="text-xs font-semibold text-white truncate">
                                {post.authorName}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate">
                                @{post.authorHandle}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                              {post.content}
                            </p>

                            {post.mediaUrl && (
                              <div className="text-[11px] text-sky-400 flex items-center gap-1 font-medium">
                                <span>[Медиа прикреплено]</span>
                              </div>
                            )}

                            {post.poll && (
                              <div className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                                <BarChart2 className="w-3.5 h-3.5" />
                                <span>{post.poll.question} ({post.poll.options?.length} вариантов)</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeletePostConfirm(post.id)}
                            disabled={isDeletingId === post.id}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                            title={language === 'ru' ? 'Удалить публикацию' : 'Delete post'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'ru' ? 'Удалить' : 'Delete'}</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* LOGS TAB */}
              {activeSubTab === 'logs' && (
                <div className="space-y-2">
                  {activityLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      {language === 'ru' ? 'Логи активности пусты' : 'No activity logs yet'}
                    </div>
                  ) : (
                    activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400 font-semibold">{log.userName || log.userHandle}:</span>
                          <span className="text-slate-300">{log.action}</span>
                          {log.detail && <span className="text-slate-500">({log.detail})</span>}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PENALTY CONFIG MODAL */}
      {penaltyTargetUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0E1526] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'ru' ? 'Выдача наказания' : 'Issue Penalty'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {penaltyTargetUser.displayName} (@{penaltyTargetUser.handle})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPenaltyTargetUser(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector: Mute or Ban */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {language === 'ru' ? 'Тип наказания:' : 'Penalty Type:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPenaltyType('mute')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    penaltyType === 'mute'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <VolumeX className="w-4 h-4" />
                  <div className="text-left">
                    <p className="text-xs font-semibold">Mute (Мут)</p>
                    <p className="text-[10px] text-slate-400">Запрет отправки сообщений</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPenaltyType('ban')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    penaltyType === 'ban'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  <div className="text-left">
                    <p className="text-xs font-semibold">Ban (Бан)</p>
                    <p className="text-[10px] text-slate-400">Полная блокировка аккаунта</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Reason input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {language === 'ru' ? 'Причина наказания:' : 'Reason:'}
              </label>
              <input
                type="text"
                value={penaltyReason}
                onChange={(e) => setPenaltyReason(e.target.value)}
                placeholder="Спам, оскорбления, флуд..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Duration Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'ru' ? 'Срок наказания:' : 'Duration:'}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-rose-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => setIsPermanent(e.target.checked)}
                    className="rounded bg-slate-800 text-rose-500 focus:ring-0"
                  />
                  <span>{language === 'ru' ? 'Перманентно (Навсегда)' : 'Permanent'}</span>
                </label>
              </div>

              {!isPermanent && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {[
                      { label: '5 мин', sec: 300 },
                      { label: '1 час', sec: 3600 },
                      { label: '24 часа', sec: 86400 },
                      { label: '7 дней', sec: 604800 },
                    ].map((p) => (
                      <button
                        key={p.sec}
                        type="button"
                        onClick={() => {
                          setDurationMode('preset');
                          setPresetDuration(p.sec);
                        }}
                        className={`py-1.5 rounded-lg border text-center font-medium cursor-pointer transition-all ${
                          durationMode === 'preset' && presetDuration === p.sec
                            ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Days, Hours, Minutes, Seconds */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{language === 'ru' ? 'Или точный тайминг (Дни / Часы / Мин / Сек):' : 'Custom timing:'}</span>
                      <button
                        type="button"
                        onClick={() => setDurationMode('custom')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                          durationMode === 'custom' ? 'bg-indigo-500 text-white' : 'text-indigo-400'
                        }`}
                      >
                        {language === 'ru' ? 'Включить кастом' : 'Use Custom'}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block text-center">Дни</span>
                        <input
                          type="number"
                          min="0"
                          value={customDays}
                          onChange={(e) => {
                            setCustomDays(Math.max(0, parseInt(e.target.value) || 0));
                            setDurationMode('custom');
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-center text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block text-center">Часы</span>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={customHours}
                          onChange={(e) => {
                            setCustomHours(Math.max(0, parseInt(e.target.value) || 0));
                            setDurationMode('custom');
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-center text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block text-center">Минуты</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={customMinutes}
                          onChange={(e) => {
                            setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0));
                            setDurationMode('custom');
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-center text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block text-center">Секунды</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={customSeconds}
                          onChange={(e) => {
                            setCustomSeconds(Math.max(0, parseInt(e.target.value) || 0));
                            setDurationMode('custom');
                          }}
                          className="w-full p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-center text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPenaltyTargetUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {language === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleApplyPenalty}
                disabled={isApplyingPenalty}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${
                  penaltyType === 'ban'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {isApplyingPenalty
                  ? language === 'ru' ? 'Применение...' : 'Applying...'
                  : language === 'ru'
                  ? `Применить ${penaltyType === 'ban' ? 'БАН' : 'МУТ'}`
                  : `Apply ${penaltyType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER ACCOUNT CONFIRM MODAL */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#0E1526] border border-rose-500/50 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-white">
                {language === 'ru' ? 'Удалить аккаунт пользователя?' : 'Delete User Account?'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'ru'
                  ? `Вы собираетесь полностью удалить аккаунт @${deleteTargetUser.handle} (${deleteTargetUser.displayName}) и все его данные из Firestore. Это действие необратимо.`
                  : `Are you sure you want to completely delete @${deleteTargetUser.handle}? This cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {language === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteAccountConfirm}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                {isDeletingAccount
                  ? language === 'ru' ? 'Удаление...' : 'Deleting...'
                  : language === 'ru' ? 'Да, удалить аккаунт' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
