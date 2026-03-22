// Ambient type declarations for all animated-icon JSX modules.
// Each exports a forwardRef React component that accepts standard SVG/HTML props.

import type { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';

type AnimatedIconComponent = ForwardRefExoticComponent<
  SVGProps<SVGSVGElement> & { className?: string } & RefAttributes<SVGSVGElement>
>;

// Zodiac
declare module './ZodiacAries' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacTaurus' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacGemini' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacCancer' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacLeo' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacVirgo' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacLibra' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacScorpio' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacSagittarius' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacCapricorn' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacAquarius' { const c: AnimatedIconComponent; export default c; }
declare module './ZodiacPisces' { const c: AnimatedIconComponent; export default c; }

// WuXing Elements
declare module './Leaf' { const c: AnimatedIconComponent; export default c; }
declare module './Flame' { const c: AnimatedIconComponent; export default c; }
declare module './Mountain' { const c: AnimatedIconComponent; export default c; }
declare module './Wind' { const c: AnimatedIconComponent; export default c; }
declare module './Droplet' { const c: AnimatedIconComponent; export default c; }

// Animals
declare module './Dog' { const c: AnimatedIconComponent; export default c; }
declare module './Rabbit' { const c: AnimatedIconComponent; export default c; }
declare module './Rat' { const c: AnimatedIconComponent; export default c; }

// General UI
declare module './House' { const c: AnimatedIconComponent; export default c; }
declare module './Sparkles' { const c: AnimatedIconComponent; export default c; }
declare module './Telescope' { const c: AnimatedIconComponent; export default c; }
declare module './Sun' { const c: AnimatedIconComponent; export default c; }
declare module './Moon' { const c: AnimatedIconComponent; export default c; }
declare module './MoonStar' { const c: AnimatedIconComponent; export default c; }
declare module './SunMoon' { const c: AnimatedIconComponent; export default c; }
declare module './Orbit' { const c: AnimatedIconComponent; export default c; }
declare module './Crown' { const c: AnimatedIconComponent; export default c; }
declare module './Wand' { const c: AnimatedIconComponent; export default c; }
declare module './WandSparkles' { const c: AnimatedIconComponent; export default c; }
declare module './Zap' { const c: AnimatedIconComponent; export default c; }
declare module './Star' { const c: AnimatedIconComponent; export default c; }
declare module './Globe' { const c: AnimatedIconComponent; export default c; }
declare module './Heart' { const c: AnimatedIconComponent; export default c; }
declare module './Shield' { const c: AnimatedIconComponent; export default c; }
declare module './Eye' { const c: AnimatedIconComponent; export default c; }
declare module './Diamond' { const c: AnimatedIconComponent; export default c; }
declare module './Compass' { const c: AnimatedIconComponent; export default c; }
declare module './Gem' { const c: AnimatedIconComponent; export default c; }
declare module './User' { const c: AnimatedIconComponent; export default c; }
declare module './Earth' { const c: AnimatedIconComponent; export default c; }
