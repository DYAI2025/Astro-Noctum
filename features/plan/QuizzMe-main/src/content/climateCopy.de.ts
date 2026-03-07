/**
 * Climate Axes Copy (German)
 *
 * Provides labels and descriptions for the 5 bipolar climate axes
 * Used in ClimateCard and AxisRail components
 *
 * Based on spec T3.3
 */

export interface ClimateAxisCopy {
    leftLabel: string;
    rightLabel: string;
    description?: string;
    tooltip?: string;
}

export const climateCopy: Record<string, ClimateAxisCopy> = {
    shadow_light: {
        leftLabel: 'Schatten',
        rightLabel: 'Licht',
        description: 'Wie stark zeigst du verborgene oder helle Seiten deiner Persönlichkeit?',
        tooltip: 'Schatten umfasst komplexe, versteckte Aspekte; Licht zeigt Offenheit und Klarheit.'
    },
    cold_warm: {
        leftLabel: 'Kühl',
        rightLabel: 'Warm',
        description: 'Wie emotional nahbar oder distanziert wirkst du auf andere?',
        tooltip: 'Kühl bedeutet sachlich und zurückhaltend; Warm bedeutet herzlich und einladend.'
    },
    surface_depth: {
        leftLabel: 'Oberfläche',
        rightLabel: 'Tiefe',
        description: 'Bevorzugst du pragmatische Lösungen oder tiefgründige Reflexion?',
        tooltip: 'Oberfläche fokussiert auf das Praktische; Tiefe sucht Bedeutung und Zusammenhänge.'
    },
    me_we: {
        leftLabel: 'Ich',
        rightLabel: 'Wir',
        description: 'Wie stark orientierst du dich an dir selbst oder an der Gemeinschaft?',
        tooltip: 'Ich betont Autonomie und Selbstbestimmung; Wir betont Verbindung und Zugehörigkeit.'
    },
    mind_heart: {
        leftLabel: 'Verstand',
        rightLabel: 'Gefühl',
        description: 'Entscheidest du eher rational oder emotional?',
        tooltip: 'Verstand nutzt Logik und Analyse; Gefühl folgt Intuition und Empathie.'
    }
} as const;

/**
 * Helper to get axis copy by key
 */
export function getAxisCopy(key: keyof typeof climateCopy): ClimateAxisCopy {
    return climateCopy[key];
}

/**
 * Axis names in German for display
 */
export const axisNames: Record<string, string> = {
    shadow_light: 'Schatten ↔ Licht',
    cold_warm: 'Kühl ↔ Warm',
    surface_depth: 'Oberfläche ↔ Tiefe',
    me_we: 'Ich ↔ Wir',
    mind_heart: 'Verstand ↔ Gefühl'
} as const;
