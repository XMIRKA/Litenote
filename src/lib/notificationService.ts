// Comprehensive Notification Service with Web Desktop Notifications, Background Support, Service Worker & In-App Toasts

export interface InAppToast {
  id: string;
  title: string;
  message: string;
  type?: 'message' | 'friend_request' | 'reaction' | 'comment' | 'system' | 'call';
  avatarUrl?: string;
  createdAt: number;
  onClick?: () => void;
}

type ToastListener = (toasts: InAppToast[]) => void;
let activeToasts: InAppToast[] = [];
const listeners: Set<ToastListener> = new Set();
let swRegistration: ServiceWorkerRegistration | null = null;
let titleBlinkInterval: any = null;
let originalDocumentTitle = typeof document !== 'undefined' ? document.title : 'LiteNote';

// Initialize Service Worker and tab visibility handlers
export async function initNotificationService() {
  if (typeof window === 'undefined') return;
  originalDocumentTitle = document.title || 'LiteNote';

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      swRegistration = reg;
    } catch (e) {
      console.warn('Service worker registration:', e);
    }
  }

  // Clear title alert when user focuses the tab
  window.addEventListener('focus', () => {
    stopTitleFlashing();
  });
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

// Request Browser Notifications Permission
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

// Play pleasant web audio chime
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone bright notification ping
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Web audio might be restricted before interaction
  }
}

// Send Native Desktop Notification (even when tab is not focused or backgrounded)
export async function sendDesktopNotification(
  title: string,
  body: string,
  icon?: string,
  onClick?: () => void,
  options?: { requireInteraction?: boolean; tag?: string }
) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const defaultIcon = icon || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80';
  const defaultBadge = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&auto=format&fit=crop&q=80';

  // Flash title if document is hidden
  if (document.hidden) {
    startTitleFlashing(`🔔 ${title}`);
  }

  // Try Service Worker showNotification first (stronger background longevity)
  if (swRegistration && 'showNotification' in swRegistration) {
    try {
      await swRegistration.showNotification(title, {
        body,
        icon: defaultIcon,
        badge: defaultBadge,
        tag: options?.tag || 'litenote-message',
        requireInteraction: options?.requireInteraction || false,
        vibrate: [200, 100, 200],
        data: { url: window.location.href },
      } as any);
      return;
    } catch (swErr) {
      console.warn('SW notification fallback to window:', swErr);
    }
  }

  // Standard window Notification fallback
  try {
    const notif = new Notification(title, {
      body,
      icon: defaultIcon,
      badge: defaultBadge,
      tag: options?.tag || 'litenote-alert',
      requireInteraction: options?.requireInteraction || false,
      silent: false,
    });

    notif.onclick = () => {
      window.focus();
      stopTitleFlashing();
      if (onClick) onClick();
      notif.close();
    };
  } catch (e) {
    console.warn('Native notification dispatch failed:', e);
  }
}

// Trigger in-app floating banner & native alert simultaneously
export function pushLiveNotification(params: {
  title: string;
  message: string;
  type?: InAppToast['type'];
  avatarUrl?: string;
  onClick?: () => void;
  requireInteraction?: boolean;
}) {
  playNotificationSound();

  // 1. Native Desktop notification
  sendDesktopNotification(params.title, params.message, params.avatarUrl, params.onClick, {
    requireInteraction: params.requireInteraction,
  });

  // 2. In-App Floating Toast
  const newToast: InAppToast = {
    id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: params.title,
    message: params.message,
    type: params.type || 'system',
    avatarUrl: params.avatarUrl,
    createdAt: Date.now(),
    onClick: () => {
      stopTitleFlashing();
      if (params.onClick) params.onClick();
    },
  };

  activeToasts = [newToast, ...activeToasts].slice(0, 4); // Max 4 toasts simultaneously
  notifyToastListeners();

  // Auto remove in 5 seconds
  setTimeout(() => {
    activeToasts = activeToasts.filter((t) => t.id !== newToast.id);
    notifyToastListeners();
  }, 5000);
}

export function dismissToast(toastId: string) {
  activeToasts = activeToasts.filter((t) => t.id !== toastId);
  notifyToastListeners();
}

