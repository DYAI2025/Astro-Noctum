#!/usr/bin/env python3
import sys, re, json
from pathlib import Path
from validate_aphorisms import parse_frontmatter, section, first_quote, word_count


def main():
    if len(sys.argv) != 3:
        print('usage: build_aphorisms.py <input_dir> <output_json>', file=sys.stderr)
        return 2
    src = Path(sys.argv[1])
    out = Path(sys.argv[2])
    rows = []
    for p in sorted(src.rglob('aph-*.md')):
        fm, body = parse_frontmatter(p.read_text(encoding='utf-8'))
        if fm.get('status') != 'approved':
            continue
        de = first_quote(section(body,'DE'))
        en = first_quote(section(body,'EN'))
        original = first_quote(section(body,'Original'))
        rows.append({
            'id': fm['id'],
            'status': fm['status'],
            'text': {'de': de, 'en': en, 'original': original or None},
            'source': {
                'author': fm.get('author'),
                'work': fm.get('work'),
                'year': fm.get('year'),
                'original_language': fm.get('original_language'),
                'translator_de': fm.get('translator_de'),
                'translator_en': fm.get('translator_en'),
            },
            'copyright': fm.get('copyright'),
            'attribution_status': fm.get('attribution_status'),
            'attribution_note': fm.get('attribution_note'),
            'mode_tags': fm.get('mode_tags',[]),
            'tone_tags': fm.get('tone_tags',[]),
            'element_affinity': fm.get('element_affinity',[]),
            'figure_affinity': fm.get('figure_affinity',[]),
            'season_affinity': fm.get('season_affinity',[]),
            'word_count_de': fm.get('word_count_de') or word_count(de),
            'word_count_en': fm.get('word_count_en') or word_count(en),
            'quality_rating': fm.get('quality_rating'),
            'first_used': fm.get('first_used'),
            'cooldown_days': fm.get('cooldown_days',30),
        })
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'wrote {len(rows)} approved aphorisms to {out}')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
