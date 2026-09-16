/**
 * Haptic Touch Feedback Engine for Mobile Devices
 * Uses navigator.vibrate with safe fallbacks
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export function triggerHaptic(type: HapticType = 'light') {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'selection':
      case 'light':
        navigator.vibrate(8);
        break;
      case 'medium':
        navigator.vibrate(18);
        break;
      case 'heavy':
        navigator.vibrate(35);
        break;
      case 'success':
        navigator.vibrate([10, 30, 15]);
        break;
      case 'warning':
        navigator.vibrate([25, 40, 25]);
        break;
      case 'error':
        navigator.vibrate([40, 50, 40, 50, 40]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch {
    // Ignore devices that block programmatic vibrations
  }
}
