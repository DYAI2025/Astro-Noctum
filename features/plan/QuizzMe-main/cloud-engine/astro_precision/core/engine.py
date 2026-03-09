from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Tuple, Optional

import swisseph as swe

from .time import (
    convert_local_to_utc,
    TimeConversionError,
    AmbiguousLocalTimeError,
    NonexistentLocalTimeError,
)
from ..models import ValidationIssue, ValidationReport

PLANET_BODIES = [
    ("Sun", swe.SUN),
    ("Moon", swe.MOON),
    ("Mercury", swe.MERCURY),
    ("Venus", swe.VENUS),
    ("Mars", swe.MARS),
    ("Jupiter", swe.JUPITER),
    ("Saturn", swe.SATURN),
    ("Uranus", swe.URANUS),
    ("Neptune", swe.NEPTUNE),
    ("Pluto", swe.PLUTO),
]

ZODIAC_SIGNS_DE = [
    "Widder","Stier","Zwillinge","Krebs","Löwe","Jungfrau",
    "Waage","Skorpion","Schütze","Steinbock","Wassermann","Fische"
]

STEMS = ["Jia","Yi","Bing","Ding","Wu","Ji","Geng","Xin","Ren","Gui"]
STEM_YINYANG = ["Yang","Yin"] * 5
STEM_ELEMENT = ["Wood","Wood","Fire","Fire","Earth","Earth","Metal","Metal","Water","Water"]
BRANCHES = ["Zi","Chou","Yin","Mao","Chen","Si","Wu","Wei","Shen","You","Xu","Hai"]
ANIMALS_DE = ["Ratte","Büffel","Tiger","Hase","Drache","Schlange","Pferd","Ziege","Affe","Hahn","Hund","Schwein"]

class EphemerisError(RuntimeError):
    pass

def _set_ephe_path_or_fail(strict_mode: bool) -> None:
    ephe = os.getenv("SE_EPHE_PATH")
    if ephe:
        swe.set_ephe_path(ephe)
        return
    # Without ephe path, SWIEPH may fail depending on environment.
    if strict_mode:
        raise EphemerisError(
            "SE_EPHE_PATH is not set. For strict_mode you must provide Swiss Ephemeris files "
            "and set SE_EPHE_PATH accordingly."
        )

def _choose_flags(strict_mode: bool) -> Tuple[int, List[ValidationIssue]]:
    issues: List[ValidationIssue] = []
    allow_moshier = os.getenv("ASTRO_PRECISION_ALLOW_MOSHIER") == "1"

    flags_sw = swe.FLG_SWIEPH | swe.FLG_SPEED
    # Probe: try a simple calc to verify ephemeris availability
    try:
        jd_probe = swe.julday(2025, 1, 1, 0.0, swe.GREG_CAL)
        swe.calc_ut(jd_probe, swe.SUN, flags_sw)
        return flags_sw, issues
    except Exception as e:
        if strict_mode and not allow_moshier:
            raise EphemerisError(
                "Swiss Ephemeris SWIEPH computation failed and fallback is not allowed. "
                "Set SE_EPHE_PATH to valid ephemeris files, or (not recommended) set "
                "ASTRO_PRECISION_ALLOW_MOSHIER=1."
            ) from e

        flags_mo = swe.FLG_MOSEPH | swe.FLG_SPEED
        issues.append(ValidationIssue(
            code="ephemeris_fallback_moshier",
            message="Falling back to MOSEPH (Moshier) ephemeris. This may reduce precision.",
            severity="warn" if not strict_mode else "error",
            details={"exception": str(e)},
        ))
        return flags_mo, issues

