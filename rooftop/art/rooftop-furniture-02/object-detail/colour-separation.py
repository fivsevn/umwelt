"""Scoped palette edit of the current PXO with Pixelorama's native Pencil.

Uses existing paint-detail.py's native edit/reopen transaction. Python only
plans colour runs, verifies pixels and repackages GLB image buffers. It does
not rasterize textures. Keep the baseline/work directories outside the repo.
"""
from pathlib import Path
import argparse, ast, base64, colorsys, collections, hashlib, io, json, math, shutil, struct, subprocess, zipfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
ROOF = ROOT.parents[1]
FAMILIES = ('everyday', 'rooms-vessels', 'plants-retained', 'pots-retained')
CLAY = {'vessel-terra', 'vessel-deep', 'vessel-shallow'}

def clean_pxo_metadata(path):
    with zipfile.ZipFile(path) as archive:
        entries = [(info, archive.read(info.filename)) for info in archive.infolist()]
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w') as archive:
        for info, data in entries:
            if info.filename == 'data.json':
                meta = json.loads(data)
                meta['export_profile']['directory_path'] = json.dumps('.')
                meta['export_profile']['file_name'] = json.dumps('atlas')
                data = json.dumps(meta, separators=(',', ':'), ensure_ascii=False).encode()
            archive.writestr(info, data)
    path.write_bytes(output.getvalue())
    with zipfile.ZipFile(path) as archive:
        for info, data in entries:
            if info.filename != 'data.json':
                assert archive.read(info.filename) == data

def treatment(f, family):
    mat, role = f['material'], f['role']
    if mat.startswith(('wood', 'wardrobe-')):
        return 'wood'
    if family == 'pots-retained' and f['asset'] in CLAY:
        return 'clay'
    if family == 'plants-retained' and role == 'review-pot':
        return 'clay'
    if role.startswith('review-') or mat in ('soil', 'glass', 'water', 'light'):
        return None
    if family == 'plants-retained' or mat in ('leaf', 'leaf-dark', 'stem'):
        base = tuple(int(f['baseColor'][k:k+2], 16) / 255 for k in (1, 3, 5))
        h, s, v = colorsys.rgb_to_hsv(*base)
        if .17 <= h <= .45 and s > .10:
            return 'green'
    return None

def colour(rgb, kind):
    h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
    if kind == 'wood':
        # Preserve old timber's variations and grey worn edges.
        weight = min(1., s / .20)
        h += (32 / 360 - h) * .12 * weight
        s = min(.64, s * 1.22 + .025 * weight)
        v = min(.94, v * 1.025)
    elif kind == 'clay':
        # Plain terracotta gains a red-earth hue, distinct from yellow timber.
        weight = min(1., s / .20)
        h += (18 / 360 - h) * .30 * weight
        s = min(.64, s * 1.18 + .04 * weight)
        v = min(.92, v * 1.10 + .015)
    elif kind == 'green':
        # White variegation, dry edges, blossoms and blue/purple foliage stay.
        if not (.15 <= h <= .47) or s < .075:
            return rgb
        weight = min(1., s / .25)
        h += (105 / 360 - h) * .18 * weight
        s = min(.59, s * 1.26 + .025 * weight)
        v = min(.92, v * 1.035)
    return tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h, s, v))

