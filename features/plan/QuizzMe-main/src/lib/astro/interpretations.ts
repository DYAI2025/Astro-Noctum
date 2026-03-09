
export type TransitInterpretation = {
    title: string;
    text: string;
    keywords: string[];
};

export const TRANSIT_INTERPRETATIONS: Record<string, TransitInterpretation> = {
    // Jupiter Transits
    "jupiter_trine_sun": {
        title: "Glück und Wachstum",
        text: "Heute fühlen Sie sich optimistisch und vital. Dies ist eine hervorragende Zeit, um neue Projekte zu starten oder sich persönlich weiterzuentwickeln. Ihr Selbstvertrauen zieht positive Gelegenheiten an.",
        keywords: ["Erfolg", "Optimismus", "Vitalität"]
    },
    "jupiter_square_sun": {
        title: "Übermut tut selten gut",
        text: "Sie haben viel Energie, neigen aber dazu, Ihre Kräfte zu überschätzen. Achten Sie darauf, keine Versprechen zu machen, die Sie nicht halten können. Mäßigung ist heute der Schlüssel.",
        keywords: ["Übertreibung", "Energie", "Disziplin"]
    },

    // Saturn Transits
    "saturn_conjunct_sun": {
        title: "Zeit der Reifung",
        text: "Sie könnten sich heute etwas ernster oder belasteter fühlen als sonst. Es ist eine Zeit der Prüfung, in der Sie Verantwortung übernehmen müssen. Harte Arbeit zahlt sich jetzt langfristig aus.",
        keywords: ["Verantwortung", "Ernst", "Struktur"]
    },
    "saturn_opposite_sun": {
        title: "Widerstände überwinden",
        text: "Äußere Umstände oder Autoritätspersonen könnten Ihnen heute Grenzen aufzeigen. Fühlen Sie sich nicht entmutigt, sondern sehen Sie es als Chance, Ihre Pläne auf ihre Machbarkeit zu prüfen.",
        keywords: ["Widerstand", "Grenzen", "Geduld"]
    },

    // Mars Transits
    "mars_conjunct_sun": {
        title: "Tatkraft pur",
        text: "Ein massiver Energieschub treibt Sie an. Sie können Berge versetzen, müssen aber aufpassen, nicht rücksichtslos zu sein. Nutzen Sie diese Kraft für sportliche oder berufliche Durchbrüche.",
        keywords: ["Energie", "Durchsetzungskaft", "Aktion"]
    },
    "mars_square_sun": {
        title: "Herausforderungen meistern",
        text: "Sie könnten sich heute leicht provoziert fühlen oder auf Hindernisse stoßen. Kanalisieren Sie Ihre Wut oder Frustration in konstruktive Aktivitäten, anstatt in Konflikte zu geraten.",
        keywords: ["Konflikt", "Stress", "Antrieb"]
    },

    // Venus Transits
    "venus_trine_sun": {
        title: "Harmonie und Genuss",
        text: "Ein wunderbarer Tag für soziale Kontakte, Romantik und kreative Entfaltung. Sie strahlen eine natürliche Anziehungskraft aus und fühlen sich rundum wohl.",
        keywords: ["Liebe", "Kreativität", "Genuss"]
    },
    "venus_conjunct_sun": {
        title: "Strahlende Anziehung",
        text: "Ihr Charisma ist heute unwiderstehlich. Eine perfekte Zeit für Dates, künstlerische Projekte oder einfach, um sich selbst etwas Gutes zu tun.",
        keywords: ["Charisma", "Schönheit", "Romantik"]
    },
    "venus_square_sun": {
        title: "Launen der Liebe",
        text: "Vielleicht neigen Sie heute zu Bequemlichkeit oder kleinen Eitelkeiten. Achten Sie darauf, in Beziehungen nicht zu fordernd zu sein.",
        keywords: ["Bequemlichkeit", "Laune", "Beziehung"]
    },

    // Mercury Transits
    "mercury_conjunct_sun": {
        title: "Klare Gedanken",
        text: "Ihr Verstand arbeitet heute messerscharf. Ein idealer Tag für wichtige Gespräche, Verhandlungen oder um komplexe Probleme zu lösen.",
        keywords: ["Kommunikation", "Logik", "Netzwerken"]
    },
    "mercury_square_sun": {
        title: "Nervöse Unruhe",
        text: "Es fällt Ihnen vielleicht schwer, zur Ruhe zu kommen oder sich zu konzentrieren. Achten Sie auf Missverständnisse in der Kommunikation.",
        keywords: ["Hektik", "Missverständnis", "Nervosität"]
    },

    // Moon Transits (Short term)
    "moon_trine_sun": {
        title: "Innere Harmonie",
        text: "Gefühl und Wille sind heute im Einklang. Sie fühlen sich wohl in Ihrer Haut und kommen gut mit anderen aus. Ein guter Tag für familiäre Angelegenheiten.",
        keywords: ["Harmonie", "Wohlbefinden", "Balance"]
    },
    "moon_square_sun": {
        title: "Spannungen",
        text: "Sie könnten sich innerlich zerrissen fühlen zwischen dem, was Sie wollen, und dem, was Sie brauchen. Nehmen Sie sich Zeit für sich selbst, um wieder in die Mitte zu finden.",
        keywords: ["Konflikt", "Laune", "Spannung"]
    },

    // Default / Fallback
    "default": {
        title: "Kosmische Schwingungen",
        text: "Die Planetenkonstellationen wirken subtil auf Sie ein. Nutzen Sie den Tag, um achtsam Ihre Ziele zu verfolgen und auf Ihre Intuition zu hören.",
        keywords: ["Achtsamkeit", "Intuition"]
    }
};

export function getInterpretation(transitKey: string): TransitInterpretation {
    return TRANSIT_INTERPRETATIONS[transitKey] || TRANSIT_INTERPRETATIONS["default"];
}
