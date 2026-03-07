// Debug-Script für Aszendenten-Berechnung
// Ben: 24.06.1980, 15:20 MESZ, Hannover

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// Hilfsfunktionen
function normDeg(deg) {
  let n = deg % 360;
  if (n < 0) n += 360;
  return n;
}

function sinDeg(deg) { return Math.sin(deg * DEG2RAD); }
function cosDeg(deg) { return Math.cos(deg * DEG2RAD); }
function tanDeg(deg) { return Math.tan(deg * DEG2RAD); }

// Julian Date Berechnung
function julianDateUTC(year, month, day, hour, minute, second = 0) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const decimalDay = day + (hour + (minute + second / 60) / 60) / 24;
  return Math.floor(365.25 * (year + 4716)) +
         Math.floor(30.6001 * (month + 1)) +
         decimalDay + B - 1524.5;
}

// GMST Berechnung
function greenwichMeanSiderealTime(JD_UTC) {
  const T = (JD_UTC - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (JD_UTC - 2451545.0) +
             T * T * (0.000387933 - T / 38710000);
  return normDeg(gmst);
}

// LST Berechnung
function localSiderealTimeDeg(JD_UTC, lonDeg) {
  const gmst = greenwichMeanSiderealTime(JD_UTC);
  return normDeg(gmst + lonDeg);
}

// Delta T (vereinfacht)
function deltaTSeconds(year) {
  const y = (year - 2000) / 100;
  return 62.92 + y * (32.217 + y * 0.5939);
}

// Mean Obliquity
function meanObliquityDeg(T) {
  const eps0 = 23.439291111 - T * (0.0130125 + T * (0.00000164 - T * 0.000000503));
  return eps0;
}

// ASZENDENTEN-BERECHNUNG
function calculateAscendant(lstDeg, epsilonDeg, latDeg) {
  console.log('\n=== CALCULATEASCENDANT DEBUG ===');
  console.log(`Input LST (RAMC): ${lstDeg.toFixed(6)}°`);
  console.log(`Input Epsilon:    ${epsilonDeg.toFixed(6)}°`);
  console.log(`Input Latitude:   ${latDeg.toFixed(6)}°`);

  const theta = lstDeg * DEG2RAD;
  const eps = epsilonDeg * DEG2RAD;
  const phi = latDeg * DEG2RAD;

  console.log(`\nBogenmaß:`);
  console.log(`  theta (RAMC): ${theta.toFixed(6)}`);
  console.log(`  eps:          ${eps.toFixed(6)}`);
  console.log(`  phi:          ${phi.toFixed(6)}`);

  const y = Math.cos(theta);
  const x = -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));

  console.log(`\nKoordinaten für atan2:`);
  console.log(`  y = cos(theta) = ${y.toFixed(6)}`);
  console.log(`  x = -(sin(theta)*cos(eps) + tan(phi)*sin(eps)) = ${x.toFixed(6)}`);

  let asc = Math.atan2(y, x) * RAD2DEG;
  console.log(`\natan2(y, x) = ${asc.toFixed(6)}° (vor Normalisierung)`);

  while (asc < 0) asc += 360;
  while (asc >= 360) asc -= 360;

  console.log(`Aszendent (normalisiert): ${asc.toFixed(6)}°`);

  const signIndex = Math.floor(asc / 30);
  const signs = ['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau',
                 'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische'];
  const degInSign = asc % 30;
  console.log(`Zeichen: ${signs[signIndex]} ${Math.floor(degInSign)}°${Math.floor((degInSign % 1) * 60)}'`);

  return asc;
}

// === BEN's DATEN ===
const year = 1980, month = 6, day = 24;
const hour = 15, minute = 20;
const latitude = 52.3759;  // Hannover
const longitude = 9.7320;   // Hannover
const tzOffsetMinutes = 120; // MESZ = UTC+2

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║              ASZENDENTEN DEBUG - BEN                           ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log(`\nGeburtsdaten: ${day}.${month}.${year}, ${hour}:${minute} MESZ`);
console.log(`Ort: Hannover (${latitude}°N, ${longitude}°E)`);

// UTC-Zeit berechnen
const utcHour = hour - tzOffsetMinutes / 60;
console.log(`\nUTC-Zeit: ${utcHour}:${minute} (= ${hour}:${minute} - 2h)`);

// Julian Date
const JD_UTC = julianDateUTC(year, month, day, utcHour, minute, 0);
console.log(`\nJulian Date (UTC): ${JD_UTC.toFixed(6)}`);

// Delta T
const dT = deltaTSeconds(year);
const JD_TT = JD_UTC + dT / 86400;
console.log(`Delta T: ${dT.toFixed(2)} seconds`);
console.log(`Julian Date (TT):  ${JD_TT.toFixed(6)}`);

// Jahrhundert seit J2000.0
const T = (JD_TT - 2451545.0) / 36525;
console.log(`T (Jahrhunderte seit J2000.0): ${T.toFixed(9)}`);

// Sternzeit
const GMST = greenwichMeanSiderealTime(JD_UTC);
const LST = localSiderealTimeDeg(JD_UTC, longitude);
console.log(`\nGMST: ${GMST.toFixed(6)}°`);
console.log(`LST (RAMC): ${LST.toFixed(6)}° = ${(LST/15).toFixed(4)}h`);

// Obliquity
const epsilon = meanObliquityDeg(T);
console.log(`\nMean Obliquity (ε): ${epsilon.toFixed(6)}°`);

// ASZENDENT BERECHNEN
const asc = calculateAscendant(LST, epsilon, latitude);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                    ERWARTETE WERTE                             ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('Laut professionellem Horoskop: Skorpion');
console.log('Skorpion-Bereich: 210° - 240°');
console.log('Skorpion-Mitte:   ~225°');
console.log('\n✅ = KORREKT  ❌ = FEHLER');
