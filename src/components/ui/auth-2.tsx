import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONFIGS } from '../../lib/theme';
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
  AlertCircle,
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
  Check,
  ExternalLink,
  Copy
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
    accentColor,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signInWithGoogle,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const theme = THEME_CONFIGS[accentColor] || THEME_CONFIGS.emerald;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  interface GoogleDiagnostic {
    type: 'domain' | 'provider_disabled' | 'popup_closed' | 'popup_blocked' | 'other';
    title: string;
    description: string;
    errorCode?: string;
    errorMessage?: string;
    domains?: string[];
    suggestNewTab?: boolean;
  }
  const [googleDiagnostic, setGoogleDiagnostic] = useState<GoogleDiagnostic | null>(null);
  const [copiedDomainIdx, setCopiedDomainIdx] = useState<number | null>(null);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleResetPassword = () => {
    setMode('reset');
    setErrorMsg(null);
    setGoogleDiagnostic(null);
    setResetSentEmail(null);
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    setGoogleDiagnostic(null);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.warn('Google Auth exception caught:', err?.code, err?.message);
      const errCode = err?.code || '';
      const errMsg = err?.message || '';

      const isDomainIssue =
        errCode === 'auth/unauthorized-domain' ||
        errMsg.toLowerCase().includes('unauthorized-domain') ||
        errMsg.toLowerCase().includes('unauthorized domain') ||
        errMsg.includes('ограничен Google на этом домене');

      const isProviderDisabled =
        errCode === 'auth/operation-not-allowed' ||
        errMsg.toLowerCase().includes('operation-not-allowed') ||
        errMsg.toLowerCase().includes('identity provider configuration') ||
        errMsg.toLowerCase().includes('provider is not enabled');

      const isPopupClosed =
        errCode === 'auth/popup-closed-by-user' ||
        errCode === 'auth/cancelled-popup-request';

      const isPopupBlocked = errCode === 'auth/popup-blocked';

      if (isProviderDisabled) {
        setGoogleDiagnostic({
          type: 'provider_disabled',
          title: language === 'ru' ? 'Провайдер Google не включен в Firebase Console' : 'Google Auth is disabled in Firebase',
          description: language === 'ru'
            ? 'В проекте Firebase (litenote-dc1ca) вход через Google отключен по умолчанию. Чтобы его включить: 1) В Firebase Console перейдите в Authentication → вкладка «Sign-in method». 2) Нажмите на «Google» в списке провайдеров, включите тумблер «Enable», выберите email поддержки проекта и нажмите «Save».'
            : 'Google provider is disabled in Firebase Console. Go to Authentication → Sign-in method → Google, toggle Enable, set project support email and click Save.',
          errorCode: errCode,
          errorMessage: errMsg,
        });
      } else if (isDomainIssue) {
        const currentHost = window.location.hostname || window.location.host;
        const hosts = Array.from(new Set([
          currentHost,
          'ais-dev-xcpecwjouq7heproeidavo-138388183966.asia-southeast1.run.app',
          'ais-pre-xcpecwjouq7heproeidavo-138388183966.asia-southeast1.run.app'
        ])).filter(Boolean);

        setGoogleDiagnostic({
          type: 'domain',
          title: language === 'ru' ? 'Домен ещё не подтверждён в Firebase' : 'Domain not authorized in Firebase',
          description: language === 'ru'
            ? 'В Firebase Console → Authentication → Settings → «Authorized domains» добавьте эти адреса (БЕЗ https://). Обратите внимание: после добавления Google обновляет кэш 1-2 минуты.'
            : 'In Firebase Console → Authentication → Settings → Authorized domains, add these addresses without https://. Note: Google servers take 1-2 minutes to refresh domain cache.',
          domains: hosts,
          errorCode: errCode,
          errorMessage: errMsg,
        });
      } else if (isPopupClosed) {
        setGoogleDiagnostic({
          type: 'popup_closed',
          title: language === 'ru' ? 'Окно авторизации Google закрылось' : 'Google sign-in popup was closed',
          description: language === 'ru'
            ? (isInIframe
              ? 'Вы находитесь во встроенном фрейме предпросмотра. Браузеры (Chrome/Safari) блокируют передачу токена Google между окном и фреймом из-за защиты cookies. Откройте приложение в отдельной вкладке — там вход сработает напрямую!'
              : 'Окно авторизации Google было закрыто до подтверждения входа.')
            : 'Popup was closed. If inside an iframe, open the app in a new tab for direct Google authentication.',
          errorCode: errCode,
          errorMessage: errMsg,
          suggestNewTab: true,
        });
      } else if (isPopupBlocked) {
        setGoogleDiagnostic({
          type: 'popup_blocked',
          title: language === 'ru' ? 'Всплывающее окно заблокировано' : 'Popup blocked by browser',
          description: language === 'ru'
            ? 'Браузер заблокировал всплывающее окно. Разрешите всплывающие окна или откройте сайт в отдельной вкладке.'
            : 'Please allow popups in your browser or open the app in a new tab.',
          errorCode: errCode,
          errorMessage: errMsg,
          suggestNewTab: true,
        });
      } else {
        setGoogleDiagnostic({
          type: 'other',
          title: language === 'ru' ? 'Ошибка входа через Google' : 'Google sign-in error',
          description: errMsg || (language === 'ru' ? 'Не удалось выполнить вход через Google' : 'Google sign-in failed'),
          errorCode: errCode,
          errorMessage: errMsg,
          suggestNewTab: isInIframe,
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
      titleRu: "Интеллектуальное ядро Litenote AI",
      titleEn: "Litenote AI Intelligence Core",
      descRu: "Встроенный всесторонний собеседник и ассистент для диалогов, объяснения кода, рефакторинга и генерации публикаций.",
      descEn: "Built-in all-around intelligence for deep conversation, code analysis, instant debugging, and creative drafting.",
      badge: "Litenote Neural Core",
      icon: "Sparkles",
      tech: "AI Companion"
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
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
      } else if (mode === 'reset') {
        if (!email.trim()) {
          setErrorMsg(language === 'ru' ? 'Укажите email или никнейм' : 'Enter email or handle');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg(language === 'ru' ? 'Новый пароль должен содержать от 6 символов' : 'Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        await resetPassword(email, password);
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
      } else if (err.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        msg = language === 'ru' ? 'Вход ограничен на этом домене' : 'Access restricted on this domain';
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
                ? 'Мгновенный запуск кода в песочнице, Litenote AI ядро, голосовые хабы и сверхбыстрый обмен знаниями.'
                : 'Zero-friction live code REPL, Litenote AI reasoning hub, ultra-fast peer chat, and real-time audio rooms.'}
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
              <span>Litenote AI</span>
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
                  : mode === 'signup'
                  ? (language === 'ru' ? 'Создать профиль' : 'Create an account')
                  : (language === 'ru' ? 'Сброс пароля' : 'Reset password')}
              </h3>
              
              {/* Mode Toggle Capsule */}
              <div className="flex p-1 bg-[#03060C] rounded-full border border-[#142338]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setGoogleDiagnostic(null);
                  }}
                  style={
                    mode === 'signin'
                      ? {
                          borderColor: theme.hex,
                          backgroundColor: `${theme.hex}22`,
                          boxShadow: `0 0 10px rgba(${theme.rgb}, 0.25)`,
                        }
                      : undefined
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'text-white border'
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
                    setGoogleDiagnostic(null);
                  }}
                  style={
                    mode === 'signup'
                      ? {
                          borderColor: theme.hex,
                          backgroundColor: `${theme.hex}22`,
                          boxShadow: `0 0 10px rgba(${theme.rgb}, 0.25)`,
                        }
                      : undefined
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'text-white border'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {language === 'ru' ? 'Регистрация' : 'Sign Up'}
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400">
              {mode === 'signin'
                ? (language === 'ru' ? 'Введите ваши данные для доступа к хабу LiteNote' : 'Enter your credentials to access your LiteNote workspace')
                : mode === 'signup'
                ? (language === 'ru' ? 'Присоединяйтесь к тысячам инженеров и создавайте будущее' : 'Join thousands of builders in the sovereign coder matrix')
                : (language === 'ru' ? 'Укажите email или никнейм и задайте новый пароль' : 'Enter your email or handle and set a new password')}
            </p>
          </div>

          {/* Status & Error Banners */}
          {errorMsg ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          ) : null}

          {/* Password Reset Confirmation Banner */}
          {resetSentEmail && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  {language === 'ru' ? 'Письмо отправлено!' : 'Recovery email sent!'}
                </span>
                <p className="text-[11px] text-emerald-400/90 mt-0.5">
                  {language === 'ru'
                    ? `Ссылка для восстановления доступа направлена на адрес ${resetSentEmail}. Проверьте почту и папку «Спам».`
                    : `Instructions to reset your password have been sent to ${resetSentEmail}. Please check your inbox or spam.`}
                </p>
              </div>
            </motion.div>
          )}

          {/* Google One-Click Auth / Registration */}
          {mode !== 'reset' && (
            <div className="space-y-3">
              <button
                type="button"
                id="google-auth-btn"
                onClick={handleGoogleAuth}
                disabled={isLoading || isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-full bg-[#0D1626] hover:bg-[#122238] border border-[#1E3352] hover:border-emerald-500/50 text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 active:scale-[0.99] group"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                    <span className="group-hover:text-emerald-300 transition-colors">
                      {mode === 'signup'
                        ? (language === 'ru' ? 'Зарегистрироваться через Google' : 'Sign up with Google')
                        : (language === 'ru' ? 'Войти через Google' : 'Sign in with Google')}
                    </span>
                  </>
                )}
              </button>

              {/* In-iframe subtle hint */}
              {isInIframe && !googleDiagnostic && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-950/30 border border-sky-500/20 text-[11px] text-sky-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{language === 'ru' ? 'В окне предпросмотра?' : 'Inside preview iframe?'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="underline hover:text-sky-100 font-semibold flex items-center gap-1 shrink-0 ml-2 cursor-pointer transition-colors"
                  >
                    <span>{language === 'ru' ? 'Открыть в новой вкладке' : 'Open in new tab'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Google Auth Diagnostic Panel */}
              {googleDiagnostic && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-2xl border text-xs space-y-2.5 text-left ${
                    googleDiagnostic.type === 'domain' || googleDiagnostic.type === 'provider_disabled'
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2 font-semibold">
                    <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                      googleDiagnostic.type === 'domain' || googleDiagnostic.type === 'provider_disabled'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`} />
                    <span className="text-sm font-sans">{googleDiagnostic.title}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">
                    {googleDiagnostic.description}
                  </p>

                  {googleDiagnostic.domains && googleDiagnostic.domains.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {language === 'ru' ? 'Адреса для добавления в Firebase:' : 'Domains to add in Firebase:'}
                      </span>
                      {googleDiagnostic.domains.map((dom, idx) => (
                        <div
                          key={dom}
                          className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-lg bg-black/60 border border-slate-700/60 font-mono text-[11px] text-slate-200 select-all"
                        >
                          <span className="truncate">{dom}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator?.clipboard) {
                                navigator.clipboard.writeText(dom);
                                setCopiedDomainIdx(idx);
                                setTimeout(() => setCopiedDomainIdx(null), 2000);
                              }
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-sans font-semibold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedDomainIdx === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>{language === 'ru' ? 'Скопировано' : 'Copied'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{language === 'ru' ? 'Копировать' : 'Copy'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {googleDiagnostic.suggestNewTab && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-lg active:scale-[0.99]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{language === 'ru' ? 'Открыть сайт в отдельной вкладке и войти' : 'Open in new tab and sign in'}</span>
                      </button>
                    </div>
                  )}

                  {googleDiagnostic.errorCode && (
                    <div className="pt-1 text-[10px] font-mono text-slate-400 opacity-70">
                      code: {googleDiagnostic.errorCode}
                    </div>
                  )}
                </motion.div>
              )}

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-[#142338] w-full" />
                <span className="bg-[#080D18] px-3 text-[11px] font-mono text-slate-500 uppercase tracking-wider shrink-0">
                  {language === 'ru' ? 'или по email / никнейму' : 'or with email / handle'}
                </span>
                <div className="border-t border-[#142338] w-full" />
              </div>
            </div>
          )}

          {/* ---------------- PRIMARY AUTH FORM (EMAIL / NICKNAME) ---------------- */}
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
                      placeholder={language === 'ru' ? 'Алекс Смирнов' : 'Alex Rivers'}
                      className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#040810] text-white border border-[#142338] rounded-full focus:outline-none focus:border-emerald-500 font-sans transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    {language === 'ru' ? 'Никнейм (@handle)' : 'Developer Handle (@handle)'}
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="alex_dev"
                      className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#040810] text-emerald-300 border border-[#142338] rounded-full focus:outline-none focus:border-emerald-500 font-mono transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono text-slate-400">
                  {mode === 'signin'
                    ? (language === 'ru' ? 'Email или Никнейм (@handle)' : 'Email or Username (@handle)')
                    : 'Email'}
                </label>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={mode === 'signin' ? 'text' : 'email'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'signin' ? 'alex@mail.com или @alex_dev' : 'alex@mail.com'}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#040810] text-white border border-[#142338] rounded-full focus:outline-none focus:border-emerald-500 font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono text-slate-400">
                  {mode === 'reset'
                    ? (language === 'ru' ? 'Новый пароль' : 'New Password')
                    : (language === 'ru' ? 'Пароль' : 'Password')}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono hover:underline cursor-pointer"
                  >
                    {language === 'ru' ? 'Забыли пароль?' : 'Forgot password?'}
                  </button>
                )}
                {mode === 'reset' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono hover:underline cursor-pointer"
                  >
                    {language === 'ru' ? '← Назад ко входу' : '← Back to sign in'}
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
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-[#040810] text-white border border-[#142338] rounded-full focus:outline-none focus:border-emerald-500 font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {(mode === 'signup' || mode === 'reset') && (
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                  <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>{language === 'ru' ? 'Минимум 6 символов' : 'At least 6 characters'}</span>
                </div>
              )}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: theme.hex,
                boxShadow: `0 0 20px rgba(${theme.rgb}, 0.35)`,
              }}
              className="w-full py-3 rounded-full text-[#041912] font-black text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 hover:brightness-110"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>{language === 'ru' ? 'Войти в LiteNote' : 'Sign in to LiteNote'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              ) : mode === 'signup' ? (
                <>
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>{language === 'ru' ? 'Создать аккаунт и войти' : 'Create Account & Sign In'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                  <span>{language === 'ru' ? 'Обновить пароль и войти' : 'Update Password & Sign In'}</span>
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
