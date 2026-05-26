# Fly.io Deployment RCA — bazodiac-fly (2026-05-26)

## Kurzfazit
Der primäre Ausfall ist **kein Netzwerk/Port-Bug**, sondern ein **Boot-Abbruch durch fehlende Secrets**. Dadurch beendet sich `node server.mjs` mit Exit-Code 1, die App bindet nie auf `0.0.0.0:8080`, und Fly Smoke Checks schlagen folgerichtig fehl.

## Evidenz aus Logs
- `FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in production.`
- `[server] Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY`
- Danach Neustart/Connection refused auf `0.0.0.0:8080`
- `Main child exited normally with code: 1`

## Top-3 wahrscheinlichste Ursachen

### 1) Fehlende Fly-Secrets (höchste Wahrscheinlichkeit)
**Warum wahrscheinlich:** Server validiert env vars beim Start und bricht in Production sofort ab.

**Verifikation:**
```bash
fly secrets list -a astro-noctum
```
Wenn `SUPABASE_URL` oder `SUPABASE_SERVICE_ROLE_KEY` fehlen: Root Cause bestätigt.

**Fix:**
```bash
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... -a astro-noctum
```

### 2) Secrets im falschen Scope/bei falscher App gesetzt
**Warum wahrscheinlich:** Deploy-Command zeigt App `astro-noctum`; bei mehreren Umgebungen wird häufig in der falschen App/Org gesetzt.

**Verifikation:**
```bash
fly apps list
fly status -a astro-noctum
fly secrets list -a astro-noctum
```

**Fix:** Secrets explizit für die Ziel-App erneut setzen; danach Redeploy.

### 3) Race/Instabilität bei Machine-Provisioning nach Crash
**Warum wahrscheinlich:** `machine not found` tritt oft nach frühem Boot-Crash/Auto-Cleanup auf, wenn Smoke Checks noch gegen eine bereits entfernte Instanz laufen.

**Verifikation:**
```bash
fly logs -a astro-noctum
fly machine list -a astro-noctum
```

**Fix:** Erst Runtime-Start stabilisieren (Cause #1/#2), dann erneut deployen. Optional temporär `min_machines_running = 0`, um HA-Rollout-Komplexität während Incident zu reduzieren.

## Integrations-Fixplan

1. **Preflight vor Deploy erzwingen**
   - Neues Script: `npm run predeploy:fly` prüft zwingende Runtime-Secrets lokal/CI-seitig.
2. **Secrets in Fly setzen + dokumentieren**
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` als mandatory in Deploy-Runbook.
3. **Smoke-Check-Readiness absichern**
   - Sicherstellen, dass `PORT=8080` aktiv ist (App lauscht bereits auf `0.0.0.0`).
4. **Staged Redeploy**
   - Erst Single-Machine verifizieren, dann HA/Zerodowntime-Replikation aktivieren.
5. **Post-Deploy Checkliste**
   - `fly status`, `fly logs`, Health endpoint und auth request smoke testen.

## Deployment-Fähigkeit (Was aktuell testbar ist)
- **Im Repository testbar:** Preflight-Validierung und Startverhalten.
- **Extern nötig:** echter Fly Deploy (`flyctl deploy`) inkl. Account/App-Secrets.


## Technische Schuld separat: IPv6 Rate-Limit Warning

Die `express-rate-limit`-Warnung zur IPv6-Adressaggregation ist **kein Start-Blocker**, aber sollte bereinigt werden, damit Keying konsistent und warning-frei bleibt (insbesondere auf Fly mit IPv6-Traffic).

**Umsetzung:** `keyGenerator` nutzt jetzt `ipKeyGenerator(req.ip)` statt rohem `req.ip` als Fallback.

## Fly Rollout Runbook (exakte Reihenfolge)

1. **Secrets setzen** (Pflicht vor Deploy)
   ```bash
   fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... -a astro-noctum
   ```
2. **Deploy ausführen**
   ```bash
   fly deploy -a astro-noctum
   ```
3. **Status + Logs prüfen**
   ```bash
   fly status -a astro-noctum
   fly logs -a astro-noctum
   ```
4. **Smoke-Checks verifizieren**
   - Fly-Output auf erfolgreiche Health/Smoke-Checks prüfen
   - optional machine-spezifisch bei Problemen:
     ```bash
     fly machine list -a astro-noctum
     fly logs -a astro-noctum -i <machine-id>
     ```
