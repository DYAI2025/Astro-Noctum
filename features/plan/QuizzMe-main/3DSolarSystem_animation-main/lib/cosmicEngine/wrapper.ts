/**
 * Astronomia Wrapper
 * Layer 1: Direct interface to astronomia library with dynamic imports
 * Provides typed access to VSOP87 planetary positions, ELP2000 lunar positions,
 * and coordinate transformations.
 */

import type {
  EclipticCoordinates,
  EquatorialCoordinates,
  HorizontalCoordinates,
  JulianDay,
  MoonPhaseData,
  MoonPhaseName,
  ObserverLocation,
  PlanetId,
} from './types';
import { AngleUtils } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE LOADING
// ═══════════════════════════════════════════════════════════════════════════════

// Lazy-loaded module references
let julianModule: typeof import('astronomia/julian') | null = null;
let planetpositionModule: typeof import('astronomia/planetposition') | null = null;
let moonpositionModule: typeof import('astronomia/moonposition') | null = null;
let moonphaseModule: typeof import('astronomia/moonphase') | null = null;
let moonillumModule: typeof import('astronomia/moonillum') | null = null;
let coordModule: typeof import('astronomia/coord') | null = null;
let siderealModule: typeof import('astronomia/sidereal') | null = null;
let nutationModule: typeof import('astronomia/nutation') | null = null;
let solarModule: typeof import('astronomia/solar') | null = null;
let baseModule: typeof import('astronomia/base') | null = null;

// VSOP87 data cache (lazy-loaded per planet)
const vsop87Data: Map<PlanetId, unknown> = new Map();

/**
 * Load astronomia module dynamically
 * Uses dynamic imports for code splitting
 */
async function loadModule<T>(
  moduleName: string,
  cacheRef: { value: T | null },
  importFn: () => Promise<T>
): Promise<T> {
  if (cacheRef.value) {
    return cacheRef.value;
  }
  cacheRef.value = await importFn();
  return cacheRef.value;
}

// Module loaders
const loadJulian = () =>
  loadModule('julian', { get value() { return julianModule; }, set value(v) { julianModule = v; } }, () =>
    import('astronomia/julian')
  );

const loadPlanetPosition = () =>
  loadModule('planetposition', { get value() { return planetpositionModule; }, set value(v) { planetpositionModule = v; } }, () =>
    import('astronomia/planetposition')
  );

const loadMoonPosition = () =>
  loadModule('moonposition', { get value() { return moonpositionModule; }, set value(v) { moonpositionModule = v; } }, () =>
    import('astronomia/moonposition')
  );

const loadMoonPhase = () =>
  loadModule('moonphase', { get value() { return moonphaseModule; }, set value(v) { moonphaseModule = v; } }, () =>
    import('astronomia/moonphase')
  );

const loadMoonIllum = () =>
  loadModule('moonillum', { get value() { return moonillumModule; }, set value(v) { moonillumModule = v; } }, () =>
    import('astronomia/moonillum')
  );

const loadCoord = () =>
  loadModule('coord', { get value() { return coordModule; }, set value(v) { coordModule = v; } }, () =>
    import('astronomia/coord')
  );

const loadSidereal = () =>
  loadModule('sidereal', { get value() { return siderealModule; }, set value(v) { siderealModule = v; } }, () =>
    import('astronomia/sidereal')
  );

const loadNutation = () =>
  loadModule('nutation', { get value() { return nutationModule; }, set value(v) { nutationModule = v; } }, () =>
    import('astronomia/nutation')
  );

const loadSolar = () =>
  loadModule('solar', { get value() { return solarModule; }, set value(v) { solarModule = v; } }, () =>
    import('astronomia/solar')
  );

const loadBase = () =>
  loadModule('base', { get value() { return baseModule; }, set value(v) { baseModule = v; } }, () =>
    import('astronomia/base')
  );

/**
 * Load VSOP87 data for a planet
 * Data is loaded on demand and cached
 */
