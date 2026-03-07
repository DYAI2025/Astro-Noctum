// Vergleiche verschiedene GMST-Formeln

function normDeg(deg) {
  let n = deg % 360;
  if (n < 0) n += 360;
  return n;
}

// AKTUELLE Engine-Formel
function greenwichMeanSiderealTime_Current(JD_UTC) {
  const T = (JD_UTC - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (JD_UTC - 2451545.0) +
             T * T * (0.000387933 - T / 38710000);
  return normDeg(gmst);
}

// Alternative GMST-Formel (IAU 2006)
function greenwichMeanSiderealTime_IAU2006(JD_UTC) {
  const T = (JD_UTC - 2451545.0) / 36525;
  const UT = (JD_UTC - Math.floor(JD_UTC - 0.5) - 0.5) * 24; // UT in Stunden

  // GMST0 (GMST at 0h UT)
  let gmst0 = 24110.54841 + 8640184.812866 * T + 0.093104 * T * T - 0.0000062 * T * T * T;
  gmst0 = gmst0 / 3600 % 24; // in Stunden, mod 24

  // GMST = GMST0 + UT * 1.00273790935
  let gmst = gmst0 + UT * 1.00273790935;
  gmst = (gmst % 24) * 15; // in Grad

  return normDeg(gmst);
}

// Meeus Algorithmus
function greenwichMeanSiderealTime_Meeus(JD_UTC) {
  const T = (JD_UTC - 2451545.0) / 36525;
  let theta0 = 280.46061837 + 360.98564736629 * (JD_UTC - 2451545.0) +
               T * T * (0.000387933 - T / 38710000);
  return normDeg(theta0);
}

console.log('=== GMST FORMULA COMPARISON ===\n');

const jd_ben_24 = 2444415.055556; // 24.06.1980, 13:20 UTC
const jd_ben_27 = 2444418.055556; // 27.06.1980, 13:20 UTC

console.log('Ben (24.06.1980, 13:20 UTC):');
console.log(`  Current:  ${greenwichMeanSiderealTime_Current(jd_ben_24).toFixed(6)}°`);
console.log(`  IAU 2006: ${greenwichMeanSiderealTime_IAU2006(jd_ben_24).toFixed(6)}°`);
console.log(`  Meeus:    ${greenwichMeanSiderealTime_Meeus(jd_ben_24).toFixed(6)}°`);

console.log('\nBen (27.06.1980, 13:20 UTC):');
console.log(`  Current:  ${greenwichMeanSiderealTime_Current(jd_ben_27).toFixed(6)}°`);
console.log(`  IAU 2006: ${greenwichMeanSiderealTime_IAU2006(jd_ben_27).toFixed(6)}°`);
console.log(`  Meeus:    ${greenwichMeanSiderealTime_Meeus(jd_ben_27).toFixed(6)}°`);

console.log('\nDifferenz GMST (27 - 24):');
const diff_current = greenwichMeanSiderealTime_Current(jd_ben_27) - greenwichMeanSiderealTime_Current(jd_ben_24);
const diff_iau = greenwichMeanSiderealTime_IAU2006(jd_ben_27) - greenwichMeanSiderealTime_IAU2006(jd_ben_24);
console.log(`  Current:  ${diff_current.toFixed(2)}°`);
console.log(`  IAU 2006: ${diff_iau.toFixed(2)}°`);
console.log('  Erwartet: ~3° (für 3 Tage * 361°/Tag % 360)');

// Test mit J2000.0
console.log('\n=== VERIFICATION WITH J2000.0 ===');
const jd_j2000 = 2451545.0; // 2000-01-01 12:00 UT
console.log(`J2000.0 (2000-01-01 12:00 UT):`);
console.log(`  Current:  ${greenwichMeanSiderealTime_Current(jd_j2000).toFixed(6)}°`);
console.log(`  IAU 2006: ${greenwichMeanSiderealTime_IAU2006(jd_j2000).toFixed(6)}°`);
console.log(`  Expected: ~280.46° (GMST at J2000.0 epoch)`);
