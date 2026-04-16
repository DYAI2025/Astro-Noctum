import { useState, useMemo, useRef, useCallback } from "react";
import { ChladniSignature } from "../components/ChladniSignature";
import { PLANETS } from "../lib/planetaryFrequencies";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChartData {
  sun_sign_de: string; moon_sign_de: string; ascendant: string;
  planets: Array<{ name: string; name_de: string; sign_de: string; degree: number; retrograde: boolean; longitude: number }>;
  houses: Record<string, { degree: number; sign: string }>;
  bazi_pillars: { year: any; month: any; day: any; hour: any };
  day_master: string;
  wuxing_from_planets: Record<string, number>;
  wuxing_from_bazi: Record<string, number>;
  wuxing_weights: Record<string, number>;
  harmony_index: number;
  dominant_planet_element: string;
  dominant_bazi_element: string;
  numeric_signature: number;
  chladni: { m: number; n: number; a: number; b: number };
  geo: { city: string; country: string; timezone: string };
}

interface SynthesisData {
  archetype_name: string;
  synthesis_reading: string;
  core_traits: string[];
  element_blend: string;
  resonance_description: string;
  using_fallback?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ELEMENT_DE: Record<string, string> = { Wood:"Holz", Fire:"Feuer", Earth:"Erde", Metal:"Metall", Water:"Wasser" };
const ELEMENT_COLORS: Record<string, { primary: string; glow: string }> = {
  Wood:  { primary: "#66BB6A", glow: "rgba(102,187,106,0.25)" },
  Fire:  { primary: "#FF9800", glow: "rgba(255,152,0,0.25)" },
  Earth: { primary: "#FFD54F", glow: "rgba(255,213,79,0.25)" },
  Metal: { primary: "#CFD8DC", glow: "rgba(207,216,220,0.2)" },
  Water: { primary: "#42A5F5", glow: "rgba(66,165,245,0.25)" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function PlanetFrequencyRow({ planet, weight }: { planet: typeof PLANETS[0]; weight: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid rgba(210,169,90,0.08)" }}>
      <span style={{ fontSize: 18, width: 24, textAlign: "center", color: planet.color }}>{planet.symbol}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: "Inter", fontSize: 13, color: "#F7F3EA", fontWeight: 500 }}>{planet.name_de}</span>
          <span style={{ fontFamily: "Inter", fontSize: 11, color: "rgba(240,211,155,0.6)", fontVariantNumeric: "tabular-nums" }}>
            {planet.baseFrequency.toFixed(2)} Hz
          </span>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${weight * 100}%`, background: `linear-gradient(90deg, ${planet.color}66, ${planet.color})`, borderRadius: 1, transition: "width 1.2s ease" }} />
        </div>
      </div>
      <span style={{ fontFamily: "Inter", fontSize: 10, color: `${planet.color}88`, minWidth: 24, textAlign: "right" }}>{Math.round(weight * 100)}</span>
    </div>
  );
}

function BaziPillar({ label, pillar }: { label: string; pillar: any }) {
  if (!pillar) return null;
  return (
    <div style={{ textAlign: "center", padding: "1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(210,169,90,0.12)", borderRadius: 8 }}>
      <div style={{ fontSize: 10, fontFamily: "Inter", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: "#F0D39B", marginBottom: "0.25rem" }}>{pillar.stem}</div>
      <div style={{ fontSize: 18, color: "#D2A95A", marginBottom: "0.4rem" }}>{pillar.branch}</div>
      <div style={{ fontSize: 11, color: "#94A3B8" }}>{pillar.animal}</div>
      <div style={{ fontSize: 10, color: "#6CA192", marginTop: 2 }}>{ELEMENT_DE[pillar.element] || pillar.element}</div>
    </div>
  );
}

function WuxingBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: "rgba(247,243,234,0.6)", fontFamily: "Inter" }}>{label}</span>
        <span style={{ fontSize: 11, color, fontFamily: "Inter", fontVariantNumeric: "tabular-nums" }}>{Math.round(value * 100)}%</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value * 100}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 2, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Home() {
  // Form state
  const [birthdate, setBirthdate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [birthCountry, setBirthCountry] = useState("");

  // Loading states
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingSynth, setLoadingSynth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [synthesis, setSynthesis] = useState<SynthesisData | null>(null);
  const [activeTab, setActiveTab] = useState<"signatur" | "westlich" | "bazi" | "frequenzen">("signatur");

  const resultsRef = useRef<HTMLDivElement>(null);

  // Chladni params — live from chart or defaults
  const chladniParams = useMemo(() => {
    if (!chartData) return { m: 3, n: 4, a: 0.5, b: 0.5, element: null as any, harmonyIndex: 0.5 };
    const domElem = chartData.dominant_planet_element as any;
    return {
      m: chartData.chladni.m,
      n: chartData.chladni.n,
      a: chartData.chladni.a,
      b: chartData.chladni.b,
      element: domElem,
      harmonyIndex: chartData.harmony_index,
    };
  }, [chartData]);

  const dominantColor = useMemo(() => {
    if (!chartData) return { primary: "#42A5F5", glow: "rgba(66,165,245,0.2)" };
    return ELEMENT_COLORS[chartData.dominant_planet_element] || ELEMENT_COLORS.Water;
  }, [chartData]);

  // Planet weights (from wuxing + cousto mapping)
  const planetWeights = useMemo(() => {
    if (!chartData) return PLANETS.map(() => 0.4);
    return PLANETS.map(p => {
      const w = chartData.wuxing_weights?.[p.wuxing_element] || 0.2;
      return Math.min(1, w * 1.8);
    });
  }, [chartData]);

  const handleCalculate = useCallback(async () => {
    if (!birthdate || !birthTime || !birthCity || !birthCountry) return;
    setError(null);
    setLoadingChart(true);
    setSynthesis(null);
    setChartData(null);

    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthdate, birth_time: birthTime, birth_city: birthCity, birth_country: birthCountry }),
      });
      const data = await res.json() as any;
      if (!res.ok || data.error) throw new Error(data.error || "Fehler bei der Berechnung");
      setChartData(data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);

      // Then synthesize
      setLoadingSynth(true);
      const synthRes = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartData: data }),
      });
      const synthData = await synthRes.json() as any;
      if (synthData.ok || synthData.archetype_name) setSynthesis(synthData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingChart(false);
      setLoadingSynth(false);
    }
  }, [birthdate, birthTime, birthCity, birthCountry]);

  const canSubmit = birthdate && birthTime && birthCity && birthCountry && !loadingChart;

  return (
    <div style={{ background: "#0A2030", minHeight: "100vh" }}>
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: "1px solid rgba(210,169,90,0.12)",
        backdropFilter: "blur(16px)",
        background: "rgba(10,32,48,0.85)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ color: "#D2A95A", fontSize: 14 }}>✦</span>
          <span style={{ fontFamily: "Playfair Display", fontWeight: 600, fontSize: 15, color: "#F7F3EA", letterSpacing: "0.04em" }}>
            Bazodiac
          </span>
        </div>
        <div style={{ display: "flex", gap: "2rem" }}>
          {["Signatur", "Frequenzen", "Wissenschaft"].map(item => (
            <span key={item} style={{ fontFamily: "Inter", fontSize: 13, color: "rgba(247,243,234,0.45)", cursor: "default" }}>
              {item}
            </span>
          ))}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 56, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>
        {/* Deep background gradient */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(13,90,95,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, width: "100%", padding: "6rem 2rem 4rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }}>

          {/* Left: Copy + Form */}
          <div>
            <div style={{ marginBottom: "0.75rem" }}>
              <span style={{ fontFamily: "Inter", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#D2A95A", opacity: 0.8 }}>
                Westliche Astrologie × Chinesisches BaZi
              </span>
            </div>
            <h1 style={{ fontFamily: "Playfair Display", fontWeight: 600, fontSize: "clamp(2.2rem, 4vw, 3.2rem)", lineHeight: 1.1, color: "#F7F3EA", marginBottom: "1.25rem" }}>
              Deine kosmische<br />
              <em style={{ fontStyle: "italic", color: "#F0D39B" }}>Signatur</em>
            </h1>
            <p style={{ fontFamily: "Inter", fontSize: 16, color: "rgba(247,243,234,0.55)", lineHeight: 1.6, marginBottom: "2.5rem", maxWidth: "50ch" }}>
              Dein Geburtsbild als Resonanzfeld — berechnet aus westlicher Astrologie und den Vier Säulen des BaZi. Sichtbar als Cymatics-Muster, das nur dir gehört.
            </p>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={labelStyle}>Geburtsdatum</label>
                  <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
                    style={inputStyle} placeholder="TT.MM.JJJJ" />
                </div>
                <div>
                  <label style={labelStyle}>Geburtszeit</label>
                  <input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)}
                    style={inputStyle} placeholder="HH:MM" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={labelStyle}>Geburtsstadt</label>
                  <input type="text" value={birthCity} onChange={e => setBirthCity(e.target.value)}
                    style={inputStyle} placeholder="z.B. München" />
                </div>
                <div>
                  <label style={labelStyle}>Land</label>
                  <input type="text" value={birthCountry} onChange={e => setBirthCountry(e.target.value)}
                    style={inputStyle} placeholder="z.B. Deutschland" />
                </div>
              </div>

              {error && (
                <div style={{ padding: "0.6rem 0.8rem", background: "rgba(230,81,0,0.12)", border: "1px solid rgba(230,81,0,0.3)", borderRadius: 6, fontSize: 13, color: "#FF9800", fontFamily: "Inter" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleCalculate}
                disabled={!canSubmit}
                style={{
                  padding: "0.85rem 2rem", borderRadius: 8, border: "none",
                  background: canSubmit ? "linear-gradient(135deg, #D2A95A, #B8873A)" : "rgba(210,169,90,0.15)",
                  color: canSubmit ? "#0A2030" : "rgba(210,169,90,0.4)",
                  fontFamily: "Inter", fontWeight: 600, fontSize: 14,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  transition: "all 0.3s", letterSpacing: "0.03em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                }}
              >
                {loadingChart ? (
                  <>
                    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(10,32,48,0.3)", borderTopColor: "#0A2030", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite" }} />
                    Berechne…
                  </>
                ) : "Signatur berechnen"}
              </button>
            </div>
          </div>

          {/* Right: Signature Canvas */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ position: "relative" }}>
              {/* Glow ring */}
              <div style={{
                position: "absolute", inset: -20,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${dominantColor.glow} 0%, transparent 70%)`,
                transition: "background 1.2s ease",
                animation: "glow-pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
              }} />