def _deg_to_sign(lon: float) -> Tuple[str, int, float]:
    lon = lon % 360.0
    sign_index = int(lon // 30)
    deg_in_sign = lon - 30.0 * sign_index
    return ZODIAC_SIGNS_DE[sign_index], sign_index, deg_in_sign

def _parse_time_fields(birth_date: str, birth_time: str) -> datetime:
    # birth_time can be HH:MM or HH:MM:SS
    parts = birth_time.split(":")
    if len(parts) not in (2, 3):
        raise ValueError("birth_time must be HH:MM or HH:MM:SS")
    hh = int(parts[0]); mm = int(parts[1]); ss = int(parts[2]) if len(parts) == 3 else 0
    y, m, d = [int(x) for x in birth_date.split("-")]
    return datetime(y, m, d, hh, mm, ss)

def _jd_ut_from_utc(dt_utc: datetime, ut1_minus_utc_seconds: float) -> float:
    dt_ut = dt_utc + timedelta(seconds=float(ut1_minus_utc_seconds))
    hour = dt_ut.hour + dt_ut.minute/60.0 + dt_ut.second/3600.0 + dt_ut.microsecond/3.6e9
    return swe.julday(dt_ut.year, dt_ut.month, dt_ut.day, hour, swe.GREG_CAL)

def _sun_longitude(jd_ut: float, flags: int) -> float:
    vals = swe.calc_ut(jd_ut, swe.SUN, flags)[0]
    lon = float(vals[0])
    return lon % 360.0

def find_li_chun_utc(year: int, *, flags: int) -> datetime:
    """
    Find Li Chun moment for given Gregorian year (UTC), defined by Sun ecliptic longitude = 315° (tropical).
    Uses robust bracketing + bisection in a window Feb 2..6 (UTC).
    """
    target = 315.0
    start = datetime(year, 2, 2, 0, 0, 0, tzinfo=timezone.utc)
    end = datetime(year, 2, 6, 0, 0, 0, tzinfo=timezone.utc)

    # hourly scan
    step = timedelta(hours=1)
    t0 = start
    f0 = None
    bracket = None

    def f(dt: datetime) -> float:
        jd = _jd_ut_from_utc(dt, 0.0)
        lon = _sun_longitude(jd, flags)
        # Around early Feb, lon near 315, monotone increasing ~1°/day.
        return lon - target

    while t0 <= end:
        f1 = f(t0)
        if f0 is not None:
            # detect sign change
            if (f0 <= 0 and f1 >= 0) or (f0 >= 0 and f1 <= 0):
                bracket = (t0 - step, t0)
                break
        f0 = f1
        t0 += step

    if bracket is None:
        raise RuntimeError("Failed to bracket Li Chun in Feb 2..6 window. Check ephemeris/flags.")

    a, b = bracket
    fa = f(a); fb = f(b)
    # Bisection
    for _ in range(80):
        mid = a + (b - a) / 2
        fm = f(mid)
        if abs(fm) < 1e-8:
            return mid
        # shrink
        if (fa <= 0 and fm >= 0) or (fa >= 0 and fm <= 0):
            b, fb = mid, fm
        else:
            a, fa = mid, fm
        if (b - a).total_seconds() < 0.5:
            return a + (b - a) / 2
    return a + (b - a) / 2

def chinese_year_pillar(*, birth_utc: datetime, li_chun_utc: datetime) -> Dict[str, Any]:
    year_for_pillar = birth_utc.year if birth_utc >= li_chun_utc else birth_utc.year - 1
    stem_i = (year_for_pillar - 4) % 10
    branch_i = (year_for_pillar - 4) % 12
    return {
        "year_for_pillar": year_for_pillar,
        "stem": STEMS[stem_i],
        "branch": BRANCHES[branch_i],
        "animal_de": ANIMALS_DE[branch_i],
        "element": STEM_ELEMENT[stem_i],
        "yin_yang": STEM_YINYANG[stem_i],
    }

@dataclass(frozen=True)
class ComputeOptions:
    house_system: str = "P"
    strict_mode: bool = True
    zodiac_mode: str = "tropical"  # reserved
    fold: Optional[int] = None
    ut1_minus_utc_seconds: float = 0.0

def compute_horoscope(payload: Dict[str, Any], *, options: ComputeOptions) -> Dict[str, Any]:
    issues: List[ValidationIssue] = []

    # --- Validate input
    for k in ("birth_date","birth_time","birth_location","iana_time_zone"):
        if k not in payload:
            issues.append(ValidationIssue(
                code="missing_field",
                message=f"Missing required field: {k}",
                severity="error",
                details={"field": k},
            ))

    if issues:
        return _finalize_error(payload, issues)

    birth_date = str(payload["birth_date"])
    birth_time = str(payload["birth_time"])
    loc = payload["birth_location"]
    tz = str(payload["iana_time_zone"])
    fold = payload.get("fold", options.fold)
    ut1 = float(payload.get("ut1_minus_utc_seconds", options.ut1_minus_utc_seconds))
    hsys = str(payload.get("house_system", options.house_system))[:1]

    try:
        lat = float(loc["lat"]); lon = float(loc["lon"])
    except Exception:
        issues.append(ValidationIssue(
            code="invalid_location",
            message="birth_location must provide numeric lat/lon",
            severity="error"
        ))
        return _finalize_error(payload, issues)

    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        issues.append(ValidationIssue(
            code="location_out_of_range",
            message="birth_location lat/lon out of range",
            severity="error",
            details={"lat": lat, "lon": lon},
        ))
        return _finalize_error(payload, issues)

    try:
        local_naive = _parse_time_fields(birth_date, birth_time)
        conv = convert_local_to_utc(local_naive=local_naive, iana_time_zone=tz, fold=fold)
    except AmbiguousLocalTimeError as e:
        # DST fall-back: time occurs twice, need fold parameter
        issues.append(ValidationIssue(
            code=e.code,  # "AMBIGUOUS_LOCAL_TIME"
            message=str(e),
            severity="error",
            details=e.details,  # includes candidates
        ))
        return _finalize_error(payload, issues, http_status=e.http_status)
    except NonexistentLocalTimeError as e:
        # DST spring-forward: time doesn't exist
        issues.append(ValidationIssue(
            code=e.code,  # "NONEXISTENT_LOCAL_TIME"
            message=str(e),
            severity="error",
            details=e.details,  # includes gap_info
        ))
        return _finalize_error(payload, issues, http_status=e.http_status)
    except (ValueError, TimeConversionError) as e:
        code = getattr(e, 'code', 'time_conversion_failed')
        issues.append(ValidationIssue(
            code=code,
            message=str(e),
            severity="error",
        ))
        return _finalize_error(payload, issues)

    # --- Ephemeris setup
    try:
        _set_ephe_path_or_fail(options.strict_mode)
        flags, flag_issues = _choose_flags(options.strict_mode)
        issues.extend(flag_issues)
    except EphemerisError as e:
        issues.append(ValidationIssue(
            code="ephemeris_unavailable",
            message=str(e),
            severity="error",
        ))
        return _finalize_error(payload, issues)

    # --- JD / ΔT
    jd_ut = _jd_ut_from_utc(conv.utc_dt, ut1)
    delta_t_days = float(swe.deltat(jd_ut))
    delta_t_seconds = delta_t_days * 86400.0

    # --- Planets
    planets: Dict[str, Any] = {}
    for name, body in PLANET_BODIES:
        try:
            vals = swe.calc_ut(jd_ut, body, flags)[0]
            lon_ecl = float(vals[0])
            lat_ecl = float(vals[1])
            dist = float(vals[2])
            speed = float(vals[3]) if len(vals) > 3 else None
        except Exception as e:
            issues.append(ValidationIssue(
                code="planet_calc_failed",
                message=f"Failed to compute {name}: {e}",
                severity="error",
            ))
            return _finalize_error(payload, issues)
        lon_norm = lon_ecl % 360.0
        sign, sign_i, deg_in_sign = _deg_to_sign(lon_norm)
        planets[name] = {
            "longitude": lon_norm,
            "sign": sign,
            "degree_in_sign": deg_in_sign,
            "speed_longitude_deg_per_day": speed,
        }

    # --- Houses / Asc
    try:
        cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, hsys.encode('ascii'), flags)
        asc = float(ascmc[0]) % 360.0
        mc = float(ascmc[1]) % 360.0
    except Exception as e:
        issues.append(ValidationIssue(
            code="houses_calc_failed",
            message=f"Failed to compute houses/ascendant: {e}",
            severity="error",
        ))
        return _finalize_error(payload, issues)

    asc_sign, _, asc_deg_in_sign = _deg_to_sign(asc)
    houses = {str(i): float(cusps[i-1]) % 360.0 for i in range(1, 13)}

    # --- Li Chun + Chinese year pillar
    try:
        li_chun = find_li_chun_utc(conv.utc_dt.year, flags=flags)
        cny = chinese_year_pillar(birth_utc=conv.utc_dt, li_chun_utc=li_chun)
    except Exception as e:
        issues.append(ValidationIssue(
            code="li_chun_failed",
            message=f"Failed to compute Li Chun / Chinese year pillar: {e}",
            severity="error",
        ))
        return _finalize_error(payload, issues)

    # --- Crosschecks
    issues.extend(_crosscheck_sun_sign(conv.local_dt.date(), planets["Sun"]["sign"], planets["Sun"]["longitude"]))
    issues.extend(_crosscheck_delta_t(conv.utc_dt.year, delta_t_seconds))
    issues.extend(_crosscheck_chinese_year(conv.utc_dt, cny["animal_de"], li_chun))

    report = _build_report(issues)

    out = {
        "ascendant": {
            "longitude": asc,
            "sign": asc_sign,
            "degree_in_sign": asc_deg_in_sign,
        },
        "mc": {
            "longitude": mc,
            "sign": _deg_to_sign(mc)[0],
            "degree_in_sign": _deg_to_sign(mc)[2],
        },
        "houses": houses,
        "planets": planets,
        "chinese_year": {
            **cny,
            "li_chun_utc": li_chun.isoformat(),
        },
        "audit": {
            "jd_ut": jd_ut,
            "delta_t_seconds": delta_t_seconds,
            "iana_time_zone": tz,
            "utc_timestamp": conv.utc_dt.isoformat(),
            "local_timestamp": conv.local_dt.isoformat(),
            "utc_offset_minutes": conv.utc_offset_minutes,
            "dst_offset_minutes": conv.dst_offset_minutes,
            "house_system": hsys,
            "swisseph_version": (swe.version if hasattr(swe, "version") else "unknown"),
            "engine_flags": {
                "flags": int(flags),
                "mode": "swieph" if (flags & swe.FLG_SWIEPH) else "moseph",
            },
        },
        "validation": report.to_dict(),
    }
    return out

