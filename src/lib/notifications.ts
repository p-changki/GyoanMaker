/**
 * Request browser notification permission.
 * Safe to call multiple times — only prompts if not yet decided.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Send a browser notification if permission is granted and tab is not focused.
 */
export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Only notify when tab is not focused
  if (document.hasFocus()) return;

  const notification = new Notification(title, {
    icon: "/logo-icon.svg",
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
