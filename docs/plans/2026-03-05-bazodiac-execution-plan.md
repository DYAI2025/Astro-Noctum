# Bazodiac 14-Tage Execution Plan — Parallelisiert

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bazodiac von 80% auf LIVE + REVENUE bringen — mit Freemium/Stripe, SEO-Content, Social Sharing und optimierter Fusion-UX.

**Architecture:** Iterativer Sprint-Plan mit 6 Iterationen. Jede Iteration hat parallele Tracks (A/B/C), die von unabhängigen Subagenten gleichzeitig bearbeitet werden. Tracks innerhalb einer Iteration haben keine Abhängigkeiten zueinander. Iterationen selbst sind sequentiell (spätere brauchen Ergebnisse früherer).

**Tech Stack:** React 19 + Vite 6 + Tailwind v4 + TypeScript + Supabase + Stripe + Gemini + ElevenLabs + Express (server.mjs)

**Aktueller Stand (aus Codebase-Analyse):**
- ✅ 24h In-Memory Cache für BAFE existiert bereits (server.mjs)
- ✅ Retry-Logik mit Exponential Backoff existiert (3 Retries)
- ✅ URL-Fallback-Chain (Internal → Public BAFE) existiert
- ❌ Kein `tier` in profiles — kein Free/Premium Split
- ❌ Kein Stripe — kein Payment
- ❌ Kein robots.txt, keine sitemap.xml, keine Landing Page
- ❌ Kein Social Share / PDF Export
- ❌ Fusion-Prompt nutzt Daten nicht explizit für Cross-System-Synthese
- ❌ Keine SEO-Content-Seiten

---

## Iteration 1: Foundation — Schema + Fusion + UX Polish

**Abhängigkeiten:** Keine (Startpunkt)
**Geschätzte Komplexität:** Mittel

### Track A: Supabase Schema + Freemium-Infrastruktur

**Ziel:** `tier`-Spalte + isPremium-Logic als Grundlage für alles Weitere.

**Files:**
- Modify: `supabase-schema.sql`
- Modify: `src/contexts/AuthContext.tsx`
- Create: `src/hooks/usePremium.ts`
- Modify: `src/lib/supabase.ts`

**Step 1: Supabase Schema erweitern**

SQL via Supabase Dashboard oder Migration ausführen:

```sql
-- Add tier column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
CHECK (tier IN ('free', 'premium'));

-- Add stripe_customer_id for payment tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add stripe_payment_id for receipt reference
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

-- Index for quick tier lookups
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
```

**Step 2: usePremium Hook erstellen**

```typescript
// src/hooks/usePremium.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsPremium(false); setLoading(false); return; }

    const fetchTier = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();
      setIsPremium(data?.tier === 'premium');
      setLoading(false);
    };
    fetchTier();

    // Realtime subscription for instant upgrade reflection
    const channel = supabase
      .channel('profile-tier')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        setIsPremium(payload.new.tier === 'premium');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { isPremium, loading };
}
```

**Step 3: Commit**
```bash
git add supabase-schema.sql src/hooks/usePremium.ts
git commit -m "feat: add premium tier to profiles + usePremium hook"
```

---

### Track B: Fusion-Prompt optimieren

**Ziel:** Gemini-Prompt schärfen, damit Fusion als USP klar kommuniziert wird.

**Files:**
- Modify: `src/services/gemini.ts` (Prompt-Sektion)

**Step 1: Fusion-Prompt überarbeiten**

In `src/services/gemini.ts` den `buildPrompt()`-Abschnitt ersetzen. Der neue Prompt muss:

1. Explizit auf Cross-System-Synthese eingehen (nicht nur nebeneinander legen)
2. Den "Fusion-Satz" enthalten: "Das zeigt dir keine andere App"
3. Fusion-Daten als primären Abschnitt verwenden, nicht als Anhängsel

```typescript
// In generateInterpretation() — replace the prompt construction
const prompt = `You are Bazodiac's fusion astrologer — the ONLY system that synthesizes Western astrology, Chinese BaZi, and Wu-Xing Five Elements into one unified reading.

BIRTH DATA (JSON):
${JSON.stringify(allData, null, 2)}

