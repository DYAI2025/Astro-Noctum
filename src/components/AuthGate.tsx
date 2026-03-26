import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

const EMAIL_STORAGE_KEY = "bazodiac_email";

export function AuthGate() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { lang, setLang, t } = useLanguage();

  // ── View State ────────────────────────────────────────────────────────
  const [view, setView] = useState<"login" | "register" | "reset">("login");

  // ── Login fields ──────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // ── Register fields ───────────────────────────────────────────────────
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  // ── Shared state ──────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Prefill login email from localStorage (returning visitors)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EMAIL_STORAGE_KEY);
      if (saved) setLoginEmail(saved);
    } catch {
      // silent
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = await signIn(loginEmail, loginPassword);
    setBusy(false);
    if (err) { setError(err); return; }
    try { localStorage.setItem(EMAIL_STORAGE_KEY, loginEmail); } catch { /* silent */ }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerPassword !== registerConfirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setBusy(true);
    const err = await signUp(registerEmail, registerPassword);
    setBusy(false);
    if (err) { setError(err); return; }
    try { localStorage.setItem(EMAIL_STORAGE_KEY, registerEmail); } catch { /* silent */ }
    // With email confirmation disabled, signUp auto-signs-in via AuthContext.
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = await resetPassword(loginEmail);
    setBusy(false);
    if (err) { setError(err); return; }
    setResetSent(true);
  };

  // ── Shared input style ────────────────────────────────────────────────
  const inputCls =
    "w-full bg-white/[0.03] border border-gold/10 rounded-lg px-4 py-3 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors";

  const labelCls = "block text-[9px] uppercase tracking-[0.3em] text-gold/50 mb-2";

  const btnCls =
    "w-full py-3 border border-gold/20 text-gold text-[10px] uppercase tracking-[0.4em] hover:bg-gold/5 hover:border-gold/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed";

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[90] bg-obsidian flex items-center justify-center overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm px-8 py-12"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-gold/60 mb-2">
            Bazodiac
          </p>
        </div>

        {/* ── Login Section ──────────────────────────────────────────── */}
        {view === "login" && (
        <section>
          <h2 className="font-serif text-2xl mb-4 text-center">
            {lang === "de" ? "Einloggen" : "Login"}
          </h2>
          <p className="text-white/40 text-xs text-center mb-6">
            {lang === "de"
              ? "Melde dich an, um dein Chart zu sehen."
              : "Sign in to view your chart."}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={labelCls}>{t("auth.emailLabel")}</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => { setLoginEmail(e.target.value); if (error) setError(null); }}
                className={inputCls}
                placeholder={t("auth.emailPlaceholder")}
              />
            </div>
            <div>
              <label className={labelCls}>{t("auth.passwordLabel")}</label>
              <input
                type="password"
                required
                minLength={6}
                value={loginPassword}
                onChange={(e) => { setLoginPassword(e.target.value); if (error) setError(null); }}
                className={inputCls}
                placeholder={t("auth.passwordPlaceholder")}
              />
            </div>
            <button type="submit" disabled={busy} className={btnCls}>
              {busy ? "…" : lang === "de" ? "Einloggen" : "Login"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setView("reset"); setError(null); setResetSent(false); }}
            className="w-full text-center mt-4 text-white/30 text-[10px] hover:text-white/50 transition-colors"
          >
            {lang === "de" ? "Passwort vergessen?" : "Forgot password?"}
          </button>
        </section>

        )}

        {/* ── Divider & CTA ──────────────────────────────────────────── */}
        {view === "login" && (
          <>
            <div className="flex items-center gap-4 my-10">
              <div className="flex-1 h-px bg-gold/10" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/20"></span>
              <div className="flex-1 h-px bg-gold/10" />
            </div>
            
            <button
              onClick={() => { setView("register"); setError(null); }}
              className="w-full py-3 border border-gold/20 text-gold text-[10px] uppercase tracking-[0.4em] hover:bg-gold/5 hover:border-gold/40 transition-all font-medium"
            >
              {lang === "de" ? "Jetzt registrieren" : "Register now"}
            </button>
          </>
        )}

        {/* ── Register Section ───────────────────────────────────────── */}
        {view === "register" && (
        <section>
          <h2 className="font-serif text-2xl font-bold mb-4 text-center">
            {lang === "de" ? "Registrieren" : "Register"}
          </h2>
          <p className="text-white/40 text-xs text-center mb-6">
            {lang === "de"
              ? "Erstelle ein Konto, um dein Chart zu speichern."
              : "Create an account to save your chart."}
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className={labelCls}>{t("auth.emailLabel")}</label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => { setRegisterEmail(e.target.value); if (error) setError(null); }}
                className={inputCls}
                placeholder={t("auth.emailPlaceholder")}
              />
            </div>
            <div>
              <label className={labelCls}>{t("auth.passwordLabel")}</label>
              <input
                type="password"
                required
                minLength={6}
                value={registerPassword}
                onChange={(e) => { setRegisterPassword(e.target.value); if (error) setError(null); }}
                className={inputCls}
                placeholder={t("auth.passwordPlaceholder")}
              />
            </div>
            <div>
              <label className={labelCls}>
                {lang === "de" ? "Passwort bestätigen" : "Confirm password"}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={registerConfirmPassword}
                onChange={(e) => { setRegisterConfirmPassword(e.target.value); if (error) setError(null); }}
                className={inputCls}
                placeholder={lang === "de" ? "Passwort wiederholen" : "Repeat password"}
              />
            </div>
            <div>
              <label className={labelCls}>
                {lang === "de" ? "Sprache" : "Language"}
              </label>
              <select
                aria-label="Sprache"
                value={lang}
                onChange={(e) => setLang(e.target.value as "de" | "en")}
                className={inputCls}
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>
            <button type="submit" disabled={busy} className={btnCls}>
              {busy ? "…" : lang === "de" ? "Konto erstellen" : "Create account"}
            </button>
          </form>
        </section>

        )}

        {/* ── Back to Login CTA ──────────────────────────────────────── */}
        {view === "register" && (
          <div className="mt-8 text-center">
            <button
              onClick={() => { setView("login"); setError(null); }}
              className="text-white/40 text-xs hover:text-white transition-colors underline decoration-white/30 underline-offset-4"
            >
              {lang === "de" ? "Zurück zum Login" : "Back to login"}
            </button>
          </div>
        )}

        {/* ── Reset Password Section ────────────────────────────────── */}
        {view === "reset" && (
        <section>
          <h2 className="font-serif text-2xl mb-4 text-center">
            {lang === "de" ? "Passwort zurücksetzen" : "Reset password"}
          </h2>
          {resetSent ? (
            <div className="text-center space-y-4">
              <p className="text-white/60 text-xs">
                {lang === "de"
                  ? "Wir haben dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts gesendet."
                  : "We've sent you an email with a link to reset your password."}
              </p>
              <button
                onClick={() => { setView("login"); setResetSent(false); setError(null); }}
                className={btnCls}
              >
                {lang === "de" ? "Zurück zum Login" : "Back to login"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-white/40 text-xs text-center mb-4">
                {lang === "de"
                  ? "Gib deine E-Mail-Adresse ein und wir senden dir einen Link."
                  : "Enter your email and we'll send you a reset link."}
              </p>
              <div>
                <label className={labelCls}>{t("auth.emailLabel")}</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); if (error) setError(null); }}
                  className={inputCls}
                  placeholder={t("auth.emailPlaceholder")}
                />
              </div>
              <button type="submit" disabled={busy} className={btnCls}>
                {busy ? "…" : lang === "de" ? "Link senden" : "Send link"}
              </button>
            </form>
          )}
        </section>
        )}

        {/* ── Reset Back to Login ──────────────────────────────────────── */}
        {view === "reset" && !resetSent && (
          <div className="mt-8 text-center">
            <button
              onClick={() => { setView("login"); setError(null); }}
              className="text-white/40 text-xs hover:text-white transition-colors underline decoration-white/30 underline-offset-4"
            >
              {lang === "de" ? "Zurück zum Login" : "Back to login"}
            </button>
          </div>
        )}

        {/* ── Error display ──────────────────────────────────────────── */}
        {error && (
          <p className="text-red-400/80 text-xs text-center mt-6">{error}</p>
        )}
      </motion.div>
    </div>
  );
}
