import React, { useState } from 'react';
import { Device } from '../ui/Device';
import { LiteNoteLogo } from '../Common/LiteNoteLogo';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Terminal,
  Play,
  Volume2,
  Sparkles,
  Send,
  Radio,
  Bell,
  Search,
  CheckCircle2,
  Code2,
  Plus,
  Home,
  MessageCircle,
  Cpu,
  User,
  Check,
  Languages,
  Pin
} from 'lucide-react';

interface DeviceAppShowcaseProps {
  language?: 'ru' | 'en';
}

export const DeviceAppShowcase: React.FC<DeviceAppShowcaseProps> = ({ language = 'ru' }) => {
  // Post interactive state
  const [likes, setLikes] = useState(24);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Translation preview state inside phone
  const [isShowingRussian, setIsShowingRussian] = useState(language === 'ru');

  // REPL mini-runner state
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [replOutput, setReplOutput] = useState<string | null>(null);

  // Bottom active tab
  const [activeTab, setActiveTab] = useState<'feed' | 'repl' | 'chat'>('feed');

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      setLikes((prev) => prev - 1);
      setIsLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleRunCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCodeRunning(true);
    setReplOutput(null);
    setTimeout(() => {
      setReplOutput('✔ Connected to LiteNote Hub: Developer\n✔ Realtime Firebase Listeners: Active\n✔ REPL Sandbox Execution: 0 errors');
      setIsCodeRunning(false);
    }, 350);
  };

  const stories = [
    {
      name: language === 'ru' ? 'Вы' : 'You',
      img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      isUser: true
    },
    {
      name: 'Mirkamol',
      img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Mirkamol',
      role: 'FOUNDER',
      hasStory: true
    },
    {
      name: 'Patrick',
      img: 'https://api.dicebear.com/7.x/bottts/svg?seed=PatrickJane',
      role: 'CO-FOUNDER',
      hasStory: true
    },
    {
      name: 'Core Dev',
      img: 'https://api.dicebear.com/7.x/bottts/svg?seed=CoreDev',
      hasStory: true
    },
    {
      name: 'DevHub',
      img: 'https://api.dicebear.com/7.x/bottts/svg?seed=LiteNoteBot',
      hasStory: true
    },
  ];

  const postTextEn = `Three days — and Litenote is already evolving.

We launched just three days ago, and since then we've been working non-stop: fixing bugs, optimizing performance, and rolling out features that make this platform feel like home for coders, builders, and creators.

What's already live:
• Friend requests & subscriptions
• Real-time messaging, voice & video calls
• File sharing (any format)
• Posts, polls, reactions & comments`;

  const postTextRu = `Три дня — и Litenote уже развивается.

Мы запустили платформу всего три дня назад и с тех пор работаем без перерыва: исправляем ошибки, оптимизируем производительность и внедряем функции, чтобы сделать платформу идеальным домом для разработчиков и авторов.

Что уже доступно:
• Запросы в друзья и подписки
• Мгновенный мессенджер, аудио и видеозвонки
• Обмен файлами любых форматов
• Посты, опросы, реакции и комментарии`;

  return (
    <div className="flex flex-col items-center w-full relative">
      {/* Dynamic Copied Toast */}
      {copiedToast && (
        <div className="absolute top-2 z-50 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-bold font-mono shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3 h-3" />
          <span>{language === 'ru' ? 'Ссылка скопирована!' : 'Link copied!'}</span>
        </div>
      )}

      {/* React Bits 3D Device displaying the full REAL LiteNote Website */}
      <Device
        type="phone"
        theme="cyber"
        autoAnimate={true}
        enableRotate={true}
        rotateStrength={8}
        enableParallax={true}
        scale={0.96}
        className="w-full flex justify-center"
        screenClassName="bg-[#050913] text-slate-100 flex flex-col justify-between select-none"
      >
        {/* ================= 1. REAL WEBSITE APP BAR ================= */}
        <div className="shrink-0 bg-[#070D1A]/95 border-b border-slate-800/80 px-3 py-2 flex items-center justify-between backdrop-blur-md z-10">
          <div className="flex items-center gap-1.5">
            <LiteNoteLogo size={20} showText={false} />
            <span className="font-extrabold text-xs tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              LiteNote
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
            <div className="relative">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            </div>
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
              alt="Me"
              className="w-5 h-5 rounded-full ring-1 ring-emerald-500/60 object-cover"
            />
          </div>
        </div>

        {/* ================= 2. SCROLLABLE WEBSITE CONTENT ================= */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2.5 text-left custom-scrollbar">
          
          {/* A. Stories / Team Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {stories.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center shrink-0 space-y-1">
                <div
                  className={`relative p-[1.5px] rounded-full ${
                    s.isUser
                      ? 'border border-dashed border-emerald-500/50'
                      : s.role === 'FOUNDER'
                      ? 'border-2 border-amber-400 shadow-sm'
                      : s.role === 'CO-FOUNDER'
                      ? 'border-2 border-cyan-400 shadow-sm'
                      : 'border border-emerald-500/60'
                  }`}
                >
                  <img
                    src={s.img}
                    alt={s.name}
                    className="w-8 h-8 rounded-full object-cover bg-slate-800"
                  />
                  {s.isUser && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full flex items-center justify-center border border-[#050913]">
                      <Plus className="w-2 h-2 text-slate-950 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 truncate max-w-[42px]">{s.name}</span>
              </div>
            ))}
          </div>

          {/* B. Real Interactive Main Feed Post from Patrick Jane (@detective) */}
          <div className="p-2.5 rounded-2xl bg-[#09111F] border border-[#16273E] space-y-2 shadow-md">
            {/* Post Banner */}
            <div className="flex items-center justify-between text-[8px] font-mono text-cyan-400 font-semibold border-b border-slate-800/80 pb-1">
              <span className="flex items-center gap-1">
                <Pin className="w-2.5 h-2.5 text-indigo-400 fill-indigo-400" />
                <span className="text-slate-300">{language === 'ru' ? 'Закреплено' : 'Pinned'}</span>
              </span>
              <span className="text-cyan-400">💎 ПОСТ ОТ СООСНОВАТЕЛЯ LITENOTE</span>
            </div>

            {/* Post Author */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=PatrickJane"
                  alt="Patrick Jane"
                  className="w-7 h-7 rounded-xl object-cover ring-2 ring-cyan-400/80 bg-slate-800"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-white">Patrick Jane</span>
                    <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400/20" />
                  </div>
                  <div className="flex items-center gap-1 text-[8.5px]">
                    <span className="text-emerald-400 font-mono">@detective</span>
                    <span className="text-cyan-400 font-mono px-1 py-[1px] rounded bg-cyan-950/60 text-[7.5px] font-bold">CO-FOUNDER</span>
                  </div>
                </div>
              </div>
              <span className="text-[8.5px] text-slate-500">3 д назад</span>
            </div>

            {/* Post Text with Live Translation toggle */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                {isShowingRussian ? postTextRu : postTextEn}
              </p>

              {/* Translation Toggle Button */}
              <button
                type="button"
                onClick={() => setIsShowingRussian(!isShowingRussian)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0B1525] border border-cyan-500/30 text-[8.5px] font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer"
              >
                <Languages className="w-2.5 h-2.5" />
                <span>{isShowingRussian ? 'Показать оригинал (EN)' : 'Перевести на русский'}</span>
              </button>
            </div>

            {/* Real Code Snippet Box */}
            <div className="rounded-xl bg-[#040810] border border-slate-800 p-2 font-mono text-[9px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 border-b border-slate-800/80 pb-1 text-[8.5px]">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Terminal className="w-2.5 h-2.5" />
                  <span>pipeline.ts</span>
                </span>
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={isCodeRunning}
                  className="px-1.5 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[8px] font-bold font-mono flex items-center gap-0.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-2 h-2 fill-current" />
                  <span>{isCodeRunning ? '...' : 'Run'}</span>
                </button>
              </div>

              <div className="text-emerald-300 leading-tight">
                <p className="text-slate-500">// LiteNote Real-Time Pipeline</p>
                <p>
                  <span className="text-cyan-400">import</span> &#123; db, auth &#125; <span className="text-cyan-400">from</span> <span className="text-amber-200">'@/firebase'</span>;
                </p>
                <p className="text-emerald-400">
                  console.<span className="text-amber-300">log</span>(<span className="text-amber-200">"Connected to LiteNote Hub"</span>);
                </p>
              </div>

              {replOutput && (
                <div className="mt-1 p-1 rounded bg-[#02050A] border border-emerald-500/30 text-[8px] text-emerald-400 font-mono animate-in fade-in whitespace-pre-line">
                  {replOutput}
                </div>
              )}
            </div>

            {/* Post Action Buttons */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex items-center gap-1 transition-colors cursor-pointer ${
                  isLiked ? 'text-rose-400 font-bold' : 'hover:text-white'
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
                <span>{likes}</span>
              </button>

              <div className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                <MessageSquare className="w-3 h-3 text-slate-400" />
                <span>6</span>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`transition-colors cursor-pointer ${
                  isBookmarked ? 'text-amber-400' : 'hover:text-white'
                }`}
              >
                <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-current text-amber-400' : ''}`} />
              </button>
            </div>

            {/* Real Comment Thread Preview */}
            <div className="p-1.5 rounded-lg bg-[#050A14] border border-slate-800/60 flex items-start gap-1.5 text-[9px]">
              <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=Mirkamol"
                alt="Mirkamol"
                className="w-4 h-4 rounded-full object-cover shrink-0 mt-0.5 border border-amber-400"
              />
              <p className="text-slate-300 leading-tight">
                <span className="font-bold text-amber-300">@creator: </span>
                {language === 'ru' ? 'Отличный старт! Продолжаем развивать платформу 🚀' : 'Great milestone! Building the future of dev social 🚀'}
              </p>
            </div>
          </div>
        </div>

        {/* ================= 3. MOBILE BOTTOM NAVIGATION BAR ================= */}
        <div className="shrink-0 bg-[#070D1A]/95 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-slate-400 backdrop-blur-md z-10">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'feed' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="text-[8px]">{language === 'ru' ? 'Лента' : 'Feed'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('repl')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'repl' ? 'text-cyan-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="text-[8px]">REPL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`relative flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
              activeTab === 'chat' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-[8px]">{language === 'ru' ? 'Чат' : 'Chat'}</span>
            <span className="absolute -top-1 right-0 px-1 py-[0.5px] rounded-full bg-emerald-500 text-slate-950 text-[7px] font-bold">
              3
            </span>
          </button>

          <div className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-purple-400 transition-colors">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[8px]">AI</span>
          </div>

          <div className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-slate-200 transition-colors">
            <User className="w-3.5 h-3.5" />
            <span className="text-[8px]">{language === 'ru' ? 'Профиль' : 'Profile'}</span>
          </div>
        </div>
      </Device>
    </div>
  );
};

export default DeviceAppShowcase;
