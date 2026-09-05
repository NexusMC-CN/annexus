import argparse
import hashlib
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument('upstream', type=Path)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
upstream = args.upstream.resolve()
outputs = {}
sources = {}

def read(path):
    raw = (upstream / path).read_bytes()
    sources[str(path)] = hashlib.sha256(raw).hexdigest()
    return raw.decode()

def emit(path, text):
    outputs[path] = text

imports = []
for path in sorted((upstream / 'packages/react/src/components').rglob('*.css')):
    relative = path.relative_to(upstream / 'packages/react/src')
    emit('src/styles/' + str(relative), read(path.relative_to(upstream)))
    imports.append('@import "./' + str(relative) + '";')
emit('src/styles/icon.css', read(Path('packages/icons/css/icon.css')))
emit('src/styles/index.css', '\n'.join(imports + ['@import "./icon.css";']) + '\n')
for name in ['v1/remap', 'v2/light', 'v2/dark']:
    emit(f'src/styles/theme/{name}.css', read(Path(f'packages/theme/src/css/{name}.css')))

attr_map = {name: re.sub('[A-Z]', lambda m: '-' + m[0].lower(), name) for name in [
    'fillRule', 'clipRule', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin',
    'strokeMiterlimit', 'strokeDasharray', 'strokeDashoffset', 'fillOpacity',
    'strokeOpacity', 'stopColor', 'stopOpacity', 'colorInterpolationFilters']}

def node_expr(element):
    tag = element.tag.split('}')[-1]
    attrs = {attr_map.get(k, k): v for k, v in element.attrib.items()}
    children = [node_expr(child) for child in element]
    if element.text and element.text.strip():
        children.insert(0, json.dumps(element.text.strip()))
    return 'h(' + json.dumps(tag) + ', ' + json.dumps(attrs) + ', [' + ', '.join(children) + '])'

icons = 0
for version in ['v1', 'v2']:
    base = Path('packages/icons/src/react') / version
    index = read(base / 'index.tsx')
    emit(f'src/icons/{version}/index.ts', index)
    for path in sorted((upstream / base).rglob('*.tsx')):
        if path.name.startswith('index'):
            continue
        src = read(path.relative_to(upstream))
        name = re.search(r'export const (\w+)', src)[1]
        svg = re.search(r'(<svg\b[\s\S]*?</svg>)', src)[1]
        svg = re.sub(r'\s+ref=\{ref\}|\s+\{\.\.\.props\}', '', svg)
        svg = re.sub(r'=\{(-?[\d.]+)\}', r'="\1"', svg)
        element = ET.fromstring(svg)
        attrs = dict(element.attrib)
        attrs['xmlns'] = 'http://www.w3.org/2000/svg'
        rel = path.relative_to(upstream / base).with_suffix('.ts')
        depth = len(rel.parts) + 1
        factory = '../' * depth + 'internal/svg'
        out = "import { h } from 'vue'\nimport { createSvgIcon } from '" + factory + "'\n"
        out += f'export const {name} = createSvgIcon({json.dumps(name)}, {json.dumps(attrs)}, () => ['
        out += ', '.join(node_expr(child) for child in element) + '])\n'
        out += f'export default {name}\n'
        emit(f'src/icons/{version}/{rel}', out)
        icons += 1

emit('scripts/upstream.json', json.dumps({
    'repository': 'pixiv/charcoal',
    'commit': '5a6536d7d9c6f55c96f2ddb242333e4f7b371575',
    'version': '6.1.0',
    'icons': icons,
    'sources': sources
}, indent=2) + '\n')

errors = []
for path, content in outputs.items():
    target = root / path
    if args.check:
        if not target.exists() or target.read_text() != content:
            errors.append(path)
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)
if errors:
    raise SystemExit('\n'.join(errors))
print(f'{len(outputs)} files, {icons} icons')