TASK: Write a deeply personal ${lang === 'de' ? 'German' : 'English'} horoscope interpretation (400–500 words, 5 paragraphs, Markdown, no bullet points). Address the reader as "${lang === 'de' ? 'du' : 'you'}".

STRUCTURE — each paragraph MUST cross-reference at least two systems:

1. **Your Cosmic Identity**: Start with the Western Sun sign (${allData.western?.zodiac_sign || '?'}) and immediately bridge to the BaZi Day Master (${allData.bazi?.day_master || '?'}). What does THIS specific combination reveal that neither system alone can show?

2. **Emotional Depths**: Connect Moon sign (${allData.western?.moon_sign || '?'}) with the BaZi pillars' emotional patterns. How does Wu-Xing's dominant element (${allData.wuxing?.dominant_element || '?'}) color these emotional currents?

3. **The Fusion Revelation**: This is the core. Use the fusion data to reveal the UNIQUE intersection — the pattern that emerges ONLY when Western + BaZi + Wu-Xing are layered together. This is what no other app can show. Make this paragraph feel like a discovery.

4. **Wu-Xing Balance**: Which elements are strong, which are weak? How does this elemental map interact with the Western Ascendant (${allData.western?.ascendant_sign || '?'})? Give one concrete life recommendation based on elemental balance.

5. **Your Path Forward**: Synthesize all three systems into a forward-looking invitation. End with a sentence that makes the reader feel truly seen.

TONE: Warm, precise, mystical but grounded. Never generic. Every sentence must feel like it was written for THIS specific birth chart.`;
```

**Step 2: Fallback-Texte aktualisieren**

Die hardcoded Fallback-Texte in derselben Datei aktualisieren, um den Fusion-Aspekt zu betonen:

```typescript
const FALLBACK_DE = `## Dein Bazodiac Fusion-Blueprint

Dein kosmisches Profil vereint drei uralte Systeme zu einem Bild, das so nur Bazodiac zeichnen kann. Westliche Astrologie zeigt deine Sonnenessenz, chinesisches BaZi enthüllt die Säulen deines Schicksals, und Wu-Xing offenbart das elementare Gleichgewicht, das alles verbindet.

Diese Fusion ist mehr als die Summe ihrer Teile — sie zeigt Muster, die kein einzelnes System allein erkennen kann. Dein vollständiges Reading wird gerade vorbereitet und bald verfügbar sein.`;

const FALLBACK_EN = `## Your Bazodiac Fusion Blueprint

Your cosmic profile unites three ancient systems into a picture that only Bazodiac can paint. Western astrology reveals your solar essence, Chinese BaZi unveils the pillars of your destiny, and Wu-Xing shows the elemental balance connecting it all.

This fusion is more than the sum of its parts — it reveals patterns no single system can see alone. Your complete reading is being prepared and will be available soon.`;
```

**Step 3: Commit**
```bash
git add src/services/gemini.ts
git commit -m "feat: optimize Gemini fusion prompt for cross-system synthesis"
```

---

### Track C: UX Polish — Loading/Error States + Mobile

**Ziel:** Saubere Loading-States, klare Fehlermeldungen, Mobile-Check.

**Files:**
- Modify: `src/App.tsx` (error handling)
- Modify: `src/components/Dashboard.tsx` (loading skeletons)
- Modify: `src/components/BirthForm.tsx` (mobile fixes if needed)

**Step 1: Error Messages verbessern**

In `src/App.tsx` — alle `catch`-Blöcke prüfen und sicherstellen, dass:
- Keine "undefined" oder leere Strings als Fehlermeldung angezeigt werden
- Deutsche/Englische Fehler-Strings je nach Sprachcontext

```typescript
// Pattern for every catch block in App.tsx:
catch (err) {
  const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
  setError(lang === 'de'
    ? `Berechnung fehlgeschlagen: ${msg}. Bitte versuche es erneut.`
    : `Calculation failed: ${msg}. Please try again.`
  );
}
```

**Step 2: Dashboard Skeleton-States**

