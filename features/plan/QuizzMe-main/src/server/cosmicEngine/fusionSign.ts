import type { SymbolSpecV1 } from "./schemas";

// ═══════════════════════════════════════════════════════════════════════════
// SYMBOL CACHE (Deterministic memoization)
// ═══════════════════════════════════════════════════════════════════════════

const symbolCache = new Map<string, SymbolSpecV1>();
const CACHE_MAX_SIZE = 100; // Limit cache size (FIFO eviction: oldest inserted entries removed first)

function getCacheKey(baziElement: string, westernSign: string): string {
    return `${baziElement}::${westernSign}`;
}

// Wu Xing elements
type WuXingElement = "Wood" | "Fire" | "Earth" | "Metal" | "Water";
type WesternElement = "Fire" | "Earth" | "Air" | "Water";

// --- Mappings ---

const WESTERN_SIGN_ELEMENTS: Record<string, string> = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
    'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
};

// Map Western Elements to "Systemic Elements" (aligned with Wu Xing for visuals)
// Air is Yang (like Fire/Wood). Water is Yin. Fire is Yang. Earth is Yin.
// We map Air -> Metal (Intellect/Structure) or Wood (Growth/Movement)?
// Traditional western: Air = Hot + Wet.
// Ba Zi: Wood = Growing, Wind.
// Let's map Air -> Wood for visual duality (Triangle/Movement).
// Or follow the document: "Yang (Fire, Air)". 
const WESTERN_TO_SYSTEMIC: Record<string, 'Yang' | 'Yin'> = {
    'Fire': 'Yang',
    'Air': 'Yang',
    'Earth': 'Yin',
    'Water': 'Yin'
};

const BAZI_TO_SYSTEMIC: Record<string, 'Yang' | 'Yin'> = {
    'Wood': 'Yang',
    'Fire': 'Yang',
    'Earth': 'Yin',
    'Metal': 'Yang',
    'Water': 'Yin'
};

// Design Tokens
const COLORS = {
    YANG: '#A8D8F8', // Light Blue
    YIN: '#F2E8D1',  // Beige
    BG_YANG: '#F0F8FF', // Very light blue
    BG_YIN: '#FAF8F0',  // Very light beige
    TEXT: '#666666',
    TRANSPARENCY: 'rgba(255,255,255,0.4)',
    STROKE: 'none'
};

