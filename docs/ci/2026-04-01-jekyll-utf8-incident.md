# Jekyll UTF-8 Incident (2026-04-01)

## Root cause
GitHub Pages/Jekyll tried to parse files with markdown extensions as UTF-8 text. Multiple `*.md` files were actually ZIP/DOCX binaries (`PK\x03\x04` header), which triggered Liquid tokenizer crashes with `invalid byte sequence in UTF-8`.

## Affected files
These files were binary documents stored with `.md` extensions and were renamed to `.docx`:

- `docs/Bazodiac_Dev_Brief_04_Cleanup.docx`
- `features/docs/specs/Bazahuawa.docx`
- `features/docs/specs/Bazodiac Fusion Ring Signal Logic.docx`
- `features/docs/specs/Bazodiac_Semantic_Marker_Mapping_v2.docx`
- `features/plan/Fu-Ring/Fu-Ring-final/Uploads/Dev_Brief_Fusion_Ring_v2.docx`
- `features/plan/Implementation-plan/Bazodiac_Fusion_Ring_Architektur_v1.docx`
- `features/plan/Implementation-plan/Bazodiac_Sky_Spec.docx`
- `features/plan/Implementation-plan/Bazodiac_Transit_State_Spec.docx`
- `features/plan/Implementation-plan/Dev_Brief_BaZi_Dashboard_v2.docx`
- `features/plan/Implementation-plan/Dev_Brief_BaZi_WuXing_Dashboard.docx`
- `features/plan/Implementation-plan/Dev_Brief_Fusion_Ring_v2.docx`

## Preventive controls
- Added `scripts/check-text-integrity.mjs` to validate strict UTF-8 and detect binary signatures in text-like extensions.
- Added CI workflow `.github/workflows/text-integrity.yml` to run `npm run check:text-integrity` on every push/PR.
