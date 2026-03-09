// src/lib/routing/verticals.registry.ts
//
// Single Source of Truth für:
// - welche Verticals es gibt (Tiles auf /)
// - wie Subdomains auf interne App-Routen gemappt werden (Middleware-Rewrite)
// - wie man saubere, konsistente URLs baut (Root -> Subdomain, Vertical -> Root)
//
// Prinzip:
// - Public: Verticals liegen auf Subdomains (quiz.<domain>, horoscope.<domain>)
// - Intern: App Router rendert unter /verticals/<id>/...
// - Root "/" (neutral domain) ist immer das Character Sheet.

export type VerticalId =
  | "character"
  | "quiz"
  | "horoscope"
  | "rituals"
  | "insights";

export type VerticalKind = "root" | "input" | "content";

export type VerticalNavTile = {
  id: VerticalId;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  // optional future: icon, badge, disabledReason, etc.
};

export type Vertical = {
  id: VerticalId;
  kind: VerticalKind;

  title: string;
  description: string;

  /**
   * Public subdomain für das Vertical. Root (character) hat keine.
   * Beispiel: "quiz" => quiz.<baseDomain>
   */
  subdomain?: string;

  /**
   * Interner Prefix im App Router. Muss zu src/app/verticals/<id> passen.
   * Root (character) ist "/" und KEIN Prefix.
   */
  internalBasePath: `/${string}`; // "/" | "/verticals/quiz" | ...

  /**
   * Tile-Settings für die modulare Navigation auf Root "/"
   */
  nav: {
    showOnRoot: boolean;
    order: number;
    ctaLabel: string;
  };

  /**
   * Feature-Flag / Rollout (für neue Verticals).
   * Keep simple: per ENV oder hardcoded.
   */
  enabled: (env: Record<string, string | undefined>) => boolean;
};

export const VERTICALS: readonly Vertical[] = [
  {
    id: "character",
    kind: "root",
    title: "Character Sheet",
    description: "Dein Profil – Aggregation aus allen Modulen (Single Source of Truth).",
    internalBasePath: "/",
    nav: { showOnRoot: false, order: 0, ctaLabel: "Öffnen" },
    enabled: () => true,
  },
  {
    id: "quiz",
    kind: "input",
    title: "Quizzes",
    description: "Input-Module: Antworten → ContributionEvent → Profil-Update.",
    subdomain: "quiz",
    internalBasePath: "/verticals/quiz",
    nav: { showOnRoot: true, order: 10, ctaLabel: "Quiz starten" },
    enabled: () => true,
  },
  {
    id: "horoscope",
    kind: "content",
    title: "Horoscope",
    description: "Content-Module: Signs/Readings (optional mit leichten Markern).",
    subdomain: "horoscope",
    internalBasePath: "/verticals/horoscope",
    nav: { showOnRoot: true, order: 20, ctaLabel: "Horoskop ansehen" },
    enabled: () => true,
  },
  {
    id: "rituals",
    kind: "content",
    title: "Rituals",
    description: "Zukünftiges Vertical: Routinen/Challenges, die das Profil schrittweise füttern.",
    subdomain: "rituals",
    internalBasePath: "/verticals/rituals",
    nav: { showOnRoot: true, order: 30, ctaLabel: "Entdecken" },
    enabled: (env) => env.NEXT_PUBLIC_ENABLE_RITUALS === "true",
  },
  {
    id: "insights",
    kind: "content",
    title: "Insights",
    description: "Zukünftiges Vertical: Erklärungen/Reflection/Deep Dives zum Profil.",
    subdomain: "insights",
    internalBasePath: "/verticals/insights",
    nav: { showOnRoot: true, order: 40, ctaLabel: "Insights öffnen" },
    enabled: (env) => env.NEXT_PUBLIC_ENABLE_INSIGHTS === "true",
  },
] as const;

export const VERTICAL_BY_ID: Readonly<Record<VerticalId, Vertical>> = VERTICALS.reduce(
  (acc, v) => {
    acc[v.id] = v;
    return acc;
  },
  {} as Record<VerticalId, Vertical>
);

/** Minimal: baseDomain + protocol zentral, damit Root-Tiles saubere Subdomain-Links bauen. */
export type UrlBuildOptions = {
  /** z.B. "example.com" (ohne Subdomain). Falls leer: wird aus currentHost versucht zu heuristiken. */
  baseDomain?: string;
  /** default: "https" */
  protocol?: "http" | "https";
  /** optional: wenn du in Dev Ports nutzt (selten mit Hostfile), z.B. 3000 */
  port?: number;
  /** hostname der aktuellen Request (kann port enthalten) */
  currentHost?: string;
};

