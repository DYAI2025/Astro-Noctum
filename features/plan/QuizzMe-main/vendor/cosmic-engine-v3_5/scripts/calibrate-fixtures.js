#!/usr/bin/env node
/**
 * FIXTURE CALIBRATION SCRIPT
 *
 * Dieses Script kalibriert die Golden Fixtures gegen echte Swiss Ephemeris Werte.
 * MUSS vor Production-Deployment ausgeführt werden!
 *
 * Usage:
 *   node scripts/calibrate-fixtures.js
 *
 * Prerequisites:
 *   - Python mit pyswisseph installiert
 *   - cd astro-precision-horoscope && pip install -r requirements.txt
 */

const { PrecisionBridge, PrecisionError } = require('../src/precision-bridge');
const fs = require('fs');
const path = require('path');

// Non-strict mode for calibration (allows fallback during setup)
process.env.COSMIC_STRICT_MODE = '0';
process.env.COSMIC_PRECISION_FALLBACK = '0'; // Still fail-closed

async function calibrate() {
  console.log('═'.repeat(70));
  console.log('  GOLDEN FIXTURE CALIBRATION');
  console.log('  Calibrating against Swiss Ephemeris SSOT');
  console.log('═'.repeat(70));
  console.log('');

  // Python path: Use env var or default to venv
  // CI should set COSMIC_PYTHON_PATH or create venv in setup step
  const pythonPath = process.env.COSMIC_PYTHON_PATH ||
    path.join(__dirname, '..', 'astro-precision-horoscope', '.venv', 'bin', 'python3');

  const bridge = new PrecisionBridge({
    strictMode: false, // Allow warnings during calibration
    useFallback: false,
    pythonPath
  });

  // Check availability
  console.log('🔍 Checking Swiss Ephemeris availability...');
  try {
    await bridge.checkAvailability();
    console.log('✅ Swiss Ephemeris available');
  } catch (error) {
    console.error('❌ Swiss Ephemeris not available:', error.message);
    console.error('');
    console.error('Setup instructions:');
    console.error('  1. cd astro-precision-horoscope');
    console.error('  2. python3 -m venv .venv && source .venv/bin/activate');
    console.error('  3. pip install -r requirements.txt');
    console.error('  4. export SE_EPHE_PATH=/path/to/ephemeris (optional)');
    process.exit(1);
  }

  const fixturesDir = path.join(__dirname, '..', 'tests', 'fixtures');
  const goldenFiles = fs.readdirSync(fixturesDir)
    .filter(f => f.startsWith('golden-') && f.endsWith('.json'));

  console.log(`\n📁 Found ${goldenFiles.length} fixture(s) to calibrate\n`);

  for (const filename of goldenFiles) {
    console.log('─'.repeat(70));
    console.log(`📋 Calibrating: ${filename}`);
    console.log('─'.repeat(70));

    const filepath = path.join(fixturesDir, filename);
    const fixture = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    try {
      // Calculate with Swiss Ephemeris
      const result = await bridge.computeHoroscope(fixture.input);

      if (!result.success || result.mode !== 'precision') {
        console.error(`❌ Failed to calculate: ${result.error || result.mode}`);
        continue;
      }

      // Extract values
      const { ascendant, mc, planets } = result.data;

      console.log('');
      console.log('Swiss Ephemeris values:');
      console.log(`  Ascendant: ${ascendant.longitude.toFixed(4)}° (${ascendant.sign})`);
      console.log(`  MC:        ${mc.longitude.toFixed(4)}° (${mc.sign})`);
      console.log(`  Sun:       ${planets.Sun.longitude.toFixed(4)}° (${planets.Sun.sign})`);
      console.log(`  Moon:      ${planets.Moon.longitude.toFixed(4)}° (${planets.Moon.sign})`);

      // Update fixture
      fixture.expected.ascendant.longitude = Math.round(ascendant.longitude * 10000) / 10000;
      fixture.expected.ascendant.sign = ascendant.sign;
      delete fixture.expected.ascendant.longitude_placeholder;
      delete fixture.expected.ascendant.comment;

      fixture.expected.mc.longitude = Math.round(mc.longitude * 10000) / 10000;
      fixture.expected.mc.sign = mc.sign;
      delete fixture.expected.mc.longitude_placeholder;

      fixture.expected.sun.longitude = Math.round(planets.Sun.longitude * 10000) / 10000;
      fixture.expected.sun.sign = planets.Sun.sign;
      delete fixture.expected.sun.longitude_placeholder;

      fixture.expected.moon.longitude = Math.round(planets.Moon.longitude * 10000) / 10000;
      fixture.expected.moon.sign = planets.Moon.sign;
      delete fixture.expected.moon.longitude_placeholder;

      // Update metadata
      fixture.calibration_required = false;
      fixture.calibrated_at = new Date().toISOString();
      fixture.calibrated_with = result.audit.swisseph_version;
      fixture.source = 'Calibrated against Swiss Ephemeris output';

      // Write back
      fs.writeFileSync(filepath, JSON.stringify(fixture, null, 2));

      console.log('');
      console.log('✅ Fixture calibrated and saved');

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      if (error instanceof PrecisionError) {
        console.error(`   Code: ${error.code}`);
      }
    }
  }

  console.log('');
  console.log('═'.repeat(70));
  console.log('  CALIBRATION COMPLETE');
  console.log('═'.repeat(70));
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review calibrated fixtures in tests/fixtures/');
  console.log('  2. Run CI gate: npm run ci');
  console.log('  3. Commit changes if tests pass');
  console.log('');
}

calibrate().catch(console.error);
