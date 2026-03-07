// Finde exakte Zeit, die Skorpion-Aszendent ergibt

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

const longitude = 9.7320;
const latitude = 52.3759;
const epsilon = 23.441831;

console.log('=== FINDE SKORPION-ZEIT FÜR 24. JUNI 1980 ===\n');

// Teste verschiedene Uhrzeiten am 24. Juni
for (let hour = 0; hour <= 23; hour++) {
  for (let minute = 0; minute < 60; minute += 15) {
    // UTC Zeit
    const jd = julianDateUTC(1980, 6, 24, hour, minute, 0);
    const lst = localSiderealTimeDeg(jd, longitude);
    const asc = calculateAscendant(lst, epsilon, latitude);

    const signs = ['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau',
                   'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische'];
    const sign = signs[Math.floor(asc / 30)];

    if (sign === 'Skorpion') {
      const mesz_hour = hour + 2;
      const mesz_day = mesz_hour >= 24 ? 25 : 24;
      const final_hour = mesz_hour >= 24 ? mesz_hour - 24 : mesz_hour;

      console.log(`✅ ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC → ${final_hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} MESZ (${mesz_day}.06.) → ASC ${asc.toFixed(1)}° (${sign})`);
    }
  }
}

console.log('\n=== VERGLEICH MIT ANGABE ===');
const givenUTC = julianDateUTC(1980, 6, 24, 13, 20, 0);
const givenLST = localSiderealTimeDeg(givenUTC, longitude);
const givenASC = calculateAscendant(givenLST, epsilon, latitude);
const givenSign = ['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau',
                   'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische'][Math.floor(givenASC / 30)];

console.log(`Angegeben: 24.06.1980, 15:20 MESZ = 13:20 UTC`);
console.log(`Ergebnis: ASC ${givenASC.toFixed(2)}° (${givenSign})`);
console.log(`Skorpion-Bereich: 210° - 240°`);
console.log(`Differenz: ${(225 - givenASC).toFixed(2)}°`);
