#!/usr/bin/env python3
"""Dependency-free catalog tooling. Python 3.11+; Windows, macOS and Linux."""
import argparse
import functools
import html
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
TOPICS = {'software-design', 'software-testing', 'languages-and-verification', 'hardware', 'mathematics'}
MODES = {'browser': 'Runs in your browser', 'simulation': 'Conceptual simulation', 'local-tools': 'Requires local tools', 'hosted': 'Requires a hosted service'}
SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')

def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))

def validate_path(value):
    path = PurePosixPath(value)
    if not value or path.is_absolute() or '..' in path.parts or '\\' in value or ':' in value:
        raise ValueError(f'Unsafe relative path: {value}')
    return path

def collect(root=ROOT):
    lessons, ids = [], set()
    for manifest in sorted((root / 'lessons').glob('*/*/lesson.json')):
        data = read_json(manifest)
        for field in ('id', 'title', 'summary', 'topic', 'level', 'mode', 'entrypoint'):
            if not isinstance(data.get(field), str) or not data[field].strip():
                raise ValueError(f'{manifest}: missing string {field}')
        if not SLUG.fullmatch(data['id']) or data['id'] in ids:
            raise ValueError(f'{manifest}: invalid or duplicate id')
        ids.add(data['id'])
        if data['topic'] not in TOPICS or manifest.parent.parent.name != data['topic'] or manifest.parent.name != data['id']:
            raise ValueError(f'{manifest}: directory must match topic/id')
        if data['mode'] not in MODES:
            raise ValueError(f'{manifest}: invalid execution mode')
        for field in ('tags', 'languages', 'prerequisites'):
            if not isinstance(data.get(field), list) or not all(isinstance(v, str) and v.strip() for v in data[field]):
                raise ValueError(f'{manifest}: {field} must be an array of nonempty strings')
        entry = validate_path(data['entrypoint'])
        if entry.suffix != '.html' or not (manifest.parent / 'app' / entry).is_file():
            raise ValueError(f'{manifest}: missing HTML entrypoint')
        for item in (manifest.parent / 'app').rglob('*'):
            if item.is_symlink():
                raise ValueError(f'{manifest}: symlinks are not publishable')
            if item.is_file() and (item.name.startswith('.') or item.suffix in ('.pem', '.key')):
                raise ValueError(f'{manifest}: unexpected private/config file in app: {item.name}')
        data = {**data, 'url': f"lessons/{data['topic']}/{data['id']}/{entry.as_posix()}"}
        lessons.append(data)
    if not lessons:
        raise ValueError('No lessons found')
    return lessons

def build(root=ROOT):
    lessons = collect(root)
    config = read_json(root / 'site/config.json')
    output = root / '_site'
    if output.exists():
        shutil.rmtree(output)
    output.mkdir()
    shutil.copytree(root / 'shared', output / 'shared')
    for lesson in lessons:
        shutil.copytree(root / 'lessons' / lesson['topic'] / lesson['id'] / 'app', output / 'lessons' / lesson['topic'] / lesson['id'])
    cards = []
    escape = html.escape
    for lesson in lessons:
        search = ' '.join([lesson['title'], lesson['summary'], *lesson['tags'], *lesson['languages']]).lower()
        cards.append(f'''<article class="lesson-card" data-topic="{escape(lesson['topic'])}" data-mode="{escape(lesson['mode'])}" data-search="{escape(search)}">
<div class="card-meta">{escape(lesson['topic'].replace('-', ' '))} · {escape(lesson['level'])}</div>
<h2><a href="{escape(lesson['url'])}">{escape(lesson['title'])}</a></h2>
<p>{escape(lesson['summary'])}</p><div class="card-bottom"><span class="badge">{escape(MODES[lesson['mode']])}</span><span>{escape(', '.join(lesson['languages']))}</span></div></article>''')
    template = (root / 'site/index.template.html').read_text(encoding='utf-8')
    for key in ('title', 'tagline', 'intro', 'repository'):
        template = template.replace('{{' + key + '}}', escape(config[key]))
    template = template.replace('{{cards}}', '\n'.join(cards)).replace('{{count}}', str(len(lessons)))
    (output / 'index.html').write_text(template, encoding='utf-8')
    (output / 'catalog.json').write_text(json.dumps(lessons, indent=2) + '\n', encoding='utf-8')
    (output / '.nojekyll').touch()
    return output

def create(topic, slug, title, root=ROOT):
    if topic not in TOPICS or not SLUG.fullmatch(slug):
        raise ValueError('Use a supported topic and a lowercase-hyphenated slug')
    destination = root / 'lessons' / topic / slug
    if destination.exists():
        raise ValueError(f'Already exists: {destination}')
    shutil.copytree(root / 'templates/lesson', destination)
    data = read_json(destination / 'lesson.json')
    data.update(id=slug, topic=topic, title=title)
    (destination / 'lesson.json').write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    return destination

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('check')
    sub.add_parser('build')
    serve = sub.add_parser('serve'); serve.add_argument('--port', type=int, default=8000)
    new = sub.add_parser('new'); new.add_argument('topic', choices=sorted(TOPICS)); new.add_argument('slug'); new.add_argument('--title', required=True)
    args = parser.parse_args()
    if args.command == 'check':
        print(f'Validated {len(collect())} lesson(s)')
    elif args.command == 'build':
        print(f'Built {build()}')
    elif args.command == 'new':
        print(f'Created {create(args.topic, args.slug, args.title)} — edit the lesson before committing')
    else:
        output = build()
        handler = functools.partial(SimpleHTTPRequestHandler, directory=str(output))
        print(f'Open http://localhost:{args.port} (Ctrl+C to stop)', flush=True)
        ThreadingHTTPServer(('127.0.0.1', args.port), handler).serve_forever()

if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError) as error:
        print(f'Error: {error}', file=sys.stderr)
        sys.exit(1)
