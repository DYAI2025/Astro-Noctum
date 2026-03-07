// Detaillierte Analyse: 15:20 MESZ - Waage/Skorpion Grenze?

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function normDeg(deg) {
  let n = deg % 360;
  if (n < 0) n += 360;
  return n;
}

function julianDateUTC(year, month, day, hour = 0, minute = 0, second = 0) {
  let Y = year, M = month;
  const dayFrac = (hour + minute / 60 + second / 3600) / 24;
  const D = day + dayFrac;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

function greenwichMeanSiderealTime(JD_UTC) {
  const D = JD_UTC - 2451545.0;
  const T = D / 36525;
  let GMST = 280.46061837 + 360.98564736629 * D
           + 0.000387933 * T * T - (T ** 3) / 38710000;
  return normDeg(GMST);
}

function localSiderealTimeDeg(JD_UTC, lonDeg) {
  const gmst = greenwichMeanSiderealTime(JD_UTC);
  return normDeg(gmst + lonDeg);
}

function calculateAscendant(lstDeg, epsilonDeg, latDeg) {
  const theta = lstDeg * DEG2RAD;
  const eps = epsilonDeg * DEG2RAD;
  const phi = latDeg * DEG2RAD;

  const y = Math.cos(theta);
  const x = -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));

  let asc = Math.atan2(y, x) * RAD2DEG;
  while (asc < 0) asc += 360;
  while (asc >= 360) asc -= 360;

  return asc;
}

// BEN'S DATEN - GEBURTSURKUNDE
const year = 1980, month = 6, day = 24;
const hour_MESZ = 15, minute = 20;
const latitude = 52.3759;
const longitude = 9.7320;

// MESZ = UTC+2
const hour_UTC = hour_MESZ - 2;

console.log('═══════════════════════════════════════════════════════════════');
console.log('PRÄZISE ANALYSE: 24.06.1980, 15:20 MESZ (GEBURTSURKUNDE)');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📍 Geburtsdaten:`);
console.log(`   Datum: ${day}.${month}.${year}`);
console.log(`   Zeit:  ${hour_MESZ}:${minute} MESZ`);
console.log(`   UTC:   ${hour_UTC}:${minute}`);
console.log(`   Ort:   Hannover (${latitude}°N, ${longitude}°E)\n`);

// JD berechnen
const JD_UTC = julianDateUTC(year, month, day, hour_UTC, minute, 0);
console.log(`🔢 Julian Date (UTC): ${JD_UTC.toFixed(6)}\n`);

// Delta T für 1980
const deltaT_1980 = 50.54; // IERS Wert für 1980
const JD_TT = JD_UTC + deltaT_1980 / 86400;
const T = (JD_TT - 2451545.0) / 36525;

console.log(`⏱️  Delta T (1980): ${deltaT_1980.toFixed(2)} Sekunden`);
console.log(`   JD (TT): ${JD_TT.toFixed(6)}`);
console.log(`   T (Jahrhunderte): ${T.toFixed(9)}\n`);

// Obliquity (Mean vs True)
const meanEps = 23.439291111 - T * (0.0130125 + T * (0.00000164 - T * 0.000000503));
console.log(`🌐 Mean Obliquity: ${meanEps.toFixed(6)}°`);

// Teste mit verschiedenen Epsilon-Werten
const epsilonValues = [
  { name: 'Mean Obliquity', value: meanEps },
  { name: 'IAU 2000 (23.4392911°)', value: 23.4392911 },
  { name: 'Gerundet (23.44°)', value: 23.44 },
  { name: 'True Obliquity (~+9.2")', value: meanEps + 9.2/3600 }
];

console.log(`\n📊 ASZENDENT MIT VERSCHIEDENEN OBLIQUITY-WERTEN:\n`);

const GMST = greenwichMeanSiderealTime(JD_UTC);
const LST = localSiderealTimeDeg(JD_UTC, longitude);

console.log(`   GMST: ${GMST.toFixed(6)}°`);
console.log(`   LST:  ${LST.toFixed(6)}° (${(LST/15).toFixed(4)}h)\n`);

const signs = ['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau',
               'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische'];

epsilonValues.forEach(eps => {
  const asc = calculateAscendant(LST, eps.value, latitude);
  const signIndex = Math.floor(asc / 30);
  const degInSign = asc % 30;
  const minInSign = (degInSign % 1) * 60;

  console.log(`   ${eps.name.padEnd(30)} → ASC ${asc.toFixed(4)}° = ${signs[signIndex]} ${Math.floor(degInSign)}°${Math.floor(minInSign)}'`);
});

