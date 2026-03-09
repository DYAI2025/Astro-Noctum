from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Literal

ValidationStatus = Literal["ok", "warn", "error"]

@dataclass(frozen=True)
class ValidationIssue:
    code: str
    message: str
    severity: Literal["warn", "error"]
    details: Optional[Dict[str, Any]] = None

@dataclass(frozen=True)
class ValidationReport:
    status: ValidationStatus
    issues: List[ValidationIssue]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "issues": [
                {
                    "code": i.code,
                    "message": i.message,
                    "severity": i.severity,
                    **({"details": i.details} if i.details else {}),
                }
                for i in self.issues
            ],
            "summary": self.summary(),
        }

    def summary(self) -> str:
        if not self.issues:
            return "ok"
        errs = [i for i in self.issues if i.severity == "error"]
        warns = [i for i in self.issues if i.severity == "warn"]
        if errs:
            return f"{len(errs)} error(s), {len(warns)} warning(s)"
        return f"{len(warns)} warning(s)"
