# Decisions and Risks

## Entscheidungen

| Datum | Entscheidung | Begruendung | Konsequenz |
|---|---|---|---|
| 2026-04-30 | Zwei-Phasen-Ritual statt Single-Phase-Horoskop | Wahl-Moment erzeugt Selbst-Framing und Shareability | Phase 2 existiert nur nach Tap |
| 2026-04-30 | Rat der sechs statt uneinheitlicher Fuenferliste | Memory hatte Inkonsistenz; sechs ist jetzt konsistent mit Sonne, Mond, Aszendent, Day-Master, Jahrestier, dominantem Wu-Xing | UI zeigt sechs Optionen |
| 2026-04-30 | Obsidian/gbrain als Kuration, nicht Runtime | Live-Auslieferung muss deterministisch und robust sein | Build exportiert JSON/DB |
| 2026-04-30 | Moderne Film/Game/Song-Zitate in Quarantaene | Kommerzielles Urheberrechtsrisiko | Nicht in Production exportieren |
| 2026-04-30 | `status: review` als Default | Ben kuratiert final | Kein ungepruefter Aphorismus wird approved |

## Top-Risiken

| ID | Risiko | Impact | Prob | Mitigation | Owner | Trigger |
|---|---|---|---|---|---|---|
| R1 | Falsche Zuschreibung beruehmter Aphorismen | high | high | `attribution_status`, Quellenstelle, Review-Pflicht | Ben | keine Werkstelle |
| R2 | Copyright bei modernen Zitaten | high | high | Quarantaene, keine Production, Lizenzpruefung | Ben/Legal | Film/Game/Song/lebende Autor:innen |
| R3 | gbrain als Runtime-Abhaengigkeit | med | med | JSON/DB als Production Source | Tech | Latenz > 200ms oder MCP down |
| R4 | LLM erzeugt Slot 1 frei | high | med | Prompt-Gate und Validator: Slot 1 muss aphorism_id haben | Voice | kein aphorism_id |
| R5 | Begriffe werden vermischt | med | med | Spec-Begriffe verbindlich, `Tageswetter` verboten | Product | Text enthaelt Tageswetter |
| R6 | Rat der sechs driftet wieder zu fuenf Figuren | med | med | Schema und API enum erzwingen sechs Optionen | Product/Tech | enum length != 6 |
