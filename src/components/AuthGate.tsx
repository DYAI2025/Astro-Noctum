import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

const EMAIL_STORAGE_KEY = "bazodiac_email";

export function AuthGate() {
  const { signIn, signUp } = useAuth();
  const { lang, setLang, t } = useLanguage();

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
        </section>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 h-px bg-gold/10" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/20">
            {lang === "de" ? "oder" : "or"}
          </span>
          <div className="flex-1 h-px bg-gold/10" />
        </div>

        {/* ── Register Section ───────────────────────────────────────── */}
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

        {/* ── Error display ──────────────────────────────────────────── */}
        {error && (
          <p className="text-red-400/80 text-xs text-center mt-6">{error}</p>
        )}
      </motion.div>
    </div>
  );
}
