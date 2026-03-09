/**
 * PRECISION BRIDGE - FAIL-CLOSED Swiss Ephemeris Integration
 *
 * PRODUCTION MODE: Kein Fallback, keine stillen Defaults, harte Validation
 *
 * Environment Variables:
 * - COSMIC_PRECISION_FALLBACK=1  // Aktiviert Fallback (nur Dev/Test!)
 * - COSMIC_STRICT_MODE=1         // Erzwingt strict validation (Production)
 * - SE_EPHE_PATH=/path/to/ephe   // Swiss Ephemeris Dateien
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Production Mode Detection
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ALLOW_FALLBACK = process.env.COSMIC_PRECISION_FALLBACK === '1';
const FORCE_STRICT = process.env.COSMIC_STRICT_MODE === '1' || IS_PRODUCTION;

class PrecisionBridge {
  constructor(options = {}) {
    this.pythonPath = options.pythonPath || 'python3';
    this.scriptPath = options.scriptPath || path.join(__dirname, '..', 'astro-precision-horoscope', 'scripts', 'compute_horoscope.py');

    // FAIL-CLOSED: Strict mode default in production
    this.strictMode = options.strictMode !== false || FORCE_STRICT;

    // FAIL-CLOSED: No fallback in production
    this.useFallback = options.useFallback === true && ALLOW_FALLBACK;

    if (IS_PRODUCTION && this.useFallback) {
      throw new Error('FATAL: Fallback mode is not allowed in production (COSMIC_PRECISION_FALLBACK must not be set)');
    }

    if (this.useFallback) {
      console.warn('⚠️  WARNING: Fallback mode enabled - NOT FOR PRODUCTION USE!');
    }
  }

  /**
   * Prüft ob das Python-Modul verfügbar ist
   * FAIL-CLOSED: Wirft Error wenn nicht verfügbar und kein Fallback
   */
  async checkAvailability() {
    try {
      const result = await this._executePython(['--help']);
      return {
        available: true,
        message: 'Swiss Ephemeris precision module available',
        mode: 'precision'
      };
    } catch (error) {
      if (!this.useFallback) {
        throw new PrecisionError(
          'Swiss Ephemeris module is not available and fallback is disabled. ' +
          'Install dependencies: cd astro-precision-horoscope && pip install -r requirements.txt',
          { code: 'EPHEMERIS_UNAVAILABLE', original: error }
        );
      }
      return {
        available: false,
        message: `Swiss Ephemeris not available: ${error.message}`,
        mode: 'fallback-allowed',
        error
      };
    }
  }

  /**
   * Berechnet ein Horoskop mit Swiss Ephemeris
   *
   * FAIL-CLOSED Requirements:
   * - timezone MUSS angegeben sein (keine UTC defaults)
   * - Bei DST ambiguity MUSS fold angegeben sein
   * - Validation errors führen zu Exception
   * - Validation warnings führen zu Exception (in strict mode)
   *
   * @throws {PrecisionError} Bei fehlenden Inputs, Validation-Fehlern, etc.
   */
  async computeHoroscope(input) {
    // FAIL-CLOSED: Harte Input-Validation
    this._validateInputStrict(input);

    // Input transformieren
    const payload = this._transformInputStrict(input);

    try {
      // Temp-Datei für Input erstellen
      const tempInput = await this._createTempFile(JSON.stringify(payload, null, 2));

      // Python-Script ausführen
      const args = ['--input', tempInput];
      // Python strict mode follows JS strict mode
      // In strict mode: warnings become errors, SE_EPHE_PATH may be required
      // Policy: Moshier is allowed if ASTRO_PRECISION_ALLOW_MOSHIER=1
      if (!this.strictMode) {
        args.push('--non-strict');
      }

      const output = await this._executePython(args);

      // Temp-Datei löschen
      fs.unlinkSync(tempInput);

      // Output parsen
      let result;
      try {
          result = JSON.parse(output);
      } catch (parseError) {
          console.error("PY_STDOUT:", output); 
          // Check if stdout contained error messages instead of JSON
          throw new PrecisionError(
            `Failed to parse Python output: ${parseError.message}. Content: ${output.substring(0, 200)}...`,
             { code: 'JSON_PARSE_ERROR', output }
          );
      }

      // FAIL-CLOSED: Validation Gate
      this._enforceValidation(result);

      return {
        success: true,
        mode: 'precision',
        engine: 'swiss-ephemeris',
        data: result,
        audit: result.audit,
        validation: result.validation
      };

    } catch (error) {
      // FAIL-CLOSED: Kein Fallback in Production
      if (!this.useFallback) {
        if (error instanceof PrecisionError) {
          throw error;
        }
        throw new PrecisionError(
          `Precision calculation failed: ${error.message}`,
          { code: 'CALCULATION_FAILED', original: error }
        );
      }

      // Fallback nur in Dev/Test
      console.error('❌ Precision calculation failed:', error.message);
      console.warn('⚠️  Returning fallback signal (NOT FOR PRODUCTION)');

      return {
        success: false,
        mode: 'fallback',
        engine: 'none',
        error: error.message,
        fallbackReason: error.message,
        warning: 'Precision calculation failed - fallback required'
      };
    }
  }

  /**
   * FAIL-CLOSED: Strikte Input-Validation
   * Wirft Errors bei fehlenden/ungültigen Inputs
   */
  _validateInputStrict(input) {
    const required = ['year', 'month', 'day', 'hour', 'minute', 'latitude', 'longitude'];
    const missing = required.filter(field => input[field] === undefined || input[field] === null);

    if (missing.length > 0) {
      throw new PrecisionError(
        `Missing required fields: ${missing.join(', ')}`,
        { code: 'MISSING_REQUIRED_FIELDS', fields: missing }
      );
    }

    // FAIL-CLOSED: Timezone ist PFLICHT
    if (!input.timezone && input.tzOffsetMinutes === undefined) {
      throw new PrecisionError(
        'Timezone information is required. Provide either "timezone" (IANA) or "tzOffsetMinutes".',
        { code: 'TIMEZONE_NOT_RESOLVABLE' }
      );
    }

    // FAIL-CLOSED: In Strict Mode ist IANA PFLICHT (tzOffsetMinutes nicht erlaubt)
    if (this.strictMode && !input.timezone) {
      throw new PrecisionError(
        'IANA timezone is required in strict mode. ' +
        'tzOffsetMinutes is not allowed because it cannot handle DST correctly. ' +
        'Use IANA format like "Europe/Berlin" or "America/New_York".',
        { code: 'IANA_TIMEZONE_REQUIRED_STRICT' }
      );
    }

    // Lat/Lon Ranges
    if (input.latitude < -90 || input.latitude > 90) {
      throw new PrecisionError(
        `Invalid latitude: ${input.latitude} (must be between -90 and 90)`,
        { code: 'INVALID_LATITUDE', value: input.latitude }
      );
    }

    if (input.longitude < -180 || input.longitude > 180) {
      throw new PrecisionError(
        `Invalid longitude: ${input.longitude} (must be between -180 and 180)`,
        { code: 'INVALID_LONGITUDE', value: input.longitude }
      );
    }

    // Date Ranges
    if (input.year < 1800 || input.year > 2200) {
      throw new PrecisionError(
        `Year ${input.year} outside supported range (1800-2200)`,
        { code: 'YEAR_OUT_OF_RANGE', value: input.year }
      );
    }

    if (input.month < 1 || input.month > 12) {
      throw new PrecisionError(
        `Invalid month: ${input.month}`,
        { code: 'INVALID_MONTH', value: input.month }
      );
    }

    if (input.day < 1 || input.day > 31) {
      throw new PrecisionError(
        `Invalid day: ${input.day}`,
        { code: 'INVALID_DAY', value: input.day }
      );
    }

    if (input.hour < 0 || input.hour > 23) {
      throw new PrecisionError(
        `Invalid hour: ${input.hour}`,
        { code: 'INVALID_HOUR', value: input.hour }
      );
    }

    if (input.minute < 0 || input.minute > 59) {
      throw new PrecisionError(
        `Invalid minute: ${input.minute}`,
        { code: 'INVALID_MINUTE', value: input.minute }
      );
    }
  }

  /**
   * FAIL-CLOSED: Strikte Input-Transformation
   * KEINE stillen Defaults - wirft Errors stattdessen
   */
  _transformInputStrict(input) {
    let timezone;

    // IANA Timezone Detection
    if (input.timezone) {
      timezone = input.timezone;
    } else if (input.tzOffsetMinutes !== undefined) {
      // Fallback: UTC offset zu Timezone-String
      // ACHTUNG: Dies ist ungenau wegen DST! Nur als Notlösung.
      const offsetHours = Math.floor(Math.abs(input.tzOffsetMinutes) / 60);
      const offsetMins = Math.abs(input.tzOffsetMinutes) % 60;
      const sign = input.tzOffsetMinutes >= 0 ? '+' : '-';
      timezone = `Etc/GMT${sign}${offsetHours}`;

      console.warn('⚠️  WARNING: Using UTC offset instead of IANA timezone.');
      console.warn('    This may cause errors during DST transitions!');
      console.warn(`    Approximation: ${timezone} for offset ${input.tzOffsetMinutes}`);
    } else {
      // FAIL-CLOSED: Kein Default!
      throw new PrecisionError(
        'No timezone information provided. Provide either "timezone" (IANA, recommended) or "tzOffsetMinutes".',
        { code: 'TIMEZONE_NOT_RESOLVABLE' }
      );
    }

    const payload = {
      birth_date: `${input.year}-${String(input.month).padStart(2, '0')}-${String(input.day).padStart(2, '0')}`,
      birth_time: `${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')}:${String(input.second || 0).padStart(2, '0')}`,
      birth_location: {
        lat: input.latitude,
        lon: input.longitude
      },
      iana_time_zone: timezone,
      house_system: input.houseSystem || 'P',
      strict_mode: this.strictMode
    };

    // FAIL-CLOSED: DST Ambiguity Handling
    if (input.fold !== undefined) {
      payload.fold = input.fold;
    }

    return payload;
  }

  /**
   * FAIL-CLOSED: Validation Gate
   * In Strict Mode: warn = error
   */
  _enforceValidation(result) {
    if (!result.validation) {
      throw new PrecisionError(
        'Missing validation data in precision result',
        { code: 'VALIDATION_MISSING' }
      );
    }

    const { status, issues } = result.validation;

    // FAIL-CLOSED: Errors immer ablehnen
    if (status === 'error') {
      const errorIssues = issues.filter(i => i.severity === 'error');
      const firstError = errorIssues[0];

      // Check for DST-specific errors (preserve code and details)
      if (firstError?.code === 'AMBIGUOUS_LOCAL_TIME') {
        throw new PrecisionError(
          firstError.message,
          {
            code: 'AMBIGUOUS_LOCAL_TIME',
            httpStatus: 409,
            candidates: firstError.details?.candidates || [],
            validation: result.validation
          }
        );
      }

      if (firstError?.code === 'NONEXISTENT_LOCAL_TIME') {
        throw new PrecisionError(
          firstError.message,
          {
            code: 'NONEXISTENT_LOCAL_TIME',
            httpStatus: 422,
            gapInfo: firstError.details?.gap_info || {},
            validation: result.validation
          }
        );
      }

      // Generic validation error
      const errorMessages = errorIssues
        .map(i => `${i.code}: ${i.message}`)
        .join('; ');

      throw new PrecisionError(
        `Validation failed: ${errorMessages}`,
        {
          code: 'VALIDATION_ERROR',
          httpStatus: result.http_status || 400,
          validation: result.validation,
          issues: errorIssues
        }
      );
    }

    // FAIL-CLOSED: In Strict Mode sind Warnings auch Errors
    if (this.strictMode && status === 'warn') {
      const warnMessages = issues
        .filter(i => i.severity === 'warn')
        .map(i => `${i.code}: ${i.message}`)
        .join('; ');

      throw new PrecisionError(
        `Strict validation failed (warnings not allowed): ${warnMessages}`,
        {
          code: 'VALIDATION_WARN_IN_STRICT',
          validation: result.validation,
          issues: issues.filter(i => i.severity === 'warn')
        }
      );
    }

    // FAIL-CLOSED: Nur 'ok' ist akzeptabel in Strict Mode
    if (this.strictMode && status !== 'ok') {
      throw new PrecisionError(
        `Validation status '${status}' not allowed in strict mode`,
        { code: 'VALIDATION_NOT_OK', status }
      );
    }
  }

  /**
   * Berechnet präzise Planetenpositionen
   */
  async getPlanetPositions(input) {
    const result = await this.computeHoroscope(input);
    return {
      ...result,
      planets: result.data.planets
    };
  }

  /**
   * Berechnet präzisen Aszendenten
   */
  async getAscendant(input) {
    const result = await this.computeHoroscope(input);
    return {
      ...result,
      ascendant: result.data.ascendant,
      mc: result.data.mc
    };
  }

  /**
   * Berechnet Häuser mit Swiss Ephemeris
   */
  async getHouses(input, houseSystem = 'P') {
    const inputWithHouse = { ...input, houseSystem };
    const result = await this.computeHoroscope(inputWithHouse);
    return {
      ...result,
      houses: result.data.houses,
      ascendant: result.data.ascendant,
      mc: result.data.mc
    };
  }

  /**
   * Berechnet Li Chun (chinesisches Neujahr) präzise
   */
  async getLiChun(year) {
    const input = {
      year,
      month: 2,
      day: 4,
      hour: 12,
      minute: 0,
      second: 0,
      latitude: 0,
      longitude: 0,
      timezone: 'UTC'
    };

    const result = await this.computeHoroscope(input);
    return {
      success: true,
      mode: result.mode,
      li_chun_utc: result.data.chinese_year.li_chun_utc,
      chinese_year: result.data.chinese_year
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Führt Python-Script aus
   */
  _executePython(args) {
    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, [this.scriptPath, ...args]);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else if (code === 2) {
          // Exit code 2 = warnings (in non-strict Python mode)
          // Aber wir behandeln das hier auf Node-Seite
          resolve(stdout);
        } else {
          reject(new Error(
            `Python process exited with code ${code}\n` +
            `STDERR: ${stderr}\n` +
            `STDOUT: ${stdout}`
          ));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Erstellt temporäre Datei
   */
  async _createTempFile(content) {
    const tempDir = path.join(os.tmpdir(), 'cosmic-engine-temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(
      tempDir,
      `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`
    );
    fs.writeFileSync(tempFile, content, 'utf8');
    return tempFile;
  }
}

class PrecisionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'PrecisionError';
    this.code = details.code || 'PRECISION_ERROR';
    this.details = details;

    // Preserve original error for debugging
    if (details.original) {
      this.original = details.original;
    }
  }

  toJSON() {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}

module.exports = { PrecisionBridge, PrecisionError };
