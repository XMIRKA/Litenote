// Comprehensive Notification Service with Web Desktop Notifications, Background Support, Service Worker & In-App Toasts

export interface InAppToast {
  id: string;
  title: string;
  message: string;
  type?: 'message' | 'friend_request' | 'reaction' | 'comment' | 'system' | 'call';
  avatarUrl?: string;
  imageUrl?: string;
  createdAt: number;
  onClick?: () => void;
}

export interface DesktopNotificationOptions {
  requireInteraction?: boolean;
  tag?: string;
  renotify?: boolean;
  image?: string;
  badge?: string;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  data?: any;
}

type ToastListener = (toasts: InAppToast[]) => void;
let activeToasts: InAppToast[] = [];
const listeners: Set<ToastListener> = new Set();
let swRegistration: ServiceWorkerRegistration | null = null;
let titleBlinkInterval: any = null;
let originalDocumentTitle = typeof document !== 'undefined' ? document.title : 'LiteNote';
let notificationClickHandlers: Array<(data: any) => void> = [];

// Helper to generate a crisp high-res stylized avatar if none is present
export function getNotificationAvatar(avatarUrl?: string, name?: string): string {
  if (avatarUrl && avatarUrl.trim() && !avatarUrl.includes('placeholder')) {
    return avatarUrl;
  }
  const cleanName = encodeURIComponent(name || 'LiteNote');
  return `https://ui-avatars.com/api/?name=${cleanName}&background=4f46e5&color=ffffff&bold=true&size=256`;
}

// Clean up markdown & special formatting from body string for clean system notifications
export function cleanNotificationBody(text?: string): string {
  if (!text) return '';
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '📷 [Изображение]')
    .replace(/\[.*?\]\(.*?\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '📄 [Код]')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~#]/g, '')
    .trim()
    .substring(0, 140);
}

// Initialize Service Worker, tab visibility handlers, and postMessage communication
export async function initNotificationService() {
  if (typeof window === 'undefined') return;
  originalDocumentTitle = document.title || 'LiteNote';

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      swRegistration = reg;

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          notificationClickHandlers.forEach((handler) => handler(event.data.data));
        }
      });
    } catch (e) {
      console.warn('Service worker registration:', e);
    }
  }

  // Clear title alert when user focuses the tab
  window.addEventListener('focus', () => {
    stopTitleFlashing();
  });
}

export function onServiceWorkerNotificationClick(handler: (data: any) => void) {
  notificationClickHandlers.push(handler);
  return () => {
    notificationClickHandlers = notificationClickHandlers.filter((h) => h !== handler);
  };
}

export function startTitleFlashing(alertText: string) {
  if (typeof document === 'undefined') return;
  stopTitleFlashing();
  let toggle = false;
  titleBlinkInterval = setInterval(() => {
    document.title = toggle ? alertText : originalDocumentTitle;
    toggle = !toggle;
  }, 1000);
}

export function stopTitleFlashing() {
  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
    titleBlinkInterval = null;
  }
  if (typeof document !== 'undefined') {
    document.title = originalDocumentTitle;
  }
}

export function subscribeToasts(callback: ToastListener) {
  listeners.add(callback);
  callback(activeToasts);
  return () => {
    listeners.delete(callback);
  };
}

function notifyToastListeners() {
  listeners.forEach((fn) => fn([...activeToasts]));
}

// Check notification permission state
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request Browser Notifications Permission with resilient fallback
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

// Play pleasant web audio chime (Apple / Telegram Style)
let sharedAudioCtx: AudioContext | null = null;
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }

    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;

    // Harmonic double chime (E5 -> A5)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc2.frequency.setValueAtTime(880.0, now + 0.08); // A5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.06, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.12);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch {
    // Non-blocking for audio playback
  }
}

