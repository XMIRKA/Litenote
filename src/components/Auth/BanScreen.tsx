import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserPenalty } from '../../types';
import { Ban, Clock, ShieldAlert, LogOut } from 'lucide-react';

interface BanScreenProps {
  penalty: UserPenalty;
}

export const BanScreen: React.FC<BanScreenProps> = ({ penalty }) => {
  const { user, logout, language } = useAuth();

  const formatRemainingPenalty = (expiresAt: number) => {
    if (expiresAt === 0) return language === 'ru' ? 'Перманентно (Навсегда)' : 'Permanent';
    const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    const d = Math.floor(diff / 86400);
    const h = Math.floor((diff % 86400) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (d > 0) return `${d}д ${h}ч ${m}м`;
    if (h > 0) return `${h}ч ${m}м ${s}с`;
    return `${m}м ${s}с`;
  };

  return (
    <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-[#0F172A] border border-rose-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <Ban className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">
            {language === 'ru' ? 'Доступ к LiteNote заблокирован' : 'Account Suspended'}
          </h2>
          <p className="text-xs text-slate-400">
            {language === 'ru'
              ? 'Ваш аккаунт был временно или навсегда заблокирован модератором сервиса.'
              : 'Your account has been suspended by a moderator for rule violations.'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>{language === 'ru' ? 'Причина:' : 'Reason:'}</span>
            <span className="font-semibold text-rose-400">{penalty.reason || 'Нарушение правил'}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>{language === 'ru' ? 'Кем выдано:' : 'Issued By:'}</span>
            <span className="font-semibold text-slate-300">{penalty.issuedBy || 'Модератор'}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>{language === 'ru' ? 'Оставшийся срок:' : 'Remaining:'}</span>
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRemainingPenalty(penalty.expiresAt)}</span>
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <LogOut className="w-4 h-4" />
          <span>{language === 'ru' ? 'Выйти из аккаунта' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );
};
