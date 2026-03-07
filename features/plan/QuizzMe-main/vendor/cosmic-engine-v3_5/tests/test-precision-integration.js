/**
 * TEST: Swiss Ephemeris Integration
 *
 * Testet die Integration zwischen Cosmic Engine und astro-precision-horoscope
 */

const { CosmicEngineEnhanced } = require('../src/cosmic-engine-enhanced');
const { PrecisionBridge } = require('../src/precision-bridge');

// Test-Daten: Ben (Kalibrierungsvektor aus v3)
const BEN_DATA = {
  year: 1980,
  month: 6,
  day: 24,
  hour: 15,
  minute: 20,
  second: 0,
  latitude: 52.3759,
  longitude: 9.7320,
  timezone: 'Europe/Berlin', // MESZ = UTC+2
  tzOffsetMinutes: 120
};

// Test-Daten: Neue Person
const TEST_DATA = {
  year: 1983,
  month: 3,
  day: 12,
  hour: 16,
  minute: 26,
  second: 0,
  latitude: 52.3759,
  longitude: 9.7320,
  timezone: 'Europe/Berlin',
  tzOffsetMinutes: 60 // MEZ = UTC+1
};

async function testPrecisionBridge() {
  console.log('\n🧪 TEST 1: Precision Bridge Availability');
  console.log('='.repeat(60));

  const bridge = new PrecisionBridge({ strictMode: false });
  const check = await bridge.checkAvailability();

  console.log('Status:', check.available ? '✅ Available' : '❌ Not Available');
  console.log('Message:', check.message);

  return check.available;
}