# ----------------- Crosschecks -----------------

def _load_csv_rows(path: str) -> List[List[str]]:
    rows: List[List[str]] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            rows.append([c.strip() for c in line.split(",")])
    return rows

def _crosscheck_sun_sign(local_date, sun_sign_from_lon: str, sun_lon: float) -> List[ValidationIssue]:
    """
    Crosscheck A: Sun sign from longitude vs popular date boundaries (approximate).
    If mismatch far from cusps -> error; near cusp -> warn.
    """
    import pathlib
    rows = _load_csv_rows(str(pathlib.Path(__file__).resolve().parents[2] / "assets" / "zodiac-table-west.csv"))

    mmdd = f"{local_date.month:02d}-{local_date.day:02d}"

    def in_range(start: str, end: str, x: str) -> bool:
        # ranges may wrap year (e.g. Capricorn 12-22..01-19)
        if start <= end:
            return start <= x <= end
        return x >= start or x <= end

    date_sign = None
    for sign, start, end in rows:
        if in_range(start, end, mmdd):
            date_sign = sign
            break

    if date_sign is None:
        return [ValidationIssue(
            code="sun_sign_date_table_unmatched",
            message="Could not map date to a sign using zodiac-table-west.csv",
            severity="warn",
            details={"date": str(local_date), "mmdd": mmdd},
        )]

    if date_sign == sun_sign_from_lon:
        return []

    # cusp detection from longitude boundary
    dist_to_boundary = min(sun_lon % 30.0, 30.0 - (sun_lon % 30.0))
    if dist_to_boundary < 1.0:
        return [ValidationIssue(
            code="sun_sign_cusp_mismatch",
            message="Sun sign mismatch vs date-table but Sun longitude is within 1° of a boundary (cusp).",
            severity="warn",
            details={"date_sign": date_sign, "lon_sign": sun_sign_from_lon, "sun_lon": sun_lon, "dist_to_boundary_deg": dist_to_boundary},
        )]

    return [ValidationIssue(
        code="sun_sign_mismatch",
        message="Sun sign mismatch between longitude-based sign and date-table sign.",
        severity="error",
        details={"date_sign": date_sign, "lon_sign": sun_sign_from_lon, "sun_lon": sun_lon, "dist_to_boundary_deg": dist_to_boundary},
    )]

