import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";

const EMAIL_STORAGE_KEY = "bazodiac_email";

export function AuthGate() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  // Prefill email from localStorage (returning visitors)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EMAIL_STORAGE_KEY);
      if (saved) setEmail(saved);
    } catch {
      // silent
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password confirmation for signup
    if (mode === "signup" && password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setBusy(true);

    const err =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password);

    setBusy(false);

    if (err) {
      setError(err);
      return;
    }

    // Persist email for next visit
    try {
      localStorage.setItem(EMAIL_STORAGE_KEY, email);
    } catch {
      // silent
    }

    if (mode === "signup") {
      setSignupDone(true);
    }
  };

  if (signupDone) {
    return (
      <div className="fixed inset-0 z-[90] bg-obsidian flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md px-8"
        >
          <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-gold/60 mb-6">
            Bazodiac
          </p>
          <h2 className="font-serif text-2xl mb-4">Prüfe dein Postfach</h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Wir haben dir eine Bestätigungs-E-Mail gesendet. Klicke auf den Link, um dein Konto zu aktivieren.
          </p>
          <button
            onClick={() => {
              setSignupDone(false);
              setMode("login");
            }}
            className="px-8 py-3 border border-gold/20 text-gold text-[10px] uppercase tracking-[0.4em] hover:bg-gold/5 hover:border-gold/40 transition-all"
          >
            Zum Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] bg-obsidian flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm px-8"
      >
        <div className="text-center mb-10">
          <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-gold/60 mb-4">
            Bazodiac
          </p>
          <h2 className="font-serif text-2xl mb-2">
            {mode === "login" ? "Willkommen zurück" : "Konto erstellen"}
          </h2>
          <p className="text-white/40 text-xs">
            {mode === "login"
              ? "Melde dich an, um dein Chart zu sehen."
              : "Erstelle ein Konto, um dein Chart zu speichern."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.3em] text-gold/50 mb-2">
              E-Mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-gold/10 rounded-lg px-4 py-3 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors"
              placeholder="du@beispiel.de"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-[0.3em] text-gold/50 mb-2">
              Passwort
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-gold/10 rounded-lg px-4 py-3 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors"
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-[9px] uppercase tracking-[0.3em] text-gold/50 mb-2">
                Passwort bestätigen
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-gold/10 rounded-lg px-4 py-3 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors"
                placeholder="Passwort wiederholen"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400/80 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 border border-gold/20 text-gold text-[10px] uppercase tracking-[0.4em] hover:bg-gold/5 hover:border-gold/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy
              ? "..."
              : mode === "login"
              ? "Anmelden"
              : "Registrieren"}
          </button>
        </form>

        <p className="text-center mt-8 text-[10px] text-white/30">
          {mode === "login" ? (
            <>
              Noch kein Konto?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setConfirmPassword("");
                }}
                className="text-gold/60 hover:text-gold transition-colors underline underline-offset-2"
              >
                Registrieren
              </button>
            </>
          ) : (
            <>
              Bereits registriert?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setConfirmPassword("");
                }}
                className="text-gold/60 hover:text-gold transition-colors underline underline-offset-2"
              >
                Anmelden
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