              {/* Thin orbital rings */}
              <div style={{
                position: "absolute", inset: -8, borderRadius: "50%",
                border: `1px solid rgba(210,169,90,0.15)`,
                animation: "spin-slow 30s linear infinite",
              }} />
              <div style={{
                position: "absolute", inset: -16, borderRadius: "50%",
                border: `1px solid rgba(210,169,90,0.08)`,
                animation: "spin-slow 50s linear infinite reverse",
              }} />

              <ChladniSignature params={chladniParams} active={!!chartData} size={420} />
            </div>

            {/* Signature metadata */}
            {chartData ? (
              <div style={{ textAlign: "center", animation: "fade-in 0.5s ease" }}>
                <div style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(210,169,90,0.5)", marginBottom: "0.4rem" }}>
                  Signatur aktiv · {chartData.geo.city}, {chartData.geo.country}
                </div>
                <div style={{ fontFamily: "Playfair Display", fontSize: 14, color: "#F0D39B", fontStyle: "italic" }}>
                  m={chartData.chladni.m} · n={chartData.chladni.n} · χ={chartData.numeric_signature}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Inter", fontSize: 11, color: "rgba(247,243,234,0.2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Warte auf Geburtsdaten
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {chartData && (
        <div ref={resultsRef} style={{ borderTop: "1px solid rgba(210,169,90,0.1)" }}>

          {/* Archetype Hero */}
          <section style={{ background: "#0F3045", padding: "5rem 2rem" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
              {loadingSynth && !synthesis && (
                <div style={{ fontFamily: "Inter", fontSize: 13, color: "rgba(247,243,234,0.35)", letterSpacing: "0.1em", marginBottom: "2rem" }}>
                  Synthese wird berechnet…
                </div>
              )}
              {synthesis && (
                <div className="animate-fade-in">
                  <div style={{ fontFamily: "Inter", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#D2A95A", marginBottom: "1rem" }}>
                    Dein Archetypus
                  </div>
                  <h2 style={{ fontFamily: "Playfair Display", fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#F7F3EA", lineHeight: 1.1, marginBottom: "1rem" }}>
                    {synthesis.archetype_name}
                  </h2>
                  <div style={{ display: "inline-block", padding: "0.3rem 1rem", background: `${dominantColor.glow}`, border: `1px solid rgba(210,169,90,0.25)`, borderRadius: 20, fontFamily: "Inter", fontSize: 13, color: "#F0D39B", marginBottom: "2rem" }}>
                    {synthesis.element_blend}
                  </div>
                  <p style={{ fontFamily: "Inter", fontSize: 15, color: "rgba(247,243,234,0.55)", fontStyle: "italic", maxWidth: "60ch", margin: "0 auto" }}>
                    "{synthesis.resonance_description}"
                  </p>
                </div>
              )}
              {!synthesis && !loadingSynth && (
                <div>
                  <div style={{ fontFamily: "Inter", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#D2A95A", marginBottom: "1rem" }}>
                    Signatur berechnet
                  </div>
                  <h2 style={{ fontFamily: "Playfair Display", fontWeight: 600, fontSize: "2.5rem", color: "#F7F3EA", marginBottom: "0.5rem" }}>
                    ☉ {chartData.sun_sign_de} · ☽ {chartData.moon_sign_de}
                  </h2>
                  <p style={{ color: "#94A3B8", fontFamily: "Inter", fontSize: 14 }}>Aszendent: {chartData.ascendant}</p>
                </div>
              )}
            </div>
          </section>

          {/* Tabs */}
          <section style={{ background: "#0A2030", borderBottom: "1px solid rgba(210,169,90,0.1)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem", display: "flex", gap: 0 }}>
              {(["signatur", "westlich", "bazi", "frequenzen"] as const).map((tab) => {
                const labels: Record<string, string> = {
                  signatur: "Signatur", westlich: "Westliche Astrologie",
                  bazi: "BaZi Vier Säulen", frequenzen: "Planetenfrequenzen"
                };
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: "1rem 1.5rem", background: "none", border: "none",
                    borderBottom: activeTab === tab ? "2px solid #D2A95A" : "2px solid transparent",
                    color: activeTab === tab ? "#F0D39B" : "rgba(247,243,234,0.35)",
                    fontFamily: "Inter", fontSize: 13, fontWeight: activeTab === tab ? 500 : 400,
                    cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.02em",
                  }}>
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Tab Content */}
          <section style={{ background: "#0A2030", padding: "4rem 2rem", minHeight: 500 }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>

              {/* ── Signatur Tab ── */}
              {activeTab === "signatur" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
                  {/* Left: synthesis reading */}
                  <div>
                    <SectionLabel>Synthese-Lesung</SectionLabel>
                    {synthesis ? (
                      <div style={{ fontFamily: "Inter", fontSize: 15, color: "rgba(247,243,234,0.7)", lineHeight: 1.75 }}>
                        {synthesis.synthesis_reading.split("\n\n").map((para, i) => (
                          <p key={i} style={{ marginBottom: "1rem" }}>{para}</p>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontFamily: "Inter", fontSize: 14, color: "#94A3B8" }}>
                        {loadingSynth ? "Synthese wird berechnet…" : "—"}
                      </div>
                    )}

                    {synthesis?.core_traits && (
                      <div style={{ marginTop: "2rem" }}>
                        <SectionLabel>Kern-Qualitäten</SectionLabel>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {synthesis.core_traits.map((trait, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                              <span style={{ color: "#D2A95A", marginTop: 2 }}>◆</span>
                              <span style={{ fontFamily: "Inter", fontSize: 14, color: "rgba(247,243,234,0.65)" }}>{trait}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Wu-Xing + params */}
                  <div>
                    <SectionLabel>Wu-Xing Resonanz</SectionLabel>
                    <div style={{ marginBottom: "2rem" }}>
                      {Object.entries(chartData.wuxing_weights).map(([elem, w]) => (
                        <WuxingBar
                          key={elem}
                          label={ELEMENT_DE[elem] || elem}
                          value={w}
                          color={ELEMENT_COLORS[elem]?.primary || "#D2A95A"}
                        />
                      ))}
                    </div>

                    <SectionLabel>Signatur-Parameter</SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "2rem" }}>
                      {[
                        { k: "Knotenlinien m", v: chartData.chladni.m },
                        { k: "Knotenlinien n", v: chartData.chladni.n },
                        { k: "Amplitude α", v: chartData.chladni.a.toFixed(3) },
                        { k: "Amplitude β", v: chartData.chladni.b.toFixed(3) },
                        { k: "Harmonie-Index", v: `${(chartData.harmony_index * 100).toFixed(0)}%` },
                        { k: "Numerische Signatur", v: chartData.numeric_signature },
                      ].map(item => (
                        <div key={item.k} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(210,169,90,0.1)", borderRadius: 8 }}>
                          <div style={{ fontSize: 10, fontFamily: "Inter", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{item.k}</div>
                          <div style={{ fontSize: 18, fontFamily: "Playfair Display", color: "#F0D39B" }}>{item.v}</div>
                        </div>
                      ))}
                    </div>

                    <SectionLabel>Dominantes Element</SectionLabel>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      {[
                        { label: "Planeten", elem: chartData.dominant_planet_element },
                        { label: "BaZi", elem: chartData.dominant_bazi_element },
                      ].map(item => {
                        const col = ELEMENT_COLORS[item.elem] || ELEMENT_COLORS.Water;
                        return (
                          <div key={item.label} style={{ flex: 1, padding: "1rem", background: `${col.glow}`, border: `1px solid ${col.primary}33`, borderRadius: 10, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "rgba(247,243,234,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "Inter" }}>{item.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 600, color: col.primary, fontFamily: "Playfair Display" }}>{ELEMENT_DE[item.elem] || item.elem}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Westliche Astrologie Tab ── */}
              {activeTab === "westlich" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
                  <div>
                    <SectionLabel>Planeten-Positionen</SectionLabel>
                    <div style={{ marginBottom: "2rem" }}>
                      {/* Big three */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                        {[
                          { label: "Sonne", symbol: "☉", value: chartData.sun_sign_de },
                          { label: "Mond", symbol: "☽", value: chartData.moon_sign_de },
                          { label: "Aszendent", symbol: "ASC", value: chartData.ascendant },
                        ].map(item => (
                          <div key={item.label} style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(210,169,90,0.15)", borderRadius: 10, textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontFamily: "Inter" }}>{item.label}</div>
                            <div style={{ fontSize: 22, color: "#D2A95A", marginBottom: 4 }}>{item.symbol}</div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "#F7F3EA", fontFamily: "Playfair Display", fontStyle: "italic" }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Planet table */}
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            {["Planet", "Zeichen", "Grad", "℞"].map(h => (
                              <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.5rem", fontSize: 10, fontFamily: "Inter", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid rgba(210,169,90,0.1)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.planets.map(p => (
                            <tr key={p.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <td style={{ padding: "0.5rem", fontFamily: "Inter", fontSize: 13, color: "#F7F3EA" }}>{p.name_de}</td>
                              <td style={{ padding: "0.5rem", fontFamily: "Inter", fontSize: 13, color: "rgba(247,243,234,0.65)", fontStyle: "italic" }}>{p.sign_de}</td>
                              <td style={{ padding: "0.5rem", fontFamily: "Inter", fontSize: 12, color: "#94A3B8", fontVariantNumeric: "tabular-nums" }}>{p.degree}°</td>
                              <td style={{ padding: "0.5rem", color: p.retrograde ? "#FF9800" : "transparent", fontSize: 12 }}>℞</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Houses */}
                  <div>
                    <SectionLabel>12 Häuser</SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                      {Object.entries(chartData.houses).map(([num, h]) => (
                        <div key={num} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.6rem", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
                          <span style={{ fontSize: 10, color: "#D2A95A", fontFamily: "Inter", fontWeight: 500, minWidth: 20 }}>H{num}</span>
                          <span style={{ fontSize: 12, color: "rgba(247,243,234,0.6)", fontFamily: "Inter", fontStyle: "italic" }}>{h.sign}</span>
                          <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: "auto", fontVariantNumeric: "tabular-nums", fontFamily: "Inter" }}>{h.degree.toFixed(1)}°</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── BaZi Tab ── */}
              {activeTab === "bazi" && (
                <div>
                  <SectionLabel>Die Vier Säulen</SectionLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "3rem" }}>
                    <BaziPillar label="Jahr-Säule" pillar={chartData.bazi_pillars.year} />
                    <BaziPillar label="Monat-Säule" pillar={chartData.bazi_pillars.month} />
                    <BaziPillar label="Tag-Säule" pillar={chartData.bazi_pillars.day} />
                    <BaziPillar label="Stunde-Säule" pillar={chartData.bazi_pillars.hour} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
                    <div>
                      <SectionLabel>Day Master</SectionLabel>
                      <div style={{ padding: "1.5rem", background: "rgba(210,169,90,0.06)", border: "1px solid rgba(210,169,90,0.2)", borderRadius: 12, textAlign: "center", marginBottom: "2rem" }}>
                        <div style={{ fontSize: 36, fontFamily: "Playfair Display", color: "#F0D39B", marginBottom: "0.5rem" }}>{chartData.day_master}</div>
                        <div style={{ fontSize: 13, color: "#94A3B8", fontFamily: "Inter" }}>Tag-Meister · innere Grundnatur</div>
                      </div>

                      <SectionLabel>Wu-Xing aus BaZi</SectionLabel>
                      {Object.entries(chartData.wuxing_from_bazi).map(([elem, val]) => (
                        <WuxingBar key={elem} label={ELEMENT_DE[elem] || elem} value={val / Math.max(...Object.values(chartData.wuxing_from_bazi) as number[])} color={ELEMENT_COLORS[elem]?.primary || "#D2A95A"} />
                      ))}
                    </div>
                    <div>
                      <SectionLabel>Wu-Xing aus Planeten</SectionLabel>
                      {Object.entries(chartData.wuxing_from_planets).map(([elem, val]) => (
                        <WuxingBar key={elem} label={ELEMENT_DE[elem] || elem} value={val / Math.max(...Object.values(chartData.wuxing_from_planets) as number[])} color={ELEMENT_COLORS[elem]?.primary || "#D2A95A"} />
                      ))}

                      <div style={{ marginTop: "2rem", padding: "1.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(210,169,90,0.1)", borderRadius: 10 }}>
                        <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", fontFamily: "Inter" }}>Harmonie-Index</div>
                        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: "0.5rem" }}>
                          <div style={{ height: "100%", width: `${chartData.harmony_index * 100}%`, background: "linear-gradient(90deg, #D2A95A88, #D2A95A)", borderRadius: 3, transition: "width 1s ease" }} />
                        </div>
                        <div style={{ fontSize: 24, fontFamily: "Playfair Display", color: "#D2A95A" }}>{(chartData.harmony_index * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Planetenfrequenzen Tab ── */}
              {activeTab === "frequenzen" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
                  <div>
                    <SectionLabel>Cousto Frequenzen · Kosmische Oktave</SectionLabel>
                    <p style={{ fontFamily: "Inter", fontSize: 14, color: "rgba(247,243,234,0.45)", lineHeight: 1.65, marginBottom: "1.5rem" }}>
                      Hans Cousto berechnete 1978 die Umlaufzeiten der Planeten in akustische Frequenzen (Oktavierungsgesetz). Deine dominanten Elemente färben die Frequenzgewichtung deiner Signatur.
                    </p>
                    {PLANETS.map((p, i) => (
                      <PlanetFrequencyRow key={p.name} planet={p} weight={planetWeights[i]} />
                    ))}
                  </div>
                  <div>
                    <SectionLabel>Chladni-Geometrie</SectionLabel>
                    <p style={{ fontFamily: "Inter", fontSize: 14, color: "rgba(247,243,234,0.45)", lineHeight: 1.65, marginBottom: "1.5rem" }}>
                      Die sichtbare Signatur entsteht nach der Chladni-Gleichung. Sand oder Wasser auf einer schwingenden Membran ordnet sich an den Knotenlinien — den Stellen minimaler Amplitude.
                    </p>
                    <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(210,169,90,0.12)", borderRadius: 12, fontFamily: "Inter", fontSize: 13, color: "rgba(247,243,234,0.5)", lineHeight: 1.8 }}>
                      <div style={{ marginBottom: "0.75rem", color: "#F0D39B", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>Formel</div>
                      <div style={{ fontFamily: "monospace", fontSize: 14, color: "#6CA192", marginBottom: "1rem" }}>
                        f(x,y) = α·sin(π·n·x)·sin(π·m·y)<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ β·sin(π·m·x)·sin(π·n·y)
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <div><span style={{ color: "#D2A95A" }}>m, n</span> — Knotenlinien aus deiner BaZi-Signatur ({chartData.chladni.m}, {chartData.chladni.n})</div>
                        <div><span style={{ color: "#D2A95A" }}>α, β</span> — Amplituden aus dem Harmonie-Index ({chartData.chladni.a.toFixed(3)}, {chartData.chladni.b.toFixed(3)})</div>
                        <div><span style={{ color: "#D2A95A" }}>Partikel</span> — wandern stochastisch zu den Knotenlinien (|f| → 0)</div>
                      </div>
                    </div>

                    <div style={{ marginTop: "1.5rem" }}>
                      <SectionLabel>Elementare Frequenzzuordnung</SectionLabel>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {Object.entries(ELEMENT_DE).map(([en, de]) => {
                          const col = ELEMENT_COLORS[en];
                          const relPlanets = PLANETS.filter(p => p.wuxing_element === en);
                          return (
                            <div key={en} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.primary, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: 13, color: col.primary, fontFamily: "Inter" }}>{de}</span>
                                <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "0.5rem" }}>{relPlanets.map(p => `${p.symbol} ${p.name_de}`).join(", ")}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── Science Section (always visible) ──────────────────────────────── */}
      <section style={{ background: "#0F3045", padding: "7rem 2rem", borderTop: "1px solid rgba(210,169,90,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ maxWidth: 500, marginBottom: "4rem" }}>
            <div style={{ fontFamily: "Inter", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#D2A95A", marginBottom: "1rem" }}>
              Das Prinzip
            </div>
            <h2 style={{ fontFamily: "Playfair Display", fontWeight: 600, fontSize: "clamp(1.8rem, 3vw, 2.8rem)", color: "#F7F3EA", lineHeight: 1.15, marginBottom: "1rem" }}>
              Frequenz formt sichtbare Muster
            </h2>
            <p style={{ fontFamily: "Inter", fontSize: 15, color: "rgba(247,243,234,0.45)", lineHeight: 1.7 }}>
              Chladni-Figuren, Wasser-Cymatics und die Kosmische Oktave folgen demselben Prinzip: Frequenz als ordnende Kraft. Dein Körper zu 70% Wasser — jede Frequenz hinterlässt ein Muster.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }}>
            {[
              { icon: "◈", color: "#6CA192", title: "Chladni-Figuren", text: "Ernst F.F. Chladni zeigte 1787: Sand auf einer schwingenden Metallplatte ordnet sich an den Knotenlinien. Jede Frequenz erzeugt eine eindeutige geometrische Form." },
              { icon: "◎", color: "#D2A95A", title: "Wasser-Cymatics", text: "In Wasser bilden Schallwellen stehende Wellenmuster — dreidimensionale Interferenzstrukturen. Resonanz ist sichtbar, sobald das Medium es zulässt." },
              { icon: "◉", color: "#42A5F5", title: "Kosmische Oktave", text: "Hans Cousto berechnete 1978 Planetenumlaufzeiten in akustische Frequenzen. Venus schwingt bei 221,23 Hz, Mars bei 144,72 Hz — geometrisch unterschiedliche Chladni-Muster." },
            ].map(item => (
              <div key={item.title} style={{ padding: "1.75rem", background: "rgba(10,32,48,0.5)", border: "1px solid rgba(210,169,90,0.1)", borderRadius: 12 }}>
                <div style={{ fontSize: 22, color: item.color, marginBottom: "0.75rem" }}>{item.icon}</div>
                <div style={{ fontFamily: "Playfair Display", fontWeight: 600, fontSize: 16, color: "#F7F3EA", marginBottom: "0.75rem" }}>{item.title}</div>
                <div style={{ fontFamily: "Inter", fontSize: 14, color: "rgba(247,243,234,0.45)", lineHeight: 1.65 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(210,169,90,0.08)", padding: "2.5rem 2rem", background: "#0A2030" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "#D2A95A" }}>✦</span>
            <span style={{ fontFamily: "Playfair Display", fontWeight: 600, fontSize: 13, color: "rgba(247,243,234,0.3)" }}>Bazodiac</span>
          </div>
          <div style={{ fontFamily: "Inter", fontSize: 11, color: "rgba(247,243,234,0.2)" }}>
            Westliche Astrologie × Chinesisches BaZi × Cousto Kosmische Oktave
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "Inter", fontSize: 11,
  color: "rgba(247,243,234,0.4)", textTransform: "uppercase",
  letterSpacing: "0.12em", marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.65rem 0.85rem",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(210,169,90,0.2)",
  borderRadius: 8, color: "#F7F3EA",
  fontFamily: "Inter", fontSize: 14,
  outline: "none", transition: "border-color 0.2s",
  colorScheme: "dark",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#D2A95A", marginBottom: "1rem", opacity: 0.75 }}>
      {children}
    </div>
  );
}
