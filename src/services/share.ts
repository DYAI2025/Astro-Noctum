export async function getShareUrl(userId: string): Promise<string | null> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const { shareUrl } = await res.json();
    return shareUrl;
  } catch {
    return null;
  }
}

export function shareToWhatsApp(url: string, text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
}

export function shareToTwitter(url: string, text: string) {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
}

export function shareToLinkedIn(url: string) {
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
}

export async function copyToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
