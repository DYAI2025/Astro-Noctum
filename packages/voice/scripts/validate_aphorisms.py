#!/usr/bin/env python3
import sys, re, json
from pathlib import Path

ALLOWED_STATUS = {'draft','review','approved','retired'}
ALLOWED_ATTR = {'verified','disputed','apocryphal','folkloric'}
ALLOWED_COPYRIGHT = {'PD','Zitatrecht','eigene-Übersetzung','lizenziert'}
ALLOWED_MODES = {'pulse','trace','spannung'}
ALLOWED_ELEMENTS = {'wasser','feuer','erde','holz','metall'}
ALLOWED_FIGURES = {'sonne','mond','aszendent','day_master','jahrestier','wuxing_dom'}
ALLOWED_SEASONS = {'fruehling','sommer','herbst','winter'}


def word_count(text):
    text = text.replace('—',' ').replace('–',' ')
    return len([t for t in re.split(r'\s+', text.strip()) if t])


def parse_scalar(value):
    v = value.strip()
    if v == 'null': return None
    if v.startswith('"') and v.endswith('"'):
        return v[1:-1]
    if v.startswith("'") and v.endswith("'"):
        return v[1:-1]
    if v.startswith('[') and v.endswith(']'):
        inner = v[1:-1].strip()
        if not inner: return []
        return [x.strip().strip('"').strip("'") for x in inner.split(',')]
    if re.fullmatch(r'-?\d+', v): return int(v)
    return v


def parse_frontmatter(raw):
    lines = raw.splitlines()
    if not lines or lines[0].strip() != '---':
        raise ValueError('missing frontmatter start')
    try:
        end = lines[1:].index('---') + 1
    except ValueError:
        raise ValueError('missing frontmatter end')
    fm = {}
    for line in lines[1:end]:
        if not line.strip() or line.strip().startswith('#'):
            continue
        if ':' not in line:
            raise ValueError('invalid frontmatter line: ' + line)
        k,v = line.split(':',1)
        fm[k.strip()] = parse_scalar(v)
    body = '\n'.join(lines[end+1:])
    return fm, body


def section(body, title):
    pat = r'^## ' + re.escape(title) + r'\s*$'
    m = re.search(pat, body, re.M)
    if not m: return None
    rest = body[m.end():]
    n = re.search(r'^## ', rest, re.M)
    return rest[:n.start()].strip() if n else rest.strip()


def first_quote(sec):
    if not sec: return ''
    lines = []
    for line in sec.splitlines():
        if line.strip().startswith('>'):
            lines.append(line.strip()[1:].strip())
    return ' '.join(lines).strip()


def validate_file(path):
    errors = []
    raw = path.read_text(encoding='utf-8')
    try:
        fm, body = parse_frontmatter(raw)
    except Exception as e:
        return [f'{path}: {e}']
    required = ['id','status','author','original_language','copyright','attribution_status','mode_tags','tone_tags','word_count_de','word_count_en','quality_rating','cooldown_days']
    for k in required:
        if k not in fm:
            errors.append(f'missing {k}')
    if fm.get('id') and path.stem != fm.get('id'):
        errors.append('filename/id mismatch')
    if fm.get('status') not in ALLOWED_STATUS:
        errors.append('invalid status')
    if fm.get('attribution_status') not in ALLOWED_ATTR:
        errors.append('invalid attribution_status')
    if fm.get('copyright') not in ALLOWED_COPYRIGHT:
        errors.append('invalid copyright')
    if fm.get('attribution_status') != 'verified' and not fm.get('attribution_note'):
        errors.append('attribution_note required when not verified')
    for m in fm.get('mode_tags',[]) or []:
        if m not in ALLOWED_MODES: errors.append('invalid mode_tags item ' + m)
    for e in fm.get('element_affinity',[]) or []:
        if e not in ALLOWED_ELEMENTS: errors.append('invalid element_affinity item ' + e)
    for f in fm.get('figure_affinity',[]) or []:
        if f not in ALLOWED_FIGURES: errors.append('invalid figure_affinity item ' + f)
    for s in fm.get('season_affinity',[]) or []:
        if s not in ALLOWED_SEASONS: errors.append('invalid season_affinity item ' + s)
    de = first_quote(section(body,'DE'))
    en = first_quote(section(body,'EN'))
    if not de: errors.append('missing DE blockquote')
    if not en: errors.append('missing EN blockquote')
    if de and fm.get('word_count_de') != word_count(de):
        errors.append(f'word_count_de expected {word_count(de)} got {fm.get("word_count_de")}')
    if en and fm.get('word_count_en') != word_count(en):
        errors.append(f'word_count_en expected {word_count(en)} got {fm.get("word_count_en")}')
    if fm.get('original_language') not in ('de','en','unknown'):
        orig = first_quote(section(body,'Original'))
        if not orig:
            errors.append('Original blockquote required for non-de/en original_language')
    return [f'{path}: {e}' for e in errors]


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('knowledge/bazodiaac-brain/aphorisms')
    files = sorted(root.rglob('aph-*.md'))
    all_errors = []
    for p in files:
        all_errors.extend(validate_file(p))
    if all_errors:
        print('\n'.join(all_errors))
        return 1
    print(f'valid: {len(files)} aphorism files passed schema checks')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
