import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CallSession, UserProfile } from '../../types';
import {
  createCallDoc,
  updateCallDoc,
  subscribeActiveCall,
  addCallCandidateDoc,
} from '../../lib/firebase';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Maximize2,
  Minimize2,
  Users,
  Shield,
  Volume2,
  VolumeX,
  RotateCw,
  Sparkles,
  Settings,
  Grid,
  Square,
  Activity,
  Layers,
  Check,
  X,
  Radio,
} from 'lucide-react';

interface CallModalProps {
  isOpen: boolean;
  callSession: CallSession;
  isCaller: boolean;
  recipient: UserProfile | { uid: string; displayName: string; handle: string; avatarUrl?: string } | null;
  onClose: (durationSeconds: number, callType: 'voice' | 'video', status?: 'completed' | 'missed' | 'declined') => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  callSession,
  isCaller,
  recipient,
  onClose,
}) => {
  const { user, language } = useAuth();

  const [callStatus, setCallStatus] = useState<'dialing' | 'connecting' | 'connected' | 'declined' | 'missed' | 'ended'>('dialing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callSession.callType === 'video');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'focus' | 'grid' | 'pip'>('focus');
  const [swappedViews, setSwappedViews] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<{ audioInputs: MediaDeviceInfo[]; videoInputs: MediaDeviceInfo[] }>({
    audioInputs: [],
    videoInputs: [],
  });
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');

  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const queuedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<any>(null);
  const dialTimeoutRef = useRef<any>(null);
  const candidateIndexMapRef = useRef<{ caller: number; callee: number }>({ caller: 0, callee: 0 });

  // Web Audio Ringtone for Caller (outgoing dial tone)
  const startOutgoingTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const playBeep = () => {
        if (!ctx || ctx.state === 'closed') return;
        try {
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.setValueAtTime(425, now);
          osc2.frequency.setValueAtTime(425, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
          gain.gain.setValueAtTime(0.08, now + 1.2);
          gain.gain.linearRampToValueAtTime(0, now + 1.25);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.3);
          osc2.stop(now + 1.3);
        } catch (e) {}
      };

      playBeep();
      ringtoneIntervalRef.current = setInterval(playBeep, 3500);
    } catch (e) {
      console.warn('Outgoing tone init error:', e);
    }
  };

  const stopOutgoingTone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const playChime = (type: 'connected' | 'hangup' | 'busy') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'connected') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'hangup') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'busy') {
        osc.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.setValueAtTime(0, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
      setTimeout(() => {
        if (ctx.state !== 'closed') ctx.close().catch(() => {});
      }, 500);
    } catch (e) {}
  };

  // Enumerate Media Devices for selector
  const refreshDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices({ audioInputs, videoInputs });
      }
    } catch (e) {}
  };

  // Native Fullscreen API integration
  const toggleNativeFullscreen = useCallback(() => {
    const target = modalContainerRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => setIsFullscreen(true));
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, []);

  // Listen to native fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Keyboard Shortcuts (F = Fullscreen, M = Mute, V = Video, Esc = Close FS)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'f' || e.key === 'F') {
        toggleNativeFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'v' || e.key === 'V') {
        toggleVideo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMuted, isVideoEnabled, toggleNativeFullscreen]);

  // Main Call Initialization
  useEffect(() => {
    if (!isOpen || !callSession) return;

    let isMounted = true;
    candidateIndexMapRef.current = { caller: 0, callee: 0 };
    setDuration(0);
    setIsVideoEnabled(callSession.callType === 'video');

    const setupCall = async () => {
      try {
        await refreshDevices();

        // 1. Capture Ultra High Definition Local Media
        let stream: MediaStream | null = null;
        try {
          if (callSession.callType === 'video') {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1920, min: 1280, max: 1920 },
                height: { ideal: 1080, min: 720, max: 1080 },
                frameRate: { ideal: 30, max: 60 },
                facingMode: cameraFacing,
                deviceId: selectedVideoId ? { exact: selectedVideoId } : undefined,
              },
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: 2,
                sampleRate: 48000,
                deviceId: selectedAudioId ? { exact: selectedAudioId } : undefined,
              },
            });
          } else {
            stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: 2,
                sampleRate: 48000,
                deviceId: selectedAudioId ? { exact: selectedAudioId } : undefined,
              },
            });
          }
        } catch (err) {
          console.warn('Ultra HD capture fallback to standard HD resolution:', err);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: callSession.callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
              audio: true,
            });
          } catch (err2) {
            console.warn('Fallback to audio-only stream:', err2);
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (err3) {
              console.error('Failed to capture audio/video media device:', err3);
            }
          }
        }

        if (!isMounted) {
          if (stream) stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (stream) {
          localStreamRef.current = stream;
          if (localVideoRef.current && callSession.callType === 'video') {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }
        }

        // 2. Initialize WebRTC Peer Connection with Google STUN Servers
        const rtcConfig: RTCConfiguration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ],
        };
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnectionRef.current = pc;

        // Reset queued candidates
        queuedCandidatesRef.current = [];

        // Add local tracks
        if (stream) {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream!);
          });
        }

        // Remote track handler
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            remoteStreamRef.current = event.streams[0];
          } else {
            const exists = remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id);
            if (!exists) {
              remoteStreamRef.current.addTrack(event.track);
            }
          }

          const checkVideoTrack = () => {
            const vTracks = remoteStreamRef.current.getVideoTracks();
            const hasLiveVideo = vTracks.some((t) => t.enabled && t.readyState === 'live');
            setHasRemoteVideo(hasLiveVideo);
          };

          checkVideoTrack();
          event.track.onunmute = () => checkVideoTrack();
          event.track.onmute = () => checkVideoTrack();
          event.track.onended = () => checkVideoTrack();

          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStreamRef.current;
            remoteAudioRef.current.muted = false;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.play().catch((e) => console.warn('Remote audio play ontrack:', e));
          }

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.muted = true; // Dedicated audio element handles high bitrate sound
            remoteVideoRef.current.play().catch(() => {});
          }
        };

        // Safe ICE Candidate queuing
        const applyCandidate = async (cand: RTCIceCandidateInit) => {
          if (!cand || !cand.candidate) return;
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn('ICE candidate apply error:', e);
            }
          } else {
            queuedCandidatesRef.current.push(cand);
          }
        };

        const flushQueuedCandidates = async () => {
          if (!pc.remoteDescription) return;
          const candidates = [...queuedCandidatesRef.current];
          queuedCandidatesRef.current = [];
          for (const cand of candidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn('Flushing queued candidate error:', e);
            }
          }
        };

        // ICE Candidate Gathering
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            addCallCandidateDoc(callSession.id, event.candidate.toJSON(), isCaller);
          }
        };

        // 3. Caller vs Callee Flow
        if (isCaller) {
          const isGroupCall =
            callSession.isGroupCall ||
            (callSession.participants && callSession.participants.length > 2) ||
            Boolean(recipient?.uid && recipient.uid.startsWith('group_'));

          const isRecipientOnline = isGroupCall
            ? true
            : recipient && 'status' in recipient
            ? (recipient as any).status !== 'offline'
            : true;

          if (!isRecipientOnline) {
            setCallStatus('missed');
            setStatusMessage(
              language === 'ru'
                ? 'Пользователя нет на сайте. Звонок можно поднять только когда он в сети.'
                : 'User is not on the site. Calls can only be answered while active.'
            );
            playChime('busy');
            setTimeout(() => {
              cleanupAndClose(0, 'missed');
            }, 3000);
            return;
          }

          setCallStatus('dialing');
          startOutgoingTone();

          // Generate Offer
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);

          // Save call with offer to Firestore
          const initialCallDoc: CallSession = {
            ...callSession,
            offer: {
              type: offer.type,
              sdp: offer.sdp || '',
            },
            status: 'ringing',
            startedAt: Date.now(),
          };
          await createCallDoc(initialCallDoc);

          // 35s timeout for unanswered call
          dialTimeoutRef.current = setTimeout(async () => {
            if (peerConnectionRef.current && peerConnectionRef.current.connectionState !== 'connected') {
              stopOutgoingTone();
              playChime('busy');
              setCallStatus('missed');
              setStatusMessage(language === 'ru' ? 'Абонент не отвечает' : 'No answer');
              await updateCallDoc(callSession.id, { status: 'missed', endedAt: Date.now() });
              setTimeout(() => {
                onClose(0, callSession.callType, 'missed');
              }, 2000);
            }
          }, 35000);

        } else {
          // Callee branch
          setCallStatus('connecting');

          if (callSession.offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(callSession.offer as RTCSessionDescriptionInit));
            await flushQueuedCandidates();

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateCallDoc(callSession.id, {
              status: 'connected',
              answer: {
                type: answer.type,
                sdp: answer.sdp || '',
              },
              connectedAt: Date.now(),
            });

            if (callSession.callerCandidates && callSession.callerCandidates.length > 0) {
              for (const cand of callSession.callerCandidates) {
                await applyCandidate(cand);
              }
              candidateIndexMapRef.current.caller = callSession.callerCandidates.length;
            }

            playChime('connected');
            setCallStatus('connected');
          }
        }

        // 4. Subscribe to Real-Time Updates
        const unsubscribe = subscribeActiveCall(callSession.id, async (docSnap) => {
          if (!docSnap || !isMounted) return;

          if (isCaller && docSnap.calleeCandidates) {
            const startIdx = candidateIndexMapRef.current.callee;
            for (let i = startIdx; i < docSnap.calleeCandidates.length; i++) {
              await applyCandidate(docSnap.calleeCandidates[i]);
            }
            candidateIndexMapRef.current.callee = docSnap.calleeCandidates.length;
          } else if (!isCaller && docSnap.callerCandidates) {
            const startIdx = candidateIndexMapRef.current.caller;
            for (let i = startIdx; i < docSnap.callerCandidates.length; i++) {
              await applyCandidate(docSnap.callerCandidates[i]);
            }
            candidateIndexMapRef.current.caller = docSnap.callerCandidates.length;
          }

          if (isCaller && docSnap.status === 'connected' && docSnap.answer && !pc.currentRemoteDescription) {
            if (dialTimeoutRef.current) {
              clearTimeout(dialTimeoutRef.current);
              dialTimeoutRef.current = null;
            }
            stopOutgoingTone();
            await pc.setRemoteDescription(new RTCSessionDescription(docSnap.answer as RTCSessionDescriptionInit));
            await flushQueuedCandidates();
            playChime('connected');
            setCallStatus('connected');

            if (remoteVideoRef.current && remoteStreamRef.current) {
              remoteVideoRef.current.srcObject = remoteStreamRef.current;
              remoteVideoRef.current.play().catch(() => {});
            }
          }

          if (docSnap.status === 'declined') {
            stopOutgoingTone();
            if (dialTimeoutRef.current) clearTimeout(dialTimeoutRef.current);
            playChime('busy');
            setCallStatus('declined');
            setStatusMessage(language === 'ru' ? 'Вызов отклонен' : 'Call declined');
            setTimeout(() => {
              cleanupAndClose(0, 'declined');
            }, 1800);
          }

          if (docSnap.status === 'ended') {
            stopOutgoingTone();
            if (dialTimeoutRef.current) clearTimeout(dialTimeoutRef.current);
            playChime('hangup');
            setCallStatus('ended');
            setStatusMessage(language === 'ru' ? 'Звонок завершен' : 'Call ended');
            setTimeout(() => {
              cleanupAndClose(docSnap.durationSeconds || duration, 'completed');
            }, 1200);
          }
        });

        return () => {
          unsubscribe();
        };
      } catch (err) {
        console.error('Call initialization failed:', err);
        stopOutgoingTone();
      }
    };

    setupCall();

    return () => {
      isMounted = false;
      stopOutgoingTone();
      if (dialTimeoutRef.current) clearTimeout(dialTimeoutRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [isOpen, callSession.id]);

  // Duration Timer
  useEffect(() => {
    let interval: any = null;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const cleanupAndClose = (finalDuration: number, status: 'completed' | 'missed' | 'declined') => {
    stopOutgoingTone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    onClose(finalDuration, callSession.callType, status);
  };

  const handleEndCall = async () => {
    stopOutgoingTone();
    if (dialTimeoutRef.current) clearTimeout(dialTimeoutRef.current);
    playChime('hangup');

    const nextStatus = callStatus === 'connected' ? 'ended' : 'missed';
    setCallStatus(nextStatus);

    await updateCallDoc(callSession.id, {
      status: nextStatus,
      endedAt: Date.now(),
      durationSeconds: duration,
    }).catch(() => {});

    cleanupAndClose(duration, duration > 0 ? 'completed' : 'missed');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const nextMuted = !isMuted;
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
      setIsMuted(nextMuted);
    }
  };

  const toggleVideo = async () => {
    const nextVideoState = !isVideoEnabled;
    setIsVideoEnabled(nextVideoState);

    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const activeVideoTrack = videoTracks.find((t) => t.readyState === 'live');

      if (!nextVideoState) {
        videoTracks.forEach((t) => {
          t.enabled = false;
        });
      } else {
        if (activeVideoTrack) {
          activeVideoTrack.enabled = true;
        } else {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1920, min: 1280 },
                height: { ideal: 1080, min: 720 },
                facingMode: cameraFacing,
              },
            });
            const newVideoTrack = stream.getVideoTracks()[0];
            localStreamRef.current.addTrack(newVideoTrack);

            if (peerConnectionRef.current) {
              const senders = peerConnectionRef.current.getSenders();
              const videoSender = senders.find((s) => s.track?.kind === 'video');
              if (videoSender) {
                await videoSender.replaceTrack(newVideoTrack);
              } else {
                peerConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current);
              }
            }
          } catch (e) {
            console.warn('Could not re-acquire video track:', e);
          }
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        if (nextVideoState) {
          localVideoRef.current.play().catch(() => {});
        }
      }
    }
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);

    if (localStreamRef.current && isVideoEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            facingMode: nextFacing,
          },
        });
        const newTrack = stream.getVideoTracks()[0];
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newTrack);

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(newTrack);
          }
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.warn('Failed to switch camera facing mode:', e);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor',
            frameRate: { ideal: 60, max: 60 },
          },
          audio: false,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
          localVideoRef.current.play().catch(() => {});
        }
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          revertScreenShare();
        };
      } catch (e) {
        console.warn('Screen share cancelled:', e);
      }
    } else {
      revertScreenShare();
    }
  };

  const revertScreenShare = () => {
    if (localStreamRef.current && peerConnectionRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      if (cameraTrack) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(cameraTrack);
        }
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
    }
    setIsScreenSharing(false);
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const isVideo = callSession.callType === 'video';

  return (
    <div
      ref={modalContainerRef}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isFullscreen ? 'p-0 bg-black' : 'p-0 sm:p-3 md:p-6 bg-black/95 sm:bg-black/90 backdrop-blur-2xl'
      } transition-all duration-300 select-none animate-in fade-in`}
    >
      {/* Offscreen audio element for continuous HD voice */}
      <audio
        ref={(el) => {
          remoteAudioRef.current = el;
          if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
            el.srcObject = remoteStreamRef.current;
            el.muted = false;
            el.volume = 1.0;
            el.play().catch((err) => console.warn('Remote audio play error:', err));
          }
        }}
        autoPlay
        playsInline
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Main Calling Frame (Sleek Obsidian Studio) */}
      <div
        className={`w-full ${
          isFullscreen
            ? 'h-[100dvh] max-w-none rounded-none border-0'
            : 'h-[100dvh] sm:h-[90vh] sm:max-h-[860px] max-w-6xl rounded-none sm:rounded-3xl border-0 sm:border sm:border-white/15 shadow-[0_0_80px_rgba(0,0,0,0.9)]'
        } bg-[#07090E] flex flex-col relative overflow-hidden transition-all duration-300`}
      >
        {/* Top Floating Telemetry & Info Header */}
        <div className="absolute top-0 inset-x-0 p-2.5 sm:p-4 md:p-5 pt-[max(0.6rem,env(safe-area-inset-top))] flex items-center justify-between z-30 pointer-events-none bg-gradient-to-b from-black/90 via-black/60 to-transparent gap-2">
          {/* Recipient Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pointer-events-auto">
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-900 border border-white/15 overflow-hidden flex items-center justify-center shadow-lg">
                {recipient?.avatarUrl ? (
                  <img src={recipient.avatarUrl} alt={recipient.displayName} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                )}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-[#07090E] ${
                  callStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-bold text-xs sm:text-sm md:text-base text-white tracking-tight truncate max-w-[130px] sm:max-w-[240px] md:max-w-xs">
                  {recipient?.displayName || 'Собеседник'}
                </h3>
                <span className="hidden xs:inline-flex px-1.5 sm:px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9px] sm:text-[10px] font-mono text-emerald-400 font-semibold items-center gap-1 shrink-0">
                  <Shield className="w-2.5 h-2.5" />
                  E2EE HD
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-mono text-slate-300 flex items-center gap-1.5 mt-0.5 truncate">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">
                  {statusMessage ||
                    (callStatus === 'dialing'
                      ? language === 'ru'
                        ? 'Вызов абонента...'
                        : 'Dialing...'
                      : callStatus === 'connecting'
                      ? language === 'ru'
                        ? 'Соединение WebRTC...'
                        : 'Connecting WebRTC...'
                      : callStatus === 'connected'
                      ? formatTimer(duration)
                      : language === 'ru'
                      ? 'Завершение...'
                      : 'Ending...')}
                </span>
              </p>
            </div>
          </div>

          {/* Telemetry & Quick Action Bar */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 pointer-events-auto">
            {/* Resolution indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-md">
              <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span>1080p 60fps</span>
            </div>

            {/* Layout Mode Toggle for Video calls */}
            {isVideo && callStatus === 'connected' && (
              <button
                onClick={() => setLayoutMode(layoutMode === 'focus' ? 'grid' : 'focus')}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                title={layoutMode === 'focus' ? 'Разделить экран (50/50)' : 'Фокус на собеседнике'}
              >
                {layoutMode === 'focus' ? <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            )}

            {/* Device Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
              title={language === 'ru' ? 'Настройки устройств' : 'Device Settings'}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleNativeFullscreen}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
              title={isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* Device Settings Popup Overlay */}
        {showSettings && (
          <div className="absolute top-16 sm:top-20 right-3 sm:right-6 z-40 w-72 sm:w-80 bg-slate-950/95 border border-white/15 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 text-xs text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 font-bold">
              <span>{language === 'ru' ? 'Устройства ввода' : 'Input Devices'}</span>
              <button onClick={() => setShowSettings(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mt-3">
              <div>
                <label className="text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-indigo-400" />
                  {language === 'ru' ? 'Микрофон' : 'Microphone'}
                </label>
                <select
                  value={selectedAudioId}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl p-2 text-slate-200 outline-none focus:border-indigo-500 font-mono text-[11px]"
                >
                  <option value="">{language === 'ru' ? 'По умолчанию (HD)' : 'Default (HD)'}</option>
                  {availableDevices.audioInputs.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `Микрофон ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              {isVideo && (
                <div>
                  <label className="text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-indigo-400" />
                    {language === 'ru' ? 'Камера' : 'Camera'}
                  </label>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl p-2 text-slate-200 outline-none focus:border-indigo-500 font-mono text-[11px]"
                  >
                    <option value="">{language === 'ru' ? 'По умолчанию (1080p)' : 'Default (1080p)'}</option>
                    {availableDevices.videoInputs.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Камера ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Calling Stage & Cinema Viewport */}
        <div className="flex-1 min-h-0 relative flex items-center justify-center bg-[#05070D] overflow-hidden">
          {/* Subtle Ambient Background Grid & Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(99,102,241,0.12),rgba(0,0,0,0))] pointer-events-none" />

          {isVideo ? (
            /* VIDEO CALL STAGE */
            <div className={`w-full h-full relative ${layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 p-2 sm:p-3 gap-2 sm:gap-3' : ''}`}>
              {/* Remote Participant View */}
              <div
                className={`relative w-full h-full bg-[#080B12] flex items-center justify-center overflow-hidden ${
                  layoutMode === 'grid' ? 'rounded-2xl border border-white/10' : ''
                }`}
              >
                <video
                  ref={(el) => {
                    remoteVideoRef.current = el;
                    if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                      el.srcObject = remoteStreamRef.current;
                      el.play().catch(() => {});
                    }
                  }}
                  playsInline
                  autoPlay
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    callStatus === 'connected' && hasRemoteVideo ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
                  }`}
                />

                {/* Remote Camera Off / Dialing State */}
                {(callStatus !== 'connected' || !hasRemoteVideo) && (
                  <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 p-4 text-center z-10 animate-in zoom-in-95 max-w-sm">
                    <div className="relative flex items-center justify-center">
                      {callStatus === 'dialing' || callStatus === 'connecting' ? (
                        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-indigo-500/40 animate-ping absolute pointer-events-none" />
                      ) : null}
                      <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 relative z-10 flex items-center justify-center">
                        {recipient?.avatarUrl ? (
                          <img src={recipient.avatarUrl} alt={recipient?.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-2xl sm:text-3xl font-bold text-indigo-300">
                            {recipient?.displayName ? recipient.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight truncate max-w-xs">
                        {recipient?.displayName}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-1 px-2">
                        {callStatus === 'dialing'
                          ? language === 'ru'
                            ? 'Ожидание ответа абонента...'
                            : 'Waiting for answer...'
                          : callStatus === 'connecting'
                          ? language === 'ru'
                            ? 'Соединение WebRTC HD...'
                            : 'Connecting WebRTC HD...'
                          : language === 'ru'
                          ? 'Собеседник отключил камеру (Аудиосвязь активна)'
                          : 'Remote camera disabled (HD Audio active)'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Remote Participant Label Badge */}
                <div className="absolute top-14 sm:top-4 left-3 sm:left-4 px-2.5 sm:px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] sm:text-[11px] font-medium text-white flex items-center gap-2 pointer-events-none z-10">
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">{recipient?.displayName || 'Собеседник'}</span>
                </div>
              </div>

              {/* Local User View (Picture-in-Picture in focus mode, or 2nd tile in grid mode) */}
              <div
                onClick={() => layoutMode === 'focus' && setSwappedViews(!swappedViews)}
                className={
                  layoutMode === 'grid'
                    ? 'relative w-full h-full bg-[#080B12] rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center'
                    : 'absolute top-16 right-3 sm:top-auto sm:bottom-24 sm:right-5 w-24 sm:w-48 aspect-[3/4] sm:aspect-video rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-950/95 backdrop-blur-xl z-20 transition-all duration-300 hover:scale-105 cursor-pointer group'
                }
              >
                <video
                  ref={(el) => {
                    localVideoRef.current = el;
                    if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                      localVideoRef.current.srcObject = localStreamRef.current;
                      if (isVideoEnabled) el.play().catch(() => {});
                    }
                  }}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isVideoEnabled ? 'opacity-100 block' : 'opacity-0 hidden'
                  } ${cameraFacing === 'user' && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
                />

                {!isVideoEnabled && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-2 text-center animate-in fade-in">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-300 mb-1 overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <VideoOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                      )}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
                      {language === 'ru' ? 'Камера выкл' : 'Camera off'}
                    </span>
                  </div>
                )}

                {/* Overlay Indicators for Local tile */}
                <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 px-1.5 sm:px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[9px] sm:text-[10px] font-mono text-white flex items-center gap-1 sm:gap-1.5 border border-white/10">
                  {isMuted ? <MicOff className="w-2.5 h-2.5 text-rose-400" /> : <Mic className="w-2.5 h-2.5 text-emerald-400" />}
                  <span>{language === 'ru' ? 'Вы' : 'You'}</span>
                </div>

                {/* Flip camera on hover */}
                {isVideoEnabled && !isScreenSharing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCameraFacing();
                    }}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 rounded-lg bg-black/70 hover:bg-black text-white border border-white/10 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                    title={language === 'ru' ? 'Сменить камеру' : 'Switch Camera'}
                  >
                    <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* VOICE CALL STAGE (Minimalist High-End Studio) */
            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 z-10 animate-in zoom-in-95 px-4 text-center">
              <div className="relative flex items-center justify-center">
                {callStatus === 'dialing' && (
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-indigo-500/30 animate-ping absolute pointer-events-none" />
                )}
                {callStatus === 'connected' && (
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-emerald-500/25 animate-pulse absolute pointer-events-none" />
                )}

                <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.8)] bg-slate-900 relative z-10 flex items-center justify-center">
                  {recipient?.avatarUrl ? (
                    <img src={recipient.avatarUrl} alt={recipient?.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-3xl sm:text-4xl font-bold text-indigo-300">
                      {recipient?.displayName ? recipient.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate max-w-xs">{recipient?.displayName || 'Собеседник'}</h2>
                <p className="text-xs font-mono text-slate-400">
                  {callStatus === 'connected'
                    ? `${language === 'ru' ? 'Длительность' : 'Duration'}: ${formatTimer(duration)}`
                    : callStatus === 'dialing'
                    ? language === 'ru'
                      ? 'Вызов абонента...'
                      : 'Calling...'
                    : language === 'ru'
                    ? 'Соединение...'
                    : 'Connecting...'}
                </p>
              </div>

              {/* Dynamic Equalizer Frequency Waves */}
              {callStatus === 'connected' && (
                <div className="flex items-center gap-1 h-8 sm:h-10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
                  {[30, 60, 90, 45, 100, 75, 50, 85, 95, 40, 70, 55, 90, 65, 35, 80, 50, 75].map((val, idx) => (
                    <span
                      key={idx}
                      className="w-1 rounded-full bg-emerald-400 animate-pulse"
                      style={{
                        height: `${val}%`,
                        animationDuration: `${0.6 + (idx % 4) * 0.2}s`,
                        animationDelay: `${idx * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Frosted Bottom Control Dock */}
        <div className="p-3 sm:p-4 md:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/95 via-black/85 to-transparent flex items-center justify-center z-30 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-2 rounded-2xl bg-slate-950/90 border border-white/15 backdrop-blur-2xl shadow-2xl">
            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className={`p-2.5 sm:p-3.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-900 text-white hover:bg-slate-800 border border-white/10'
              }`}
              title={isMuted ? 'Включить микрофон (M)' : 'Выключить микрофон (M)'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Camera Toggle */}
            {isVideo && (
              <button
                onClick={toggleVideo}
                className={`p-2.5 sm:p-3.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
                  !isVideoEnabled
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-slate-900 text-white hover:bg-slate-800 border border-white/10'
                }`}
                title={isVideoEnabled ? 'Выключить камеру (V)' : 'Включить камеру (V)'}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}

            {/* Screen Sharing Toggle */}
            {isVideo && (
              <button
                onClick={toggleScreenShare}
                className={`p-2.5 sm:p-3.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
                  isScreenSharing
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400'
                    : 'bg-slate-900 text-white hover:bg-slate-800 border border-white/10'
                }`}
                title="Демонстрация экрана Full HD"
              >
                <Monitor className="w-5 h-5" />
              </button>
            )}

            {/* Switch Camera Facing (Mobile / Tablet) */}
            {isVideo && isVideoEnabled && !isScreenSharing && (
              <button
                onClick={toggleCameraFacing}
                className="p-2.5 sm:p-3.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 border border-white/10 transition-all active:scale-95 cursor-pointer"
                title="Переключить камеру"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-2 shadow-xl shadow-rose-600/40 active:scale-95 transition-all cursor-pointer"
              title="Завершить звонок"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-mono font-bold uppercase tracking-wider">
                {language === 'ru' ? 'Завершить' : 'End'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
