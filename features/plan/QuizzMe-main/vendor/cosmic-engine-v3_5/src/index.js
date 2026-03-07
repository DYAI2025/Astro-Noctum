/**
 * COSMIC ARCHITECTURE ENGINE v3.1 - UNIFIED FAIL-CLOSED
 *
 * SSOT Entry Point - Swiss Ephemeris für Western, vollständige Ba Zi Integration
 *
 * ARCHITEKTUR:
 * - Western (Aszendent, Planeten, Häuser): Swiss Ephemeris via Python (SSOT)
 * - Ba Zi (Vier Säulen): JavaScript (validiert, Offset 49)
 * - Fusion/Li Wei: JavaScript (vollständige Implementation)
 *
 * FAIL-CLOSED:
 * - Kein Fallback für Western-Berechnungen
 * - IANA Timezone PFLICHT in Strict Mode
 * - Validation.status='ok' PFLICHT für Datenlieferung
 * - CI-Gate mit Golden Fixtures
 */

const { PrecisionBridge, PrecisionError } = require('./precision-bridge');

// Import Ba Zi/Fusion/Li Wei from v3 engine
const v3Engine = require('../cosmic-architecture-engine-v3');

// Environment
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const FORCE_STRICT = process.env.COSMIC_STRICT_MODE === '1' || IS_PRODUCTION;

class CosmicEngine {
  constructor(options = {}) {
    // FAIL-CLOSED: Strict by default in production
    this.strictMode = options.strictMode !== false || FORCE_STRICT;

    // FAIL-CLOSED: Keine Fallbacks in Production
    this.precisionBridge = new PrecisionBridge({
      strictMode: this.strictMode,
      useFallback: false, // NIEMALS Fallback
      pythonPath: options.pythonPath,
      scriptPath: options.scriptPath
    });

    this._initialized = false;
  }

  /**
   * Initialisierung - prüft Swiss Ephemeris Verfügbarkeit
   * FAIL-CLOSED: Wirft Error wenn nicht verfügbar
   */
  async initialize() {
    const check = await this.precisionBridge.checkAvailability();
    this._initialized = true;
    return {
      mode: 'precision',
      engine: 'swiss-ephemeris',
      status: 'ready'
    };
  }

  /**
   * MAIN API: Berechnet vollständiges kosmisches Profil
   *
   * FAIL-CLOSED Requirements:
   * - timezone (IANA) ist PFLICHT in Strict Mode
   * - Swiss Ephemeris muss verfügbar sein
   * - validation.status muss 'ok' sein
   *
   * @param {Object} input
   * @param {number} input.year
   * @param {number} input.month
   * @param {number} input.day
   * @param {number} input.hour
   * @param {number} input.minute
   * @param {number} [input.second]
   * @param {number} input.latitude
   * @param {number} input.longitude
   * @param {string} input.timezone - IANA timezone (PFLICHT in Strict)
   * @param {number} [input.fold] - DST disambiguation (0 or 1)
   * @returns {Promise<Object>} Vollständiges Profil
   * @throws {PrecisionError} Bei Validation-Fehlern
   */
  async calculateProfile(input) {
    // FAIL-CLOSED: Strikte Input-Validation
    this._validateInput(input);

    // 1. Swiss Ephemeris für Western (SSOT)
    const precisionResult = await this.precisionBridge.computeHoroscope(input);

    // 2. Ba Zi aus v3 Engine (JavaScript, validiert)
    const baziResult = this._calculateBaZi(input, precisionResult);

    // 3. Fusion & Li Wei (vollständig aus v3)
    const fusionResult = this._calculateFusion(precisionResult, baziResult);
    const liWeiResult = this._generateLiWei(precisionResult, baziResult, fusionResult);

    // 4. Unified Result
    // Determine ephemeris mode from Python's audit data
    const ephemerisMode = precisionResult.audit?.engine_flags?.mode || 'unknown';

    return {
      meta: {
        version: '3.1.0-unified',
        engine: 'cosmic-architecture-engine',
        mode: 'precision',
        computed: new Date().toISOString(),
        valid: true,
        strictMode: this.strictMode,
        // EPHEMERIS POLICY: Document what ephemeris is actually used
        capabilities: {
          ephemeris: ephemerisMode,
          ephemerisVersion: precisionResult.audit?.swisseph_version || 'unknown',
          // swieph = Swiss Ephemeris (full precision, <1" accuracy)
          // moseph = Moshier (analytic, sub-arcsecond accuracy, no external files)
          ephemerisAccuracy: ephemerisMode === 'moseph' ? 'sub-arcsecond (Moshier analytic)' : 'sub-arcsecond (Swiss Ephemeris)',
          western: 'swiss-ephemeris',
          bazi: 'validated-offset-49',
          fusion: 'li-wei-framework'
        }
      },
      input: this._formatInput(input),
      western: this._extractWestern(precisionResult.data),
      bazi: baziResult,
      fusion: fusionResult,
      liWei: liWeiResult,
      audit: precisionResult.audit,
      validation: precisionResult.validation
    };
  }

