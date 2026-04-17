import { Hono } from "hono";

const chart = new Hono();

// Geocoding using open-meteo geocoding API (no key needed)
async function geocodeCity(city: string, country: string): Promise<{ lat: number; lon: number; timezone: string }> {
  const query = encodeURIComponent(`${city}, ${country}`);
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json() as any;
  if (!data.results || data.results.length === 0) throw new Error(`City not found: ${city}`);
  
  // Find best match by country
  let result = data.results[0];
  if (country) {
    const countryLower = country.toLowerCase();
    const match = data.results.find((r: any) => 
      r.country?.toLowerCase().includes(countryLower) || 
      r.country_code?.toLowerCase() === countryLower.slice(0, 2)
    );
    if (match) result = match;
  }
  
  return {
    lat: result.latitude,
    lon: result.longitude,
    timezone: result.timezone || "UTC",
  };
}

chart.post("/api/chart", async (c) => {
  try {
    const body = await c.req.json() as {
      birthdate: string;
      birth_time: string;
      birth_city: string;
      birth_country: string;
    };

    const { birthdate, birth_time, birth_city, birth_country } = body;
    if (!birthdate || !birth_time || !birth_city || !birth_country) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Geocode
    const geo = await geocodeCity(birth_city, birth_country);

    // Call Bafe API
    const local_datetime = `${birthdate}T${birth_time}:00`;
    const bafeKey = c.env?.BAFE_API_KEY;
    const bafeHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (bafeKey) bafeHeaders["X-API-Key"] = bafeKey;
    const bafe_res = await fetch("https://bafe-production.up.railway.app/chart", {
      method: "POST",
      headers: bafeHeaders,
      body: JSON.stringify({
        local_datetime,
        lat: geo.lat,
        lon: geo.lon,
        timezone: geo.timezone,
      }),
    });

    if (!bafe_res.ok) {
      const err = await bafe_res.text();
      return c.json({ error: `Bafe API error: ${err}` }, 500);
    }

    const chartData = await bafe_res.json() as any;

    // Parse chart data
    const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
                   "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
    const SIGNS_DE: Record<string, string> = {
      "Aries":"Widder","Taurus":"Stier","Gemini":"Zwillinge","Cancer":"Krebs",
      "Leo":"Löwe","Virgo":"Jungfrau","Libra":"Waage","Scorpio":"Skorpion",
      "Sagittarius":"Schütze","Capricorn":"Steinbock","Aquarius":"Wassermann","Pisces":"Fische"
    };

    const degToSign = (deg: number) => SIGNS[Math.floor(deg / 30) % 12];
    const degToSignDe = (deg: number) => SIGNS_DE[degToSign(deg)] || degToSign(deg);

    const positions: Record<string, any> = {};
    for (const p of chartData.positions || []) {
      positions[p.name] = p;
    }

    const sun = positions["Sun"];
    const moon = positions["Moon"];
    const asc_deg = chartData.angles?.Ascendant ?? 0;
    const mc_deg = chartData.angles?.MC ?? 0;

    const sun_sign = sun?.sign_name || degToSign(sun?.longitude || 0);
    const moon_sign = moon?.sign_name || degToSign(moon?.longitude || 0);
    const ascendant = degToSignDe(asc_deg);
    const sun_sign_de = SIGNS_DE[sun_sign] || sun_sign;
    const moon_sign_de = SIGNS_DE[moon_sign] || moon_sign;

    // Planet summaries
    const planet_names = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];
    const planets: any[] = [];
    for (const name of planet_names) {
      if (positions[name]) {
        const p = positions[name];
        planets.push({
          name,
          name_de: { Sun:"Sonne",Moon:"Mond",Mercury:"Merkur",Venus:"Venus",Mars:"Mars",
                     Jupiter:"Jupiter",Saturn:"Saturn",Uranus:"Uranus",Neptune:"Neptun",Pluto:"Pluto" }[name] || name,
          sign: p.sign_name,
          sign_de: SIGNS_DE[p.sign_name] || p.sign_name,
          degree: Math.round(p.degree_in_sign * 10) / 10,
          retrograde: p.is_retrograde || false,
          longitude: p.longitude,
        });
      }
    }

    // Houses
    const houses: Record<string, any> = {};
    for (let i = 1; i <= 12; i++) {
      const deg = chartData.houses?.[String(i)] ?? 0;
      houses[i] = { degree: deg, sign: degToSignDe(deg) };
    }

    // BaZi
    const bazi = chartData.bazi?.pillars || {};
    const fmtPillar = (p: any) => ({
      stem: p?.stem || "?",
      branch: p?.branch || "?",
      animal: p?.animal || "?",
      element: p?.element || "?",
      stem_index: p?.stem_index ?? 0,
    });
    const bazi_pillars = {
      year: fmtPillar(bazi.year),
      month: fmtPillar(bazi.month),
      day: fmtPillar(bazi.day),
      hour: fmtPillar(bazi.hour),
    };
    const day_master = chartData.bazi?.day_master || "?";

    // Wu-Xing
    const wx = chartData.wuxing || {};
    const wuxing_from_planets = wx.from_planets || {};
    const wuxing_from_bazi = wx.from_bazi || {};
    const harmony_index = typeof wx.harmony_index === "number" ? wx.harmony_index : 0.5;
    const dominant_planet_element = wx.dominant_planet || "Wood";
    const dominant_bazi_element = wx.dominant_bazi || "Wood";

    // Numeric signature (drives Chladni m,n params)
    const yi = bazi_pillars.year.stem_index;
    const mi = bazi_pillars.month.stem_index;
    const di = bazi_pillars.day.stem_index;
    const hi = bazi_pillars.hour.stem_index;
    const numeric_signature = (yi * 1000 + mi * 100 + di * 10 + hi) % 360;

    // Chladni parameters derived from chart
    const chladni_m = 2 + (numeric_signature % 5); // 2..6
    const chladni_n = 2 + (Math.floor(numeric_signature * 7 / 5) % 5); // 2..6
    const chladni_a = 0.3 + harmony_index * 0.7;
    const chladni_b = 1.0 - chladni_a * 0.6;

    // Wu-Xing weights (normalized 0..1)
    const elems = ["Wood","Fire","Earth","Metal","Water"];
    const planet_total = elems.reduce((s, e) => s + (wuxing_from_planets[e] || 0), 0) || 1;
    const bazi_total = elems.reduce((s, e) => s + (wuxing_from_bazi[e] || 0), 0) || 1;
    const wuxing_weights: Record<string, number> = {};
    for (const e of elems) {
      const pv = (wuxing_from_planets[e] || 0) / planet_total;
      const bv = (wuxing_from_bazi[e] || 0) / bazi_total;
      wuxing_weights[e] = (pv + bv) / 2;
    }

    return c.json({
      ok: true,
      geo: { ...geo, city: birth_city, country: birth_country },
      sun_sign, sun_sign_de, moon_sign, moon_sign_de, ascendant,
      planets, houses,
      bazi_pillars, day_master,
      wuxing_from_planets, wuxing_from_bazi, wuxing_weights,
      harmony_index, dominant_planet_element, dominant_bazi_element,
      numeric_signature,
      chladni: { m: chladni_m, n: chladni_n, a: chladni_a, b: chladni_b },
    });
  } catch (err: any) {
    console.error("Chart API error:", err);
    return c.json({ error: err.message || "Internal error" }, 500);
  }
});

export default chart;
