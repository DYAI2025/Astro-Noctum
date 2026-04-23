#!/usr/bin/env python3
"""Build claudemap enrichment graph from snapshot."""
import json
import re
import os

SNAP_PATH = '.claude/skills/claudemap-runtime/tmp/snapshot.json'
OUT_PATH = '.claude/skills/claudemap-runtime/tmp/claudemap-enrichment.json'


def slug(s):
    s = s.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s or 'x'


def load_snapshot():
    with open(SNAP_PATH) as f:
        data = f.read()
    dec = json.JSONDecoder()
    snap, _ = dec.raw_decode(data)
    return snap


def assign_system(rel):
    """Return (system_id, list of ancestor system ids from top to leaf) for a file path."""
    # Returns a path of system ids (top -> ... -> leaf system that owns this file)

    # Tests
    if rel.startswith('src/__tests__/') or '/__tests__/' in rel or rel.endswith('.test.ts') or rel.endswith('.test.tsx'):
        if rel.startswith('packages/shared'):
            return ['s-tests', 's-tests-shared']
        if rel.startswith('src/'):
            return ['s-tests', 's-tests-web']
        return ['s-tests']

    # Mobile
    if rel.startswith('apps/mobile/'):
        sub = rel.split('/')
        if len(sub) >= 4 and sub[2] == 'src':
            third = sub[3]
            if third in ('screens',):
                return ['s-mobile', 's-mobile-screens']
            if third in ('components',):
                return ['s-mobile', 's-mobile-components']
            if third in ('hooks',):
                return ['s-mobile', 's-mobile-hooks']
            if third in ('lib', 'utils'):
                return ['s-mobile', 's-mobile-lib']
            if third in ('navigation',):
                return ['s-mobile', 's-mobile-nav']
            if third in ('contexts',):
                return ['s-mobile', 's-mobile-contexts']
            if third in ('services',):
                return ['s-mobile', 's-mobile-services']
        return ['s-mobile']

    # Shared package
    if rel.startswith('packages/shared/'):
        parts = rel.split('/')
        if len(parts) >= 4 and parts[2] == 'src':
            sub = parts[3]
            if sub == 'quizzes':
                return ['s-shared', 's-shared-quizzes']
            if sub in ('fusion-ring', 'signatur', 'fusion-bazi'):
                return ['s-shared', 's-shared-signal']
            if sub in ('experience', 'weekly', 'agents', 'transit', 'api'):
                return ['s-shared', 's-shared-contracts']
            if sub == 'i18n':
                return ['s-shared', 's-shared-i18n']
        return ['s-shared']

    # Supabase
    if rel.startswith('supabase-migrations/') or rel == 'supabase-schema.sql':
        return ['s-supabase']

    # Express server + api-server
    if rel == 'server.mjs' or rel.startswith('api-server/') or rel.startswith('src/server/'):
        return ['s-server']

    # Scripts / bazodiac_engine / Cymantics prototypes -> tooling-ish
    if rel.startswith('scripts/'):
        return ['s-tooling', 's-tooling-scripts']
    if rel.startswith('bazodiac_engine/'):
        return ['s-docs', 's-docs-reference']
    if rel.startswith('Cymantics/'):
        return ['s-docs', 's-docs-reference']
    if rel.startswith('features/plan/') or rel.startswith('features/docs/'):
        return ['s-docs', 's-docs-plans']

    # Root tooling/config
    if rel in ('vite.config.ts', 'vitest.config.ts'):
        return ['s-tooling', 's-tooling-config']

    # src/ — web app + engines
    if rel.startswith('src/'):
        parts = rel.split('/')
        if len(parts) == 2:
            # src/App.tsx, router, main, i18n, test-setup, vite-env
            name = parts[1]
            if name in ('App.tsx', 'router.tsx', 'main.tsx', 'vite-env.d.ts', 'i18n', 'test-setup.tsx'):
                return ['s-webapp', 's-webapp-shell']
            return ['s-webapp', 's-webapp-shell']

        second = parts[1]

        # Contexts, hooks, pages -> web app
        if second == 'contexts':
            return ['s-webapp', 's-webapp-contexts']
        if second == 'hooks':
            return ['s-webapp', 's-webapp-hooks']
        if second == 'pages':
            return ['s-webapp', 's-webapp-pages']
        if second == 'stories':
            return ['s-webapp', 's-webapp-shell']
        if second == 'data':
            return ['s-webapp', 's-webapp-shell']
        if second == 'debug':
            return ['s-webapp', 's-webapp-shell']
        if second == 'types':
            return ['s-webapp', 's-webapp-shell']
        if second == 'utils':
            return ['s-webapp', 's-webapp-shell']

        # Services -> services system
        if second == 'services':
            return ['s-services']

        # Components
        if second == 'components':
            if len(parts) >= 4:
                third = parts[2]
                if third == 'quizzes':
                    return ['s-quizzes']
                if third == 'dashboard':
                    return ['s-webapp', 's-webapp-components', 's-webapp-dashboard']
                if third == 'onboarding':
                    return ['s-webapp', 's-webapp-components', 's-webapp-onboarding']
                if third == 'sky':
                    return ['s-webapp', 's-webapp-components', 's-webapp-sky']
                if third == 'signatur' or third == 'signatur-renderer':
                    return ['s-signatur', 's-signatur-ring-v1']
                if third == 'signatur-3d':
                    return ['s-signatur', 's-signatur-3d']
                if third == 'signatur-cymatics':
                    return ['s-signatur', 's-signatur-cymatics']
                if third == 'animated-icons':
                    return ['s-webapp', 's-webapp-components', 's-webapp-animated-icons']
                if third == 'navigation':
                    return ['s-webapp', 's-webapp-components', 's-webapp-nav']
                if third == 'settings':
                    return ['s-webapp', 's-webapp-components', 's-webapp-misc']
                if third == 'shared':
                    return ['s-webapp', 's-webapp-components', 's-webapp-misc']
                if third == 'ui':
                    return ['s-webapp', 's-webapp-components', 's-webapp-ui']
            # top-level components
            name = parts[-1]
            if name == 'QuizOverlay.tsx' or name == 'QuizErrorBoundary.tsx' or name == 'ClusterCard.tsx':
                return ['s-quizzes']
            if name == 'BirthChartOrrery.tsx':
                return ['s-astro-engines', 's-astro-astronomy']
            if name == 'Dashboard.tsx':
                return ['s-webapp', 's-webapp-components', 's-webapp-dashboard']
            if name in ('BirthForm.tsx', 'Splash.tsx', 'AuthGate.tsx', 'LandingHero.tsx', 'PlaceAutocomplete.tsx', 'LocationMap.tsx'):
                return ['s-webapp', 's-webapp-components', 's-webapp-onboarding']
            if name in ('ManageSubscription.tsx', 'UpgradeButton.tsx', 'PremiumGate.tsx'):
                return ['s-webapp', 's-webapp-components', 's-webapp-stripe']
            return ['s-webapp', 's-webapp-components', 's-webapp-misc']

        # lib/ — engines
        if second == 'lib':
            if len(parts) >= 3:
                third = parts[2]
                if third == 'fusion-ring' or third == 'signatur':
                    return ['s-signatur', 's-signatur-engine-core']
                if third == 'signatur-3d':
                    return ['s-signatur', 's-signatur-3d-core']
                if third == 'cymatics':
                    return ['s-signatur', 's-signatur-cymatics-core']
                if third == 'master-signal':
                    return ['s-signatur', 's-signatur-master-signal']
                if third == 'lme':
                    return ['s-signatur', 's-signatur-lme']
                if third == 'day-harmonic.ts':
                    return ['s-signatur', 's-signatur-engine-core']
                if third == 'horoscope':
                    return ['s-signatur', 's-signatur-horoscope']
                if third == 'fusion-bazi':
                    return ['s-signatur', 's-signatur-engine-core']
                if third == 'dissonance':
                    return ['s-signatur', 's-signatur-engine-core']
                if third == 'astro-data':
                    return ['s-astro-engines', 's-astro-data']
                if third == 'astronomy':
                    return ['s-astro-engines', 's-astro-astronomy']
                if third == 'space-weather':
                    return ['s-astro-engines', 's-astro-space-weather']
                if third == 'jieqi':
                    return ['s-astro-engines', 's-astro-jieqi']
                if third == 'synastry':
                    return ['s-astro-engines', 's-astro-synastry']
                if third == 'schemas':
                    return ['s-astro-engines', 's-astro-schemas']
                if third == '3d':
                    return ['s-signatur', 's-signatur-3d-core']
                if third == 'audio':
                    return ['s-webapp', 's-webapp-misc-lib']
                if third == 'utils':
                    return ['s-webapp', 's-webapp-misc-lib']
                # top-level lib files
                if third in ('analytics.ts', 'authedFetch.ts', 'element-colors.ts', 'feature-flags.ts', 'navigation.ts', 'retryWithBackoff.ts', 'supabase.ts', 'utils.ts'):
                    return ['s-webapp', 's-webapp-misc-lib']
            return ['s-webapp', 's-webapp-misc-lib']

    # fallback
    return ['s-docs']


