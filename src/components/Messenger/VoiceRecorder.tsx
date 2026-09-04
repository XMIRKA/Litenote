import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { Trash2, Send, Mic, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (audioDataUrl: string, durationSeconds: number, waveform: number[]) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoice,
  onCancel,
}) => {
  const { accentColor, language } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([25, 40, 60, 80, 50, 35, 65, 90, 55, 35, 60, 75, 45, 30, 70, 50, 35, 65]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const finalDurationRef = useRef<number>(1);

  useEffect(() => {
    // Stop any existing audio playing across the app so microphone won't pick up speaker sound/echo
    window.dispatchEvent(new CustomEvent('litenote-pause-all-audio', { detail: { exceptId: '' } }));

    startAudioRecording();
    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const startAudioRecording = async () => {
    try {
      const audioConstraints: any = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioContext = new AudioCtx();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          const sampled: number[] = [];
          for (let i = 0; i < 22; i++) {
            const val = dataArray[i % bufferLength] || 15;
            const normalized = Math.max(18, Math.min(100, Math.floor((val / 255) * 120)));
            sampled.push(normalized);
          }
          setAudioLevels(sampled);
          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }

      // Pick best supported MIME type
      let selectedMimeType = '';
      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4',
        'audio/aac',
      ];

      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        for (const type of preferredTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            selectedMimeType = type;
            break;
          }
        }
      }

      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: 128000,
      };
      if (selectedMimeType) {
        recorderOptions.mimeType = selectedMimeType;
      }

      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          finalDurationRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone access fallback / denied:', err);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          finalDurationRef.current = next;
          return next;
        });
      }, 1000);
    }
  };

  const handleFinishAndSend = () => {
    setIsProcessing(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const duration = Math.max(1, finalDurationRef.current || recordingTime || 1);
    const capturedLevels = [...audioLevels];

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
      } catch {}

      mediaRecorderRef.current.onstop = () => {
        try {
          const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mime });

          if (audioBlob.size > 0) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              onSendVoice(base64data, duration, capturedLevels);
              stopTracks();
            };
            reader.readAsDataURL(audioBlob);
          } else {
            // Fallback synthetic wave
            onSendVoice(
              'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==',
              duration,
              capturedLevels
            );
            stopTracks();
          }
        } catch {
          stopTracks();
          onCancel();
        }
      };

      try {
        mediaRecorderRef.current.stop();
      } catch {
        stopTracks();
        onCancel();
      }
    } else {
      stopTracks();
      onCancel();
    }
  };

  const handleCancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopTracks();
    onCancel();
  };

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-[#0B0F1A] border border-white/10 rounded-xl shadow-lg animate-in fade-in select-none">
      {/* Recording Indicator & Timer */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span className="font-mono font-semibold text-xs text-rose-400">
          {formatSecs(recordingTime)}
        </span>
      </div>

      {/* Live Audio Waveform Bars */}
      <div className="flex-1 flex items-center justify-center gap-0.5 h-6 max-w-xs mx-auto px-2">
        {audioLevels.map((lvl, idx) => (
          <div
            key={idx}
            className="w-1 bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-full transition-all duration-75"
            style={{ height: `${lvl}%` }}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleCancelRecording}
          disabled={isProcessing}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          title={language === 'ru' ? 'Отмена' : 'Cancel'}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleFinishAndSend}
          disabled={isProcessing}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95 flex items-center gap-1.5 shadow transition-all disabled:opacity-60"
        >
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{language === 'ru' ? 'Готово' : 'Send'}</span>
        </button>
      </div>
    </div>
  );
};

