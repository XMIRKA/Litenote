import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CallSession } from '../../types';
import { Phone, PhoneOff, Video, Users, Shield, Radio, Sparkles } from 'lucide-react';

interface IncomingCallModalProps {
  call: CallSession;
  onAccept: (call: CallSession) => void;
  onDecline: (call: CallSession) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onDecline,
}) => {
  const { language } = useAuth();
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<any>(null);

  // Play realistic incoming ringtone melody using Web Audio API
  useEffect(() => {
    let ctx: AudioContext | null = null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const playRingChime = () => {
        if (!ctx || ctx.state === 'closed') return;
        try {
          const now = ctx.currentTime;
          // Dual frequency phone ring tone (440Hz + 480Hz standard)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);

          // Pulse 1
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
          gain.gain.setValueAtTime(0.12, now + 0.8);
          gain.gain.linearRampToValueAtTime(0, now + 0.85);

          // Pulse 2
          gain.gain.setValueAtTime(0, now + 1.1);
          gain.gain.linearRampToValueAtTime(0.12, now + 1.15);
          gain.gain.setValueAtTime(0.12, now + 1.95);
          gain.gain.linearRampToValueAtTime(0, now + 2.0);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 2.1);
          osc2.stop(now + 2.1);
        } catch (e) {}
      };

      playRingChime();
      ringtoneIntervalRef.current = setInterval(playRingChime, 3800);
    } catch (e) {
      console.warn('Web Audio incoming ringtone initialization:', e);
    }

    return () => {
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const isVideo = call.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in select-none">
      <div className="relative w-full max-w-sm max-h-[95dvh] overflow-y-auto bg-[#080B12] border border-white/15 rounded-3xl p-5 sm:p-7 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col items-center text-center">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Incoming Banner */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200 text-xs font-mono mb-4 sm:mb-6">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">
            {call.isGroup || (call.participants && call.participants.length > 2)
              ? isVideo
                ? language === 'ru'
                  ? 'Групповой HD видеозвонок'
                  : 'Group HD Video Call'
                : language === 'ru'
                ? 'Групповой HD аудиозвонок'
                : 'Group HD Voice Call'
              : isVideo
              ? language === 'ru'
                ? 'Входящий HD видеозвонок'
                : 'Incoming HD Video Call'
              : language === 'ru'
                ? 'Входящий HD аудиозвонок'
                : 'Incoming HD Voice Call'}
          </span>
        </div>

        {/* Caller Avatar */}
        <div className="relative flex items-center justify-center mb-4 sm:mb-5">
          <span className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border border-indigo-500/30 animate-ping opacity-40 pointer-events-none" />
          <span className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border border-emerald-500/20 animate-pulse pointer-events-none" />
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 relative z-10 flex items-center justify-center">
            {call.groupAvatar || call.callerAvatar ? (
              <img
                src={call.groupAvatar || call.callerAvatar}
                alt={call.groupName || call.callerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-200 font-bold text-2xl">
                {(call.groupName || call.callerName) ? (call.groupName || call.callerName).charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
        </div>

        {/* Caller Details */}
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight truncate max-w-xs px-2">
          {call.groupName || call.callerName || 'Собеседник'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 mb-6 sm:mb-8 font-mono truncate max-w-xs px-2">
          {call.isGroup
            ? `${language === 'ru' ? 'Вызов от' : 'From'}: @${call.callerHandle} (${call.callerName})`
            : `@${call.callerHandle || 'user'}`}
        </p>

        {/* Accept / Decline Action Buttons */}
        <div className="flex items-center justify-center gap-8 sm:gap-10 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => onDecline(call)}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-all cursor-pointer"
              title="Отклонить"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              {language === 'ru' ? 'Отклонить' : 'Decline'}
            </span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => onAccept(call)}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-emerald-600/40 animate-pulse transition-all cursor-pointer"
              title="Принять"
            >
              {isVideo ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <Phone className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              {language === 'ru' ? 'Ответить' : 'Accept'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
