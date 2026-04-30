#!/usr/bin/env python3
import sys, json, hashlib
from pathlib import Path


def h(s):
    return int(hashlib.sha256(s.encode('utf-8')).hexdigest()[:8], 16)


def main():
    if len(sys.argv) < 5:
        print('usage: select_daily_aphorism.py <aphorisms.json> <user_id> <date> <mode> [dominant_element] [season]', file=sys.stderr)
        return 2
    data = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    user_id, day, mode = sys.argv[2], sys.argv[3], sys.argv[4]
    dominant_element = sys.argv[5] if len(sys.argv) > 5 else None
    season = sys.argv[6] if len(sys.argv) > 6 else None
    pool = [a for a in data if mode in a.get('mode_tags', [])]
    if not pool:
        print(json.dumps({'fallback': True, 'reason': 'no aphorism for mode'}, ensure_ascii=False))
        return 0
    scored = []
    for a in pool:
        score = a.get('quality_rating', 1)
        if dominant_element and dominant_element in a.get('element_affinity', []): score += 2
        if season and season in a.get('season_affinity', []): score += 1
        scored.append((score, a['id'], a))
    scored.sort(key=lambda x: (-x[0], x[1]))
    top = [x[2] for x in scored[:5]]
    chosen = top[h(user_id + day + mode) % len(top)]
    print(json.dumps(chosen, ensure_ascii=False, indent=2))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