SYSTEMS = [
    # top-level
    {'id': 's-webapp', 'label': 'Web App (src/)', 'icon': 'globe', 'parentId': None, 'filePath': 'src/', 'summary': 'React 19 SPA shell, pages, hooks, UI'},
    {'id': 's-signatur', 'label': 'Signatur Engine', 'icon': 'zap', 'parentId': None, 'filePath': 'src/lib,src/components/signatur*', 'summary': 'Fusion-Ring, 3D, Cymatics, Master Signal'},
    {'id': 's-astro-engines', 'label': 'Astro Engines', 'icon': 'layers', 'parentId': None, 'filePath': 'src/lib', 'summary': 'BaZi, astronomy, space-weather, schemas'},
    {'id': 's-quizzes', 'label': 'Quizzes', 'icon': 'puzzle', 'parentId': None, 'filePath': 'src/components/quizzes', 'summary': '22 quizzes, clusters, event mapping'},
    {'id': 's-services', 'label': 'Services / API Clients', 'icon': 'gear', 'parentId': None, 'filePath': 'src/services', 'summary': 'BAFE, Gemini, Supabase, Stripe, Experience'},
    {'id': 's-server', 'label': 'Express Server', 'icon': 'server', 'parentId': None, 'filePath': 'server.mjs,api-server,src/server', 'summary': 'BAFE proxy, auth, Stripe, Master Signal port'},
    {'id': 's-mobile', 'label': 'Mobile App', 'icon': 'route', 'parentId': None, 'filePath': 'apps/mobile', 'summary': 'Expo 53 / RN 0.79 iOS app'},
    {'id': 's-shared', 'label': 'Shared Package', 'icon': 'layers', 'parentId': None, 'filePath': 'packages/shared', 'summary': '@bazodiac/shared: fusion math, quiz defs'},
    {'id': 's-supabase', 'label': 'Supabase Schema', 'icon': 'database', 'parentId': None, 'filePath': 'supabase-migrations', 'summary': 'Postgres schema + migrations'},
    {'id': 's-tests', 'label': 'Tests', 'icon': 'shield', 'parentId': None, 'filePath': 'src/__tests__,packages/shared/**/__tests__', 'summary': 'Vitest suite'},
    {'id': 's-tooling', 'label': 'Tooling & Config', 'icon': 'gear', 'parentId': None, 'filePath': 'scripts,*.config.*', 'summary': 'Vite, Vitest, scripts'},
    {'id': 's-docs', 'label': 'SDLC & Docs', 'icon': 'file', 'parentId': None, 'filePath': 'features,bazodiac_engine,Cymantics', 'summary': 'Planning, reference impls, SDLC scaffold'},

    # nested — Web App
    {'id': 's-webapp-shell', 'label': 'App Shell & Router', 'icon': 'route', 'parentId': 's-webapp', 'filePath': 'src/', 'summary': 'App.tsx, router, main, i18n'},
    {'id': 's-webapp-pages', 'label': 'Pages', 'icon': 'route', 'parentId': 's-webapp', 'filePath': 'src/pages', 'summary': 'Lazy-loaded route pages'},
    {'id': 's-webapp-hooks', 'label': 'Hooks', 'icon': 'puzzle', 'parentId': 's-webapp', 'filePath': 'src/hooks', 'summary': 'Bridge hooks to engines'},
    {'id': 's-webapp-contexts', 'label': 'Contexts', 'icon': 'lock', 'parentId': 's-webapp', 'filePath': 'src/contexts', 'summary': 'Auth, app state'},
    {'id': 's-webapp-components', 'label': 'Components', 'icon': 'puzzle', 'parentId': 's-webapp', 'filePath': 'src/components', 'summary': 'UI components'},
    {'id': 's-webapp-dashboard', 'label': 'Dashboard', 'icon': 'layers', 'parentId': 's-webapp-components', 'filePath': 'src/components/dashboard', 'summary': 'Dashboard sections'},
    {'id': 's-webapp-onboarding', 'label': 'Onboarding', 'icon': 'route', 'parentId': 's-webapp-components', 'filePath': 'src/components/onboarding', 'summary': 'Birth form + signature reveal'},
    {'id': 's-webapp-sky', 'label': 'Sky', 'icon': 'globe', 'parentId': 's-webapp-components', 'filePath': 'src/components/sky', 'summary': 'Space weather visualizations'},
    {'id': 's-webapp-animated-icons', 'label': 'Animated Icons', 'icon': 'code', 'parentId': 's-webapp-components', 'filePath': 'src/components/animated-icons', 'summary': 'Lottie/Framer icon set'},
    {'id': 's-webapp-nav', 'label': 'Navigation', 'icon': 'route', 'parentId': 's-webapp-components', 'filePath': 'src/components/navigation'},
    {'id': 's-webapp-ui', 'label': 'UI Primitives', 'icon': 'puzzle', 'parentId': 's-webapp-components', 'filePath': 'src/components/ui'},
    {'id': 's-webapp-stripe', 'label': 'Stripe UI', 'icon': 'lock', 'parentId': 's-webapp-components', 'filePath': 'src/components', 'summary': 'Subscription + upgrade UI'},
    {'id': 's-webapp-misc', 'label': 'Misc Components', 'icon': 'puzzle', 'parentId': 's-webapp-components', 'filePath': 'src/components'},
    {'id': 's-webapp-misc-lib', 'label': 'Shared Lib', 'icon': 'code', 'parentId': 's-webapp', 'filePath': 'src/lib', 'summary': 'Utilities, supabase client, feature flags'},

    # nested — Signatur
    {'id': 's-signatur-engine-core', 'label': 'Fusion Ring Engine', 'icon': 'zap', 'parentId': 's-signatur', 'filePath': 'src/lib/fusion-ring,src/lib/signatur', 'summary': 'V1/V2 signal math, ring geometry'},
    {'id': 's-signatur-ring-v1', 'label': 'Signatur Components', 'icon': 'puzzle', 'parentId': 's-signatur', 'filePath': 'src/components/signatur', 'summary': 'Ring components'},
    {'id': 's-signatur-3d', 'label': '3D Signatur Components', 'icon': 'puzzle', 'parentId': 's-signatur', 'filePath': 'src/components/signatur-3d'},
    {'id': 's-signatur-3d-core', 'label': '3D Signatur Core', 'icon': 'layers', 'parentId': 's-signatur', 'filePath': 'src/lib/signatur-3d,src/lib/3d', 'summary': 'GLSL shaders, Chladni math'},
    {'id': 's-signatur-cymatics', 'label': 'Cymatics Components', 'icon': 'puzzle', 'parentId': 's-signatur', 'filePath': 'src/components/signatur-cymatics'},
    {'id': 's-signatur-cymatics-core', 'label': 'Cymatics Core', 'icon': 'layers', 'parentId': 's-signatur', 'filePath': 'src/lib/cymatics'},
    {'id': 's-signatur-master-signal', 'label': 'Master Signal', 'icon': 'zap', 'parentId': 's-signatur', 'filePath': 'src/lib/master-signal', 'summary': 'Unified signal pipeline'},
    {'id': 's-signatur-lme', 'label': 'LME Types', 'icon': 'code', 'parentId': 's-signatur', 'filePath': 'src/lib/lme', 'summary': 'Lifecycle Mapping Engine types'},
    {'id': 's-signatur-horoscope', 'label': 'Horoscope', 'icon': 'code', 'parentId': 's-signatur', 'filePath': 'src/lib/horoscope'},

    # nested — Astro
    {'id': 's-astro-data', 'label': 'Astro Data', 'icon': 'database', 'parentId': 's-astro-engines', 'filePath': 'src/lib/astro-data', 'summary': 'BaZi stems, zodiac tables'},
    {'id': 's-astro-astronomy', 'label': 'Astronomy', 'icon': 'globe', 'parentId': 's-astro-engines', 'filePath': 'src/lib/astronomy', 'summary': 'Keplerian, stars, orrery'},
    {'id': 's-astro-space-weather', 'label': 'Space Weather', 'icon': 'zap', 'parentId': 's-astro-engines', 'filePath': 'src/lib/space-weather', 'summary': 'NOAA + DONKI adapters'},
    {'id': 's-astro-schemas', 'label': 'Zod Schemas', 'icon': 'shield', 'parentId': 's-astro-engines', 'filePath': 'src/lib/schemas', 'summary': 'Transit state, experience contracts'},
    {'id': 's-astro-jieqi', 'label': 'Jieqi', 'icon': 'clock', 'parentId': 's-astro-engines', 'filePath': 'src/lib/jieqi'},
    {'id': 's-astro-synastry', 'label': 'Synastry', 'icon': 'layers', 'parentId': 's-astro-engines', 'filePath': 'src/lib/synastry'},

    # nested — Mobile
    {'id': 's-mobile-screens', 'label': 'Screens', 'icon': 'route', 'parentId': 's-mobile', 'filePath': 'apps/mobile/src/screens'},
    {'id': 's-mobile-components', 'label': 'Components', 'icon': 'puzzle', 'parentId': 's-mobile', 'filePath': 'apps/mobile/src/components'},
    {'id': 's-mobile-hooks', 'label': 'Hooks', 'icon': 'code', 'parentId': 's-mobile', 'filePath': 'apps/mobile/src/hooks'},
    {'id': 's-mobile-lib', 'label': 'Lib', 'icon': 'code', 'parentId': 's-mobile', 'filePath': 'apps/mobile/src/lib'},
    {'id': 's-mobile-nav', 'label': 'Navigation', 'icon': 'route', 'parentId': 's-mobile', 'filePath': 'apps/mobile/src/navigation'},
    {'id': 's-mobile-contexts', 'label': 'Contexts', 'icon': 'lock', 'parentId': 's-mobile', 'filePath': 'apps/mobile/src/contexts'},
    {'id': 's-mobile-services', 'label': 'Services', 'icon': 'gear', 'parentId': 's-mobile', 'filePath': 'apps/mobile/src/services'},

    # nested — shared
    {'id': 's-shared-quizzes', 'label': 'Quiz Definitions', 'icon': 'puzzle', 'parentId': 's-shared', 'filePath': 'packages/shared/src/quizzes', 'summary': 'Universal quiz schema + definitions'},
    {'id': 's-shared-signal', 'label': 'Fusion Signal Math', 'icon': 'zap', 'parentId': 's-shared', 'filePath': 'packages/shared/src/fusion-ring,signatur'},
    {'id': 's-shared-contracts', 'label': 'Contracts', 'icon': 'shield', 'parentId': 's-shared', 'filePath': 'packages/shared/src/experience,weekly,agents,transit,api'},
    {'id': 's-shared-i18n', 'label': 'i18n', 'icon': 'globe', 'parentId': 's-shared', 'filePath': 'packages/shared/src/i18n'},

    # nested — tests
    {'id': 's-tests-web', 'label': 'Web Tests', 'icon': 'shield', 'parentId': 's-tests', 'filePath': 'src/__tests__'},
    {'id': 's-tests-shared', 'label': 'Shared Tests', 'icon': 'shield', 'parentId': 's-tests', 'filePath': 'packages/shared/src/**/__tests__'},

    # nested — tooling
    {'id': 's-tooling-config', 'label': 'Config', 'icon': 'gear', 'parentId': 's-tooling', 'filePath': 'root configs'},
    {'id': 's-tooling-scripts', 'label': 'Scripts', 'icon': 'gear', 'parentId': 's-tooling', 'filePath': 'scripts/'},

    # nested — docs
    {'id': 's-docs-plans', 'label': 'Planning Artefacts', 'icon': 'file', 'parentId': 's-docs', 'filePath': 'features/plan', 'summary': 'Not part of build'},
    {'id': 's-docs-reference', 'label': 'Reference Impls', 'icon': 'file', 'parentId': 's-docs', 'filePath': 'bazodiac_engine,Cymantics', 'summary': 'Python + Cymantics prototypes'},
]


