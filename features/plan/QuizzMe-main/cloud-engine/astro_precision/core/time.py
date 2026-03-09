from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import Optional, Tuple, List, Dict, Any

@dataclass(frozen=True)
class TimeConversion:
    local_dt: datetime
    utc_dt: datetime
    utc_offset_minutes: int
    dst_offset_minutes: int

class TimeConversionError(ValueError):
    """Base class for time conversion errors."""
    def __init__(self, message: str, code: str = "TIME_CONVERSION_ERROR",
                 http_status: int = 400, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.code = code
        self.http_status = http_status
        self.details = details or {}

class AmbiguousLocalTimeError(TimeConversionError):
    """Raised when local time is ambiguous due to DST fall-back."""
    def __init__(self, message: str, candidates: List[Dict[str, Any]]):
        super().__init__(
            message=message,
            code="AMBIGUOUS_LOCAL_TIME",
            http_status=409,
            details={"candidates": candidates}
        )
        self.candidates = candidates

class NonexistentLocalTimeError(TimeConversionError):
    """Raised when local time doesn't exist due to DST spring-forward gap."""
    def __init__(self, message: str, gap_info: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="NONEXISTENT_LOCAL_TIME",
            http_status=422,
            details={"gap_info": gap_info or {}}
        )

def _offset_minutes(dt: datetime) -> int:
    off = dt.utcoffset()
    if off is None:
        return 0
    return int(off.total_seconds() // 60)

def _dst_minutes(dt: datetime) -> int:
    dst = dt.dst()
    if dst is None:
        return 0
    return int(dst.total_seconds() // 60)

def convert_local_to_utc(
    *,
    local_naive: datetime,
    iana_time_zone: str,
    fold: Optional[int] = None,
) -> TimeConversion:
    """
    Konvertiert lokale naive Zeit in UTC, inkl. historischer DST-Regeln (tzdata).

    Guardrails:
    - Ambiguous times (DST fall-back): ohne fold -> Fehler.
    - Nonexistent times (DST spring-forward): Fehler (fail-closed).

    Diese Checks sind wichtig, weil 1h Unterschied den Aszendenten deutlich verschiebt.
    """
    if local_naive.tzinfo is not None:
        raise TimeConversionError("local_naive must be naive (tzinfo=None)")

    tz = ZoneInfo(iana_time_zone)

    # Check fold parameter validity
    if fold is not None and fold not in (0, 1):
        raise TimeConversionError("fold must be 0 or 1", code="INVALID_FOLD")

    # Build both fold variants
    dt0 = local_naive.replace(tzinfo=tz, fold=0)
    dt1 = local_naive.replace(tzinfo=tz, fold=1)
    off0 = dt0.utcoffset()
    off1 = dt1.utcoffset()

    # Convert to UTC
    utc0 = dt0.astimezone(timezone.utc)
    utc1 = dt1.astimezone(timezone.utc)

    # Roundtrip check - convert back to local time
    rt0 = utc0.astimezone(tz).replace(tzinfo=None)
    rt1 = utc1.astimezone(tz).replace(tzinfo=None)

    # NONEXISTENT TIME: Neither roundtrip matches the original local time
    # This happens during spring-forward gap (clock jumps forward)
    if rt0 != local_naive and rt1 != local_naive:
        raise NonexistentLocalTimeError(
            f"Local time {local_naive.isoformat()} does not exist in {iana_time_zone} "
            f"(DST spring-forward gap). The clock jumped forward, skipping this time. "
            f"Provide a valid local time.",
            gap_info={
                "local_time": local_naive.isoformat(),
                "timezone": iana_time_zone,
                "hint": "Choose a time before or after the DST transition gap."
            }
        )

    # AMBIGUOUS TIME: Both roundtrips match but offsets are different
    # This happens during fall-back (clock goes back, time repeats)
    is_ambiguous = (off0 != off1) and (rt0 == local_naive) and (rt1 == local_naive)
    if is_ambiguous and fold is None:
        # Build candidates with offset info for caller
        candidates = [
            {
                "fold": 0,
                "utc_offset_minutes": int(off0.total_seconds() // 60) if off0 else 0,
                "dst_active": _dst_minutes(dt0) > 0,
                "utc_time": utc0.isoformat(),
            },
            {
                "fold": 1,
                "utc_offset_minutes": int(off1.total_seconds() // 60) if off1 else 0,
                "dst_active": _dst_minutes(dt1) > 0,
                "utc_time": utc1.isoformat(),
            },
        ]
        raise AmbiguousLocalTimeError(
            f"Local time {local_naive.isoformat()} is ambiguous in {iana_time_zone} "
            f"due to DST fall-back. Provide fold=0 (first occurrence, DST) or fold=1 "
            f"(second occurrence, standard time).",
            candidates=candidates
        )

    # Use the specified fold or default to 0
    aware = local_naive.replace(tzinfo=tz, fold=fold or 0)
    utc_dt = aware.astimezone(timezone.utc)

    return TimeConversion(
        local_dt=aware,
        utc_dt=utc_dt,
        utc_offset_minutes=_offset_minutes(aware),
        dst_offset_minutes=_dst_minutes(aware),
    )