Prüfen ob Skeleton-Loading-States für die Dashboard-Sektionen existieren. Falls nicht, pro Sektion ein `skeleton-dust`-Platzhalter anzeigen während `apiData` noch null ist.

**Step 3: Mobile Responsiveness**

- BirthForm: Sicherstellen dass Date/Time-Inputs auf iOS Safari korrekt rendern
- Dashboard: Prüfen dass 3D-Orrery auf kleinen Screens nicht überlappt
- Videos aus `media/` dürfen NICHT beim ersten Load geladen werden (lazy loading prüfen)

**Step 4: Bundle-Size Check**
```bash
npm run build && ls -lah dist/assets/*.js | head -20
```

**Step 5: Commit**
```bash
git add src/App.tsx src/components/Dashboard.tsx src/components/BirthForm.tsx
git commit -m "fix: improve error messages, loading states, mobile UX"
```

---

### ✅ Iteration 1 Done-Gate
- [ ] `profiles.tier` Spalte existiert in Supabase
- [ ] `usePremium()` Hook funktioniert
- [ ] Gemini-Prompt produziert Fusion-fokussierte Interpretation
- [ ] Keine console.errors im App-Flow
- [ ] Mobile: BirthForm + Dashboard funktionieren auf kleinem Screen

---

## Iteration 2: Payment — Stripe + Freemium UI

**Abhängigkeiten:** Iteration 1 (Schema + usePremium Hook)

### Track A: Stripe Backend

**Ziel:** Checkout-Session + Webhook-Endpoint in server.mjs.

**Files:**
- Modify: `server.mjs`
- Modify: `package.json` (add stripe dependency)

**Step 1: Stripe installieren**
```bash
npm install stripe
```

**Step 2: Checkout-Endpoint in server.mjs**

```javascript
// === STRIPE INTEGRATION ===
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Create checkout session
app.post('/api/checkout', express.json(), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payment not configured' });

  const { userId, userEmail } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'payment',
      customer_email: userEmail,
      success_url: `${process.env.APP_URL || req.headers.origin}?upgrade=success`,
      cancel_url: `${process.env.APP_URL || req.headers.origin}?upgrade=cancelled`,
      metadata: { userId },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe] Checkout error:', err.message);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Webhook: Stripe → Supabase profile upgrade
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe] Webhook sig error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    if (userId) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          tier: 'premium',
          stripe_customer_id: session.customer,
          stripe_payment_id: session.payment_intent,
        })
        .eq('id', userId);

      if (error) console.error('[Stripe] Profile update failed:', error);
      else console.log(`[Stripe] User ${userId} upgraded to premium`);
    }
  }

  res.json({ received: true });
});
```

**WICHTIG:** Der Webhook-Endpoint muss VOR dem `express.json()`-Middleware-Block stehen, da er `express.raw()` braucht. Alternativ: `express.json()` nur auf spezifische Routen anwenden statt global.

**Step 3: .env.example aktualisieren**
```
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://bazodiac.com
```

**Step 4: Commit**
```bash
git add server.mjs package.json package-lock.json .env.example
git commit -m "feat: add Stripe checkout + webhook for premium upgrade"
```

---

### Track B: Freemium UI — Dashboard Split

**Ziel:** Free-User sehen eingeschränktes Reading + Premium-Teaser. Premium-User sehen alles.

**Files:**
- Create: `src/components/PremiumGate.tsx`
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/App.tsx` (upgrade success handler)

**Step 1: PremiumGate Komponente**

```tsx
// src/components/PremiumGate.tsx
import { usePremium } from '@/src/hooks/usePremium';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface Props {
  children: React.ReactNode;
  teaser?: string;
}

