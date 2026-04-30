import type { ApiData } from '../../types/bafe';

export type CouncilKey = 'sonne' | 'mond' | 'aszendent' | 'day_master' | 'jahrestier' | 'wuxing_dom';

export interface CouncilFigure {
  key: CouncilKey;
  displayName: string;
  signOrElement: string;
}

const DISPLAY_DE: Record<CouncilKey, string> = {
  sonne: 'Sonne', mond: 'Mond', aszendent: 'Aszendent',
  day_master: 'Day-Master', jahrestier: 'Jahrestier', wuxing_dom: 'Wu-Xing',
};

const DISPLAY_EN: Record<CouncilKey, string> = {
  sonne: 'Sun', mond: 'Moon', aszendent: 'Ascendant',
  day_master: 'Day Master', jahrestier: 'Year Animal', wuxing_dom: 'Wu Xing',
};

let warnedAllDashes = false;
/** Test-only escape hatch — resets the once-per-session warning gate. */
export function __resetCouncilWarnState(): void { warnedAllDashes = false; }

export function buildCouncil(api: ApiData, lang: 'de' | 'en' = 'de'): CouncilFigure[] {
  const display = lang === 'en' ? DISPLAY_EN : DISPLAY_DE;
  const dash = '—';
  const figures: CouncilFigure[] = [
    { key: 'sonne',       displayName: display.sonne,       signOrElement: api?.western?.zodiac_sign       || dash },
    { key: 'mond',        displayName: display.mond,        signOrElement: api?.western?.moon_sign         || dash },
    { key: 'aszendent',   displayName: display.aszendent,   signOrElement: api?.western?.ascendant_sign    || dash },
    { key: 'day_master',  displayName: display.day_master,  signOrElement: api?.bazi?.day_master           || dash },
    { key: 'jahrestier',  displayName: display.jahrestier,  signOrElement: api?.bazi?.zodiac_sign          || dash },
    { key: 'wuxing_dom',  displayName: display.wuxing_dom,  signOrElement: api?.wuxing?.dominant_element   || dash },
  ];
  if (!warnedAllDashes && figures.every(f => f.signOrElement === dash)) {
    warnedAllDashes = true;
    console.warn('[buildCouncil] all six figures resolved to "—" — possible BAFE schema drift or empty profile');
  }
  return figures;
}
