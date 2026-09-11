import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONFIGS } from '../../lib/theme';
import { Download, Smartphone, X, Check, Share, PlusSquare, Monitor, CheckCircle2, FileDown, ShieldCheck, AlertCircle } from 'lucide-react';
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
  const [showDownloadConfirmModal, setShowDownloadConfirmModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
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

  const handleConfirmDownloadApk = () => {
    setDownloading(true);
    // Directly download the app package file from backend without any third-party redirects
    try {
      const link = document.createElement('a');
      link.href = '/api/app/download-package';
      link.setAttribute('download', 'LiteNote-App-v2.4.0.apk');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => setShowDownloadConfirmModal(false), 2000);
      }, 800);
    } catch {
      setDownloading(false);
      setShowDownloadConfirmModal(false);
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
                {language === 'ru' ? 'Веб-приложение LiteNote (PWA / APK)' : 'LiteNote Native App (PWA / APK)'}
              </h4>
              {isInstalled && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-medium">
                  {language === 'ru' ? 'Установлено' : 'Installed'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              {language === 'ru'
                ? 'Работает прямо на этом сайте или загружается отдельным пакетом для телефона и ПК.'
                : 'Runs seamlessly on this domain or download direct installer package for phone and desktop.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
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
                <span>{language === 'ru' ? 'Установить PWA' : 'Install PWA'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDownloadConfirmModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all hover:text-white cursor-pointer shrink-0"
            title={language === 'ru' ? 'Скачать установочный файл APK' : 'Download direct APK package'}
          >
            <FileDown className="w-4 h-4 text-sky-400" />
            <span>{language === 'ru' ? 'Скачать файл' : 'Download Package'}</span>
          </button>
        </div>
      </div>

      {/* Two-step Download Confirmation Modal */}
      <AnimatePresence>
        {showDownloadConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="w-full max-w-md rounded-2xl bg-[#091120] border border-[#1e2f4a] p-6 shadow-2xl text-left space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowDownloadConfirmModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: `${theme.hex}25`, color: theme.hex }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-slate-700"
                >
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {language === 'ru' ? 'Подтверждение скачивания' : 'Confirm Download'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'ru' ? 'LiteNote Standalone Launcher v2.4.0' : 'LiteNote Standalone Launcher v2.4.0'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2 text-amber-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{language === 'ru' ? 'Добровольная загрузка' : 'Voluntary Download'}</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {language === 'ru'
                    ? 'Вы собираетесь загрузить автономный установочный пакет LiteNote на устройство. Подтвердите действие для начала скачивания.'
                    : 'You are about to download the standalone LiteNote package to your device. Please confirm to proceed with the download.'}
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  {language === 'ru' ? 'Размер: ~2.4 МБ • Формат: Standalone Package' : 'Size: ~2.4 MB • Format: Standalone Package'}
                </div>
              </div>

              {downloadSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 justify-center font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'ru' ? 'Загрузка успешно началась!' : 'Download started successfully!'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDownloadConfirmModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                  >
                    {language === 'ru' ? 'Отмена' : 'Cancel'}
                  </button>

                  <button
                    type="button"
                    disabled={downloading}
                    onClick={handleConfirmDownloadApk}
                    style={{ backgroundColor: theme.hex }}
                    className="flex-1 py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {downloading ? (
                      <span>{language === 'ru' ? 'Подготовка...' : 'Preparing...'}</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4 stroke-[2.5]" />
                        <span>{language === 'ru' ? 'Да, скачать' : 'Yes, Download'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