// Shape Generators
// Center (100, 100), Size variable
const SHAPES = {
    Diamond: (cx: number, cy: number, r: number, color: string) => 
        `<polygon points="${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}" fill="${color}" stroke="none"/>`,
    
    Triangle: (cx: number, cy: number, r: number, color: string) => {
        // Equilateral triangle
        const h = r * Math.sqrt(3) / 2;
        return `<polygon points="${cx},${cy-r} ${cx+h},${cy+r/2} ${cx-h},${cy+r/2}" fill="${color}" stroke="none"/>`;
    },

    Circle: (cx: number, cy: number, r: number, color: string) => 
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="none"/>`,
    
    Square: (cx: number, cy: number, r: number, color: string) => 
        `<rect x="${cx-r*0.8}" y="${cy-r*0.8}" width="${r*1.6}" height="${r*1.6}" fill="${color}" stroke="none"/>`
};

// Element -> Shape Mapping
// Refined based on "Systemic Minimalism" doc
function getShape(system: 'BaZi' | 'Western', element: string, polarity: 'Yang' | 'Yin'): 'Diamond' | 'Triangle' | 'Circle' | 'Square' {
    if (polarity === 'Yin') return 'Circle';
    
    // Yang Handling
    // Metal -> Diamond
    // Fire -> Triangle
    // Wood -> Triangle (or maybe Rect/Square to differentiate?)
    // Air (Western) -> Diamond (Intellect) or Triangle?
    
    if (element === 'Metal') return 'Diamond';
    if (element === 'Fire') return 'Triangle';
    if (element === 'Wood') return 'Triangle'; 
    if (element === 'Air') return 'Diamond'; // Structure/Intellect
    
    return 'Diamond'; // Fallback Yang
}

/**
 * Generate AI prompt for Midjourney/NanoBanana
 */
function generatePrompt(
    baziElement: WuXingElement,
    westernElement: WesternElement,
    bPolarity: 'Yang' | 'Yin',
    wPolarity: 'Yang' | 'Yin',
    fgShape: string,
    bgShape: string
): string {
    const polarityDesc = bPolarity === wPolarity
        ? `unified ${bPolarity} energy`
        : `${bPolarity}-${wPolarity} duality`;

    return `Minimalist geometric symbol, ${fgShape} inside ${bgShape}, ` +
        `representing ${baziElement} (${bPolarity}) core within ${westernElement} (${wPolarity}) context, ` +
        `${polarityDesc}, systemic minimalism style, clean lines, ` +
        `soft gradients, light blue and beige palette, white background, ` +
        `sacred geometry, vector art, no text --ar 1:1 --stylize 50`;
}

/**
 * Generate Fusion Sign - "Systemic Minimalism" Symbol
 *
 * Creates a visual identity symbol by fusing Ba Zi Day Master element
 * with Western Sun Sign element using geometric shapes and polarities.
 *
 * @param baziDayMasterElement - Ba Zi Day Master element (Wood, Fire, Earth, Metal, Water)
 * @param westernSunSign - Western zodiac sign (Aries, Taurus, etc.)
 * @returns SymbolSpecV1 compliant object
 */
export function generateFusionSign(
    baziDayMasterElement: string,
    westernSunSign: string
): SymbolSpecV1 | undefined {
    // Validate inputs
    if (!baziDayMasterElement || !westernSunSign) {
        return undefined;
    }

    // Check cache first (deterministic function)
    const cacheKey = getCacheKey(baziDayMasterElement, westernSunSign);
    const cached = symbolCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // 1. Normalize Inputs
    // Ba Zi should be standard English "Wood", "Fire" etc.
    // Western Sign -> Element
    const wElement = WESTERN_SIGN_ELEMENTS[westernSunSign] || 'Earth'; // Fallback
    const bElement = baziDayMasterElement;

    const wPolarity = WESTERN_TO_SYSTEMIC[wElement];
    const bPolarity = BAZI_TO_SYSTEMIC[bElement] || 'Yang';

    // 2. Logic: Who is Background? Who is Foreground?
    // Doc says: "Primary (Ba Zi) is Yang (foreground); Western is Yin (background)" - but this was an example.
    // General rule in doc: "The diamond (Metal) sits within the circle (Earth)".
    // This implies: The "Container" (Background) creates the field, the "Content" (Foreground) sits inside.
    // Let's adopt a rule:
    // Yin is ALWAYS Background (Container/Stable).
    // Yang is ALWAYS Foreground (Active/Dynamic).
    // If BOTH are Yin: Large Circle + Small Circle (Concentric).
    // If BOTH are Yang: Large Shape + Small Shape (Interlocking).
    
    // Wait, the doc example had Metal (Yang) + Earth (Yin).
    // Metal (Diamond) inside Earth (Circle).
    // So Yin = Background, Yang = Foreground holds.
    
    // Conflict resolution (Same polarity):
    // If BZ=Yang, W=Yang: Western is broad background, BaZi is precise core?
    // Let's keep BaZi as the "Core Identity" (Foreground) and Western as "Broad Context" (Background).
    
    const bgIsWestern = true; 
    
    // 3. Shapes & Colors
    // Background (Western)
    const bgColors = wPolarity === 'Yang' ? COLORS.YANG : COLORS.YIN;
    const bgShapeType = getShape('Western', wElement, wPolarity);
    
    // Foreground (Ba Zi)
    const fgColors = bPolarity === 'Yang' ? COLORS.YANG : COLORS.YIN;
    const fgShapeType = getShape('BaZi', bElement, bPolarity);

    // If colors are identical/similar, we need contrast.
    // If both are Yang (Light Blue), make foreground darker or background lighter?
    // Or invert?
    // The Systemic Minimalism palette has "Beige" and "Light Blue".
    // If both are Yang, use Light Blue for FG, and maybe White/Off-White for BG?
    // Or use the "Secondary" tokens.
    // Let's implement a simple contrast check.
    
    let renderBgColor = bgColors;
    let renderFgColor = fgColors;
    
    if (wPolarity === bPolarity) {
        // Contrast needed.
        if (wPolarity === 'Yang') {
            // Both Blue. Make BG paler.
            renderBgColor = '#D0E8F8'; // Human adjustment
            renderFgColor = '#7FB6FF'; // Deeper blue
        } else {
            // Both Beige.
            renderBgColor = '#FAF5E6';
            renderFgColor = '#E6DCC0'; // Darker beige
        }
    }

    // 4. SVG Generation
    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    
    // Background Shape
    const bgR = 120; // Large
    const bgSvg = SHAPES[bgShapeType](cx, cy, bgR, renderBgColor);
    
    // Foreground Shape
    const fgR = 60; // Small
    const fgSvg = SHAPES[fgShapeType](cx, cy, fgR, renderFgColor);
    
    // Process Transparency (Dashed lines / Construction)
    // "Review the process"
    // Circle at top
    const processMark = `<circle cx="${cx}" cy="${cy - bgR}" r="4" fill="${COLORS.TRANSPARENCY}" />`;
    // Dashed connecting line
    const dashedLine = `<line x1="${cx}" y1="${cy - bgR}" x2="${cx}" y2="${cy}" stroke="${renderFgColor}" stroke-width="1" stroke-dasharray="4 4" opacity="0.5" />`;

    const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <!-- Canvas BG -->
  <rect width="${size}" height="${size}" fill="transparent" />
  
  <!-- Background Layer (Western Context) -->
  <g opacity="0.9">
    ${bgSvg}
  </g>

  <!-- Connection / Process -->
  ${dashedLine}

  <!-- Foreground Layer (Ba Zi Core) -->
  <g filter="url(#glow)">
    ${fgSvg}
  </g>

  <!-- Process Mark -->
  ${processMark}

</svg>`.trim();

    // 5. Description / Label
    const description = `The **${bElement}** (${bPolarity}) core structures the **${wElement}** (${wPolarity}) context.`;

    // 6. Generate AI Prompt
    const prompt = generatePrompt(
        bElement as WuXingElement,
        wElement as WesternElement,
        bPolarity,
        wPolarity,
        fgShapeType.toLowerCase(),
        bgShapeType.toLowerCase()
    );

    // 7. Build SymbolSpecV1 compliant object
    const result: SymbolSpecV1 = {
        version: "1.0" as const,
        svg,
        description,
        elements: {
            bazi: bElement as WuXingElement,
            western: wElement as WesternElement,
        },
        colors: {
            primary: renderFgColor,
            secondary: renderBgColor,
            bg: '#FFFFFF',
        },
        prompt,
        generatedAt: new Date().toISOString(),
    };

    // 8. Store in cache (FIFO eviction: remove oldest entry when full)
    if (symbolCache.size >= CACHE_MAX_SIZE) {
        const firstKey = symbolCache.keys().next().value;
        if (firstKey) {
            symbolCache.delete(firstKey);
        }
    }
    symbolCache.set(cacheKey, result);

    return result;
}