export function PremiumGate({ children, teaser }: Props) {
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const { t } = useLanguage();

  if (isPremium) return <>{children}</>;

  const handleUpgrade = async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, userEmail: user?.email }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-obsidian/70 rounded-2xl backdrop-blur-sm">
        <div className="text-center p-6 max-w-md">
          <h3 className="font-serif text-2xl text-gold mb-3">
            {t?.premiumTitle || 'Unlock Your Full Reading'}
          </h3>
          <p className="text-dawn/70 mb-5 text-sm">
            {teaser || t?.premiumTeaser || 'Discover the complete fusion of Western astrology, BaZi, and Wu-Xing — a reading no other app can offer.'}
          </p>
          <button
            onClick={handleUpgrade}
            className="px-6 py-3 bg-gold text-obsidian font-semibold rounded-xl hover:bg-gold/90 transition-colors"
          >
            {t?.upgradeCta || 'Upgrade — 4,99 €'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Dashboard splitten**

In `Dashboard.tsx` die Sektionen in Free und Premium aufteilen:

**Free (sichtbar für alle):**
- Sonnenzeichen + Mondzeichen + Aszendent (Western Triad)
- BaZi Day Master + Tierzeichen
- Wuxing dominantes Element (Übersicht)
- Kurze Gemini-Interpretation (erste 2 Absätze)
- 3D Orrery (Basis)

**Premium (hinter PremiumGate):**
- Alle 4 BaZi-Säulen mit Detailanalyse
- Komplette Wuxing-Balance (alle 5 Elemente)
- Volle Gemini-Interpretation (alle Absätze)
- Haus-Bedeutungen (I–XII)
- ElevenLabs Voice Agent (Levi Bazi)

```tsx
// In Dashboard.tsx — wrap premium sections:
import { PremiumGate } from './PremiumGate';

// Free section (always visible)
<section className="space-y-6">
  <WesternTriad data={apiData.western} />
  <BaziOverview dayMaster={apiData.bazi?.day_master} animal={apiData.bazi?.zodiac_sign} />
  <WuxingSummary dominant={apiData.wuxing?.dominant_element} />
  <InterpretationPreview text={interpretation} maxParagraphs={2} />
</section>

// Premium section (gated)
<PremiumGate teaser={t?.fusionTeaser}>
  <section className="space-y-6">
    <BaziPillars pillars={apiData.bazi?.pillars} />
    <WuxingFullChart elements={apiData.wuxing} />
    <InterpretationFull text={interpretation} />
    <HouseMeanings houses={apiData.western?.houses} />
  </section>
</PremiumGate>
```

**Step 3: Upgrade-Success Handler in App.tsx**

```typescript
// In App.tsx useEffect — check for upgrade success
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('upgrade') === 'success') {
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    // Profile tier will update via realtime subscription in usePremium
  }
}, []);
```

**Step 4: Commit**
```bash
git add src/components/PremiumGate.tsx src/components/Dashboard.tsx src/App.tsx
git commit -m "feat: freemium UI with PremiumGate + Dashboard split"
```

---

### ✅ Iteration 2 Done-Gate
- [ ] `POST /api/checkout` erstellt Stripe Checkout Session
- [ ] `POST /api/webhook/stripe` upgraded User zu Premium
- [ ] Free-User sehen eingeschränktes Dashboard + Upgrade-CTA
- [ ] Premium-User sehen volles Dashboard
- [ ] Stripe Test-Zahlung funktioniert end-to-end

---

## Iteration 3: Social Share + Landing Page Skeleton

**Abhängigkeiten:** Iteration 1 (Fusion-Prompt für Share-Inhalte)

### Track A: Social Share Card + Share-URL

**Ziel:** Nutzer können ihr Reading als schöne Social Card teilen.

**Files:**
- Create: `src/components/ShareCard.tsx`
- Create: `src/services/share.ts`
- Modify: `server.mjs` (share endpoint)
- Modify: `src/components/Dashboard.tsx` (Share-Button)

**Step 1: Share-Daten als öffentlichen Hash speichern**

```javascript
// server.mjs — Public share endpoint
import crypto from 'crypto';

app.post('/api/share', express.json(), async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  // Generate deterministic share hash from userId
  const hash = crypto.createHash('sha256').update(userId).digest('hex').slice(0, 12);

  // Fetch astro profile
  const { data: profile } = await supabaseAdmin
    .from('astro_profiles')
    .select('sun_sign, moon_sign, asc_sign, astro_json, birth_date')
    .eq('user_id', userId)
    .single();

  if (!profile) return res.status(404).json({ error: 'No profile found' });

  // Store minimal share data (or use existing astro_profiles)
  // The hash IS the userId hash — no extra table needed
  res.json({
    shareUrl: `${process.env.APP_URL || req.headers.origin}/share/${hash}`,
    hash,
  });
});

// Public share page (returns OG meta + mini reading)
app.get('/share/:hash', async (req, res) => {
  // For SPA: return index.html with injected OG meta tags
  // The React app reads the /share/:hash route and shows a public mini-reading
  const html = await fs.promises.readFile(path.join(__dirname, 'dist', 'index.html'), 'utf-8');

  // TODO: In a future iteration, inject dynamic OG tags here
  // For now, serve the SPA and let client-side handle it
  res.send(html);
});
```

**Step 2: Share-Service (Client)**

```typescript
// src/services/share.ts
export async function getShareUrl(userId: string): Promise<string | null> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const { shareUrl } = await res.json();
    return shareUrl;
  } catch { return null; }
}

export function shareToWhatsApp(url: string, text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
}

export function shareToTwitter(url: string, text: string) {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
}

export function shareToLinkedIn(url: string) {
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
}

export async function copyToClipboard(url: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(url); return true; }
  catch { return false; }
}
```

**Step 3: ShareCard Komponente + Dashboard-Integration**

```tsx
// src/components/ShareCard.tsx
import { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { getShareUrl, shareToWhatsApp, shareToTwitter, shareToLinkedIn, copyToClipboard } from '@/src/services/share';

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
        <button onClick={async () => { const u = await handleShare(); u && shareToWhatsApp(u, shareText); }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">WhatsApp</button>
        <button onClick={async () => { const u = await handleShare(); u && shareToTwitter(u, shareText); }}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm">X / Twitter</button>
        <button onClick={async () => { const u = await handleShare(); u && shareToLinkedIn(u); }}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm">LinkedIn</button>
        <button onClick={async () => {
          const u = await handleShare();
          if (u) { const ok = await copyToClipboard(u); setCopied(ok); setTimeout(() => setCopied(false), 2000); }
        }}
          className="px-4 py-2 bg-ash text-dawn rounded-lg text-sm">
          {copied ? '✓ Copied' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Commit**
```bash
git add src/components/ShareCard.tsx src/services/share.ts server.mjs src/components/Dashboard.tsx
git commit -m "feat: social sharing with share URL + WhatsApp/Twitter/LinkedIn buttons"
```

---

### Track B: SEO Grundlagen — robots.txt + sitemap + Meta

**Ziel:** Google kann die Seite finden und indexieren.

**Files:**
- Create: `media/robots.txt`
- Create: `media/sitemap.xml`
- Modify: `index.html` (zusätzliche Meta-Tags)

**Step 1: robots.txt**

```
# media/robots.txt (served from publicDir)
User-agent: *
Allow: /
Sitemap: https://bazodiac.com/sitemap.xml
```

**Step 2: sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/2000/01/sitemap-protocol">
  <url>
    <loc>https://bazodiac.com/</loc>
    <lastmod>2026-03-05</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

Hinweis: Wird in Iteration 5 mit Content-Seiten erweitert.

**Step 3: index.html Meta-Tags erweitern**

```html
<!-- Schema.org structured data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Bazodiac",
  "description": "Fusion astrology combining Western zodiac, Chinese BaZi, and Wu-Xing Five Elements",
  "url": "https://bazodiac.com",
  "applicationCategory": "Lifestyle",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR",
    "description": "Free basic reading"
  }
}
</script>

