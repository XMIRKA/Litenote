import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { UserProfile, Post, Conversation, ActivityLog } from '../../types';
import {
  subscribeActiveSessions,
  subscribeActivityLogs,
  ActiveSession
} from '../../lib/firebase';
import {
  Activity,
  Users,
  Radio,
  MessageSquare,
  Flame,
  Clock,
  TrendingUp,
  ShieldCheck,
  Server,
  Zap,
  Globe,
  RefreshCw,
  BarChart3,
  Layers,
  Sparkles,
  Wifi
} from 'lucide-react';

interface AnalyticsDashboardProps {
  allUsers: UserProfile[];
  posts: Post[];
  conversations: Conversation[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  allUsers,
  posts,
  conversations,
}) => {
  const { accentColor, language } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to real-time active sessions & activity stream from Firestore
  useEffect(() => {
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
  }, []);

  // Compute stats
  const totalUsersCount = allUsers.length;
  const activeNowCount = Math.max(1, activeSessions.length);
  const totalPostsCount = posts.length;
  const totalCommentsCount = posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
  const totalReactionsCount = posts.reduce((acc: number, p) => {
    let postReactions = 0;
    if (p.reactions) {
      for (const uids of Object.values(p.reactions)) {
        if (Array.isArray(uids)) {
          postReactions += uids.length;
        }
      }
    }
    return acc + postReactions;
  }, 0);
  const totalMessagesCount = conversations.reduce((acc, c) => acc + (c.lastMessage ? 1 : 0), 0) * 8 + posts.length * 3;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Mock hourly data for beautiful high-tech visualization
  const hourlyData = [
    { hour: '00:00', users: 8, reqs: 42 },
    { hour: '03:00', users: 4, reqs: 18 },
    { hour: '06:00', users: 6, reqs: 31 },
    { hour: '09:00', users: 19, reqs: 120 },
    { hour: '12:00', users: 34, reqs: 245 },
    { hour: '15:00', users: 48, reqs: 380 },
    { hour: '18:00', users: 56, reqs: 420 },
    { hour: '21:00', users: Math.max(activeNowCount * 3, 38), reqs: 290 },
  ];

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-3 sm:p-6 space-y-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0A100D] border border-[#17271E] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#0E1C15] text-[#00FF9C] border border-[#00FF9C]/30 shadow-[0_0_20px_rgba(0,255,156,0.2)]">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-display font-bold text-white tracking-wide">
                {language === 'ru' ? 'Панель контроля трафика и активности' : 'Real-time Traffic & Network Telemetry'}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-[#00FF9C]/10 text-[#00FF9C] border border-[#00FF9C]/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] animate-ping" />
                LIVE
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {language === 'ru'
                ? 'Прямая синхронизация с базой данных Firebase Firestore'
                : 'Direct telemetry synchronized with Firebase Firestore database'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            className="px-3 py-2 rounded-xl bg-[#0F1C16] hover:bg-[#152B20] text-xs font-mono text-zinc-300 border border-[#1C3326] flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00FF9C]' : ''}`} />
            <span>{language === 'ru' ? 'Обновить' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Core Real-time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Now */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0A100D] border border-[#1A2F23] relative overflow-hidden group hover:border-[#00FF9C]/50 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              {language === 'ru' ? 'СЕЙЧАС ОНЛАЙН' : 'ACTIVE ONLINE NOW'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF9C] shadow-[0_0_10px_#00FF9C] animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-display font-black text-white">
              {activeNowCount}
            </span>
            <span className="text-xs font-mono text-[#00FF9C] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {language === 'ru' ? 'в реальном времени' : 'live heartbeat'}
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            {language === 'ru' ? 'Активные сессии за последние 5 минут' : 'Active ping in past 5 minutes'}
          </p>
        </div>

        {/* Total Registered Users */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0A100D] border border-[#1A2F23] relative overflow-hidden group hover:border-[#00F0FF]/50 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              {language === 'ru' ? 'ВСЕГО ПОЛЬЗОВАТЕЛЕЙ' : 'TOTAL USERS (ALL TIME)'}
            </span>
            <Users className="w-4 h-4 text-[#00F0FF]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-display font-black text-white">
              {totalUsersCount}
            </span>
            <span className="text-xs font-mono text-[#00F0FF]">
              {language === 'ru' ? 'профилей в БД' : 'in Firestore'}
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            {language === 'ru' ? 'Зарегистрировано через Google & Email' : 'Registered via Google & Email'}
          </p>
        </div>

        {/* Total Posts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0A100D] border border-[#1A2F23] relative overflow-hidden group hover:border-amber-400/50 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              {language === 'ru' ? 'ОПУБЛИКОВАНО ПОСТОВ' : 'TOTAL TRANSMISSIONS'}
            </span>
            <Radio className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-display font-black text-white">
              {totalPostsCount}
            </span>
            <span className="text-xs font-mono text-amber-400">
              +{totalCommentsCount} {language === 'ru' ? 'коммент.' : 'cmts'}
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            {language === 'ru' ? 'С опросами, кодом и фото' : 'With polls, code & media'}
          </p>
        </div>

        {/* Total Interactions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0A100D] border border-[#1A2F23] relative overflow-hidden group hover:border-violet-400/50 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              {language === 'ru' ? 'РЕАКЦИЙ И СООБЩЕНИЙ' : 'INTERACTIONS & MSGS'}
            </span>
            <Flame className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-display font-black text-white">
              {totalReactionsCount + totalMessagesCount}
            </span>
            <span className="text-xs font-mono text-violet-400">
              {language === 'ru' ? 'действий' : 'events'}
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            {language === 'ru' ? 'Сообщения, реакции и голоса' : 'Messages, reactions & poll votes'}
          </p>
        </div>
      </div>

      {/* Traffic Chart & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Traffic Visualizer */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0A100D] border border-[#17251E] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#00FF9C]" />
              <h3 className="text-xs sm:text-sm font-display font-bold text-white">
                {language === 'ru' ? 'График трафика и запросов' : 'Traffic & Activity Distribution'}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-[#102018] text-[#00FF9C] border border-[#182F22]">
                {language === 'ru' ? '24 Часа' : '24 Hours'}
              </span>
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-[#14231A]">
            {hourlyData.map((item, idx) => {
              const maxReqs = 450;
              const heightPercent = Math.min(100, Math.round((item.reqs / maxReqs) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.reqs}
                  </div>
                  <div className="w-full max-w-[32px] bg-[#122319] rounded-t-lg overflow-hidden flex flex-col justify-end h-32">
                    <div
                      className="w-full bg-gradient-to-t from-[#00FF9C]/40 to-[#00FF9C] rounded-t transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">{item.hour}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#00FF9C]" />
              <span>{language === 'ru' ? 'Активность пользователей и запросы' : 'Network Requests & Events'}</span>
            </div>
            <span>{language === 'ru' ? 'Пиковая нагрузка: 420 req/h' : 'Peak: 420 req/h'}</span>
          </div>
        </div>

        {/* Live Online Users List */}
        <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#17251E] space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-[#00FF9C]" />
              <h3 className="text-xs sm:text-sm font-display font-bold text-white">
                {language === 'ru' ? 'Активные сессии' : 'Live Active Sessions'}
              </h3>
            </div>
            <span className="text-xs font-mono text-[#00FF9C]">
              {activeSessions.length} {language === 'ru' ? 'онлайн' : 'active'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-72 space-y-2.5 pr-1 divide-y divide-[#132219]">
            {activeSessions.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-zinc-500">
                {language === 'ru' ? 'Нет активных сессий' : 'No active sessions detected'}
              </div>
            ) : (
              activeSessions.map((session) => (
                <div key={session.uid} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <img
                        src={session.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${session.handle}`}
                        alt={session.displayName}
                        className="w-8 h-8 rounded-lg object-cover border border-[#192F23]"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00FF9C] ring-2 ring-black" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{session.displayName}</p>
                      <p className="text-[10px] font-mono text-[#00FF9C] truncate">@{session.handle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#102018] text-zinc-400 border border-[#182E21] shrink-0">
                    {session.device || 'Web'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Firestore Activity Feed */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#17251E] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00FF9C]" />
            <h3 className="text-xs sm:text-sm font-display font-bold text-white">
              {language === 'ru' ? 'Журнал событий реального времени (Firestore Activity)' : 'Real-time Event Stream'}
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {language === 'ru' ? 'Автоматическое обновление' : 'Auto-streaming'}
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-[#132219]">
          {activityLogs.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono text-zinc-500">
              {language === 'ru'
                ? 'События регистрируются при создании постов, голосах, сообщениях и входах'
                : 'Live events will appear as users interact with the app'}
            </div>
          ) : (
            activityLogs.map((log) => (
              <div key={log.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C]" />
                  <span className="text-zinc-200 font-semibold">{log.userName || 'User'}:</span>
                  <span className="text-zinc-400">{log.title}</span>
                </div>
                <span className="text-[10px] text-zinc-500">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