def _crosscheck_delta_t(year: int, delta_t_seconds: float) -> List[ValidationIssue]:
    import pathlib
    rows = _load_csv_rows(str(pathlib.Path(__file__).resolve().parents[2] / "assets" / "deltaT-reference.txt"))
    for y, ref, tol, note in rows:
        if int(y) == int(year):
            ref_f = float(ref); tol_f = float(tol)
            if abs(delta_t_seconds - ref_f) <= tol_f:
                return []
            return [ValidationIssue(
                code="delta_t_out_of_reference_range",
                message="ΔT deviates from deltaT-reference.txt sanity range.",
                severity="warn",
                details={"year": year, "delta_t_seconds": delta_t_seconds, "reference": ref_f, "tolerance": tol_f, "note": note},
            )]
    return [ValidationIssue(
        code="delta_t_no_reference",
        message="No ΔT sanity reference for this year in deltaT-reference.txt",
        severity="warn",
        details={"year": year},
    )]

def _crosscheck_chinese_year(birth_utc: datetime, animal_from_pillar: str, li_chun_utc: datetime) -> List[ValidationIssue]:
    """
    Crosscheck chinese year animal against Li-Chun-based boundary table (assets/zodiac-table-chinese.csv).

    Diese Tabelle dient als **einfacher, deterministischer Guardrail**.
    Mismatch ist nur dann tolerierbar, wenn die Geburt sehr nahe am Li-Chun-Übergang liegt
    und unterschiedliche Ephemeriden-Modelle (SWIEPH vs MOSEPH) minimal abweichen.
    """
    import pathlib
    from datetime import datetime as _dt, timezone as _tz

    rows = _load_csv_rows(str(pathlib.Path(__file__).resolve().parents[2] / "assets" / "zodiac-table-chinese.csv"))

    # header present? _load_csv_rows ignores comment lines, not header. Detect header by first cell.
    # We expect columns: animal_de,start_utc,end_utc,...
    # If header slipped through, skip it.
    if rows and rows[0][0] == "animal_de":
        rows = rows[1:]

    found = None
    for row in rows:
        animal = row[0]
        start = _dt.fromisoformat(row[1]).astimezone(_tz.utc)
        end = _dt.fromisoformat(row[2]).astimezone(_tz.utc)
        if start <= birth_utc < end:
            found = animal
            break

    if found is None:
        return [ValidationIssue(
            code="chinese_year_not_in_table",
            message="Birth timestamp not covered by zodiac-table-chinese.csv range.",
            severity="warn",
            details={"birth_utc": birth_utc.isoformat()},
        )]

    if found == animal_from_pillar:
        return []

    # near-boundary tolerance: within 24h of computed Li Chun
    seconds_from_li_chun = abs((birth_utc - li_chun_utc).total_seconds())
    if seconds_from_li_chun <= 24 * 3600:
        return [ValidationIssue(
            code="chinese_year_boundary_mismatch",
            message="Chinese year mismatch vs table, but birth is within 24h of Li Chun boundary; check ephemeris mode consistency.",
            severity="warn",
            details={"table_animal": found, "pillar_animal": animal_from_pillar, "birth_utc": birth_utc.isoformat(), "li_chun_utc": li_chun_utc.isoformat()},
        )]

    return [ValidationIssue(
        code="chinese_year_mismatch",
        message="Chinese year mismatch vs Li-Chun-based boundary table.",
        severity="error",
        details={"table_animal": found, "pillar_animal": animal_from_pillar, "birth_utc": birth_utc.isoformat(), "li_chun_utc": li_chun_utc.isoformat()},
    )]

# ----------------- Report helpers

def _build_report(issues: List[ValidationIssue]) -> ValidationReport:
    errs = [i for i in issues if i.severity == "error"]
    warns = [i for i in issues if i.severity == "warn"]
    if errs:
        return ValidationReport(status="error", issues=issues)
    if warns:
        return ValidationReport(status="warn", issues=issues)
    return ValidationReport(status="ok", issues=[])

def _finalize_error(payload: Dict[str, Any], issues: List[ValidationIssue], http_status: int = 400) -> Dict[str, Any]:
    report = _build_report(issues)
    result = {"validation": report.to_dict(), "input_echo": payload}
    # Include HTTP status for structured error handling
    if http_status != 400:
        result["http_status"] = http_status
    return result

