import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONFIGS } from '../../lib/theme';
import { Download, Smartphone, X, Check, Share, PlusSquare, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { accentColor, language } = useAuth();
  const theme = THEME_CONFIGS[accentColor] || THEME_CONFIGS['cyber-green'];
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);

  // If already installed and running inside standalone app, do not display
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Browser didn't trigger beforeinstallprompt yet or inside iframe
      setShowGenericModal(true);
    }
  };

  const buttonText = language === 'ru' ? 'Установить приложение' : 'Install App';
  const shortButtonText = language === 'ru' ? 'Приложение' : 'Install';

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          title={language === 'ru' ? 'Установить LiteNote на главный экран' : 'Install LiteNote to Home Screen'}
          style={{
            borderColor: `${theme.hex}50`,
            backgroundColor: `${theme.hex}14`,
          }}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm ${className}`}
        >
          <div
            style={{ backgroundColor: `${theme.hex}25` }}
            className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
          >
            <Download
              style={{ color: theme.hex }}
              className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5"
            />
          </div>
          <span className="hidden sm:inline font-sans text-[12px] font-semibold text-slate-200 group-hover:text-white">
            {shortButtonText}
          </span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            borderColor: `${theme.hex}35`,
            backgroundColor: `${theme.hex}10`,
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 hover:bg-slate-800/60 active:scale-[0.99] cursor-pointer group ${className}`}
        >
          <div
            style={{ backgroundColor: `${theme.hex}22`, color: theme.hex }}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
          >
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left leading-tight min-w-0 flex-1">
            <span className="font-semibold text-slate-200 group-hover:text-white text-[13px] truncate">
              {buttonText}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {language === 'ru' ? 'PWA • Быстрый запуск' : 'PWA • Fast launch'}
            </span>
          </div>
          <Download
            style={{ color: theme.hex }}
            className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
          />
        </button>
      )}

      {variant === 'settings' && (
        <div className={`p-4 rounded-2xl bg-[#091120]/80 border border-[#17263c] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${className}`}>
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${theme.hex}20`, color: theme.hex }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-700/50"
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-left">
              <h4 className="text-sm font-semibold text-white">
                {language === 'ru' ? 'LiteNote как приложение (PWA)' : 'LiteNote Native App (PWA)'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'ru'
                  ? 'Установите LiteNote на рабочий стол телефона или ПК для мгновенной загрузки и работы без браузера.'
                  : 'Install LiteNote on your phone or desktop home screen for instant access and distraction-free UI.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              backgroundColor: theme.hex,
            }}
            className="px-4 py-2 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-95 cursor-pointer shrink-0 shadow-md"
          >
            <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>{language === 'ru' ? 'Установить' : 'Install'}</span>
          </button>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-[#0B1322] border border-[#1A2C46] p-6 shadow-2xl text-left space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: `${theme.hex}25`, color: theme.hex }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {language === 'ru' ? 'Установка на iPhone / iPad' : 'Install on iPhone / iPad'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'ru' ? 'Через стандартный браузер Safari' : 'Via standard Safari browser'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-sm text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                    1
                  </div>
                  <div className="flex-1 text-xs leading-relaxed">
                    <span>
                      {language === 'ru'
                        ? 'В Safari нажмите кнопку '
                        : 'In Safari, tap the '}
                    </span>
                    <strong className="text-white inline-flex items-center gap-1 mx-1">
                      <Share className="w-3.5 h-3.5 text-sky-400" />
                      {language === 'ru' ? '«Поделиться»' : '«Share»'}
                    </strong>
                    <span>
                      {language === 'ru' ? '(иконка со стрелочкой внизу экрана).' : '(arrow icon at bottom).'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                    2
                  </div>
                  <div className="flex-1 text-xs leading-relaxed">
                    <span>
                      {language === 'ru'
                        ? 'Прокрутите меню вниз и выберите '
                        : 'Scroll down and select '}
                    </span>
                    <strong className="text-white inline-flex items-center gap-1 mx-1">
                      <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                      {language === 'ru' ? '«На экран "Домой"»' : '«Add to Home Screen»'}
                    </strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                    3
                  </div>
                  <div className="flex-1 text-xs leading-relaxed">
                    <span>
                      {language === 'ru'
                        ? 'Нажмите «Добавить» в правом верхнем углу. Иконка LiteNote появится на вашем рабочем столе!'
                        : 'Tap «Add» in the top right corner. The LiteNote app icon will appear on your Home Screen!'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
              >
                {language === 'ru' ? 'Понятно' : 'Got it'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generic Browser / Preview Fallback Modal */}
      <AnimatePresence>
        {showGenericModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-[#0B1322] border border-[#1A2C46] p-6 shadow-2xl text-left space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowGenericModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: `${theme.hex}25`, color: theme.hex }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {language === 'ru' ? 'Установка приложения LiteNote' : 'Install LiteNote App'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'ru' ? 'Chrome, Edge, Android или отдельная вкладка' : 'Chrome, Edge, Android or new tab'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'ru'
                  ? 'Чтобы установить веб-приложение на телефон или компьютер:'
                  : 'To install LiteNote on your device:'}
              </p>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{language === 'ru' ? '1. Откройте в отдельной вкладке' : '1. Open in a standalone tab'}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-normal">
                    {language === 'ru'
                      ? 'Внутри окна предпросмотра браузер ограничивает установку. Откройте прямую ссылку:'
                      : 'Inside the preview frame, browsers restrict install prompts. Open the direct tab:'}
                  </p>
                  <button
                    type="button"
                    onClick={() => window.open(window.location.href, '_blank')}
                    style={{ backgroundColor: `${theme.hex}25`, color: theme.hex, borderColor: `${theme.hex}40` }}
                    className="w-full py-1.5 px-2.5 rounded-lg border font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 transition"
                  >
                    <span>{language === 'ru' ? 'Открыть в отдельной вкладке' : 'Open in New Tab'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    <span>{language === 'ru' ? '2. Нажмите иконку установки' : '2. Click the install icon'}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-normal">
                    {language === 'ru'
                      ? 'В адресной строке Chrome/Edge появится значок ⊕ («Установить»), либо в меню браузера (⋮) выберите «Установить приложение / Добавить на главный экран».'
                      : 'In Chrome/Edge address bar, click ⊕ («Install») or from browser menu (⋮) select «Install app / Add to Home screen».'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGenericModal(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
              >
                {language === 'ru' ? 'Закрыть' : 'Close'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
