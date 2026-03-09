// Test: Was passiert, wenn wir JD um 3 Tage korrigieren?

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function normDeg(deg) {
  let n = deg % 360;
  if (n < 0) n += 360;
  return n;
}

function greenwichMeanSiderealTime(JD_UTC) {
  const T = (JD_UTC - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (JD_UTC - 2451545.0) +
             T * T * (0.000387933 - T / 38710000);
  return normDeg(gmst);
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

console.log('=== TEST JD KORREKTUR ===\n');

const originalJD = 2444415.055556;

for (let correction = 0; correction <= 5; correction += 0.5) {
  const correctedJD = originalJD + correction;
  const gmst = greenwichMeanSiderealTime(correctedJD);
  const lst = localSiderealTimeDeg(correctedJD, longitude);
  const asc = calculateAscendant(lst, epsilon, latitude);

  const signs = ['Wid', 'Sti', 'Zwi', 'Kre', 'Löw', 'Jun', 'Waa', 'Sko', 'Sch', 'Ste', 'Was', 'Fis'];
  const sign = signs[Math.floor(asc / 30)];
  const marker = (sign === 'Sko') ? ' ← SKORPION!' : '';

  console.log(`JD +${correction.toFixed(1)} Tage: JD=${correctedJD.toFixed(2)} → LST=${lst.toFixed(1)}° → ASC=${asc.toFixed(1)}° (${sign})${marker}`);
}

console.log('\n=== GENAUERE ANALYSE UM 3 TAGE ===\n');

for (let correction = 2.5; correction <= 3.5; correction += 0.1) {
  const correctedJD = originalJD + correction;
  const lst = localSiderealTimeDeg(correctedJD, longitude);
  const asc = calculateAscendant(lst, epsilon, latitude);

  const signs = ['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau',
                 'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische'];
  const sign = signs[Math.floor(asc / 30)];

  if (sign === 'Skorpion') {
    console.log(`✅ +${correction.toFixed(1)} Tage: LST=${lst.toFixed(2)}° → ASC=${asc.toFixed(2)}° (${sign})`);
  }
}
