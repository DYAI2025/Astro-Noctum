"use client";

import AuthForm from "@/components/auth/AuthForm";
import { useTranslations } from "@/components/i18n/TranslationProvider";

export default function LoginPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[var(--app-surface)] text-[var(--app-text)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--theme-accent-strong) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
      />

      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--theme-orb-emerald)] rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--theme-orb-gold)] rounded-full blur-[100px]" />

      <div className="relative z-10 w-full flex flex-col items-center">
        <AuthForm />

        <div className="mt-8 text-center">
            <p className="mono text-[10px] text-[var(--theme-muted-text)] uppercase tracking-widest">
                {t("login.tagline")}
            </p>
        </div>
      </div>
    </div>
  );
}