<!-- Additional OG tags -->
<meta property="og:image" content="https://bazodiac.com/og-image.jpg" />
<meta property="og:locale" content="de_DE" />
<meta property="og:locale:alternate" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
```

**Step 4: Commit**
```bash
git add media/robots.txt media/sitemap.xml index.html
git commit -m "feat: add robots.txt, sitemap.xml, Schema.org + OG meta tags"
```

---

### ✅ Iteration 3 Done-Gate
- [ ] Share-Buttons auf Dashboard funktionieren (WhatsApp, Twitter, LinkedIn, Copy)
- [ ] Share-URL generiert deterministische Links
- [ ] robots.txt + sitemap.xml erreichbar unter /robots.txt und /sitemap.xml
- [ ] Schema.org Markup validiert (Google Rich Results Test)

---

## Iteration 4: Landing Page + GA4 Events

**Abhängigkeiten:** Iteration 3 (SEO-Grundlagen)

### Track A: Static Landing Page

**Ziel:** Eine separate, SEO-optimierte Landing Page die zur App verlinkt.

**Entscheidung:** Statt eine komplett separate Seite (Astro/Next.js) zu bauen, erstellen wir eine pre-rendered HTML-Datei, die von server.mjs für nicht-eingeloggte Besucher auf `/` served wird. Die SPA bleibt unter `/app` oder wird nach Login angezeigt.

**Files:**
- Create: `landing/index.html`
- Create: `landing/style.css`
- Modify: `server.mjs` (Landing-Route)

**Step 1: Landing Page HTML**

Eine single-page Landing mit:
- Hero: "Dein kosmisches Profil — drei Systeme, ein Bild."
- Value Prop: "Bazodiac fusioniert westliche Astrologie, chinesisches BaZi und Wu-Xing"
- Feature-Liste: 6 Features mit Icons
- Social Proof Platzhalter (Testimonials)
- CTA: "Berechne dein Horoskop — kostenlos"
- Footer: Impressum, Datenschutz Links

Muss vollständig statisch sein (kein JS-Bundle nötig), damit Google es sofort indexieren kann.

**Step 2: Server-Route für Landing**

```javascript
// server.mjs — serve landing page for unauthenticated root visits
app.get('/', (req, res, next) => {
  // If user has auth cookie/token, serve the SPA
  // Otherwise serve the landing page
  const hasSession = req.headers.cookie?.includes('sb-');
  if (hasSession) return next(); // Fall through to SPA

  res.sendFile(path.join(__dirname, 'landing', 'index.html'));
});
```

**Step 3: Commit**
```bash
git add landing/ server.mjs
git commit -m "feat: add static landing page for SEO + unauthenticated visitors"
```

---

### Track B: GA4 Event Tracking

**Ziel:** Conversion-Funnel messbar machen.

**Files:**
- Create: `src/lib/analytics.ts`
- Modify: `src/App.tsx` (Event-Calls)
- Modify: `src/components/PremiumGate.tsx` (upgrade_clicked Event)

**Step 1: Analytics-Helper**

```typescript
// src/lib/analytics.ts
declare global {
  interface Window { gtag: (...args: unknown[]) => void; }
}

