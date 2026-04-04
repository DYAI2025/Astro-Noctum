// All icons are plain JS forwardRef components. TypeScript infers their props as `{}` under
// allowJs, which makes className/aria-hidden invalid at call sites. We cast each export to
// AnimatedIcon (ForwardRefExoticComponent<SVGProps<SVGSVGElement>>) here — the one place
// all icons pass through — so every consumer gets correct prop types without touching the JSX.

import type { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';

type AnimatedIcon = ForwardRefExoticComponent<
  SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>
>;
const ai = (c: unknown): AnimatedIcon => c as AnimatedIcon;

// ── Zodiac Sign Icons ────────────────────────────────────────────────
import _ZodiacAries from './ZodiacAries';
import _ZodiacTaurus from './ZodiacTaurus';
import _ZodiacGemini from './ZodiacGemini';
import _ZodiacCancer from './ZodiacCancer';
import _ZodiacLeo from './ZodiacLeo';
import _ZodiacVirgo from './ZodiacVirgo';
import _ZodiacLibra from './ZodiacLibra';
import _ZodiacScorpio from './ZodiacScorpio';
import _ZodiacSagittarius from './ZodiacSagittarius';
import _ZodiacCapricorn from './ZodiacCapricorn';
import _ZodiacAquarius from './ZodiacAquarius';
import _ZodiacPisces from './ZodiacPisces';
import _ZodiacOphiuchus from './ZodiacOphiuchus';

export const ZodiacAries        = ai(_ZodiacAries);
export const ZodiacTaurus       = ai(_ZodiacTaurus);
export const ZodiacGemini       = ai(_ZodiacGemini);
export const ZodiacCancer       = ai(_ZodiacCancer);
export const ZodiacLeo          = ai(_ZodiacLeo);
export const ZodiacVirgo        = ai(_ZodiacVirgo);
export const ZodiacLibra        = ai(_ZodiacLibra);
export const ZodiacScorpio      = ai(_ZodiacScorpio);
export const ZodiacSagittarius  = ai(_ZodiacSagittarius);
export const ZodiacCapricorn    = ai(_ZodiacCapricorn);
export const ZodiacAquarius     = ai(_ZodiacAquarius);
export const ZodiacPisces       = ai(_ZodiacPisces);
export const ZodiacOphiuchus    = ai(_ZodiacOphiuchus);

// ── WuXing Element Icons ─────────────────────────────────────────────
import _Leaf     from './Leaf';
import _Flame    from './Flame';
import _Mountain from './Mountain';
import _Wind     from './Wind';
import _Diamond  from './Diamond';
import _Droplet  from './Droplet';

export const IconLeaf     = ai(_Leaf);       // Wood / Holz
export const IconFlame    = ai(_Flame);      // Fire / Feuer
export const IconMountain = ai(_Mountain);   // Earth / Erde
export const IconWind     = ai(_Wind);
export const IconMetal    = ai(_Diamond);    // Metal / Metall (Diamond = Edelstein, Metall-Energie)
export const IconDroplet  = ai(_Droplet);    // Water / Wasser

// ── BaZi Animal Icons ────────────────────────────────────────────────
import _Dog    from './Dog';
import _Rabbit from './Rabbit';
import _Rat    from './Rat';

export const IconDog    = ai(_Dog);
export const IconRabbit = ai(_Rabbit);
export const IconRat    = ai(_Rat);

// ── General UI Icons ─────────────────────────────────────────────────
import _House        from './House';
import _Sparkles     from './Sparkles';
import _Telescope    from './Telescope';
import _Sun          from './Sun';
import _Moon         from './Moon';
import _Mars         from './Mars';
import _Venus        from './Venus';
import _MoonStar     from './MoonStar';
import _SunMoon      from './SunMoon';
import _Orbit        from './Orbit';
import _Eclipse      from './Eclipse';
import _Crown        from './Crown';
import _Wand         from './Wand';
import _WandSparkles from './WandSparkles';
import _Zap          from './Zap';
import _Star         from './Star';
import _Globe        from './Globe';
import _Heart        from './Heart';
import _Shield       from './Shield';
import _Eye          from './Eye';
import _Compass      from './Compass';
import _Gem          from './Gem';
import _User         from './User';
import _Earth        from './Earth';

export const IconHouse        = ai(_House);
export const IconSparkles     = ai(_Sparkles);
export const IconTelescope    = ai(_Telescope);
export const IconSun          = ai(_Sun);
export const IconMoon         = ai(_Moon);
export const IconMars         = ai(_Mars);
export const IconVenus        = ai(_Venus);
export const IconMoonStar     = ai(_MoonStar);
export const IconSunMoon      = ai(_SunMoon);
export const IconOrbit        = ai(_Orbit);
export const IconEclipse      = ai(_Eclipse);
export const IconCrown        = ai(_Crown);
export const IconWand         = ai(_Wand);
export const IconWandSparkles = ai(_WandSparkles);
export const IconZap          = ai(_Zap);
export const IconStar         = ai(_Star);
export const IconGlobe        = ai(_Globe);
export const IconHeart        = ai(_Heart);
export const IconShield       = ai(_Shield);
export const IconEye          = ai(_Eye);
export const IconDiamond      = ai(_Diamond);
export const IconCompass      = ai(_Compass);
export const IconGem          = ai(_Gem);
export const IconUser         = ai(_User);
export const IconEarth        = ai(_Earth);
