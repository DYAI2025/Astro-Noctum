// ---------------------------------------------------------------------------
// Space-Weather Pipeline  --  Shared Type Definitions
// ---------------------------------------------------------------------------

/** NOAA SWPC data format version */
export type NoaaVersion = 'v1' | 'v2';

// ---- Real-time readings ---------------------------------------------------

export interface KpReading {
  /** Planetary K-index (0-9) */
  kp: number;
  timestamp: string;
  estimated: boolean;
  /** NOAA G-scale label, e.g. "G0", "G1" ... "G5" */
  noaaScale: string;
}

export interface F107Reading {
  /** 10.7 cm solar radio flux (SFU) */
  flux: number;
  timestamp: string;
  adjusted: boolean;
}

export interface XrayFluxReading {
  /** GOES X-ray flux in W/m^2 */
  flux: number;
  /** Solar flare class */
  classType: 'A' | 'B' | 'C' | 'M' | 'X';
  timestamp: string;
}

export interface ProtonFluxReading {
  /** >= 10 MeV proton flux (pfu) */
  flux10MeV: number;
  /** >= 100 MeV proton flux (pfu) */
  flux100MeV: number;
  timestamp: string;
}

// ---- Forecasts ------------------------------------------------------------

export interface KpForecast {
  timestamp: string;
  kp: number;
  noaaScale: string;
}

export interface ThreeDayForecast {
  date: string;
  kpForecast: KpForecast[];
  geoActivity: string;
  solarActivity: string;
}

// ---- Severity & Contribution ----------------------------------------------

/**
 * NOAA storm severity scale.
 *  G = Geomagnetic  |  S = Solar Radiation  |  R = Radio Blackout
 */
export type SpaceWeatherSeverity =
  | 'G0' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5'
  | 'S1' | 'S2' | 'S3' | 'S4' | 'S5'
  | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

export type SpaceWeatherEventType =
  | 'cme_arrival'
  | 'flare'
  | 'geomagnetic_storm'
  | 'sep'
  | 'hss'
  | 'alert';

export interface SpaceWeatherContribution {
  schema: 'sp.contribution.v1';
  event_id: string;
  type: SpaceWeatherEventType;
  severity: SpaceWeatherSeverity;
  /** Normalised weight injected into the Signatur ring (0-1, hard-capped at 0.5) */
  signature_weight: number;
  source_event_id?: string;
  started_at: string;
  /** Contribution MUST expire -- no open-ended space-weather effects */
  expires_at: string;
  description?: string;
}

// ---- Aggregated API response ----------------------------------------------

export interface SpaceWeatherExtended {
  current: {
    kp: KpReading | null;
    kpForecast3h: KpForecast[];
    xrayFlux: number | null;
    xrayClass: XrayFluxReading['classType'] | null;
    protonFlux: number | null;
  };
  events: SpaceWeatherContribution[];
  alerts: string[];
  epoch: {
    sunspotNumber: number | null;
    f107: number | null;
    solarCyclePhase: string | null;
  };
  meta: {
    fetchedAt: string;
    noaaVersion: NoaaVersion;
    cacheTtlSeconds: number;
  };
}
