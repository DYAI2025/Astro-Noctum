// Direkter Test der julianDateUTC Funktion aus der Engine

function julianDateUTC(year, month, day, hour = 0, minute = 0, second = 0) {
  let Y = year, M = month;
  const dayFrac = (hour + minute / 60 + second / 3600) / 24;
  const D = day + dayFrac;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const result = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;

  console.log('=== JULIAN DATE DEBUG ===');
  console.log(`Input: ${year}-${month}-${day} ${hour}:${minute}:${second}`);
  console.log(`Y=${Y}, M=${M}, D=${D.toFixed(6)}`);
  console.log(`A=${A}, B=${B}`);
  console.log(`Math.floor(365.25 * (${Y} + 4716)) = ${Math.floor(365.25 * (Y + 4716))}`);
  console.log(`Math.floor(30.6001 * (${M} + 1)) = ${Math.floor(30.6001 * (M + 1))}`);
  console.log(`JD = ${result.toFixed(6)}`);
  console.log('');

  return result;
}

// Test mit Ben's Daten - UTC Zeit!
console.log('Ben: 24.06.1980, 15:20 MESZ = 13:20 UTC\n');
const jd = julianDateUTC(1980, 6, 24, 13, 20, 0);

console.log('\n=== VERGLEICH ===');
console.log(`Berechnet:  JD = ${jd.toFixed(6)}`);
console.log(`Erwartet:   JD ≈ 2444418.05 (laut ASZENDENT_FIX_PLAN.md)`);
console.log(`Differenz:  ${(jd - 2444418.05).toFixed(6)} Tage`);

// Referenz: J2000.0 = 2000-01-01 12:00 = JD 2451545.0
console.log('\n=== REFERENZ ===');
const jd2000 = julianDateUTC(2000, 1, 1, 12, 0, 0);
console.log(`J2000.0 sollte sein: 2451545.0`);
console.log(`Differenz: ${(jd2000 - 2451545.0).toFixed(6)}`);
