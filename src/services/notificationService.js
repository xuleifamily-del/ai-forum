const CUSTOM_EVENT_NAME = 'aif-notification';

export async function requestPermission() {
  if (typeof window === 'undefined') return 'denied';
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    const res = await Notification.requestPermission();
    return res;
  } catch (e) {
    return 'denied';
  }
}

export function getPermission() {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function notify({ title, body, questionId, url }) {
  const targetUrl = url || (questionId ? `/detail/${questionId}` : '/');
  const perm = getPermission();
  if (perm === 'granted') {
    try {
      const n = new Notification(title, { body });
      n.onclick = (e) => {
        e.preventDefault();
        window.focus();
        window.location.href = targetUrl;
        n.close();
      };
      setTimeout(() => n.close(), 6000);
      return { channel: 'system' };
    } catch (e) {
      window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: { title, body, url: targetUrl } }));
      return { channel: 'toast', fallback: true };
    }
  } else {
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: { title, body, url: targetUrl } }));
    return { channel: 'toast' };
  }
}

export function notifySummaryReady({ questionId, title }) {
  return notify({
    title: '✨ AI 要点摘要已生成',
    body: `「${truncate(title, 40)}」的社区内容摘要已就绪，点击查看。`,
    questionId,
  });
}

export function notifyInitialAnswerReady({ questionId, title }) {
  return notify({
    title: '🤖 AI 初始回答已生成',
    body: `你发布的问题「${truncate(title, 40)}」已有 AI 初步回答，点击查看。`,
    questionId,
  });
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export { CUSTOM_EVENT_NAME };