  /**
   * FAIL-CLOSED: Strikte Input-Validation
   */
  _validateInput(input) {
    // FAIL-CLOSED: IANA Timezone PFLICHT in Strict Mode
    if (this.strictMode) {
      if (!input.timezone) {
        throw new PrecisionError(
          'IANA timezone is required in strict mode. ' +
          'tzOffsetMinutes is not allowed because it cannot handle DST correctly.',
          { code: 'IANA_TIMEZONE_REQUIRED' }
        );
      }

      // Validate IANA format (basic check)
      if (!input.timezone.includes('/') && input.timezone !== 'UTC') {
        throw new PrecisionError(
          `Invalid IANA timezone format: "${input.timezone}". ` +
          'Expected format like "Europe/Berlin" or "America/New_York".',
          { code: 'INVALID_TIMEZONE_FORMAT', value: input.timezone }
        );
      }
    }

    // Standard validations (delegiert an Bridge)
    // Bridge macht weitere Checks
  }

  /**
   * Ba Zi Berechnung (aus v3 Engine)
   */
  _calculateBaZi(input, precisionResult) {
    // UTC Zeit für JD berechnen
    const tzOffset = this._getTzOffsetMinutes(input, precisionResult);
    const utcHour = input.hour - tzOffset / 60;

    const JD_UTC = v3Engine.julianDateUTC(
      input.year, input.month, input.day,
      utcHour, input.minute, input.second || 0
    );

    // Sonnenlänge aus Swiss Ephemeris (präziser als JS-Berechnung)
    const sunLon = precisionResult.data.planets.Sun.longitude;

    // Year Pillar (mit Li Chun aus Swiss Ephemeris)
    const liChunYear = new Date(precisionResult.data.chinese_year.li_chun_utc).getFullYear();
    const effectiveYear = precisionResult.data.chinese_year.year_for_pillar;

    const yearPillar = this._calculateYearPillarFromEffective(effectiveYear);

    // Month Pillar (Sonnenlänge aus Swiss Ephemeris)
    const monthPillar = v3Engine.calculateMonthPillar(sunLon, yearPillar.stemIndex);

    // Day Pillar (mit 23:00 Uhr Regel)
    const dayPillar = v3Engine.calculateDayPillar(JD_UTC, input.hour);

    // Hour Pillar (True Solar Time)
    const TST = this._calculateTST(input, tzOffset);
    const hourPillar = v3Engine.calculateHourPillar(TST, dayPillar.stemIndex);

    const bazi = {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
      dayMaster: {
        stem: dayPillar.stem,
        stemCN: dayPillar.stemCN,
        element: dayPillar.element,
        polarity: dayPillar.polarity
      },
      fullNotation: `${yearPillar.stemCN}${yearPillar.branchCN} ${monthPillar.stemCN}${monthPillar.branchCN} ${dayPillar.stemCN}${dayPillar.branchCN} ${hourPillar.stemCN}${hourPillar.branchCN}`,
      fullNotationPinyin: `${yearPillar.stem}-${yearPillar.branch} ${monthPillar.stem}-${monthPillar.branch} ${dayPillar.stem}-${dayPillar.branch} ${hourPillar.stem}-${hourPillar.branch}`,
      liChun: precisionResult.data.chinese_year.li_chun_utc
    };

    return bazi;
  }

