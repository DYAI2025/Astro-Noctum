// Rückwärts-Berechnung: Welche LST ergibt Skorpion-Aszendent?

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

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

const epsilon = 23.441831;
const latitude = 52.3759;
const targetAsc = 225; // Skorpion Mitte

console.log('=== REVERSE CALCULATION ===');
console.log(`Ziel: Aszendent = ${targetAsc}° (Skorpion)\n`);
console.log(`Teste verschiedene LST-Werte:\n`);

// Teste LST von 100° bis 250° in 5°-Schritten
for (let lst = 100; lst <= 250; lst += 5) {
  const asc = calculateAscendant(lst, epsilon, latitude);
  const signs = ['Wid', 'Sti', 'Zwi', 'Kre', 'Löw', 'Jun', 'Waa', 'Sko', 'Sch', 'Ste', 'Was', 'Fis'];
  const sign = signs[Math.floor(asc / 30)];
  const marker = (sign === 'Sko') ? ' ← SKORPION!' : '';
  console.log(`LST ${lst.toString().padStart(3)}° → ASC ${asc.toFixed(2).padStart(6)}° (${sign})${marker}`);
}

console.log('\n=== GENAUERE ANALYSE FÜR SKORPION ===\n');

// Finde exakte LST für ASC = 225°
for (let lst = 145; lst <= 155; lst += 0.5) {
  const asc = calculateAscendant(lst, epsilon, latitude);
  if (Math.abs(asc - 225) < 5) {
    console.log(`LST ${lst.toFixed(1)}° → ASC ${asc.toFixed(3)}° (Differenz: ${(asc - 225).toFixed(3)}°)`);
  }
}

console.log('\n=== AKTUELLE ENGINE-WERTE ===');
const currentLST = 122.581670;
const currentAsc = calculateAscendant(currentLST, epsilon, latitude);
console.log(`LST ${currentLST.toFixed(2)}° → ASC ${currentAsc.toFixed(2)}° (Waage)`);

console.log('\n=== ERFORDERLICHE KORREKTUR ===');
const requiredLSTshift = 225 - currentAsc;
const newLST = currentLST + requiredLSTshift;
const verifyAsc = calculateAscendant(newLST, epsilon, latitude);
console.log(`Aktuelle LST: ${currentLST.toFixed(2)}°`);
console.log(`Erforderliche Shift: +${requiredLSTshift.toFixed(2)}°`);
console.log(`Neue LST: ${newLST.toFixed(2)}°`);
console.log(`Verifizierung: ASC = ${verifyAsc.toFixed(2)}°`);
