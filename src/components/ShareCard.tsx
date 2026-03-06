import { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  getShareUrl,
  shareToWhatsApp,
  shareToTwitter,
  shareToLinkedIn,
  copyToClipboard,
} from '@/src/services/share';

export function ShareCard({ sunSign, moonSign }: { sunSign: string; moonSign: string }) {
  const { user } = useAuth();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!user) return;
    const url = shareUrl || await getShareUrl(user.id);
    if (url) setShareUrl(url);
    return url;
  };

  const shareText = `My Bazodiac Fusion Reading: ${sunSign} Sun × ${moonSign} Moon. Discover yours:`;

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="font-serif text-gold text-lg">Share Your Reading</h3>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={async () => {
            const u = await handleShare();
            u && shareToWhatsApp(u, shareText);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
        >
          WhatsApp
        </button>
        <button
          onClick={async () => {
            const u = await handleShare();
            u && shareToTwitter(u, shareText);
          }}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 transition-colors"
        >
          X / Twitter
        </button>
        <button
          onClick={async () => {
            const u = await handleShare();
            u && shareToLinkedIn(u);
          }}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800 transition-colors"
        >
          LinkedIn
        </button>
        <button
          onClick={async () => {
            const u = await handleShare();
            if (u) {
              const ok = await copyToClipboard(u);
              setCopied(ok);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="px-4 py-2 bg-ash text-dawn rounded-lg text-sm hover:bg-ash/80 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