async function testPrecisionCalculation() {
  console.log('\n🧪 TEST 2: Precision Calculation (Ben)');
  console.log('='.repeat(60));

  const bridge = new PrecisionBridge({ strictMode: false, useFallback: true });

  try {
    const result = await bridge.computeHoroscope(BEN_DATA);

    console.log('Mode:', result.mode);
    console.log('Engine:', result.engine);

    if (result.mode === 'precision') {
      console.log('\n✨ Swiss Ephemeris Results:');
      console.log('─'.repeat(60));

      const { ascendant, mc, planets, validation, audit } = result.data;

      console.log('Aszendent:', `${ascendant.sign} ${ascendant.degree_in_sign.toFixed(2)}° (${ascendant.longitude.toFixed(2)}°)`);
      console.log('MC:', `${mc.sign} ${mc.degree_in_sign.toFixed(2)}°`);
      console.log('Sonne:', `${planets.Sun.sign} ${planets.Sun.degree_in_sign.toFixed(2)}°`);
      console.log('Mond:', `${planets.Moon.sign} ${planets.Moon.degree_in_sign.toFixed(2)}°`);

      console.log('\n📊 Validation:');
      console.log('Status:', validation.status);
      console.log('Checks:', validation.issues?.length || 0, 'issues');

      if (validation.issues && validation.issues.length > 0) {
        validation.issues.forEach(issue => {
          const icon = issue.severity === 'error' ? '❌' : '⚠️';
          console.log(`  ${icon} ${issue.code}: ${issue.message}`);
        });
      }

      console.log('\n🔍 Audit Trail:');
      console.log('JD_UT:', audit.jd_ut.toFixed(6));
      console.log('ΔT:', audit.delta_t_seconds.toFixed(2), 'seconds');
      console.log('Engine:', audit.swisseph_version);
      console.log('Mode:', audit.engine_flags.mode);
      console.log('Timezone:', audit.iana_time_zone);
      console.log('UTC Offset:', audit.utc_offset_minutes, 'min');
      console.log('DST Offset:', audit.dst_offset_minutes, 'min');

      return true;
    } else {
      console.log('⚠️  Fallback mode triggered');
      console.log('Reason:', result.fallbackReason);
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testEnhancedEngine() {
  console.log('\n🧪 TEST 3: Enhanced Engine Integration');
  console.log('='.repeat(60));

  const engine = new CosmicEngineEnhanced({
    usePrecision: true,
    strictMode: false,
    useFallback: true
  });

  // Initialize
  const init = await engine.initialize();
  console.log('Initialization:', init.mode);

  // Calculate profile
  console.log('\nCalculating profile for:', TEST_DATA.year, TEST_DATA.month, TEST_DATA.day);

  try {
    const profile = await engine.calculateProfile(TEST_DATA);

    console.log('\n✨ Profile Results:');
    console.log('─'.repeat(60));
    console.log('Version:', profile.meta.version);
    console.log('Precision Mode:', profile.meta.precision.mode);
    console.log('Valid:', profile.meta.valid ? '✅' : '❌');
    console.log('Compute Time:', profile.meta.computeTimeMs, 'ms');

    if (profile.meta.warnings && profile.meta.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      profile.meta.warnings.forEach(w => console.log('  -', w));
    }

    if (profile.western) {
      console.log('\n🌟 Western Astrology:');
      console.log('Ascendant:', profile.western.ascendant?.sign || 'Unknown');
      console.log('Sun:', profile.western.sun?.sign || 'Unknown');
      console.log('Moon:', profile.western.moon?.sign || 'Unknown');
    }

    if (profile.bazi) {
      console.log('\n🀄 Ba Zi (Four Pillars):');
      console.log('Year:', profile.bazi.year?.stem || 'Unknown', profile.bazi.year?.branch || 'Unknown');
      console.log('Day Master:', profile.bazi.dayMaster?.stem || 'Unknown');
    }

    return profile.meta.valid;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testComparisonPrecisionVsSimplified() {
  console.log('\n🧪 TEST 4: Precision vs Simplified Comparison');
  console.log('='.repeat(60));

  // Precision mode
  const enginePrecision = new CosmicEngineEnhanced({
    usePrecision: true,
    strictMode: false
  });

  // Simplified mode
  const engineSimplified = new CosmicEngineEnhanced({
    usePrecision: false
  });

  try {
    console.log('Calculating with Precision...');
    const resultPrecision = await enginePrecision.calculateProfile(BEN_DATA);

    console.log('Calculating with Simplified...');
    const resultSimplified = await engineSimplified.calculateProfile(BEN_DATA);

    console.log('\n📊 Comparison:');
    console.log('─'.repeat(60));

    console.log('\nPrecision Mode:');
    console.log('  Engine:', resultPrecision.meta.precision.mode);
    console.log('  Compute Time:', resultPrecision.meta.computeTimeMs, 'ms');
    console.log('  Ascendant:', resultPrecision.western?.ascendant?.sign || 'N/A');

    console.log('\nSimplified Mode:');
    console.log('  Engine:', resultSimplified.meta.precision.mode);
    console.log('  Compute Time:', resultSimplified.meta.computeTimeMs, 'ms');
    console.log('  Ascendant:', resultSimplified.western?.ascendant?.sign || 'N/A');

    if (resultPrecision.western?.ascendant && resultSimplified.western?.ascendant) {
      const diff = Math.abs(
        resultPrecision.western.ascendant.degree - resultSimplified.western.ascendant.degree
      );
      console.log('\n📐 Ascendant Difference:', diff.toFixed(4), '°');

      if (diff < 0.1) {
        console.log('✅ Excellent agreement (<0.1°)');
      } else if (diff < 1.0) {
        console.log('⚠️  Good agreement (<1°)');
      } else {
        console.log('❌ Significant difference (>1°)');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
    return false;
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  COSMIC ENGINE - SWISS EPHEMERIS INTEGRATION TESTS');
  console.log('='.repeat(60));

  const results = {
    availability: false,
    precision: false,
    engine: false,
    comparison: false
  };

  try {
    results.availability = await testPrecisionBridge();
    if (results.availability) {
      results.precision = await testPrecisionCalculation();
      results.engine = await testEnhancedEngine();
      results.comparison = await testComparisonPrecisionVsSimplified();
    } else {
      console.log('\n⚠️  Swiss Ephemeris not available - skipping precision tests');
      console.log('To enable precision mode:');
      console.log('  1. cd astro-precision-horoscope');
      console.log('  2. pip install -r requirements.txt');
      console.log('  3. export SE_EPHE_PATH=/path/to/ephemeris/files');
    }
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('='.repeat(60));

  const icon = (result) => result ? '✅' : '❌';
  console.log(icon(results.availability), 'Precision Bridge Availability');
  console.log(icon(results.precision), 'Precision Calculation');
  console.log(icon(results.engine), 'Enhanced Engine Integration');
  console.log(icon(results.comparison), 'Precision vs Simplified Comparison');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  console.log('\n📊 Overall:', `${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else if (results.availability === false) {
    console.log('⚠️  Swiss Ephemeris not configured - setup required');
  } else {
    console.log('❌ Some tests failed - check output above');
  }

  console.log('='.repeat(60) + '\n');
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testPrecisionBridge,
  testPrecisionCalculation,
  testEnhancedEngine,
  testComparisonPrecisionVsSimplified,
  runAllTests
};
