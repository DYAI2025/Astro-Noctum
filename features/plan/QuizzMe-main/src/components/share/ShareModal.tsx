'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: {
    title: string;
    description: string;
    harmonyIndex?: number;
    sunSign?: string;
    displayName?: string;
  };
}

const SOCIAL_PLATFORMS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageCircle,
    color: '#25D366',
    getUrl: (text: string, url: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    getUrl: (text: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    icon: Twitter,
    color: '#1DA1F2',
    getUrl: (text: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    getUrl: () => null, // Instagram doesn't support URL sharing
  },
];

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareData,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareText = shareData.harmonyIndex
    ? `Mein kosmischer Harmony-Index: ${Math.round(shareData.harmonyIndex * 100)}% - ${shareData.title}`
    : shareData.title;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: (typeof SOCIAL_PLATFORMS)[number]) => {
    const url = platform.getUrl(shareText, shareUrl);
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    } else if (platform.id === 'instagram') {
      // Instagram: Copy to clipboard for manual paste
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert('Link kopiert! Füge ihn in deiner Instagram Story ein.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      data-testid="share-modal-overlay"
    >
      <div
        className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid="share-modal"
      >
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-br from-[#0E1B33] to-[#1a2c4e] text-white overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C9A46A]/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#8F7AD1]/20 blur-3xl rounded-full" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            data-testid="share-modal-close"
          >
            <X size={20} />
          </button>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-xl">
                <Share2 size={20} className="text-[#C9A46A]" />
              </div>
              <h2 className="text-xl font-bold">Teilen</h2>
            </div>

            {shareData.harmonyIndex !== undefined && (
              <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/10">
                <Sparkles size={24} className="text-[#C9A46A]" />
                <div>
                  <div className="mono text-[10px] uppercase tracking-wider text-white/60">
                    Harmony Index
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(shareData.harmonyIndex * 100)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Preview */}
          <div className="p-4 bg-[#F6F3EE] rounded-xl border border-[#E6E0D8]">
            <p className="text-[13px] text-[#0E1B33] font-medium mb-1">
              {shareData.title}
            </p>
            <p className="text-[11px] text-[#5A6477]">{shareData.description}</p>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-4 gap-3">
            {SOCIAL_PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  onClick={() => handleShare(platform)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-[#F6F3EE] transition-colors group"
                  data-testid={`share-${platform.id}`}
                >
                  <div
                    className="p-3 rounded-full transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <Icon size={20} style={{ color: platform.color }} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#5A6477]">
                    {platform.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-3 p-4 bg-[#F6F3EE] rounded-xl border border-[#E6E0D8] hover:border-[#C9A46A] transition-colors"
            data-testid="share-copy-link"
          >
            {copied ? (
              <>
                <Check size={18} className="text-green-500" />
                <span className="text-[12px] font-bold text-green-600">Link kopiert!</span>
              </>
            ) : (
              <>
                <LinkIcon size={18} className="text-[#5A6477]" />
                <span className="text-[12px] font-bold text-[#5A6477]">Link kopieren</span>
              </>
            )}
          </button>

          {/* Native Share (if supported) */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full p-4 bg-[#0E1B33] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#1a2c4e] transition-colors"
              data-testid="share-native"
            >
              Mehr Optionen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
