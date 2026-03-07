// Verifiziere: Ist "24.06.1980, 15:20 MESZ" korrekt als UTC 13:20 interpretiert?

// MESZ 1980 Regeln prüfen
console.log('=== ZEITZONE-VERIFIKATION ===\n');

// In Deutschland 1980:
// Sommerzeit (MESZ) begann am 6. April 1980 (02:00 → 03:00)
// Sommerzeit endete am 28. September 1980 (03:00 → 02:00)

const birthDate = new Date('1980-06-24T15:20:00+02:00'); // MESZ = UTC+2
console.log('Geburtsdatum: 24.06.1980, 15:20 MESZ');
console.log(`JavaScript Date: ${birthDate.toISOString()}`);
console.log(`UTC Zeit: ${birthDate.getUTCHours()}:${birthDate.getUTCMinutes().toString().padStart(2, '0')}`);
console.log(`UTC Datum: ${birthDate.getUTCFullYear()}-${(birthDate.getUTCMonth()+1).toString().padStart(2, '0')}-${birthDate.getUTCDate().toString().padStart(2, '0')}`);

console.log('\n=== ALTERNATIV-HYPOTHESEN ===\n');

// Hypothese 1: Was wenn es MEZ (UTC+1) statt MESZ war?
const mez = new Date('1980-06-24T15:20:00+01:00');
console.log('Hypothese MEZ (UTC+1): ', mez.toISOString());
console.log(`  → UTC: ${mez.getUTCHours()}:${mez.getUTCMinutes().toString().padStart(2, '0')}`);

// Hypothese 2: Was wenn es lokale Sonnenzeit war?
// Hannover: 9.732°E → +38.93 Minuten von UTC
console.log('Hypothese Wahre Ortszeit (9.732°E):');
console.log('  → UTC-Offset: +38.93 Minuten');
const ortszeitUTC = 15 * 60 + 20 - 38.93; // in Minuten
console.log(`  → UTC: ${Math.floor(ortszeitUTC/60)}:${Math.round(ortszeitUTC%60).toString().padStart(2, '0')}`);

// Hypothese 3: Was wenn die Zeit  falsch interpretiert wurde (z.B. PM statt 24h)?
console.log('\nHypothese 12h-Format verwechselt:');
console.log('  15:20 als 3:20 PM interpretiert → korrekt');
console.log('  15:20 als 3:20 AM interpretiert → UTC: 01:20');

console.log('\n=== JD-BERECHNUNG MIT VERSCHIEDENEN ZEITEN ===\n');

function julianDateUTC(year, month, day, hour = 0, minute = 0, second = 0) {
  let Y = year, M = month;
  const dayFrac = (hour + minute / 60 + second / 3600) / 24;
  const D = day + dayFrac;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

const scenarios = [
  { name: 'MESZ 15:20 → UTC 13:20', hour: 13, minute: 20 },
  { name: 'MEZ 15:20 → UTC 14:20', hour: 14, minute: 20 },
  { name: 'Ortszeit 15:20 → UTC 14:41', hour: 14, minute: 41 },
  { name: 'Falsch: UTC 15:20', hour: 15, minute: 20 },
  { name: 'AM verwechselt: UTC 01:20', hour: 1, minute: 20 },
];

scenarios.forEach(sc => {
  const jd = julianDateUTC(1980, 6, 24, sc.hour, sc.minute, 0);
  console.log(`${sc.name.padEnd(30)} → JD ${jd.toFixed(6)}`);
});

console.log('\n=== ALTERNATIVE: DATUM FALSCH? ===\n');

// Was wenn statt 24.06. ein anderes Datum gemeint war?
for (let day = 21; day <= 27; day++) {
  const jd = julianDateUTC(1980, 6, day, 13, 20, 0);
  const diff = jd - 2444418.056;
  const marker = Math.abs(diff) < 0.1 ? ' ← MATCH!' : '';
  console.log(`${day}.06.1980 13:20 UTC → JD ${jd.toFixed(3)} (Diff: ${diff.toFixed(3)})${marker}`);
}
