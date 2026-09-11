import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONFIGS } from '../../lib/theme';
import { Download, Smartphone, X, Share, PlusSquare, CheckCircle2, FileDown, ShieldCheck, Laptop, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallButtonProps {
  variant?: 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { accentColor, language } = useAuth();
  const theme = THEME_CONFIGS[accentColor] || THEME_CONFIGS['cyber-green'];
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showDownloadConfirmModal, setShowDownloadConfirmModal] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<'apk' | 'pc'>('pc');
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

  const handleConfirmDownload = (type: 'apk' | 'pc') => {
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = `/api/app/download-package?platform=${type}`;
      link.setAttribute('download', type === 'pc' ? 'Install-LiteNote-PC.bat' : 'LiteNote-Launcher-v2.4.0.apk');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => setShowDownloadConfirmModal(false), 2000);
      }, 700);
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
            <Laptop className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">
                {language === 'ru' ? 'Установка приложения LiteNote' : 'Install LiteNote Application'}
              </h4>
              {isInstalled && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-medium">
                  {language === 'ru' ? 'Установлено' : 'Installed'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              {language === 'ru'
                ? 'Нативная PWA-установка в Chrome/Edge/Android или реальный ярлык для Windows на Рабочий стол.'
                : 'Native PWA installation in Chrome/Edge/Android or real Windows Desktop shortcut.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              backgroundColor: isInstalled || installedSuccess ? '#10B981' : theme.hex,
            }}
            className="px-3.5 py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-95 cursor-pointer shrink-0 shadow-md"
          >
            {isInstalled || installedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>{language === 'ru' ? 'Установлено' : 'Installed'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>{language === 'ru' ? 'Установить (PWA)' : 'Install App'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setDownloadSuccess(false);
              setDownloadTarget('pc');
              setShowDownloadConfirmModal(true);
            }}
            className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all hover:text-white cursor-pointer shrink-0"
            title={language === 'ru' ? 'Скачать ярлык запуска для Windows' : 'Download Windows desktop launcher'}
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ru' ? 'Ярлык для ПК (.bat)' : 'PC Shortcut (.bat)'}</span>
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
                    {language === 'ru' ? 'Скачать установщик ярлыка' : 'Download Launcher Setup'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'ru' ? 'Выберите формат установщика для вашей системы' : 'Select installer for your system'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDownloadTarget('pc')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                      downloadTarget === 'pc'
                        ? 'bg-sky-950/40 border-sky-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">ПК (.bat)</div>
                      <div className="text-[10px] text-slate-400">Windows Desktop</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDownloadTarget('apk')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                      downloadTarget === 'apk'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">Android (.apk)</div>
                      <div className="text-[10px] text-slate-400">Пакет приложения</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2 text-sky-400 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{language === 'ru' ? 'Как это работает на ПК' : 'How this works on PC'}</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {language === 'ru'
                    ? downloadTarget === 'pc'
                      ? 'Файл «Install-LiteNote-PC.bat» при запуске на вашем ПК автоматически создает настоящий ярлык LiteNote на вашем Рабочем столе Windows и в меню «Пуск» с отдельным окном приложения.'
                      : 'Файл «LiteNote-Launcher-v2.4.0.apk» устанавливается на Android для быстрого запуска LiteNote.'
                    : downloadTarget === 'pc'
                      ? 'The "Install-LiteNote-PC.bat" script automatically creates real LiteNote shortcuts on your Windows Desktop and Start Menu running in standalone app mode.'
                      : 'The "LiteNote-Launcher-v2.4.0.apk" installs the LiteNote standalone launcher on Android.'}
                </p>
              </div>

              {downloadSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 justify-center font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'ru' ? 'Файл скачивается!' : 'Download started!'}</span>
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
                    onClick={() => handleConfirmDownload(downloadTarget)}
                    style={{ backgroundColor: theme.hex }}
                    className="flex-1 py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {downloading ? (
                      <span>{language === 'ru' ? 'Скачивание...' : 'Downloading...'}</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4 stroke-[2.5]" />
                        <span>{language === 'ru' ? 'Скачать файл' : 'Download'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guide Modal for Native PWA Installation */}
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
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {language === 'ru' ? 'Настоящая установка приложения' : 'Native App Installation'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'ru' ? 'Установка прямо в операционную систему' : 'Install directly into OS'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
                <p className="text-slate-300 leading-relaxed">
                  {language === 'ru'
                    ? 'Так как предпросмотр запущен во фрейме песочницы, браузер блокирует прямое всплывающее окно установки. Для полноценной установки приложения в систему:'
                    : 'Inside the preview frame, direct install prompts are restricted by the sandbox. To install natively:'}
                </p>
                <div className="pt-1">
                  <a
                    href="https://ais-pre-xcpecwjouq7heproeidavo-138388183966.asia-southeast1.run.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{language === 'ru' ? 'Открыть в отдельной вкладке для установки' : 'Open in New Tab to Install'}</span>
                  </a>
                </div>
              </div>

              {isIOS ? (
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                      1
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <span>{language === 'ru' ? 'В Safari нажмите кнопку ' : 'In Safari tap '}</span>
                      <strong className="text-white inline-flex items-center gap-1 mx-1">
                        <Share className="w-3.5 h-3.5 text-sky-400" />
                        {language === 'ru' ? '«Поделиться»' : '«Share»'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                      2
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <span>{language === 'ru' ? 'Выберите ' : 'Select '}</span>
                      <strong className="text-white inline-flex items-center gap-1 mx-1">
                        <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                        {language === 'ru' ? '«На экран "Домой"»' : '«Add to Home Screen»'}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                      1
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <span>
                        {language === 'ru'
                          ? 'В браузере (Chrome / Edge / Яндекс): нажмите на иконку ⊕ или меню ⋮ → «Установить LiteNote».'
                          : 'In Chrome / Edge: click the ⊕ install icon in the address bar or menu ⋮ → «Install LiteNote».'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                      2
                    </div>
                    <div className="flex-1 leading-relaxed">
                      <span>
                        {language === 'ru'
                          ? 'Windows/Android установит полноценное приложение со своим значком в меню «Пуск» и на Рабочем столе.'
                          : 'Windows/Android registers a standalone app shortcut in Start Menu and Desktop.'}
                      </span>
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

