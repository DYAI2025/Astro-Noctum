"use client";

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useTranslations } from "@/components/i18n/TranslationProvider";
import { OAuthButtons } from "./OAuthButtons";

export default function AuthForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();
    const t = useTranslations();

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
            setSent(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="w-full max-w-md p-8 rounded-3xl bg-[var(--theme-card-surface)] backdrop-blur-xl border border-[var(--theme-card-border)] shadow-[var(--theme-card-shadow)] text-center text-[var(--app-text)]">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-[var(--theme-orb-emerald)] flex items-center justify-center">
                        <CheckCircle className="text-[var(--theme-accent)]" size={32} />
                    </div>
                </div>
                <h1 className="serif text-3xl mb-4">{t("login.sentTitle")}</h1>
                <p className="text-sm text-[var(--theme-pill-text)] mb-8 leading-relaxed">
                    {t("login.sentBody").replace('{email}', email)}
                </p>
                <button
                    onClick={() => setSent(false)}
                    className="text-[10px] uppercase tracking-widest text-[var(--theme-muted-text)] hover:text-[var(--theme-accent-strong)] transition-colors"
                >
                    {t("login.useDifferent")}
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-8 rounded-3xl bg-[var(--theme-card-surface)] backdrop-blur-xl border border-[var(--theme-card-border)] shadow-[var(--theme-card-shadow)] text-[var(--app-text)]">
            <div className="text-center mb-8">
                <h1 className="serif text-4xl mb-2">
                    {t("login.title")}
                </h1>
                <p className="mono text-[10px] text-[var(--theme-pill-text)] uppercase tracking-[0.2em]">
                    {t("login.description")}
                </p>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                    <label className="mono text-[10px] uppercase tracking-widest text-[var(--theme-pill-text)] font-bold">{t("login.email")}</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-muted-text)] group-focus-within:text-[var(--theme-accent)] transition-colors" size={16} />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[var(--theme-input-surface)] border border-[var(--theme-input-border)] rounded-xl focus:outline-none focus:border-[var(--theme-accent)] text-[var(--theme-input-text)] transition-all"
                            placeholder={t("login.placeholder")}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-4 bg-[var(--theme-accent-strong)] hover:opacity-90 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em]">
                        {loading ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <>
                                {t("login.magic")}
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </span>
                </button>
                
                <div className="text-center mt-6">
                    <p className="text-[10px] text-[var(--theme-muted-text)]">
                        {t("login.passwordless")}
                    </p>
                </div>
            </form>
            <div className="mt-8 pt-6 border-t border-[var(--theme-card-border)]">
              <OAuthButtons />
            </div>
        </div>
    );
}