function stripPort(host: string): string {
  return host.replace(/:\d+$/, "");
}

function splitHost(host: string): { sub?: string; base: string } {
  const clean = stripPort(host).toLowerCase();
  const parts = clean.split(".");
  if (parts.length <= 2) return { base: clean };
  // naive: first label is subdomain, rest is baseDomain
  return { sub: parts[0], base: parts.slice(1).join(".") };
}

/**
 * Best-effort: ermittelt baseDomain aus currentHost.
 * - quiz.example.com -> example.com
 * - example.com -> example.com
 */
export function inferBaseDomain(currentHost?: string): string | undefined {
  if (!currentHost) return undefined;
  return splitHost(currentHost).base;
}

/** Findet Vertical anhand Hostname (quiz.* => quiz, horoscope.* => horoscope, sonst character). */
export function getVerticalFromHost(currentHost?: string): Vertical {
  if (!currentHost) return VERTICAL_BY_ID.character;

  const { sub } = splitHost(currentHost);
  if (!sub) return VERTICAL_BY_ID.character;

  const match = VERTICALS.find((v) => v.subdomain === sub);
  return match ?? VERTICAL_BY_ID.character;
}

/**
 * Baut eine PUBLIC URL für ein Vertical (Root "/" oder Subdomain).
 * Beispiel:
 *  - buildVerticalUrl("quiz", "/") => https://quiz.example.com/
 *  - buildVerticalUrl("character", "/") => https://example.com/
 */
export function buildVerticalUrl(
  verticalId: VerticalId,
  path: `/${string}` = "/",
  opts: UrlBuildOptions = {}
): string {
  const v = VERTICAL_BY_ID[verticalId];
  const protocol = opts.protocol ?? "https";
  const baseDomain = opts.baseDomain ?? inferBaseDomain(opts.currentHost) ?? "localhost";
  const port = opts.port ? `:${opts.port}` : "";

  // Root stays on baseDomain
  const host =
    v.subdomain && baseDomain !== "localhost"
      ? `${v.subdomain}.${baseDomain}`
      : v.subdomain && baseDomain === "localhost"
        // local fallback: wenn jemand ohne Hosts/Subdomains arbeitet
        ? baseDomain
        : baseDomain;

  // If localhost and we can't do subdomains, we recommend path-based fallback in dev
  // (optional) but we keep it simple: just use host+path.
  return `${protocol}://${host}${port}${path}`;
}

/**
 * Middleware helper: mappt PUBLIC request (host + pathname) => interner App Router Pfad.
 * - Root domain => bleibt pathname (Character Sheet unter "/")
 * - quiz.<domain>/x => /verticals/quiz/x
 * - horoscope.<domain>/sign/aries => /verticals/horoscope/sign/aries
 */
export function toInternalPathFromRequest(
  currentHost: string | undefined,
  pathname: string
): string {
  const v = getVerticalFromHost(currentHost);
  if (v.id === "character") return pathname; // Root bleibt Root

  // pathname garantiert mit "/" beginnt
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (clean === "/") return v.internalBasePath; // Landing des Verticals
  // /verticals/<id> + /...
  return `${v.internalBasePath}${clean}`;
}

/**
 * Erzeugt die Root-Navigation (Tiles) als externe Links zu den Verticals (Subdomains).
 * Root "/" bleibt Character Sheet; Tiles springen in die Producer-Verticals.
 */
export function getRootNavTiles(opts: UrlBuildOptions = {}): VerticalNavTile[] {
  const env =
    typeof process !== "undefined" && process.env ? (process.env as Record<string, string | undefined>) : {};

  return VERTICALS
    .filter((v) => v.nav.showOnRoot)
    .filter((v) => v.enabled(env))
    .sort((a, b) => a.nav.order - b.nav.order)
    .map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      href: buildVerticalUrl(v.id, "/", opts),
      ctaLabel: v.nav.ctaLabel,
    }));
}

/**
 * Kleine Convenience: CTA nach Quiz Complete soll immer zurück aufs Character Sheet (/).
 * (egal auf welcher Subdomain das Quiz läuft)
 */
export function characterHomeUrl(opts: UrlBuildOptions = {}): string {
  return buildVerticalUrl("character", "/", opts);
}