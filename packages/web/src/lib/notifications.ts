import { truncateText } from '@clinikchat/shared';

let permissionGranted = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return true;
  }

  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  permissionGranted = result === 'granted';
  return permissionGranted;
}

export function showBrowserNotification(
  title: string,
  body: string,
  onClick?: () => void,
) {
  if (!permissionGranted || !('Notification' in window)) return;
  if (document.hasFocus()) return;

  const notification = new Notification(title, {
    body: truncateText(body, 100),
    icon: '/icons/icon-192.png',
    tag: 'clinikchat-message',
  });

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }

  setTimeout(() => notification.close(), 5000);
}
