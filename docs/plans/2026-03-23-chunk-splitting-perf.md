# Chunk-Splitting & Script Defer — Performance Optimization

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cut initial JS payload from ~519 KB gzip to ~250 KB gzip and eliminate render-blocking third-party scripts. Target: Zero Delay for 18-35 audience.

**Architecture:** Add Rollup `manualChunks` to split vendor libraries (motion, three, supabase, zod) into separate chunks that only load when needed. Defer GA4/AdSense. Lazy-load the BirthChartOrrery (heaviest three.js consumer) within Dashboard. Add `<link rel="preconnect">` for critical origins.

**Tech Stack:** Vite 6, Rollup (via Vite), React 19 lazy/Suspense

---

### Task 1: Add manualChunks to Vite Config

**Files:**
- Modify: `vite.config.ts`

**Step 1: Add build.rollupOptions.output.manualChunks**

Add the `build` key after the `server` block in the returned config object:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-three': ['three'],
        'vendor-motion': ['motion'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-zod': ['zod'],
      },
    },
  },
},
```

Note: Do NOT include `@react-three/fiber` or `@react-three/drei` in vendor-three — they have React peer deps that cause circular chunk issues. Keep them with the components that use them (already in lazy page chunks). Only the core `three` module needs extraction.

Note: The package is `motion` (not `framer-motion`) — see `package.json` line 41.

**Step 2: Run build to verify chunking**

Run: `npm run build 2>&1 | tail -25`

Expected: The old `index-*.js` (~986 KB) should shrink significantly. New chunks appear:
- `vendor-react-*.js` (~140 KB)
- `vendor-three-*.js` (~675 KB) — same as before but now explicitly named
- `vendor-motion-*.js` (~60 KB)
- `vendor-supabase-*.js` (~60 KB)
- `vendor-zod-*.js` (~30 KB)
- `index-*.js` should drop to ~300-400 KB

If build fails with circular dependency errors, remove the offending entry from manualChunks and retry.

**Step 3: Verify no runtime errors**

Run: `npm run build && npx serve dist -p 4173` (open in browser, check console for errors)

Alternative: `npm run preview` and navigate to `/`, `/signatur`, `/sky`

**Step 4: Commit**

```
perf(AN-PERF): add manualChunks vendor splitting to vite config
```

---

### Task 2: Lazy-load BirthChartOrrery inside Dashboard

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx:5`

**Why:** `BirthChartOrrery` does `import * as THREE from 'three'` plus 4 postprocessing imports (EffectComposer, RenderPass, UnrealBloomPass, OutputPass). Even though DashboardPage is lazy-loaded, three.js loads the moment Dashboard renders — even before the user scrolls to the orrery. Lazy-loading it defers three.js until the orrery section is actually visible.

**Step 1: Replace direct import with React.lazy**

In `src/components/dashboard/DashboardAstroSection.tsx`, change:

```typescript
// BEFORE (line 5):
import { BirthChartOrrery } from "../BirthChartOrrery";

// AFTER:
import { lazy, Suspense } from 'react';
const BirthChartOrrery = lazy(() => import("../BirthChartOrrery").then(m => ({ default: m.BirthChartOrrery })));
```

**Step 2: Wrap usage in Suspense**

Find the `<BirthChartOrrery` JSX usage (around line 224) and wrap it:

```tsx
<Suspense fallback={<div className="w-full aspect-square bg-[#0A0A14] rounded-2xl animate-pulse" />}>
  <BirthChartOrrery
    birthDate={birthDate}
    planetariumMode={planetariumMode}
    birthConstellation={birthConstellation}
  />
</Suspense>
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | grep -E "BirthChartOrrery|three\.module|DashboardPage"`

Expected: `BirthChartOrrery` gets its own chunk, three.js chunk is only loaded when orrery renders.

**Step 4: Run tests**

Run: `npm run test`

Expected: All tests pass. The test-setup already mocks BirthChartOrrery, so lazy wrapping doesn't affect tests.

**Step 5: Commit**

```
perf(AN-PERF): lazy-load BirthChartOrrery to defer three.js
```

---

### Task 3: Defer GA4 and AdSense scripts