// Send Native Desktop Notification (Styled with avatar, badge, rich image, tag, and actions)
export async function sendDesktopNotification(
  title: string,
  rawBody: string,
  icon?: string,
  onClick?: () => void,
  options?: DesktopNotificationOptions
) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const cleanBody = cleanNotificationBody(rawBody);
  const formattedTitle = title.includes('LiteNote') ? title : `${title} • LiteNote`;
  const notificationIcon = getNotificationAvatar(icon, title);
  const notificationBadge = '/favicon.svg';

  // Flash title if document is in background
  if (typeof document !== 'undefined' && document.hidden) {
    startTitleFlashing(`🔔 ${title}`);
  }

  // 1. Try Service Worker showNotification first (Full Rich Notification Support)
  try {
    let swReg = swRegistration;
    if (!swReg && 'serviceWorker' in navigator) {
      swReg = await navigator.serviceWorker.ready.catch(() => null);
    }

    if (swReg && 'showNotification' in swReg) {
      const swOptions: any = {
        body: cleanBody || 'Новое оповещение',
        icon: notificationIcon,
        badge: notificationBadge,
        tag: options?.tag || `litenote_${Date.now()}`,
        renotify: options?.renotify !== undefined ? options?.renotify : Boolean(options?.tag),
        requireInteraction: options?.requireInteraction || false,
        vibrate: [120, 60, 120],
        silent: false,
        timestamp: Date.now(),
        data: {
          url: window.location.href,
          ...(options?.data || {}),
        },
      };

      if (options?.image) {
        swOptions.image = options.image;
      }

      if (options?.actions && Array.isArray(options.actions)) {
        swOptions.actions = options.actions;
      }

      await swReg.showNotification(formattedTitle, swOptions);
      return;
    }
  } catch (swErr) {
    console.warn('ServiceWorker desktop notification fallback to window:', swErr);
  }

  // 2. Standard Window Notification Fallback
  try {
    const notifOptions: NotificationOptions = {
      body: cleanBody || 'Новое оповещение',
      icon: notificationIcon,
      badge: notificationBadge,
      tag: options?.tag || `litenote_${Date.now()}`,
      requireInteraction: options?.requireInteraction || false,
      silent: false,
    };

    if (options?.image && 'image' in Notification.prototype) {
      (notifOptions as any).image = options.image;
    }

    const notif = new Notification(formattedTitle, notifOptions);

    notif.onclick = () => {
      window.focus();
      stopTitleFlashing();
      if (onClick) onClick();
      notif.close();
    };
  } catch (e) {
    console.warn('Window notification dispatch failed:', e);
  }
}

// Trigger in-app floating banner & native alert simultaneously
export function pushLiveNotification(params: {
  title: string;
  message: string;
  type?: InAppToast['type'];
  avatarUrl?: string;
  imageUrl?: string;
  onClick?: () => void;
  requireInteraction?: boolean;
  tag?: string;
  renotify?: boolean;
  skipSound?: boolean;
  skipDesktop?: boolean;
  skipInAppToast?: boolean;
  actions?: Array<{ action: string; title: string }>;
  data?: any;
}) {
  if (!params.skipSound) {
    playNotificationSound();
  }

  // 1. Native Desktop notification
  if (!params.skipDesktop) {
    sendDesktopNotification(params.title, params.message, params.avatarUrl, params.onClick, {
      requireInteraction: params.requireInteraction,
      tag: params.tag,
      renotify: params.renotify,
      image: params.imageUrl,
      actions: params.actions,
      data: params.data,
    });
  }

  // 2. In-App Floating Toast (Stylized modern card)
  if (!params.skipInAppToast) {
    const newToast: InAppToast = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: params.title,
      message: cleanNotificationBody(params.message),
      type: params.type || 'system',
      avatarUrl: params.avatarUrl,
      imageUrl: params.imageUrl,
      createdAt: Date.now(),
      onClick: () => {
        stopTitleFlashing();
        if (params.onClick) params.onClick();
      },
    };

    activeToasts = [newToast, ...activeToasts].slice(0, 3); // Max 3 toasts simultaneously
    notifyToastListeners();

    // Auto remove in 5.5 seconds
    setTimeout(() => {
      activeToasts = activeToasts.filter((t) => t.id !== newToast.id);
      notifyToastListeners();
    }, 5500);
  }
}

export function dismissToast(toastId: string) {
  activeToasts = activeToasts.filter((t) => t.id !== toastId);
  notifyToastListeners();
}

