import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiteNoteLogo } from '../Common/LiteNoteLogo';
import { CyberNetworkBackground } from '../Common/CyberNetworkBackground';
import { DeviceAppShowcase } from './DeviceAppShowcase';
import { PillNav } from '../ui/PillNav';
import { Auth2 } from '../ui/auth-2';
import {
  Globe,
  Sparkles,
  MessageSquare,
  Users,
  Code,
  Terminal,
  Cpu,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  Flame
} from 'lucide-react';

export const AuthLandingView: React.FC = () => {
  const {
    language,
    setLanguage,
  } = useAuth();

  const [initialMode, setInitialMode] = useState<'signin' | 'signup'>('signin');

  const scrollToAuth = (mode: 'signin' | 'signup') => {
    setInitialMode(mode);
    const el = document.getElementById('auth-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#05080E] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-white relative overflow-y-auto overflow-x-hidden">
      {/* ---------------- BRAND BACKGROUND DESIGN ---------------- */}
      {/* Dynamic Cyber Network Particle Graph */}
      <CyberNetworkBackground opacity={0.45} nodeCount={60} className="fixed inset-0 pointer-events-none w-full h-full" />

      {/* Atmospheric Brand Glows & Tech Grid Mesh */}
      <div className="fixed -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-[#00DF89]/12 blur-[150px] pointer-events-none animate-pulse" />
      <div className="fixed -bottom-40 -right-40 w-[550px] h-[550px] rounded-full bg-cyan-500/12 blur-[150px] pointer-events-none animate-pulse" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-950/20 blur-[180px] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#0c1a2d15_1px,transparent_1px),linear-gradient(to_bottom,#0c1a2d15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* ---------------- TOP NAVBAR WITH PILLNAV ---------------- */}
      <header className="w-full border-b border-[#142338] bg-[#070D18]/85 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left LiteNote Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <LiteNoteLogo size="sm" showText={true} showSubtitle={true} animated={true} />
        </div>

        {/* Center: React Bits PillNav */}
        <div className="flex-1 flex justify-center max-w-xl">
          <PillNav
            logoElement={<LiteNoteLogo size={22} showText={false} />}
            logoAlt="LiteNote Logo"
            items={[
              {
                label: language === 'ru' ? 'Вход' : 'Sign In',
                href: '#signin',
                onClick: () => scrollToAuth('signin'),
              },
              {
                label: language === 'ru' ? 'Регистрация' : 'Sign Up',
                href: '#signup',
                onClick: () => scrollToAuth('signup'),
              },
              {
                label: language === 'ru' ? '3D Демо' : '3D Demo',
                href: '#device-demo',
                onClick: () => {
                  document.getElementById('device-demo')?.scrollIntoView({ behavior: 'smooth' });
                },
              },
              {
                label: language === 'ru' ? 'Возможности' : 'Features',
                href: '#features-grid',
                onClick: () => {
                  document.getElementById('features-grid')?.scrollIntoView({ behavior: 'smooth' });
                },
              },
            ]}
            activeHref="#signin"
            baseColor="#070D18"
            pillColor="#0B1322"
            hoveredPillTextColor="#030712"
            pillTextColor="#94A3B8"
            ease="power3.easeOut"
            initialLoadAnimation={true}
          />
        </div>

        {/* Language switch */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B1322] border border-[#182C44] text-xs font-mono text-emerald-300 hover:text-white hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>
      </header>

      {/* ---------------- MAIN CONTENT WRAPPER ---------------- */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 space-y-16 relative z-10">
        
        {/* ---------------- REACT BITS PRO: AUTH 2 BLOCK (SPLIT LAYOUT) ---------------- */}
        <section id="auth-section" className="scroll-mt-24">
          <Auth2 initialMode={initialMode} />
        </section>

        {/* ---------------- 3D DEVICE SHOWCASE & ECOSYSTEM ---------------- */}
        <section id="device-demo" className="scroll-mt-24 space-y-8 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{language === 'ru' ? 'ИНТЕРАКТИВНАЯ ЭКОСИСТЕМА' : 'INTERACTIVE ECOSYSTEM'}</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {language === 'ru' ? 'Вся мощь разработки в одном месте' : 'Everything You Need in One Unified Matrix'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              {language === 'ru'
                ? 'От интерактивного мессенджера до песочницы REPL и квантового AI терминала.'
                : 'From ultra-responsive direct messaging to live sandbox execution and AI reasoning.'}
            </p>
          </div>

          <div className="p-4 sm:p-8 rounded-3xl bg-[#070D18]/90 border border-[#142338] shadow-2xl backdrop-blur-xl">
            <DeviceAppShowcase language={language} />
          </div>
        </section>

        {/* ---------------- FEATURES GRID ---------------- */}
        <section id="features-grid" className="scroll-mt-24 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#08111D] border border-[#182A40] space-y-3 hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Code className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {language === 'ru' ? 'Живая песочница REPL' : 'Live REPL & Sandboxes'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ru'
                  ? 'Выполняйте код JavaScript, TypeScript и Python прямо внутри постов и сообщений с мгновенным выводом консоли.'
                  : 'Execute JS, TS, and Python directly inside feeds and chats with instantaneous console telemetry.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#08111D] border border-[#182A40] space-y-3 hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {language === 'ru' ? 'Gemini AI Core Matrix' : 'Gemini AI Core Matrix'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ru'
                  ? 'Встроенный терминал искусственного интеллекта для анализа архитектуры, генерации сниппетов и дебаггинга.'
                  : 'Embedded generative intelligence terminal for architectural analysis, instant snippet generation, and debugging.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#08111D] border border-[#182A40] space-y-3 hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {language === 'ru' ? 'Сверхбыстрый мессенджер' : 'Zero-Latency Messenger'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ru'
                  ? 'Групповые каналы, P2P звонки, аудиосообщения с волновой диаграммой, реакции и вложения сниппетов.'
                  : 'Group channels, direct audio/video calls, waveform voice notes, emoji reactions, and snippet attachments.'}
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="w-full border-t border-[#142338] py-6 text-center text-xs font-mono text-slate-500 relative z-10 bg-[#040810]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <LiteNoteLogo size={16} showText={false} />
            <span>LiteNote / DevHub Matrix © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="#terms" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
            <a href="#privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <span className="text-emerald-500/80">● All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
