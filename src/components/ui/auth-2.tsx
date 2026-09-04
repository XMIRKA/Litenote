import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { LiteNoteLogo } from '../Common/LiteNoteLogo';
import { CyberNetworkBackground } from '../Common/CyberNetworkBackground';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Star,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Terminal,
  Code2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Github
} from 'lucide-react';

interface Auth2Props {
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
  className?: string;
  isModal?: boolean;
}

export const Auth2: React.FC<Auth2Props> = ({
  initialMode = 'signin',
  onSuccess,
  className = '',
  isModal = false,
}) => {
  const {
    language,
    setLanguage,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);

  const platformModules = [
    {
      titleRu: "Облачная синхронизация Firebase",
      titleEn: "Firebase Realtime Cloud Engine",
      descRu: "Мгновенное обновление постов, реакций, личных сообщений и профилей в режиме реального времени на всех устройствах.",
      descEn: "Real-time synchronization for feeds, emoji reactions, peer direct messages, and user state across devices.",
      badge: "Firestore & Auth",
      icon: "Database",
      tech: "Realtime Engine"
    },
    {
      titleRu: "Встроенная песочница REPL",
      titleEn: "Integrated REPL Sandbox",
      descRu: "Запуск, тестирование и отладка фрагментов JavaScript, TypeScript и Python прямо внутри постов и сообщений без внешних IDE.",
      descEn: "Execute, test, and debug JavaScript, TypeScript, and Python snippets directly inside feeds and discussions.",
      badge: "JS / TS / Python",
      icon: "Code",
      tech: "Sandboxed Execution"
    },
    {
      titleRu: "Интеллектуальное ядро Gemini AI",
      titleEn: "Gemini AI Intelligence Core",
      descRu: "Встроенный ассистент для объяснения кода, рефакторинга, генерации решений и многоязычного перевода публикаций.",
      descEn: "Built-in intelligence for code analysis, instant debugging, architecture reviews, and multi-language post translation.",
      badge: "Gemini Neural Core",
      icon: "Sparkles",
      tech: "AI Copilot"
    },
    {
      titleRu: "Мультимедиа и P2P коммуникации",
      titleEn: "Multimedia & WebRTC Calling",
      descRu: "Аудиосообщения с волновой диаграммой, передача файлов любых форматов, групповые хабы и голосовые конференции.",
      descEn: "Waveform voice notes, file exchange for all code & media formats, developer group channels, and voice/video calling.",
      badge: "WebRTC & Audio",
      icon: "MessageSquare",
      tech: "P2P & Voice"
    }
  ];

  const currentModule = platformModules[activeTestimonialIdx % platformModules.length];

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setErrorMsg(err.message || (language === 'ru' ? 'Ошибка входа через Google. Попробуйте еще раз.' : 'Google auth failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubNotice = () => {
    // Trigger Google or prompt email
    setErrorMsg(language === 'ru' ? 'Для входа используйте Google Аккаунт или Email/Пароль.' : 'Please use Google Account or Email/Password to sign in.');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
        if (!cleanHandle) {
          setErrorMsg(language === 'ru' ? 'Укажите никнейм (@handle)' : 'Username (@handle) is required');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg(language === 'ru' ? 'Пароль должен содержать от 6 символов' : 'Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName || cleanHandle, cleanHandle);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || (language === 'ru' ? 'Неверные учетные данные' : 'Invalid credentials');
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = language === 'ru' ? 'Неверный email или пароль' : 'Invalid email or password';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = language === 'ru' ? 'Этот email уже зарегистрирован' : 'This email is already registered';
      } else if (err.code === 'auth/weak-password') {
        msg = language === 'ru' ? 'Слишком простой пароль (минимум 6 символов)' : 'Password too weak (min 6 chars)';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${isModal ? 'max-w-4xl' : 'min-h-[85vh]'} mx-auto rounded-3xl bg-[#060A12] border border-[#142338] shadow-[0_0_80px_rgba(0,223,137,0.12)] overflow-hidden flex flex-col lg:flex-row relative ${className}`}>
      
      {/* ---------------- LEFT PANEL: BRAND & TESTIMONIALS (SPLIT LAYOUT) ---------------- */}
      <div className="lg:w-1/2 p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-[#06141F] via-[#041118] to-[#02080D] relative flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#142338]">
        {/* Brand Neural Canvas Watermark */}
        <CyberNetworkBackground opacity={0.35} nodeCount={32} className="absolute inset-0 pointer-events-none w-full h-full" />
        
        {/* Brand Neon Radial Glows */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#00DF89]/15 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-[90px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#14253a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        {/* Top Header: Brand Identity & Live Status */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <LiteNoteLogo size="sm" showText={true} showSubtitle={true} animated={true} />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#04241E] border border-emerald-500/40 text-[11px] font-mono text-emerald-400 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#00DF89] animate-pulse" />
              <span>MAINNET v2.4</span>
            </div>
          </div>

          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-medium mb-3">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{language === 'ru' ? 'Профессиональная сеть разработчиков' : "The Engineer's Social Matrix"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {language === 'ru' ? (
                <>
                  Кодируй. Делись.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00DF89] via-teal-300 to-cyan-400">
                    Развивайся вместе.
                  </span>
                </>
              ) : (
                <>
                  Code, connect &{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00DF89] via-teal-300 to-cyan-400">
                    scale your ideas.
                  </span>
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed max-w-md">
              {language === 'ru'
                ? 'Мгновенный запуск кода в песочнице, Gemini AI ядро, голосовые хабы и сверхбыстрый обмен знаниями.'
                : 'Zero-friction live code REPL, Gemini AI reasoning hub, ultra-fast peer chat, and real-time audio rooms.'}
            </p>
          </div>
        </div>

        {/* Middle: Real Platform Capabilities Highlights */}
        <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3 my-4 sm:my-6">
          <div className="p-3 rounded-2xl bg-[#08111D]/90 border border-[#182A40] backdrop-blur-md">
            <div className="text-emerald-400 font-mono font-bold text-xs sm:text-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Firestore</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              {language === 'ru' ? 'Realtime База' : 'Realtime Sync'}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#08111D]/90 border border-[#182A40] backdrop-blur-md">
            <div className="text-cyan-400 font-mono font-bold text-xs sm:text-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>REPL VM</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              {language === 'ru' ? 'JS / TS / Python' : 'Multi-Lang Runner'}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-[#08111D]/90 border border-[#182A40] backdrop-blur-md">
            <div className="text-teal-400 font-mono font-bold text-xs sm:text-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>Gemini AI</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              {language === 'ru' ? 'Нейроассистент' : 'Neural Copilot'}
            </div>
          </div>
        </div>

        {/* Bottom: Professional Platform Architecture Feature Showcase */}
        <div className="relative z-10 space-y-4 pt-1">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#08111D]/95 border border-[#182A40] shadow-xl backdrop-blur-md relative">
            {/* Header badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentModule.tech}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                {currentModule.badge}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white mb-1.5">
              {language === 'ru' ? currentModule.titleRu : currentModule.titleEn}
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed min-h-[42px]">
              {language === 'ru' ? currentModule.descRu : currentModule.descEn}
            </p>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#142338]">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span>Модуль {activeTestimonialIdx + 1} из {platformModules.length}</span>
              </div>

              {/* Carousel controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTestimonialIdx((prev) => (prev === 0 ? platformModules.length - 1 : prev - 1))}
                  className="p-1.5 rounded-lg bg-[#0B1422] border border-[#1A2C42] hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTestimonialIdx((prev) => (prev === platformModules.length - 1 ? 0 : prev + 1))}
                  className="p-1.5 rounded-lg bg-[#0B1422] border border-[#1A2C42] hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Next"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 256-Bit Encrypted Protocol</span>
            </span>
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
              className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              <span>{language.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- RIGHT PANEL: SIGN IN / SIGN UP FORM ---------------- */}
      <div className="lg:w-1/2 p-6 sm:p-10 lg:p-12 bg-[#080D18] flex flex-col justify-center relative">
        <div className="max-w-md w-full mx-auto space-y-6">
          
          {/* Header Title & Pill Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {mode === 'signin'
                  ? (language === 'ru' ? 'С возвращением' : 'Welcome back')
                  : (language === 'ru' ? 'Создать профиль' : 'Create an account')}
              </h3>
              
              {/* Mode Toggle Capsule */}
              <div className="flex p-1 bg-[#03060C] rounded-full border border-[#142338]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-[#04241E] text-white border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {language === 'ru' ? 'Вход' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-[#04241E] text-white border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {language === 'ru' ? 'Регистрация' : 'Sign Up'}
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400">
              {mode === 'signin'
                ? (language === 'ru' ? 'Введите ваши данные для доступа к хабу LiteNote' : 'Enter your credentials to access your DevHub workspace')
                : (language === 'ru' ? 'Присоединяйтесь к тысячам инженеров и создавайте будущее' : 'Join thousands of builders in the sovereign coder matrix')}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* ---------------- OAUTH SOCIAL BUTTONS ---------------- */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-full bg-[#0C1524] hover:bg-[#101D30] border border-[#1A2D48] hover:border-emerald-500/50 text-xs font-semibold text-white flex items-center justify-center gap-3 transition-all shadow-sm cursor-pointer active:scale-98 group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{language === 'ru' ? 'Продолжить через Google' : 'Continue with Google'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleGithubNotice}
                className="py-2 px-3 rounded-full bg-[#0C1524] hover:bg-[#101D30] border border-[#1A2D48] hover:border-slate-600 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Github className="w-3.5 h-3.5 text-slate-300" />
                <span>GitHub</span>
              </button>
              <button
                type="button"
                onClick={handleGithubNotice}
                className="py-2 px-3 rounded-full bg-[#0C1524] hover:bg-[#101D30] border border-[#1A2D48] hover:border-slate-600 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.65-.83 1.1-1.99.98-3.15-1 .04-2.19.67-2.88 1.48-.61.71-1.14 1.88-1 3 .01 0 .07.01.1.01 1.05 0 2.15-.51 2.8-1.34z" />
                </svg>
                <span>Apple ID</span>
              </button>
            </div>
          </div>

          {/* Form Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-[#16273C]" />
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              {language === 'ru' ? 'или через email' : 'or continue with email'}
            </span>
            <div className="flex-1 border-t border-[#16273C]" />
          </div>

          {/* ---------------- FORM INPUTS ---------------- */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    {language === 'ru' ? 'Ваше имя' : 'Full Name / Display Name'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={language === 'ru' ? 'Ваше имя' : 'Your Name'}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-[#040810] text-white border border-[#142338] rounded-full focus:outline-none focus:border-emerald-500 font-sans transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    {language === 'ru' ? 'Никнейм разработчика (@handle)' : 'Developer Handle (@handle)'}
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="dev_handle"
                      className="w-full pl-9 pr-4 py-2 text-xs bg-[#040810] text-emerald-300 border border-[#142338] rounded-full focus:outline-none focus:border-emerald-500 font-mono transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@devhub.io"
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#040810] text-white border border-[#142338] rounded-full focus:outline-none focus:border-emerald-500 font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono text-slate-400">
                  {language === 'ru' ? 'Пароль' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setErrorMsg(language === 'ru' ? 'Для сброса пароля напишите нам или войдите через Google' : 'Please use Google Sign-in to recover your account')}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono hover:underline cursor-pointer"
                  >
                    {language === 'ru' ? 'Забыли пароль?' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-[#040810] text-white border border-[#142338] rounded-full focus:outline-none focus:border-emerald-500 font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMeCheckbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-[#00DF89]"
              />
              <label htmlFor="rememberMeCheckbox" className="text-xs text-slate-400 select-none cursor-pointer">
                {language === 'ru' ? 'Запомнить меня на этом устройстве' : 'Keep me signed in on this device'}
              </label>
            </div>

            {/* Submit Button (Pill with Emerald Neon Glow) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-full bg-[#00DF89] hover:bg-[#00f596] text-[#041912] font-black text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(0,223,137,0.3)] hover:shadow-[0_0_25px_rgba(0,223,137,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>{language === 'ru' ? 'Войти в DevHub Network' : 'Sign in to DevHub Network'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>{language === 'ru' ? 'Создать аккаунт разработчика' : 'Create Coder Identity'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Policy Notice */}
          <p className="text-[10px] text-center text-slate-500 leading-relaxed font-mono">
            {language === 'ru' ? (
              <>
                Нажимая продолжить, вы соглашаетесь с{' '}
                <a href="#terms" className="text-slate-400 hover:text-emerald-400 underline">Условиями обслуживания</a>{' '}
                и{' '}
                <a href="#privacy" className="text-slate-400 hover:text-emerald-400 underline">Политикой конфиденциальности</a>.
              </>
            ) : (
              <>
                By continuing, you agree to our{' '}
                <a href="#terms" className="text-slate-400 hover:text-emerald-400 underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#privacy" className="text-slate-400 hover:text-emerald-400 underline">Privacy Policy</a>.
              </>
            )}
          </p>

        </div>
      </div>
    </div>
  );
};
