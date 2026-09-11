import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONFIGS } from '../../lib/theme';
import { Download, Smartphone, X, Check, Share, PlusSquare, Monitor, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallButtonProps {
  variant?: 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'settings',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { accentColor, language } = useAuth();
  const theme = THEME_CONFIGS[accentColor] || THEME_CONFIGS['cyber-green'];
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstalledSuccess(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <div className={`p-5 rounded-2xl bg-[#091120]/80 border border-[#17263c] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3.5">
          <div
            style={{ backgroundColor: `${theme.hex}20`, color: theme.hex }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-slate-700/50 shadow-inner"
          >
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">
                {language === 'ru' ? 'Веб-приложение LiteNote (PWA)' : 'LiteNote Native App (PWA)'}
              </h4>
              {isInstalled && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-medium">
                  {language === 'ru' ? 'Установлено' : 'Installed'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              {language === 'ru'
                ? 'Работает на этом домене без установки из магазинов: добавьте иконку LiteNote на рабочий стол телефона или ПК.'
                : 'Runs seamlessly on this domain: add the LiteNote icon to your phone or desktop home screen.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            backgroundColor: isInstalled || installedSuccess ? '#10B981' : theme.hex,
          }}
          className="px-4 py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-95 cursor-pointer shrink-0 shadow-md"
        >
          {isInstalled || installedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>{language === 'ru' ? 'Приложение установлено' : 'App Installed'}</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>{language === 'ru' ? 'Установить на устройство' : 'Install on Device'}</span>
            </>
          )}
        </button>
      </div>

      {/* Guide Modal without any redirection */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-[#0B1322] border border-[#1A2C46] p-6 shadow-2xl text-left space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
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
                    {language === 'ru' ? 'Как добавить на главный экран' : 'How to Add to Home Screen'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'ru' ? 'Всё работает на текущем сайте без перехода' : 'Runs natively on this domain'}
                  </p>
                </div>
              </div>

              {isIOS ? (
                /* iOS Safari steps */
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                      1
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <span>{language === 'ru' ? 'В браузере Safari нажмите кнопку ' : 'In Safari tap '}</span>
                      <strong className="text-white inline-flex items-center gap-1 mx-1">
                        <Share className="w-3.5 h-3.5 text-sky-400" />
                        {language === 'ru' ? '«Поделиться»' : '«Share»'}
                      </strong>
                      <span>{language === 'ru' ? '(иконка со стрелочкой)' : '(arrow icon)'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                      2
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <span>{language === 'ru' ? 'Прокрутите меню и выберите ' : 'Scroll down and tap '}</span>
                      <strong className="text-white inline-flex items-center gap-1 mx-1">
                        <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                        {language === 'ru' ? '«На экран "Домой"»' : '«Add to Home Screen»'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                      3
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <span>
                        {language === 'ru'
                          ? 'Нажмите «Добавить». Иконка появится на рабочем столе как полноценное приложение!'
                          : 'Tap «Add». The icon will appear on your home screen!'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android / Chrome / Edge steps */
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                      1
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <span>
                        {language === 'ru'
                          ? 'В меню браузера (три точки ⋮ в правом верхнем углу):'
                          : 'In browser menu (three dots ⋮ at top-right):'}
                      </span>
                      <div className="mt-1 font-semibold text-white">
                        {language === 'ru'
                          ? '«Установить приложение» или «Добавить на главный экран»'
                          : '«Install app» or «Add to Home screen»'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                      2
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <p>
                        {language === 'ru'
                          ? 'На компьютере в строке браузера также доступна иконка ⊕ «Установить LiteNote».'
                          : 'On desktop, look for the ⊕ icon in the browser address bar.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
              >
                {language === 'ru' ? 'Понятно' : 'Got it'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