def paint(family, baseline, work):
    from PIL import Image  # Verification only; Pixelorama edits/exports pixels.
    folder, saved = ROOT / family, baseline / family
    out = work / family
    out.mkdir(parents=True, exist_ok=True)
    layout = json.loads((folder / 'texture-layout.json').read_text())
    size = layout['size']
    with zipfile.ZipFile(saved / (family + '-atlas.pxo')) as z:
        original = z.read('image_data/frames/1/layer_1')
    assert Image.open(saved / 'atlas.png').convert('RGBA').tobytes() == original
    strokes, allowed, changed = [], bytearray(size * size), collections.Counter()
    for f in layout['fields']:
        kind = treatment(f, family)
        if not kind:
            continue
        x, y, w, h = (int(f[k]) for k in ('x', 'y', 'w', 'h'))
        for row in range(-1, h + 1):
            runs = []
            for col in range(-1, w + 1):
                px, py = x + col, y + row
                idx = (py * size + px) * 4
                old = tuple(original[idx:idx+3])
                new = colour(old, kind) if original[idx+3] == 255 else old
                allowed[py * size + px] = 1
                if new != old:
                    changed[f['asset']] += 1
                runs.append((new, original[idx+3]))
            col = 0
            while col < len(runs):
                start, (rgb, alpha) = col, runs[col]
                col += 1
                while col < len(runs) and runs[col] == (rgb, alpha):
                    col += 1
                if alpha == 255:
                    strokes.append({'color': '#' + ''.join(f'{c:02x}' for c in rgb),
                                    'points': [[x+start-1, y+row], [x+col-2, y+row]]})
    (out / 'detail-pencil-strokes.json').write_text(json.dumps({'size':size, 'strokes':strokes}, separators=(',', ':')))
    tree = ast.parse((HERE / 'paint-detail.py').read_text())
    gd = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign)
              and any(isinstance(t, ast.Name) and t.id == 'GD' for t in n.targets))
    gd = gd.replace('objectDetailRevision', 'colourSeparationRevision')
    name = 'UmweltColourSeparation'
    config = Path.home() / 'Library/Application Support/Pixelorama/config.ini'
    config_bytes = config.read_bytes()
    extension = config.parent / 'extensions' / (name + '.zip')
    assert not extension.exists()
    scene = '[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://src/Extensions/' + name + '/Author.gd" id="1"]\n[node name="' + name + '" type="Node"]\nscript = ExtResource("1")\n'
    info = dict(name=name, display_name='Native material palette edit', description='Scoped existing PXO edit', author='五月七日', version='0.1', supported_api_versions=[8], license='MIT', nodes=['Author.tscn'])
    with zipfile.ZipFile(extension, 'w', zipfile.ZIP_DEFLATED) as z:
        for path, data in [('Author.gd',gd), ('Author.tscn',scene), ('extension.json',json.dumps(info))]:
            z.writestr('src/Extensions/' + name + '/' + path, data)
    config.write_bytes(config_bytes + ('\n[extensions]\n' + name + '=true\n').encode())
    try:
        for check in (False, True):
            source = out / 'detail-edited.pxo' if check else saved / (family + '-atlas.pxo')
            cmd = ['/Applications/Pixelorama.app/Contents/MacOS/Pixelorama', '--headless', '--', str(source), '--object-detail', '--detail-dir=' + str(out)]
            if check:
                cmd.append('--check-detail')
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=max(600, len(strokes)*.025))
            (out / ('reopen.log' if check else 'paint.log')).write_text(result.stdout + result.stderr)
            assert result.returncode == 0, result.stderr[-1500:]
    finally:
        config.write_bytes(config_bytes)
        extension.unlink(missing_ok=True)
    with zipfile.ZipFile(out / 'detail-edited.pxo') as z:
        edited = z.read('image_data/frames/1/layer_1')
    for name in ('detail-edited.png', 'detail-reopened.png'):
        assert Image.open(out / name).convert('RGBA').tobytes() == edited
    for i, permitted in enumerate(allowed):
        if not permitted:
            assert original[i*4:i*4+4] == edited[i*4:i*4+4], 'Protected atlas pixel changed'
        assert original[i*4+3] == edited[i*4+3], 'Alpha changed'
    shutil.copy2(out / 'detail-edited.pxo', folder / (family + '-atlas.pxo'))
    clean_pxo_metadata(folder / (family + '-atlas.pxo'))
    shutil.copy2(out / 'detail-edited.png', folder / 'atlas.png')
    shutil.copy2(folder / 'atlas.png', ROOF / 'assets/items' / (family + '-atlas.png'))
    report = dict(family=family, software='Pixelorama', nativePencil=True, reopened=True, nativeCelEqualsExport=True,
                  protectedPixelsUnchanged=sum(1 for p in allowed if not p), alphaPreserved=True,
                  changedChartPixelsByModel=dict(changed), pencilRuns=len(strokes), atlasSha256=hashlib.sha256((folder/'atlas.png').read_bytes()).hexdigest())
    (out / 'paint-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(f'PAINT VERIFIED {family}: {len(changed)} models, {sum(changed.values())} pixels', flush=True)

def sync(work):
    path = ROOF / 'item-data.mjs'
    text = path.read_text()
    prefix, raw = text.split('export const ITEM_DATA = ', 1)
    items = json.loads(raw.rstrip().removesuffix(';'))
    checks = []
    for item in items:
        if item['family'] not in FAMILIES:
            continue
        file = ROOF / item['file']
        data = file.read_bytes()
        jslen = struct.unpack_from('<I', data, 12)[0]
        doc, binary = json.loads(data[20:20+jslen]), data[28+jslen:]
        atlas = (ROOF / item['atlas']).read_bytes()
        assert len(doc['images']) == 1
        image_view = doc['images'][0]['bufferView']
        view = doc['bufferViews'][image_view]
        start, end = view.get('byteOffset', 0), view.get('byteOffset', 0) + view['byteLength']
        indices = [j for j in range(len(doc['bufferViews'])) if j != image_view]
        def payloads(d, b):
            return [b[d['bufferViews'][j].get('byteOffset',0):d['bufferViews'][j].get('byteOffset',0)+d['bufferViews'][j]['byteLength']] for j in indices]
        original = payloads(doc, binary)
        if binary[start:end] != atlas:
            oldend = (end+3)//4*4
            image = atlas + b'\0' * (-len(atlas)%4)
            delta = len(image) - (oldend-start)
            for j in indices:
                v = doc['bufferViews'][j]
                offset = v.get('byteOffset',0)
                assert offset >= oldend or offset + v['byteLength'] <= start
                if offset >= oldend:
                    v['byteOffset'] = offset + delta
            view['byteLength'] = len(atlas)
            binary = binary[:start] + image + binary[oldend:]
            doc['buffers'][0]['byteLength'] = len(binary)
            raw = json.dumps(doc, ensure_ascii=False, separators=(',',':')).encode()
            raw += b' ' * (-len(raw)%4)
            binary += b'\0' * (-len(binary)%4)
            data = struct.pack('<4sII', b'glTF', 2, 28+len(raw)+len(binary)) + struct.pack('<I4s',len(raw),b'JSON') + raw + struct.pack('<I4s',len(binary),b'BIN\0') + binary
            file.write_bytes(data)
        assert payloads(doc, binary) == original
        item['modelSha256'] = hashlib.sha256(data).hexdigest()
        checks.append(item['id'])
    path.write_text(prefix + 'export const ITEM_DATA = ' + json.dumps(items, ensure_ascii=False, separators=(',',':')) + ';\n')
    (work / 'runtime-check.json').write_text(json.dumps(dict(models=len(checks), geometryUvBuffersPreserved=True, embeddedCanonicalAtlases=True, ids=checks), indent=2))
    print('RUNTIME VERIFIED',len(checks),'models; only embedded atlas images and hashes changed')

def portraits(work):
    """Save PNG bytes from the actual browser renderer; no raster editing."""
    audit_path = ROOT.parent / 'rooftop-thumbnail-02/audit.json'
    audit = json.loads(audit_path.read_text())
    records = {r['id']: r for r in audit}
    items = json.loads((ROOF/'item-data.mjs').read_text().split('export const ITEM_DATA = ',1)[1].rstrip().removesuffix(';'))
    by_id = {i['id']:i for i in items}
    result = json.loads((work/'portraits.json').read_text())
    assert {r['id'] for r in result} == {i['id'] for i in items if i['family'] in FAMILIES}
    for r in result:
        item, record = by_id[r['id']], records[r['id']]
        assert r['opaquePixels'] > 0 and min(r['alphaBounds'][:2]) >= 2 and max(r['alphaBounds'][2:]) <= 141
        assert r['projection']['pot'] == record['defaultPot']
        assert r['alphaBounds'] == record['alphaBounds'] and r['opaquePixels'] == record['opaquePixels']
        # A pigment edit must keep the original projection and alpha coverage.
        for new, old in zip([r['projection']['metresPerPixel'], *r['projection']['anchor']],
                            [record['projection']['metresPerPixel'], *record['projection']['anchor']]):
            assert math.isclose(new, old, abs_tol=1e-12)
        (ROOF/item['thumbnail']).write_bytes(base64.b64decode(r['png'].split(',',1)[1]))
        for key, field in [('pngSha256','thumbnail'),('sourceModelSha256','file'),('atlasSha256','atlas')]:
            record[key] = hashlib.sha256((ROOF/item[field]).read_bytes()).hexdigest()
        if record['defaultPot']:
            pot = by_id[record['defaultPot']]
            for key, field in [('vesselModelSha256','file'),('vesselAtlasSha256','atlas')]:
                record[key] = hashlib.sha256((ROOF/pot[field]).read_bytes()).hexdigest()
    audit_path.write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
    print('PORTRAITS VERIFIED', len(result), 'actual model renders')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=('paint','sync','portraits'))
    parser.add_argument('--family', choices=FAMILIES)
    parser.add_argument('--baseline', type=Path)
    parser.add_argument('--work', type=Path, required=True)
    args = parser.parse_args()
    if args.mode == 'paint':
        assert args.family and args.baseline
        paint(args.family, args.baseline, args.work)
    elif args.mode == 'sync':
        sync(args.work)
    else:
        portraits(args.work)