def main():
    snap = load_snapshot()
    files = snap['files']

    # Build system index
    sys_by_id = {s['id']: s for s in SYSTEMS}

    # Assign each file to leaf system id; also count lines up-chain
    system_line_counts = {s['id']: 0 for s in SYSTEMS}
    system_file_counts = {s['id']: 0 for s in SYSTEMS}
    file_system = {}
    file_path_to_id = {}

    # build parent chain cache
    def ancestors(sid):
        chain = []
        cur = sid
        while cur:
            chain.append(cur)
            cur = sys_by_id[cur]['parentId']
        return chain

    for f in files:
        chain = assign_system(f['relativePath'])
        leaf = chain[-1]
        if leaf not in sys_by_id:
            leaf = chain[0]
        file_system[f['relativePath']] = leaf
        # accumulate up ancestor chain
        for aid in ancestors(leaf):
            system_line_counts[aid] = system_line_counts.get(aid, 0) + f['lineCount']
            system_file_counts[aid] = system_file_counts.get(aid, 0) + 1

    nodes = []

    # Add system nodes
    for s in SYSTEMS:
        node = {
            'id': s['id'],
            'label': s['label'],
            'type': 'system',
            'icon': s['icon'],
            'parentId': s['parentId'],
            'filePath': s.get('filePath', ''),
            'lineCount': system_line_counts.get(s['id'], 0),
            'health': 'green',
        }
        if 'summary' in s:
            node['summary'] = s['summary']
        nodes.append(node)

    # File nodes
    def file_id(rel):
        return 'f-' + slug(rel)

    file_ids_set = set()
    for f in files:
        fid = file_id(f['relativePath'])
        if fid in file_ids_set:
            # disambiguate on collision
            fid = fid + '-' + str(len(file_ids_set))
        file_ids_set.add(fid)
        file_path_to_id[f['relativePath']] = fid

        lc = f['lineCount']
        health = 'green'
        reason = None
        if lc >= 500:
            health = 'red'
            reason = 'Large file (500+ lines)'
        elif lc >= 300:
            health = 'yellow'
            reason = 'Long file (300-500 lines)'
        elif len(f.get('imports', [])) > 12:
            health = 'yellow'
            reason = 'High fan-in (>12 imports)'

        # Server.mjs special: god file
        if f['relativePath'] == 'server.mjs':
            health = 'red'
            reason = 'God file: proxy+auth+stripe+signal (5900+ lines)'

        node = {
            'id': fid,
            'label': f['name'],
            'type': 'file',
            'icon': 'file',
            'parentId': file_system[f['relativePath']],
            'filePath': f['relativePath'],
            'lineCount': lc,
            'health': health,
        }
        if reason and health != 'green':
            node['healthReason'] = reason
        nodes.append(node)

    # Build edges: cross-system imports
    # First map each import to a system. Import strings may be relative or package-style.
    # Build index: by relativePath (without ext) -> fid and system
    path_index = {}
    for f in files:
        rp = f['relativePath']
        path_index[rp] = (file_path_to_id[rp], file_system[rp])
        # strip extension
        base = re.sub(r'\.(tsx?|jsx?|mjs|cjs|json)$', '', rp)
        path_index.setdefault(base, (file_path_to_id[rp], file_system[rp]))
        # also index basename+/index variants
        if rp.endswith('/index.ts') or rp.endswith('/index.tsx') or rp.endswith('/index.js'):
            dir_ = os.path.dirname(rp)
            path_index.setdefault(dir_, (file_path_to_id[rp], file_system[rp]))

    def resolve_import(src_rel, imp):
        # relative
        if imp.startswith('.'):
            base_dir = os.path.dirname(src_rel)
            joined = os.path.normpath(os.path.join(base_dir, imp))
            # try various extensions
            cands = [joined, joined + '.ts', joined + '.tsx', joined + '.js', joined + '.jsx', joined + '.mjs',
                     joined + '/index.ts', joined + '/index.tsx', joined + '/index.js']
            for c in cands:
                if c in path_index:
                    return path_index[c]
            return None
        # @/ path alias → project root
        if imp.startswith('@/'):
            rest = imp[2:]
            cands = [rest, rest + '.ts', rest + '.tsx', rest + '.js', rest + '.mjs',
                     rest + '/index.ts', rest + '/index.tsx']
            for c in cands:
                if c in path_index:
                    return path_index[c]
            return None
        # @bazodiac/shared
        if imp.startswith('@bazodiac/shared'):
            # map to shared package
            return ('s-shared-signal', 's-shared-signal')  # treat as system-level
        return None

    def top_level(sid):
        cur = sid
        while sys_by_id[cur]['parentId']:
            cur = sys_by_id[cur]['parentId']
        return cur

    edges = []
    edge_set = set()
    for f in files:
        src_rel = f['relativePath']
        src_fid = file_path_to_id[src_rel]
        src_sys = file_system[src_rel]
        src_top = top_level(src_sys)
        for imp in f.get('imports', []):
            r = resolve_import(src_rel, imp)
            if not r:
                continue
            tgt_fid, tgt_sys = r
            # For @bazodiac/shared resolution, tgt_fid == sid - use system not file
            if tgt_fid == tgt_sys:
                # skip: system-level target not a file node
                continue
            tgt_top = top_level(tgt_sys)
            if src_top == tgt_top:
                continue
            if src_fid == tgt_fid:
                continue
            key = (src_fid, tgt_fid)
            if key in edge_set:
                continue
            edge_set.add(key)
            eid = 'edge-' + src_fid + '-' + tgt_fid
            # keep reasonably short
            if len(eid) > 200:
                eid = 'edge-' + str(abs(hash(key)))
            edges.append({
                'id': eid,
                'source': src_fid,
                'target': tgt_fid,
                'type': 'imports',
            })

    # Function nodes — opt-in, limited. Add entry functions for server, a few critical files.
    fn_targets = [
        ('server.mjs', 'default', 'Express app entry'),
        ('src/App.tsx', 'default', 'App root component'),
        ('src/router.tsx', 'default', 'Route definitions'),
        ('src/main.tsx', 'default', 'SPA bootstrap'),
    ]
    for rel, exp, summary in fn_targets:
        fid = file_path_to_id.get(rel)
        if not fid:
            continue
        nid = 'fn-' + slug(rel) + '-' + slug(exp)
        # estimate lineCount proportional, require > 0
        lc = max(1, next((f['lineCount'] for f in files if f['relativePath'] == rel), 1) // 4)
        nodes.append({
            'id': nid,
            'label': exp,
            'type': 'function',
            'icon': 'code',
            'parentId': fid,
            'filePath': rel,
            'lineCount': lc,
            'health': 'green',
            'summary': summary,
        })

    # Adjust system healths based on file counts / child count heuristics
    # Sum file counts per system
    # Mark yellow if > 30 files and no nested systems (flat bag)
    child_system_count = {s['id']: 0 for s in SYSTEMS}
    for s in SYSTEMS:
        if s['parentId']:
            child_system_count[s['parentId']] += 1

    for s in SYSTEMS:
        sid = s['id']
        sys_node = next(n for n in nodes if n['id'] == sid and n['type'] == 'system')
        fcount = system_file_counts.get(sid, 0)
        # Only files directly assigned (not descendants)
        direct = sum(1 for rp, lid in file_system.items() if lid == sid)
        if child_system_count[sid] == 0 and direct > 30:
            sys_node['health'] = 'yellow'
            sys_node['healthReason'] = 'Flat system: >30 files, no nesting'

    # Server system red
    for n in nodes:
        if n['id'] == 's-server' and n['type'] == 'system':
            n['health'] = 'red'
            n['healthReason'] = 'God-server: server.mjs alone ~5900 lines'

    # Validation: every file appears exactly once
    all_file_nodes = [n for n in nodes if n['type'] == 'file']
    assert len(all_file_nodes) == len(files), f'file count mismatch {len(all_file_nodes)} vs {len(files)}'
    ids = set()
    for n in nodes:
        assert n['id'] not in ids, 'dup id ' + n['id']
        ids.add(n['id'])

    graph = {'nodes': nodes, 'edges': edges}
    out = json.dumps(graph, separators=(',', ':'))
    with open(OUT_PATH, 'w') as f:
        f.write(out)
    size = os.path.getsize(OUT_PATH)
    top_sys = [s for s in SYSTEMS if s['parentId'] is None]
    print(f'wrote {size} bytes, {len(top_sys)} top-level systems, {len(nodes)} nodes, {len(edges)} edges')


if __name__ == '__main__':
    main()
