
// Superpowers Contribution Output Spec v1 - Core Types

export type SpecVersion = "sp.contribution.v1";

// --- 4. Core Types ---

export type Marker = {
    id: string;        // marker.*
    weight: number;    // -1..+1 (oder 0..1, aber einheitlich!)
    evidence?: {
        itemsAnswered?: number;
        confidence?: number; // 0..1
    };
};

export type TraitScore = {
    id: string;            // trait.*
    score: number;         // 1..100 (integer)
    band?: "low" | "midlow" | "mid" | "midhigh" | "high"; // optional convenience
    confidence?: number;   // 0..1
    method?: "likert" | "forced_choice" | "scenario" | "task" | "derived";
};

export type Tag = {
    id: string;            // tag.*
    label: string;         // lokalisierter Text
    kind: "archetype" | "shadow" | "style" | "astro" | "interest" | "misc";
    weight?: number;       // 0..1 optional
};

export type Unlock = {
    id: string;            // unlock.*
    unlocked: boolean;
    unlockedAt?: string;   // ISO
    level?: 1 | 2 | 3;     // optional rarity
    sourceRef?: string;    // quizId/signId/etc
};

export type Field = {
    id: string;                 // field.*
    kind: "text" | "bullets" | "enum";
    value: string | string[];
    confidence?: number;        // 0..1
};

export type AstroPayload = {
    western?: {
        sunSign?: string;     // aries..pisces
        moonSign?: string;
        ascendant?: string;
        elementsMix?: Record<"fire" | "earth" | "air" | "water", number>;      // 0..1
        modalitiesMix?: Record<"cardinal" | "fixed" | "mutable", number>;    // 0..1
        dominantPlanet?: string;
        houseEmphasis?: string[]; // ["3", "7"]
        archetypeKeywords?: string[]; // 3–5
        shadowTag?: string;         // 1
    };
    chinese?: {
        animal?: string;      // rat..pig
        element?: string;     // wood/fire/earth/metal/water
        yinYang?: "yin" | "yang";
        luckyNumbers?: number[];
        luckyDirections?: string[];
        yearEnergy?: string;  // 1 sentence
    };
    addons?: {
        numerology?: { lifePath?: number; keywords?: string[] };
        enneagram?: { type?: number; wing?: number };
        ayurveda?: { doshaMix?: Record<string, number> };
        humanDesign?: { type?: string; authority?: string; profile?: string };
    };
};

// --- 5. ContributionEvent Schema ---

export type ContributionEvent = {
    specVersion: SpecVersion;
    eventId: string;          // uuid
    occurredAt: string;       // ISO
    userRef?: string;         // optional, falls server-seitig
    source: {
        vertical: "character" | "quiz" | "horoscope" | "future";
        moduleId: string;       // z.B. quiz.personality.v1
        domain?: string;        // quiz.domain.tld
        locale?: string;        // de-DE
        build?: string;         // git sha / version
    };
    payload: {
        markers: Marker[];      // REQUIRED
        traits?: TraitScore[];
        tags?: Tag[];
        unlocks?: Unlock[];
        astro?: AstroPayload;
        fields?: Field[];
        summary?: {
            title?: string;
            bullets?: string[];   // 3–5
            resultId?: string;
        };
        debug?: {
            rawAnswersHash?: string;
            rawScores?: Record<string, number>;
        };
    };
};


// --- Helper Types for Psyche Integration ---

export interface ArchetypeMixItem {
    archetypeId: string;
    weight: number; // 0.0 - 1.0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    archetype?: any; // Contains name, description, color, etc.
}


// --- 1.2 Der zentrale Aggregationszustand: ProfileSnapshot ---

export type ProfileSnapshot = {
    psyche: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state: any; // LME PsycheState (versioned)
        archetypeMix: ArchetypeMixItem[];
        visualAxes: Record<string, number>;
        avatarParams: Record<string, number | string>;
    };
    identity: {
        displayName?: string;
        birth?: { date?: string; time?: string; place?: string }; // optional
    };
    astro?: AstroPayload;              // WESTLICH / CHINESISCH / Addons
    traits: Record<string, TraitScore>; // trait.* → last/best value
    tags: Array<Tag>;                  // tag.*
    unlocks: Record<string, Unlock>;   // unlock.*
    fields: Record<string, Field>;     // field.* -> last/best
    meta: {
        completion: {
            percent: number;
            filledBlocks: string[];        // ["values", "social", "love", ...]
            unlockCount: number;
        };
        lastUpdatedAt: string;
    };
};