type EventName =
  | 'signup'
  | 'login'
  | 'reading_started'
  | 'reading_completed'
  | 'upgrade_clicked'
  | 'payment_completed'
  | 'share_clicked';

export function trackEvent(event: EventName, params?: Record<string, string | number>) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
}
```

**Step 2: Events in App-Flow einbauen**

| Stelle | Event |
|--------|-------|
| `AuthContext.tsx` — nach signUp | `trackEvent('signup')` |
| `AuthContext.tsx` — nach signIn | `trackEvent('login')` |
| `App.tsx` — vor calculateAll() | `trackEvent('reading_started')` |
| `App.tsx` — nach Gemini-Interpretation | `trackEvent('reading_completed')` |
| `PremiumGate.tsx` — onClick Upgrade | `trackEvent('upgrade_clicked')` |
| `App.tsx` — ?upgrade=success | `trackEvent('payment_completed')` |
| `ShareCard.tsx` — onClick jeder Share-Button | `trackEvent('share_clicked', { platform })` |

**Step 3: Commit**
```bash
git add src/lib/analytics.ts src/App.tsx src/contexts/AuthContext.tsx src/components/PremiumGate.tsx src/components/ShareCard.tsx
git commit -m "feat: add GA4 event tracking for conversion funnel"
```

---

### ✅ Iteration 4 Done-Gate
- [ ] Landing Page erreichbar auf `/` für nicht-eingeloggte User
- [ ] Landing Page ist vollständig statisch, indexierbar
- [ ] GA4 Events feuern: signup, login, reading_started, reading_completed, upgrade_clicked, share_clicked
- [ ] GA4 Realtime-View zeigt Events

---

## Iteration 5: Content-Seiten (SEO Pillar)

**Abhängigkeiten:** Iteration 4 (Landing Page als Template)

### Track A: Content-Architektur + Pillar Page

**Ziel:** SEO-Content-Seiten generieren die organischen Traffic bringen.

**Files:**
- Create: `landing/content/fusion-astrologie.html` (Pillar Page)
- Create: `landing/content/sternzeichen/` (12 Cluster-Seiten)
- Modify: `media/sitemap.xml` (alle URLs eintragen)

**Approach:** Statische HTML-Seiten im `landing/content/` Ordner. Server.mjs served diese unter `/content/*`. Jede Seite hat:
- Unique H1 mit Target-Keyword
- 800–2000 Wörter Content (Fusion-Perspektive!)
- Meta Description + OG Tags
- Interner Link zur App (CTA-Button)
- AdSense Auto-Ad Snippet
- Breadcrumb Navigation
- Interne Verlinkung zwischen Cluster-Seiten

**Content-Plan (30 Seiten):**

| Typ | Seite | Target Keyword |
|-----|-------|---------------|
| Pillar | Fusion Astrologie: Western × BaZi × WuXing | fusion astrologie |
| Cluster | Widder + [Tier]: Deine Fusion-Persönlichkeit (×12) | widder horoskop bazi |
| Cluster | [Sternzeichen] Horoskop 2026: BaZi-Perspektive (×12) | [zeichen] horoskop 2026 |
| Cluster | [Element] in der Wuxing-Lehre (×5) | wuxing [element] bedeutung |
| Tool | Kostenloser Sternzeichen-Rechner mit BaZi | sternzeichen rechner |

**Step 1:** Gemini oder Claude für Content-Generierung nutzen — aber JEDE Seite muss den Fusion-USP betonen.

**Step 2: Server-Route für Content**

```javascript
// server.mjs
app.use('/content', express.static(path.join(__dirname, 'landing', 'content')));
```

**Step 3:** Sitemap mit allen Content-URLs aktualisieren.

**Step 4: Commit**
```bash
git add landing/content/ media/sitemap.xml server.mjs
git commit -m "feat: add SEO content pages — pillar + zodiac clusters"
```

---

### Track B: AdSense-Optimierung auf Content-Seiten

**Ziel:** Manuelle Ad-Placements auf Content-Seiten für bessere Revenue.

**Files:**
- Modify: Content-Seiten Templates (Ad-Slots)

**Step 1:** In jede Content-Seite drei Ad-Slots einbauen:
- Nach Paragraph 2 (In-Article)
- Sidebar (Desktop)
- Vor dem CTA (Bottom)

```html
<!-- In-Article Ad Slot -->
<ins class="adsbygoogle"
  style="display:block; text-align:center;"
  data-ad-layout="in-article"
  data-ad-format="fluid"
  data-ad-client="ca-pub-1712273263687132"
  data-ad-slot="[SLOT_ID]"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

**Step 2: Commit**
```bash
git add landing/content/
git commit -m "feat: add manual AdSense placements on content pages"
```

---

### ✅ Iteration 5 Done-Gate
- [ ] Mindestens 15 Content-Seiten live unter /content/
- [ ] Alle Seiten mit Meta-Tags, interner Verlinkung, CTA zur App
- [ ] Sitemap enthält alle Content-URLs
- [ ] AdSense zeigt Ads auf Content-Seiten
- [ ] Google Search Console: Sitemap eingereicht

---

## Iteration 6: Launch Prep + QA

**Abhängigkeiten:** Alle vorherigen Iterationen

### Track A: Full QA + Bug Fixing

**Ziel:** Kompletter User-Flow testen: Signup → Free Reading → Upgrade → Premium → Share.

**Checklist:**
- [ ] Signup funktioniert (Desktop + Mobile)
- [ ] Login funktioniert (Returning User)
- [ ] BirthForm → BAFE-Berechnung → Gemini-Interpretation → Dashboard (kein Fehler)
- [ ] Free-User sieht eingeschränktes Dashboard + Premium-Teaser
- [ ] Upgrade-Button → Stripe Checkout → Zahlung → User wird Premium
- [ ] Premium-User sieht volles Dashboard
- [ ] Share-Buttons funktionieren (WhatsApp, Twitter, LinkedIn, Copy)
- [ ] ElevenLabs Voice Widget funktioniert (Premium)
- [ ] Landing Page rendert korrekt (Desktop + Mobile)
- [ ] Content-Seiten laden, Ads zeigen
- [ ] Keine console.errors
- [ ] Lighthouse Score: >70 Performance, >90 Accessibility

### Track B: Stripe Live-Mode + Env Variables

**Ziel:** Von Test-Keys auf Live-Keys umstellen.

**Checklist:**
- [ ] Stripe Live-Product + Price erstellt
- [ ] `.env.production`: `STRIPE_SECRET_KEY=sk_live_...`, `STRIPE_PRICE_ID=price_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`
- [ ] Webhook in Stripe Dashboard auf Production-URL konfiguriert
- [ ] Test-Zahlung mit Live-Karte verifiziert

### Track C: Launch-Material vorbereiten

**Ziel:** Social Posts + Product Hunt Draft.

**Checklist:**
- [ ] Reddit Posts vorbereiten (r/astrology, r/bazi, r/spirituality)
- [ ] LinkedIn Post: Build-in-Public Story
- [ ] Product Hunt: Screenshots, Tagline ("The first app that fuses Western astrology with Chinese BaZi"), Description
- [ ] 10 Tester aus Netzwerk identifizieren

---

### ✅ Iteration 6 Done-Gate
- [ ] Kompletter Flow fehlerfrei auf Desktop + Mobile
- [ ] Stripe im Live-Mode
- [ ] Launch-Material ready
- [ ] App ist production-ready

---

## Parallelisierungs-Matrix

```
Iteration 1 (Foundation):
  ├─ Agent A: Schema + usePremium     ─┐
  ├─ Agent B: Fusion-Prompt            ├─ PARALLEL
  └─ Agent C: UX Polish               ─┘

Iteration 2 (Payment):          ← wartet auf Iter 1
  ├─ Agent A: Stripe Backend           ─┐
  └─ Agent B: Freemium UI              ─┘ PARALLEL

Iteration 3 (Sharing + SEO):    ← wartet auf Iter 1
  ├─ Agent A: Social Share             ─┐
  └─ Agent B: robots/sitemap/meta      ─┘ PARALLEL

  ⚡ Iter 2 + Iter 3 können GLEICHZEITIG laufen!

Iteration 4 (Landing + Analytics): ← wartet auf Iter 3
  ├─ Agent A: Landing Page             ─┐
  └─ Agent B: GA4 Events               ─┘ PARALLEL

Iteration 5 (Content):          ← wartet auf Iter 4
  ├─ Agent A: Content-Seiten           ─┐
  └─ Agent B: AdSense-Placement        ─┘ PARALLEL

Iteration 6 (Launch QA):        ← wartet auf ALLE
  ├─ Agent A: Full QA                  ─┐
  ├─ Agent B: Stripe Live-Mode         ├─ PARALLEL
  └─ Agent C: Launch-Material          ─┘
```

**Optimaler Zeitplan mit maximaler Parallelisierung:**

| Zeitslot | Aktive Agents |
|----------|--------------|
| Slot 1   | Iter 1: A + B + C (3 parallel) |
| Slot 2   | Iter 2: A + B + Iter 3: A + B (4 parallel!) |
| Slot 3   | Iter 4: A + B (2 parallel) |
| Slot 4   | Iter 5: A + B (2 parallel) |
| Slot 5   | Iter 6: A + B + C (3 parallel) |

**= 5 Slots statt 6 sequentielle Iterationen**

---

## Kill Criteria (aus Original-Plan)

| Tag 30 | Tag 60 | Tag 90 |
|--------|--------|--------|
| >500 Visitors, >100 Signups, >5 Sales → Weitermachen | >2k Visitors/M, >30 Sales, >50€ AdSense → Skalieren | >5k Visitors/M, >500€/M → Polster wächst |
| <100 Visitors → SEO prüfen, TikTok/Shorts testen | <10 Sales → Pricing/Split ändern | <200€/M → Pivot-Frage |
