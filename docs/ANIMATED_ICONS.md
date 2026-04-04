# Animated Icons Resource

This project includes a collection of beautifully crafted animated icons from the [DYAI2025/animated-icons](https://github.com/DYAI2025/animated-icons) repository. These icons are available as React components and feature CSS-based animations on hover.

## Installation & Availability

All icons are located in `src/components/animated-icons/` and are exported via `src/components/animated-icons/index.ts`. They are globally available for use by all agents and developers.

## Usage

Import the icons from the central index:

```tsx
import { ZodiacAries, IconSun, IconMars } from '@/src/components/animated-icons';

function MyComponent() {
  return (
    <div>
      <ZodiacAries size={32} color="#D4AF37" />
      <IconSun size={24} />
    </div>
  );
}
```

### Props

- `size`: Number (default: 24)
- `color`: String (default: 'currentColor')
- `primaryColor`: String (optional, overrides primary stroke)
- `secondaryColor`: String (optional, overrides secondary stroke)
- `strokeWidth`: Number (default: 2)
- `className`: String
- `label`: Accessibility label

## Available Icons

### Zodiac Signs
- `ZodiacAries`
- `ZodiacTaurus`
- `ZodiacGemini`
- `ZodiacCancer`
- `ZodiacLeo`
- `ZodiacVirgo`
- `ZodiacLibra`
- `ZodiacScorpio`
- `ZodiacSagittarius`
- `ZodiacCapricorn`
- `ZodiacAquarius`
- `ZodiacPisces`
- `ZodiacOphiuchus` (New)

### Celestial & Planetary
- `IconSun`
- `IconMoon`
- `IconMars` (New)
- `IconVenus` (New)
- `IconMoonStar`
- `IconSunMoon`
- `IconOrbit`
- `IconEclipse` (New)
- `IconTelescope`
- `IconStar`
- `IconSparkles`
- `IconEarth`
- `IconGlobe`

### Wu-Xing Elements
- `IconLeaf` (Wood)
- `IconFlame` (Fire)
- `IconMountain` (Earth)
- `IconMetal` (Metal - uses Diamond icon)
- `IconDroplet` (Water)
- `IconWind`

### BaZi Animals
- `IconDog`
- `IconRabbit`
- `IconRat`

### UI & Symbolic
- `IconHouse`
- `IconCrown`
- `IconWand`
- `IconWandSparkles`
- `IconZap`
- `IconHeart`
- `IconShield`
- `IconEye`
- `IconCompass`
- `IconGem`
- `IconUser`

## Adding New Icons

To add more icons from the source repository:
1. Clone `https://github.com/DYAI2025/animated-icons.git`.
2. Copy the desired `.jsx` file from `dist/react/` to `src/components/animated-icons/`.
3. Add the import and export to `src/components/animated-icons/index.ts` using the `ai()` wrapper for proper TypeScript support.