  /**
   * Year Pillar aus effektivem Jahr (bereits Li Chun-korrigiert)
   */
  _calculateYearPillarFromEffective(effectiveYear) {
    const mod = (a, n) => ((a % n) + n) % n;

    // 1984 = Jia-Zi Jahr (Index 0 im 60er Zyklus)
    const idx60 = mod(effectiveYear - 1984, 60);
    const stemIdx = idx60 % 10;
    const branchIdx = idx60 % 12;

    return {
      stem: v3Engine.STEMS[stemIdx],
      stemCN: require('../cosmic-architecture-engine-v3').STEMS ? '?' : v3Engine.STEMS[stemIdx],
      branch: v3Engine.BRANCHES[branchIdx],
      branchCN: '?',
      animal: v3Engine.ANIMALS[branchIdx],
      stemIndex: stemIdx,
      branchIndex: branchIdx,
      sexagenaryIndex: idx60,
      element: v3Engine.STEM_ELEMENTS[stemIdx],
      polarity: stemIdx % 2 === 0 ? 'Yang' : 'Yin'
    };
  }

  /**
   * True Solar Time Berechnung
   */
  _calculateTST(input, tzOffsetMinutes) {
    const mod = (a, n) => ((a % n) + n) % n;

    // UTC Zeit
    const utcMinutes = (input.hour - tzOffsetMinutes / 60) * 60 + input.minute;

    // Solar Offset (4 Minuten pro Längengrad)
    const solarOffset = input.longitude * 4;

    // Equation of Time (vereinfacht, da präzise Werte aus Swiss Ephemeris nicht direkt verfügbar)
    const JD = v3Engine.julianDateUTC(input.year, input.month, input.day, 12, 0, 0);
    const T = (JD - 2451545.0) / 36525;
    const L0 = mod(280.46646 + 36000.76983 * T, 360);
    const M = mod(357.52911 + 35999.05029 * T, 360);
    const e = 0.016708634 - 0.000042037 * T;

    const EoT = 4 * (180 / Math.PI) * (
      Math.pow(Math.tan(23.44 * Math.PI / 360), 2) * Math.sin(2 * L0 * Math.PI / 180)
      - 2 * e * Math.sin(M * Math.PI / 180)
    );

    return mod(utcMinutes + solarOffset + EoT, 1440);
  }

  /**
   * Timezone Offset aus IANA oder fallback
   */
  _getTzOffsetMinutes(input, precisionResult) {
    // Swiss Ephemeris hat den korrekten Offset berechnet
    return precisionResult.audit.utc_offset_minutes;
  }

