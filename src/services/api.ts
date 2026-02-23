export interface BirthData {
  date: string; // ISO 8601 local date time e.g. 2024-02-10T14:30:00
  tz: string;
  lon: number;
  lat: number;
}

const BASE_URL = "https://bafe-production.up.railway.app";

export async function calculateBazi(data: BirthData) {
  const res = await fetch(`${BASE_URL}/calculate/bazi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: data.date,
      tz: data.tz,
      lon: data.lon,
      lat: data.lat,
      standard: "CIVIL",
      boundary: "midnight",
      strict: true,
      ambiguousTime: "earlier",
      nonexistentTime: "error"
    }),
  });
  if (!res.ok) throw new Error("Failed to calculate Bazi");
  return res.json();
}

export async function calculateWestern(data: BirthData) {
  const res = await fetch(`${BASE_URL}/calculate/western`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: data.date,
      tz: data.tz,
      lon: data.lon,
      lat: data.lat,
      ambiguousTime: "earlier",
      nonexistentTime: "error"
    }),
  });
  if (!res.ok) throw new Error("Failed to calculate Western");
  return res.json();
}

export async function calculateFusion(data: BirthData) {
  const res = await fetch(`${BASE_URL}/calculate/fusion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: data.date,
      tz: data.tz,
      lon: data.lon,
      lat: data.lat,
      ambiguousTime: "earlier",
      nonexistentTime: "error",
      bazi_pillars: null
    }),
  });
  if (!res.ok) throw new Error("Failed to calculate Fusion");
  return res.json();
}

export async function calculateWuxing(data: BirthData) {
  const res = await fetch(`${BASE_URL}/calculate/wuxing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: data.date,
      tz: data.tz,
      lon: data.lon,
      lat: data.lat,
      ambiguousTime: "earlier",
      nonexistentTime: "error"
    }),
  });
  if (!res.ok) throw new Error("Failed to calculate Wuxing");
  return res.json();
}

export async function calculateTst(data: BirthData) {
  const res = await fetch(`${BASE_URL}/calculate/tst`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: data.date,
      tz: data.tz,
      lon: data.lon,
      ambiguousTime: "earlier",
      nonexistentTime: "error"
    }),
  });
  if (!res.ok) throw new Error("Failed to calculate TST");
  return res.json();
}

export async function calculateAll(data: BirthData) {
  const [bazi, western, fusion, wuxing, tst] = await Promise.all([
    calculateBazi(data).catch((e) => ({ error: e.message })),
    calculateWestern(data).catch((e) => ({ error: e.message })),
    calculateFusion(data).catch((e) => ({ error: e.message })),
    calculateWuxing(data).catch((e) => ({ error: e.message })),
    calculateTst(data).catch((e) => ({ error: e.message })),
  ]);
  return { bazi, western, fusion, wuxing, tst };
}
