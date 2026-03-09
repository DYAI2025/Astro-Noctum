import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { trackEvent } from "../lib/analytics";

// Known disposable / spam email domains — block on signup
const BLOCKED_DOMAINS = new Set([
  "dirtytalk.de",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamailblock.com",
  "grr.la",
  "sharklasers.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "mailinator.com",
  "maildrop.cc",
  "tempmail.com",
  "temp-mail.org",
  "throwaway.email",
  "yopmail.com",
  "yopmail.fr",
  "trashmail.com",
  "trashmail.me",
  "dispostable.com",
  "fakeinbox.com",
  "mailnesia.com",
  "tempail.com",
  "10minutemail.com",
  "mohmal.com",
  "getnada.com",
  "emailondeck.com",
  "burnermail.io",
  "discard.email",
  "mailcatch.com",
  "mintemail.com",
  "tempr.email",
  "trash-mail.com",
  "harakirimail.com",
  "spamgourmet.com",
  "mytemp.email",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "einrot.com",
  "trashmail.de",
]);

function isBlockedEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && BLOCKED_DOMAINS.has(domain);
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (isBlockedEmail(email))
      return "Diese E-Mail-Domain ist nicht erlaubt. Bitte verwende eine andere E-Mail-Adresse.";

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;

    // Supabase returns empty identities when the email is already registered
    // (no error to prevent email enumeration). Detect and redirect to login.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) return "Diese E-Mail ist bereits registriert. Bitte melde dich an.";
      trackEvent('login');
      return null;
    }

    // New user — auto-sign-in immediately (email confirmation disabled)
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr) return signInErr.message;
    trackEvent('signup');
    return null;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) trackEvent('login');
    return error?.message ?? null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