async function loadVSOP87Data(planet: PlanetId): Promise<unknown> {
  if (vsop87Data.has(planet)) {
    return vsop87Data.get(planet)!;
  }

  // Map planet IDs to VSOP87 data file names
  const dataFiles: Record<PlanetId, string> = {
    mercury: 'vsop87Bmercury',
    venus: 'vsop87Bvenus',
    earth: 'vsop87Bearth',
    mars: 'vsop87Bmars',
    jupiter: 'vsop87Bjupiter',
    saturn: 'vsop87Bsaturn',
    uranus: 'vsop87Buranus',
    neptune: 'vsop87Bneptune',
  };

  const dataName = dataFiles[planet];

  // Dynamic import of VSOP87 data
  const data = await import(`astronomia/data/${dataName}`);
  const planetData = data.default || data[dataName];
  vsop87Data.set(planet, planetData);
  return planetData;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASTRONOMIA WRAPPER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AstronomiaWrapper provides typed access to astronomia calculations
 * All angles returned in radians, distances in AU (or km for Moon)
 */
export class AstronomiaWrapper {
  private initialized = false;
  private planetInstances: Map<PlanetId, InstanceType<typeof import('astronomia/planetposition').Planet>> = new Map();

  /**
   * Initialize wrapper by preloading core modules
   * Call this before first use for best performance
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Preload essential modules in parallel
    await Promise.all([
      loadJulian(),
      loadBase(),
      loadNutation(),
    ]);

    this.initialized = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JULIAN DATE CONVERSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Convert JavaScript Date to Julian Day
   */
  async dateToJD(date: Date): Promise<JulianDay> {
    const julian = await loadJulian();
    return julian.DateToJD(date);
  }

  /**
   * Convert JavaScript Date to Julian Ephemeris Day
   * Includes delta-T correction for dynamical time
   */
  async dateToJDE(date: Date): Promise<JulianDay> {
    const julian = await loadJulian();
    return julian.DateToJDE(date);
  }

  /**
   * Convert Julian Day to JavaScript Date
   */
  async jdToDate(jd: JulianDay): Promise<Date> {
    const julian = await loadJulian();
    return julian.JDToDate(jd);
  }

  /**
   * Convert Julian Ephemeris Day to JavaScript Date
   */
  async jdeToDate(jde: JulianDay): Promise<Date> {
    const julian = await loadJulian();
    return julian.JDEToDate(jde);
  }

  /**
   * Convert Julian Day to decimal year
   */
  async jdToYear(jd: JulianDay): Promise<number> {
    const julian = await loadJulian();
    const cal = new julian.CalendarGregorian().fromJD(jd);
    return cal.toYear();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLANET POSITIONS (VSOP87)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get or create Planet instance for VSOP87 calculations
   */
  private async getPlanetInstance(planet: PlanetId) {
    if (this.planetInstances.has(planet)) {
      return this.planetInstances.get(planet)!;
    }

    const [planetposition, data] = await Promise.all([
      loadPlanetPosition(),
      loadVSOP87Data(planet),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = new planetposition.Planet(data as any);
    this.planetInstances.set(planet, instance);
    return instance;
  }

  /**
   * Get heliocentric ecliptic coordinates for a planet
   * Uses VSOP87 theory for high precision
   *
   * @param planet Planet identifier
   * @param jde Julian Ephemeris Day
   * @returns Heliocentric ecliptic coordinates (lon, lat in radians, range in AU)
   */
  async getPlanetPosition(planet: PlanetId, jde: JulianDay): Promise<EclipticCoordinates> {
    const planetInstance = await this.getPlanetInstance(planet);

    // Use position2000 for J2000.0 equinox (standard for modern work)
    const pos = planetInstance.position2000(jde);

    return {
      lon: pos.lon,
      lat: pos.lat,
      range: pos.range,
    };
  }

  /**
   * Get heliocentric ecliptic coordinates at equinox of date
   * Use this when comparing with observations
   */
  async getPlanetPositionOfDate(planet: PlanetId, jde: JulianDay): Promise<EclipticCoordinates> {
    const planetInstance = await this.getPlanetInstance(planet);
    const pos = planetInstance.position(jde);

    return {
      lon: pos.lon,
      lat: pos.lat,
      range: pos.range,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUN POSITION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get geocentric ecliptic position of the Sun
   * Uses VSOP87 via solar module for high precision
   */
  async getSunPosition(jde: JulianDay): Promise<EclipticCoordinates> {
    const solar = await loadSolar();
    const pos = solar.apparentVSOP87(jde);

    return {
      lon: pos.lon,
      lat: pos.lat,
      range: pos.range,
    };
  }

  /**
   * Get apparent equatorial coordinates of the Sun
   */
  async getSunEquatorial(jde: JulianDay): Promise<EquatorialCoordinates> {
    const solar = await loadSolar();
    const pos = solar.apparentEquatorial(jde);

    return {
      ra: pos.lon, // apparentEquatorial returns ra in lon field
      dec: pos.lat, // and dec in lat field
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOON POSITION (ELP2000)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get geocentric ecliptic position of the Moon
   * Uses ELP2000 theory for ~10 arcsecond accuracy
   */
  async getMoonPosition(jde: JulianDay): Promise<EclipticCoordinates> {
    const moonposition = await loadMoonPosition();
    const pos = moonposition.position(jde);

    return {
      lon: pos.lon,
      lat: pos.lat,
      range: pos.range, // in km
    };
  }

  /**
   * Get Moon's equatorial horizontal parallax
   */
  async getMoonParallax(distanceKm: number): Promise<number> {
    const moonposition = await loadMoonPosition();
    return moonposition.parallax(distanceKm);
  }

  /**
   * Get longitude of Moon's ascending node
   */
  async getMoonNode(jde: JulianDay): Promise<number> {
    const moonposition = await loadMoonPosition();
    return moonposition.node(jde);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOON PHASE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get Moon phase data for a given date
   */
  async getMoonPhase(jde: JulianDay): Promise<MoonPhaseData> {
    const [moonillum, moonphase, julian] = await Promise.all([
      loadMoonIllum(),
      loadMoonPhase(),
      loadJulian(),
    ]);

    // Get illumination
    const illumination = moonillum.illuminated(jde);
    const phaseAngle = moonillum.phaseAngle(jde);

    // Calculate phase (0-1, where 0=new, 0.5=full)
    // Phase angle is 0 at full moon, π at new moon
    const phase = 1 - (phaseAngle / Math.PI);

    // Determine phase name
    const phaseName = this.getPhaseName(phase);

    // Calculate moon age (days since last new moon)
    const year = new julian.CalendarGregorian().fromJD(jde).toYear();
    const lastNewMoonJDE = moonphase.newMoon(year - 0.03); // ~11 days before
    const age = jde - lastNewMoonJDE;

    // Get next phase times
    const nextNewMoon = moonphase.newMoon(year + 0.03);
    const nextFullMoon = moonphase.full(year + 0.03);

    return {
      phase,
      phaseName,
      illumination,
      age: age > 0 ? age : age + 29.53, // Synodic month
      nextNewMoon,
      nextFullMoon,
    };
  }

  /**
   * Determine phase name from phase value
   */
  private getPhaseName(phase: number): MoonPhaseName {
    // Normalize to 0-1
    const p = ((phase % 1) + 1) % 1;

    if (p < 0.0625) return 'new';
    if (p < 0.1875) return 'waxing-crescent';
    if (p < 0.3125) return 'first-quarter';
    if (p < 0.4375) return 'waxing-gibbous';
    if (p < 0.5625) return 'full';
    if (p < 0.6875) return 'waning-gibbous';
    if (p < 0.8125) return 'last-quarter';
    if (p < 0.9375) return 'waning-crescent';
    return 'new';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COORDINATE TRANSFORMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Transform ecliptic coordinates to equatorial
   */
  async eclipticToEquatorial(
    ecliptic: EclipticCoordinates,
    jde: JulianDay
  ): Promise<EquatorialCoordinates> {
    const [coord, nutation] = await Promise.all([
      loadCoord(),
      loadNutation(),
    ]);

    const obliquity = nutation.trueObliquity(jde);
    const ecl = new coord.Ecliptic(ecliptic.lon, ecliptic.lat);
    const eq = ecl.toEquatorial(obliquity);

    return {
      ra: eq.ra,
      dec: eq.dec,
      range: ecliptic.range,
    };
  }

  /**
   * Transform equatorial coordinates to horizontal (alt-az)
   */
  async equatorialToHorizontal(
    equatorial: EquatorialCoordinates,
    jde: JulianDay,
    observer: ObserverLocation
  ): Promise<HorizontalCoordinates> {
    const [coord, sidereal] = await Promise.all([
      loadCoord(),
      loadSidereal(),
    ]);

    // Calculate local sidereal time
    const gst = sidereal.apparent(jde);
    const lst = gst + AngleUtils.degToRad(observer.longitude);

    // Convert observer latitude to radians
    const latRad = AngleUtils.degToRad(observer.latitude);

    const eq = new coord.Equatorial(equatorial.ra, equatorial.dec);
    const hz = eq.toHorizontal(latRad, lst);

    return {
      altitude: hz.alt,
      azimuth: hz.az,
    };
  }

  /**
   * Get obliquity of the ecliptic
   */
  async getObliquity(jde: JulianDay): Promise<number> {
    const nutation = await loadNutation();
    return nutation.trueObliquity(jde);
  }

  /**
   * Get nutation values
   */
  async getNutation(jde: JulianDay): Promise<{ deltaPsi: number; deltaEpsilon: number }> {
    const nutation = await loadNutation();
    const [deltaPsi, deltaEpsilon] = nutation.nutation(jde);
    return { deltaPsi, deltaEpsilon };
  }

  /**
   * Get Greenwich Sidereal Time
   */
  async getGST(jd: JulianDay): Promise<number> {
    const sidereal = await loadSidereal();
    return sidereal.apparent(jd);
  }

  /**
   * Get Local Sidereal Time
   */
  async getLST(jd: JulianDay, longitudeDeg: number): Promise<number> {
    const gst = await this.getGST(jd);
    return gst + AngleUtils.degToRad(longitudeDeg);
  }
}

/**
 * Singleton instance for convenience
 */
export const astronomiaWrapper = new AstronomiaWrapper();