console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`WAAGE/SKORPION GRENZE: 210.0000°`);
console.log(`═══════════════════════════════════════════════════════════════\n`);

// Wie viel Zeit bräuchte man für Skorpion?
const targetASC = 210.0; // Skorpion-Grenze
const currentASC = calculateAscendant(LST, meanEps, latitude);
const diffDeg = targetASC - currentASC;

// LST ändert sich mit ~15.04°/Stunde (siderisch)
// Aber ASC ändert sich je nach Breite unterschiedlich schnell
// Berechne empirisch

console.log(`📏 DISTANZ ZUR SKORPION-GRENZE:\n`);
console.log(`   Aktueller ASC: ${currentASC.toFixed(4)}°`);
console.log(`   Skorpion-Grenze: ${targetASC}°`);
console.log(`   Differenz: ${diffDeg.toFixed(4)}° (${(60*diffDeg/0.25).toFixed(1)} Bogenminuten)\n`);

// Teste kleine Zeitänderungen
console.log(`⏰ ZEITVARIATION (±5 Minuten):\n`);

for (let deltaMin = -5; deltaMin <= 5; deltaMin++) {
  const testMin = minute + deltaMin;
  const testHour = hour_UTC + Math.floor(testMin / 60);
  const finalMin = testMin % 60;

  const jd = julianDateUTC(year, month, day, testHour, finalMin, 0);
  const lst = localSiderealTimeDeg(jd, longitude);
  const asc = calculateAscendant(lst, meanEps, latitude);
  const signIdx = Math.floor(asc / 30);
  const marker = (signs[signIdx] === 'Skorpion') ? ' ← SKORPION!' : '';

  const meszHour = testHour + 2;
  console.log(`   ${meszHour.toString().padStart(2, '0')}:${finalMin.toString().padStart(2, '0')} MESZ → ASC ${asc.toFixed(2)}° (${signs[signIdx]})${marker}`);
}

console.log(`\n═══════════════════════════════════════════════════════════════`);
console.log(`MÖGLICHE ERKLÄRUNGEN FÜR DISKREPANZ:`);
console.log(`═══════════════════════════════════════════════════════════════\n`);

console.log(`1. HÄUSERSYSTEM-UNTERSCHIED:`);
console.log(`   - Unsere Engine: Mathematischer Aszendent (ekliptikale Länge)`);
console.log(`   - Referenz-Horoskop: Möglicherweise anderes Häusersystem?`);
console.log(`     (Placidus, Koch, Equal, Campanus, etc.)\n`);

console.log(`2. GEBURTSZEITANGABE:`);
console.log(`   - Urkunde: Wann wurde die Zeit erfasst?`);
console.log(`   - Krankenhaus-Uhr: War sie korrekt gestellt?`);
console.log(`   - ±2-3 Minuten Unsicherheit normal\n`);

console.log(`3. KOORDINATEN-PRÄZISION:`);
console.log(`   - Hannover zentral: 52.3759°N, 9.7320°E`);
console.log(`   - Geburtsort exakt: Krankenhaus-Koordinaten?\n`);

console.log(`4. AYANAMSA (unwahrscheinlich):`);
console.log(`   - Siderisch vs. Tropisch?`);
console.log(`   - Referenz scheint tropisch (Krebs, Skorpion)\n`);
