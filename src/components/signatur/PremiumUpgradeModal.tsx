// src/components/signatur/PremiumUpgradeModal.tsx
import { useEffect, useRef } from 'react';
import { X, Lock } from 'lucide-react';
import { UpgradeButton } from '@/src/components/UpgradeButton';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface PremiumUpgradeModalProps {
  clusterName: string;
  onClose: () => void;
}

export function PremiumUpgradeModal({ clusterName, onClose }: PremiumUpgradeModalProps) {
  const { lang } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'de' ? 'Premium freischalten' : 'Unlock Premium'}
        tabIndex={-1}
        className="relative mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0A0C10] p-6 shadow-[0_0_40px_rgba(212,175,55,0.15)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-white/40 transition hover:text-white/80"
          aria-label={lang === 'de' ? 'Schließen' : 'Close'}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10">
            <Lock className="h-5 w-5 text-[#D4AF37]" />
          </div>
        </div>

        <h2 className="mb-2 text-center font-serif text-xl text-[#D4AF37]">
          {clusterName}
        </h2>
        <p className="mb-5 text-center text-sm leading-relaxed text-white/60">
          {lang === 'de'
            ? 'Dieser Cluster ist Teil des Premium-Erlebnisses. Schalte tiefere Einblicke in deine Signatur frei.'
            : 'This cluster is part of the premium experience. Unlock deeper insights into your signature.'}
        </p>

        <div className="flex justify-center">
          <UpgradeButton
            label={lang === 'de' ? 'Premium freischalten' : 'Unlock Premium'}
            className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#00050A] transition-colors hover:bg-[#D4AF37]/90 disabled:cursor-wait disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  );
}
