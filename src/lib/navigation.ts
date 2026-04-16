export interface CenterLink {
  to: string;
  label: string;
  premiumOnly?: boolean;
}

export function computeCenterLinks(
  pathname: string,
  t: (key: string) => string,
  showAtlas: boolean,
): CenterLink[] {
  const isDashboardActive = pathname === "/";
  const isSignaturActive = pathname === "/signatur" || pathname === "/fu-ring";
  const isAtlasActive = pathname === "/atlas";

  const links: CenterLink[] = [];
  if (!isDashboardActive) links.push({ to: "/", label: t("nav.dashboard") });
  if (!isSignaturActive) links.push({ to: "/signatur", label: t("nav.signatur") });
  if (showAtlas && !isAtlasActive) links.push({ to: "/atlas", label: t("nav.atlas"), premiumOnly: true });
  return links;
}

export const MOBILE_NAV_ITEM_CLASS = (active: boolean) =>
  `flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] p-1 rounded-lg active:bg-gold-deep/10 transition-colors ${
    active ? "text-gold-deep" : "text-ink/40"
  }`;