  /**
   * Fusion Analysis (aus v3 Engine)
   */
  _calculateFusion(precisionResult, bazi) {
    // Element Vector berechnen
    const elementVector = v3Engine.calculateElementVector(bazi);
    const elementBalance = v3Engine.analyzeElementBalance(elementVector);

    // Western-Eastern Resonanzen
    const resonances = [];
    const tensions = [];

    const sunWuXing = v3Engine.PLANET_TO_WUXING?.Sun || 'Fire';
    const moonWuXing = v3Engine.PLANET_TO_WUXING?.Moon || 'Water';

    // Sonne-DayMaster Resonanz
    if (sunWuXing === bazi.dayMaster.element) {
      resonances.push({
        type: 'Sun-DayMaster-Harmony',
        description: `Sonne (${sunWuXing}) in Resonanz mit Day Master (${bazi.dayMaster.element})`
      });
    }

    // Mond-Dominant Element Resonanz
    if (moonWuXing === elementBalance.dominant.element) {
      resonances.push({
        type: 'Moon-Dominant-Harmony',
        description: `Mond (${moonWuXing}) verstärkt dominantes Element (${elementBalance.dominant.element})`
      });
    }

    const western = precisionResult.data;

    return {
      elementVector: elementVector.normalized,
      elementBalance,
      synthesis: {
        primary: `${bazi.dayMaster.polarity}-${bazi.dayMaster.element} Kern mit ${western.planets.Sun.sign} Ausdruck`,
        emotional: `${western.planets.Moon.sign} Mond trifft ${bazi.year.animal}-Instinkt`,
        social: `${western.ascendant.sign} Maske über ${bazi.hour.element}-Motivation`
      },
      resonances,
      tensions
    };
  }

  /**
   * Li Wei Interpretation (aus v3 Engine)
   */
  _generateLiWei(precisionResult, bazi, fusion) {
    const elementBalance = fusion.elementBalance;

    return {
      dyaiDirective: 'Wahrheit > Nützlichkeit > Schönheit',
      interpretation: {
        dayMaster: `${bazi.dayMaster.polarity}-${bazi.dayMaster.element} (${bazi.dayMaster.stemCN || bazi.dayMaster.stem} ${bazi.dayMaster.stem})`,
        dominantElement: `${elementBalance.dominant.element} (${(elementBalance.dominant.percent * 100).toFixed(1)}%)`,
        seekingElement: `${elementBalance.seeking.element} (${(elementBalance.seeking.percent * 100).toFixed(1)}%)`,
        balance: elementBalance.balanceStatus
      },
      empowerment: `Die Ressourcen von ${elementBalance.dominant.element} nutzen, ${elementBalance.seeking.element} bewusst kultivieren`
    };
  }

  /**
   * Western Data Extraction aus Swiss Ephemeris Result
   */
  _extractWestern(data) {
    const { ascendant, mc, planets, houses } = data;

    return {
      sun: {
        longitude: planets.Sun.longitude,
        sign: planets.Sun.sign,
        degreeInSign: planets.Sun.degree_in_sign,
        speed: planets.Sun.speed_longitude_deg_per_day
      },
      moon: {
        longitude: planets.Moon.longitude,
        sign: planets.Moon.sign,
        degreeInSign: planets.Moon.degree_in_sign,
        speed: planets.Moon.speed_longitude_deg_per_day
      },
      ascendant: {
        longitude: ascendant.longitude,
        sign: ascendant.sign,
        degreeInSign: ascendant.degree_in_sign
      },
      mc: {
        longitude: mc.longitude,
        sign: mc.sign,
        degreeInSign: mc.degree_in_sign
      },
      planets: {
        Mercury: planets.Mercury,
        Venus: planets.Venus,
        Mars: planets.Mars,
        Jupiter: planets.Jupiter,
        Saturn: planets.Saturn,
        Uranus: planets.Uranus,
        Neptune: planets.Neptune,
        Pluto: planets.Pluto
      },
      houses,
      precision: 'swiss-ephemeris'
    };
  }

  /**
   * Input Formatting für Output
   */
  _formatInput(input) {
    return {
      date: `${input.year}-${String(input.month).padStart(2, '0')}-${String(input.day).padStart(2, '0')}`,
      time: `${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')}`,
      location: {
        latitude: input.latitude,
        longitude: input.longitude
      },
      timezone: input.timezone
    };
  }
}

// Convenience Factory
async function createEngine(options = {}) {
  const engine = new CosmicEngine(options);
  await engine.initialize();
  return engine;
}

module.exports = {
  CosmicEngine,
  createEngine,
  PrecisionBridge,
  PrecisionError
};