**Files:**
- Modify: `index.html`

**Step 1: Move GA4 to defer and add preconnect**

Replace the current GA4 + AdSense block:

```html
<!-- BEFORE -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-K409QD2YSJ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-K409QD2YSJ');
</script>
<script async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1712273263687132"
  crossorigin="anonymous">
</script>
```

With:

```html
<!-- Preconnect to critical origins -->
<link rel="preconnect" href="https://ykoijifgweoapitabgxx.supabase.co" crossorigin>
<link rel="dns-prefetch" href="https://bafe.vercel.app">

<!-- GA4 — deferred, non-blocking -->
<script defer src="https://www.googletagmanager.com/gtag/js?id=G-K409QD2YSJ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-K409QD2YSJ', { send_page_view: false });
</script>

<!-- AdSense — load after page interactive -->
<script>
  window.addEventListener('load', function() {
    var s = document.createElement('script');
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1712273263687132';
    s.crossOrigin = 'anonymous';
    s.async = true;
    document.head.appendChild(s);
  });
</script>
```

Key changes:
- GA4: `async` → `defer` (doesn't block parsing)
- GA4: `send_page_view: false` initially (page view fires when app is ready, not during parse)
- AdSense: Injected on `window.load` event (after everything critical is done)
- Added `<link rel="preconnect">` for Supabase (auth is first API call)
- Added `<link rel="dns-prefetch">` for BAFE (chart calc, slightly lower priority)

**Step 2: Verify GA4 still fires**

Run: `npm run build && npm run preview`

Open browser DevTools → Network tab → filter "gtag" → verify GA4 loads but NOT before main JS.

**Step 3: Commit**

```
perf(AN-PERF): defer GA4/AdSense, add preconnect for Supabase
```

---

### Task 4: Add modulepreload for critical chunks

**Files:**
- Modify: `index.html`

**Step 1: Add modulepreload hint**

After Vite's auto-injected `<script type="module">` line, add a preload for the CSS (already done by Vite) and a preconnect for fonts if used via CDN. Since Vite handles preloading of JS modules automatically, the main optimization here is ensuring the critical CSS loads ASAP.

Check if Vite already injects `<link rel="modulepreload">` — it does for direct imports. No manual action needed for JS.

The key addition: move the CSS `<link>` to appear BEFORE any `<script>` tags to avoid FOUC:

```html
<!-- CSS first, before any scripts -->
<link rel="stylesheet" crossorigin href="/assets/index-BIl_aftX.css">

<!-- Then scripts -->
<script type="module" crossorigin src="/assets/index-CIO9R04q.js"></script>
```

Note: Vite auto-generates these paths. After build, verify the order in `dist/index.html`. If Vite already puts CSS first, this task is a no-op.

**Step 2: Verify with build**

Run: `npm run build && cat dist/index.html | grep -E "stylesheet|module"`

Expected: CSS link appears before the module script tag.

**Step 3: Commit (if changes were needed)**

```
perf(AN-PERF): ensure CSS loads before JS to prevent FOUC
```

---

### Task 5: Validate final bundle sizes and document

**Files:**
- None to modify (validation only)

**Step 1: Clean build**

Run: `npm run clean && npm run build 2>&1 | tail -30`

**Step 2: Measure gzip sizes of all chunks**

Run:
```bash
for f in dist/assets/*.js; do
  raw=$(wc -c < "$f" | tr -d ' ')
  gz=$(gzip -c "$f" | wc -c | tr -d ' ')
  name=$(basename "$f")
  echo "$name: ${raw}B raw → ${gz}B gzip"
done | sort -t'→' -k2 -rn
```

**Step 3: Calculate critical path**

The critical path for an unauthenticated first visit is:
- `vendor-react-*.js` (must load)
- `index-*.js` (app shell — should be < 150 KB gzip now)
- `index-*.css`

For authenticated user hitting Dashboard:
- Above + `DashboardPage-*.js`
- `vendor-motion-*.js` (used in Dashboard animations)
- `vendor-three-*.js` loads ONLY when orrery scrolls into view

Target: Initial critical path < 250 KB gzip total.

**Step 4: Run full test suite**

Run: `npm run test`

Expected: All tests pass (594+).

**Step 5: Commit summary**

No code changes — this is a validation step. If all looks good, the branch is ready for PR.

---

### Task 6: Add gzip/brotli compression to Express

**Files:**
- Modify: `server.mjs:2902-2903`
- Modify: `package.json` (add `compression` dependency)

**Why:** `express.static` serves files uncompressed. Without compression middleware, the browser receives the full raw file sizes (623 KB JS instead of 110 KB). This is the single biggest performance win — reduces ALL transfer sizes by ~70%.

**Step 1: Install compression**

Run: `npm install compression`

**Step 2: Add compression middleware before static files**

In `server.mjs`, add the import at the top (after the existing imports around line 1-8):

```javascript
import compression from "compression";
```

Then add the middleware BEFORE `express.static` (before line 2903):

```javascript
// ── Compression ────────────────────────────────────────────────────
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ── Static files ────────────────────────────────────────────────────
app.use(express.static(distPath, { index: "index.html" }));
```

`level: 6` is the default gzip level — good balance of speed vs compression. `threshold: 1024` skips tiny files.

**Step 3: Verify compression works**

Run: `npm run build && PORT=4173 node server.mjs &`

Then: `curl -sI -H "Accept-Encoding: gzip" http://localhost:4173/assets/index-*.js | grep -i "content-encoding"`

Expected: `content-encoding: gzip`

Kill the server after: `kill %1`

**Step 4: Commit**

```
perf(AN-PERF): add gzip compression middleware to Express
```

---

### Task 7: Add immutable cache headers for hashed assets

**Files:**
- Modify: `server.mjs:2903`

**Why:** Vite outputs hashed filenames (`index-C-2Xp3lI.js`). These never change — if the content changes, the hash changes. So the browser can cache them forever. Without explicit headers, browsers re-validate on every visit.

**Step 1: Replace the simple express.static with cache-aware serving**

Replace line 2903:

```javascript
// BEFORE:
app.use(express.static(distPath, { index: "index.html" }));

// AFTER:
// Hashed assets (JS/CSS/images in /assets/) — immutable, cache 1 year
app.use("/assets", express.static(path.join(distPath, "assets"), {
  maxAge: "1y",
  immutable: true,
}));

// Other static files (HTML, media, icons) — short cache, revalidate
app.use(express.static(distPath, {
  index: "index.html",
  maxAge: "1h",
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  },
}));
```

Key: `/assets/` gets `immutable` (browser NEVER re-fetches). HTML gets `no-cache` (always revalidates, so users get new deploys instantly). Other files (media, zodiac images) get 1h cache.

**Step 2: Verify cache headers**

Run: `npm run build && PORT=4173 node server.mjs &`

```bash
curl -sI http://localhost:4173/assets/index-*.js | grep -i "cache-control"
# Expected: cache-control: public, max-age=31536000, immutable

curl -sI http://localhost:4173/ | grep -i "cache-control"
# Expected: cache-control: no-cache
```

Kill server: `kill %1`

**Step 3: Commit**

```
perf(AN-PERF): add immutable cache headers for hashed assets
```

---

### Task 8: Extract lucide-react to vendor chunk

**Files:**
- Modify: `vite.config.ts` (add to manualChunks)

**Why:** lucide-react has 933 references in the main index bundle (~80-100 KB of icon SVG data). Extracting it to its own vendor chunk means: (a) it's cached separately and doesn't invalidate when app code changes, (b) it loads in parallel with the main bundle.

**Step 1: Add lucide-react to manualChunks**

In `vite.config.ts`, add to the existing `manualChunks` object:

```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-three': ['three'],
  'vendor-motion': ['motion'],
  'vendor-supabase': ['@supabase/supabase-js'],
  'vendor-zod': ['zod'],
  'vendor-icons': ['lucide-react'],    // ← ADD THIS
},
```

**Step 2: Build and verify**

Run: `npm run build 2>&1 | grep -E "vendor-icons|index-"`

Expected: New `vendor-icons-*.js` chunk appears, `index-*.js` shrinks further.

**Step 3: Commit**

```
perf(AN-PERF): extract lucide-react icons to separate vendor chunk
```

---

### Task 9: Lazy-load ReactMarkdown in DashboardInterpretationSection

**Files:**
- Modify: `src/components/dashboard/DashboardInterpretationSection.tsx:2`

**Why:** `react-markdown` is a heavy dependency (~30 KB gzip with remark plugins). It's only used to render the interpretation text which appears below the fold. Lazy-loading it defers this cost until the user scrolls to the interpretation.

**Step 1: Replace direct import with React.lazy**

```typescript
// BEFORE (line 1-2):
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

// AFTER:
import { useMemo, lazy, Suspense } from 'react';
const ReactMarkdown = lazy(() => import('react-markdown'));
```

**Step 2: Wrap ReactMarkdown usage in Suspense**

Find where `<ReactMarkdown>` is used in the JSX and wrap it:

```tsx
<Suspense fallback={<div className="prose prose-invert animate-pulse"><div className="h-4 bg-white/5 rounded w-3/4 mb-3" /><div className="h-4 bg-white/5 rounded w-1/2 mb-3" /><div className="h-4 bg-white/5 rounded w-2/3" /></div>}>
  <ReactMarkdown ... >
    {content}
  </ReactMarkdown>
</Suspense>
```

Keep all existing props and children exactly as they are.

**Step 3: Verify build**

Run: `npm run build 2>&1 | grep -i "markdown\|Interpretation"`

Expected: ReactMarkdown gets its own chunk.

**Step 4: Run tests**

Run: `npm run test`

Expected: All tests pass.

**Step 5: Commit**

```
perf(AN-PERF): lazy-load ReactMarkdown in interpretation section
```

---

### Task 10: Final validation — measure all improvements

**Files:**
- None (validation only)

**Step 1: Clean build**

Run: `npm run clean && npm run build 2>&1 | tail -35`

**Step 2: Measure all gzip sizes**

Run:
```bash
echo "=== CHUNK SIZES (gzip) ==="
for f in dist/assets/*.js; do
  gz=$(gzip -c "$f" | wc -c | tr -d ' ')
  name=$(basename "$f")
  echo "$name: ${gz}B gzip"
done | sort -t: -k2 -rn

echo ""
echo "=== CRITICAL PATH (unauthenticated) ==="
total=0
for f in dist/assets/vendor-react-*.js dist/assets/index-*.js dist/assets/index-*.css; do
  gz=$(gzip -c "$f" | wc -c | tr -d ' ')
  total=$((total + gz))
  echo "  $(basename $f): ${gz}B"
done
echo "  TOTAL: ${total}B"
```

**Step 3: Verify compression in server**

Run: `npm run build && PORT=4173 node server.mjs &`

```bash
# Test gzip response
curl -so /dev/null -w "Size: %{size_download}, Encoding: %{content_type}\n" \
  -H "Accept-Encoding: gzip" http://localhost:4173/

# Test cache headers
curl -sI http://localhost:4173/assets/vendor-react-*.js | grep -i "cache-control\|content-encoding"
```

Kill server: `kill %1`

**Step 4: Run full test suite**

Run: `npm run test`

Expected: All tests pass (685+).

**Step 5: Summary**

No code changes — validation only. Branch ready for PR.

---

## Expected Results

| Metric | Before | After (Tasks 1-5) | After (Tasks 6-10) |
|--------|--------|-------------------|-------------------|
| Main index.js | 222 KB gzip | 110 KB gzip | ~70 KB gzip |
| Transfer size (with compression) | Raw (no gzip!) | Raw | **Gzip served** |
| Critical path (unauth) | ~1 MB raw | ~250 KB raw | ~120 KB gzip |
| Critical path (auth+dashboard) | ~1.5 MB raw | ~500 KB raw | ~250 KB gzip |
| Three.js load | On Dashboard render | On orrery scroll | On orrery scroll |
| GA4 blocking time | ~100ms | 0ms | 0ms |
| AdSense blocking time | ~200ms | 0ms | 0ms |
| Revisit load (cached) | Full re-download | Full re-download | **~0 KB** (immutable) |
| ReactMarkdown | In DashboardPage | In DashboardPage | Deferred (scroll) |
