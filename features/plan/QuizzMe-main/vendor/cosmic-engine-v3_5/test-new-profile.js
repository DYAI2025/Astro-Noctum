// Test: Neues Horoskop - 12.03.1983, 16:26, Hannover

// Importiere die Engine
const fs = require('fs');
const engineCode = fs.readFileSync('./cosmic-architecture-engine-v3.js', 'utf8');

// Extrahiere nur die Funktionen (ohne die Test-Ausführung am Ende)
const functionsOnly = engineCode.split('// ============================================================================')[0] +
                      engineCode.split('// ============================================================================').slice(1, -1).join('// ============================================================================');

eval(functionsOnly);

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║        NEUES HOROSKOP - TEST DER KORRIGIERTEN ENGINE          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Berechne Profil
const profile = calculateCosmicProfile({
  year: 1983,
  month: 3,
  day: 12,
  hour: 16,
  minute: 26,
  second: 0,
  latitude: 52.3759,  // Hannover
  longitude: 9.7320,  // Hannover
  tzOffsetMinutes: 60 // MEZ = UTC+1 (Sommerzeit beginnt erst am 27. März 1983)
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('GEBURTSDATEN');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log(`📅 Datum:     12. März 1983`);
console.log(`⏰ Zeit:      16:26 MEZ (UTC+1)`);
console.log(`📍 Ort:       Hannover, Deutschland`);
console.log(`   Breite:   52.3759°N`);
console.log(`   Länge:    9.7320°E`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🌍 WESTLICHE ASTROLOGIE');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`☀️  SONNE:       ${profile.western.sun.signDE} ${profile.western.sun.degree}°${profile.western.sun.minute}'`);
console.log(`    Position:   ${profile.western.sun.longitude.toFixed(2)}° ekliptische Länge`);
console.log(`    Element:    ${profile.western.sun.element}`);
console.log(`    Modalität:  ${profile.western.sun.modality}`);
console.log(`    Haus:       ${profile.western.sun.house}`);

console.log(`\n🌙 MOND:        ${profile.western.moon.signDE} ${profile.western.moon.degree}°${profile.western.moon.minute}'`);
console.log(`    Position:   ${profile.western.moon.longitude.toFixed(2)}° ekliptische Länge`);
console.log(`    Element:    ${profile.western.moon.element}`);
console.log(`    Modalität:  ${profile.western.moon.modality}`);
console.log(`    Haus:       ${profile.western.moon.house}`);

console.log(`\n⬆️  ASZENDENT:  ${profile.western.asc.signDE} ${profile.western.asc.degree}°${profile.western.asc.minute}'`);
console.log(`    Position:   ${profile.western.asc.longitude.toFixed(2)}° ekliptische Länge`);
console.log(`    Element:    ${profile.western.asc.element}`);
console.log(`    Modalität:  ${profile.western.asc.modality}`);

console.log(`\n🔝 MC (Himmelsmitte): ${profile.western.mc.signDE} ${profile.western.mc.degree}°${profile.western.mc.minute}'`);
console.log(`    Position:   ${profile.western.mc.longitude.toFixed(2)}° ekliptische Länge`);

console.log(`\n⬇️  DESZENDENT: ${profile.western.desc.signDE} ${profile.western.desc.degree}°${profile.western.desc.minute}'`);
console.log(`🔽 IC (Nadir):  ${profile.western.ic.signDE} ${profile.western.ic.degree}°${profile.western.ic.minute}'`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🀄 BA ZI (VIER SÄULEN DES SCHICKSALS)');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📜 VOLLSTÄNDIGE NOTATION:`);
console.log(`   Chinesisch: ${profile.bazi.fullNotation}`);
console.log(`   Pinyin:     ${profile.bazi.fullNotationPinyin}\n`);

console.log(`📅 JAHR-SÄULE (祖 - Ahnen, Familie):`);
console.log(`   ${profile.bazi.year.stemCN}${profile.bazi.year.branchCN} (${profile.bazi.year.stem}-${profile.bazi.year.branch})`);
console.log(`   Tier:       ${ANIMALS_DE[profile.bazi.year.branchIndex]}`);
console.log(`   Element:    ${profile.bazi.year.element} (${profile.bazi.year.polarity})`);

console.log(`\n🌙 MONAT-SÄULE (親 - Eltern, Karriere):`);
console.log(`   ${profile.bazi.month.stemCN}${profile.bazi.month.branchCN} (${profile.bazi.month.stem}-${profile.bazi.month.branch})`);
console.log(`   Element:    ${profile.bazi.month.element} (${profile.bazi.month.polarity})`);

console.log(`\n☀️  TAG-SÄULE (己 - Selbst, Ehe):`);
console.log(`   ${profile.bazi.day.stemCN}${profile.bazi.day.branchCN} (${profile.bazi.day.stem}-${profile.bazi.day.branch})`);
console.log(`   Element:    ${profile.bazi.day.element} (${profile.bazi.day.polarity})`);

console.log(`\n⏰ STUNDEN-SÄULE (子 - Kinder, Zukunft):`);
console.log(`   ${profile.bazi.hour.stemCN}${profile.bazi.hour.branchCN} (${profile.bazi.hour.stem}-${profile.bazi.hour.branch})`);
console.log(`   Element:    ${profile.bazi.hour.element} (${profile.bazi.hour.polarity})`);
console.log(`   Zeit:       ${profile.bazi.hour.tstMinutes} Min (True Solar Time)`);

console.log(`\n🎯 DAY MASTER (日主 - Kern der Persönlichkeit):`);
console.log(`   ${profile.bazi.dayMaster.stemCN} ${profile.bazi.dayMaster.stem}`);
console.log(`   Element:    ${profile.bazi.dayMaster.element}`);
console.log(`   Polarität:  ${profile.bazi.dayMaster.polarity}`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🔥 WU XING (FÜNF ELEMENTE) - VERTEILUNG');
console.log('═══════════════════════════════════════════════════════════════\n');

const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
const elementsDE = ['Holz', 'Feuer', 'Erde', 'Metall', 'Wasser'];
const elementsEmoji = ['🌳', '🔥', '⛰️', '⚔️', '💧'];

elements.forEach((elem, i) => {
  const percentage = profile.elementBalance.percentages[elem];
  const bars = '█'.repeat(Math.round(percentage / 5));
  console.log(`${elementsEmoji[i]}  ${elementsDE[i].padEnd(7)}: ${percentage.toFixed(1)}% ${bars}`);
});

console.log(`\n🎯 DOMINANTES ELEMENT:  ${profile.elementBalance.dominant} (${profile.elementBalance.percentages[profile.elementBalance.dominant].toFixed(1)}%)`);
console.log(`⚖️  SCHWÄCHSTES ELEMENT: ${profile.elementBalance.weakest} (${profile.elementBalance.percentages[profile.elementBalance.weakest].toFixed(1)}%)`);
console.log(`📊 BALANCE:             ${profile.elementBalance.balance}`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🌟 LI WEI SYNTHESE');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📖 DYAI Prime Directive: Wahrheit > Nützlichkeit > Schönheit\n`);

console.log(`🔹 Day Master:        ${profile.liWei.interpretation.dayMaster}`);
console.log(`🔹 Dominantes Element: ${profile.liWei.interpretation.dominantElement}`);
console.log(`🔹 Suchendes Element:  ${profile.liWei.interpretation.seekingElement}`);
console.log(`🔹 Balance:            ${profile.liWei.interpretation.balance}`);

console.log(`\n🎯 EMPOWERMENT:\n   ${profile.liWei.empowerment}`);

console.log(`\n📊 FUSION SYNTHESE:`);
console.log(`   Kern:      ${profile.fusion.synthesis.primary}`);
console.log(`   Emotional: ${profile.fusion.synthesis.emotional}`);
console.log(`   Sozial:    ${profile.fusion.synthesis.social}`);

if (profile.fusion.resonances.length > 0) {
  console.log(`\n🔗 RESONANZEN:`);
  profile.fusion.resonances.forEach(r => {
    console.log(`   • ${r.description}`);
  });
}

if (profile.fusion.tensions.length > 0) {
  console.log(`\n⚡ SPANNUNGEN:`);
  profile.fusion.tensions.forEach(t => {
    console.log(`   • ${t.description}`);
  });
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('⏰ TECHNISCHE DETAILS');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`Julian Date (UTC):     ${profile.time.jdUTC.toFixed(6)}`);
console.log(`Julian Date (TT):      ${profile.time.jdTT.toFixed(6)}`);
console.log(`Delta T:               ${profile.time.deltaT.toFixed(2)} Sekunden`);
console.log(`GMST:                  ${profile.time.gmstDeg.toFixed(4)}°`);
console.log(`LST:                   ${profile.time.lstDeg.toFixed(4)}° (${profile.time.lstHours.toFixed(4)}h)`);
console.log(`Mean Obliquity:        ${profile.time.epsilonDeg.toFixed(6)}°`);

console.log('\n═══════════════════════════════════════════════════════════════\n');
