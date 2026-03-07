"use client";

import { createClient } from "@/lib/supabase/client";
import { Github, Loader2, LucideIcon, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "@/components/i18n/TranslationProvider";

const providers: Array<{ id: 'google' | 'github'; labelKey: string; Icon: LucideIcon }> = [
  { id: 'google', labelKey: 'login.oauth.google', Icon: Sparkles },
  { id: 'github', labelKey: 'login.oauth.github', Icon: Github },
];

export function OAuthButtons() {
  const supabase = createClient();
  const t = useTranslations();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setLoadingProvider(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('OAuth error', err);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-2">
      <p className="mono text-[10px] uppercase tracking-widest text-[var(--theme-pill-text)] font-bold">{t('login.oauth')}</p>
      <div className="grid grid-cols-2 gap-3">
        {providers.map(({ id, labelKey, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleOAuth(id)}
            className="flex items-center justify-center gap-2 py-3 bg-[var(--theme-elevated-surface)] border border-[var(--theme-elevated-border)] rounded-xl text-[11px] font-semibold text-[var(--app-text)] hover:border-[var(--theme-accent)] transition-all"
          >
            {loadingProvider === id ? <Loader2 className="animate-spin" size={16} /> : <Icon size={16} />}
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
