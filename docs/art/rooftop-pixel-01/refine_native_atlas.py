"""Revision 4 edit of the EXISTING Pixelorama project, not a flat-image generator.

Preserve its frame, layer identities, base colours and structural strokes. Enlarge
existing cels by nearest-neighbour duplication, then replace only the targeted
weathering cels with explicit small pixel clusters. Actual Pixelorama exports all
PNG files afterwards. The input hash prevents accidentally overwriting later edits.
"""
from pathlib import Path
import hashlib, json, zipfile

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'garden-atlas.pxo'
EXPECTED = 'ab7104a14c67e48265a59afea19776450c6456e7389cf6a7fce9b606a22edd4b'
if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != EXPECTED:
    raise SystemExit('This one-time edit requires the saved revision-3 native PXO.')
with zipfile.ZipFile(SOURCE) as archive:
    members = {name: archive.read(name) for name in archive.namelist()}
data = json.loads(members['data.json'])
assert (data['size_x'], data['size_y'], len(data['layers'])) == (128, 128, 3)
old_layers = [members[f'image_data/frames/1/layer_{i}'] for i in (1, 2, 3)]

def double_cel(cel):
    result = bytearray(256 * 256 * 4)
    for y in range(128):
        row = b''.join(cel[(y*128+x)*4:(y*128+x+1)*4]*2 for x in range(128))
        result[(y*2)*1024:(y*2+1)*1024] = row
        result[(y*2+1)*1024:(y*2+2)*1024] = row
    return result

layers = [double_cel(cel) for cel in old_layers]
wear = layers[2]
changed_tiles = [0, 1, 3, 4, 5, 7, 11, 14, 15]
for tile in changed_tiles:
    ox, oy = tile % 4 * 64, tile // 4 * 64
    for y in range(oy, oy + 64):
        wear[(y*256+ox)*4:(y*256+ox+64)*4] = bytes(64*4)

def rects(tile, colour, strokes):
    """Inclusive, authored pixel rectangles in a native 64px material cell."""
    rgba = bytes.fromhex(colour.lstrip('#')) + b'\xff'
    ox, oy = tile % 4 * 64, tile // 4 * 64
    for x, y, w, h in strokes:
        assert 1 <= x <= x+w-1 <= 62 and 1 <= y <= y+h-1 <= 62
        for yy in range(y, y+h):
            wear[((oy+yy)*256+ox+x)*4:((oy+yy)*256+ox+x+w)*4] = rgba*w

# Plaster: top seam dust, a few short drips, irregular light/dark clusters and
# stepped lower dirt. Leave the majority of the base coat readable. The two wall
# cells share colours, with different placement of chips and water marks.
for tile in (4, 15):
    variant = tile == 15
    rects(tile, '#b6b99e', [(2,2,59,2), (2,55,59,5), (4,52,5,3),
        (12,53,7,2), (23,51,4,4), (35,54,6,2), (49,52,5,3),
        (7,15,5,3), (10,18,4,2), (24,33,4,4), (27,35,3,2),
        (40,20,5,3), (43,23,3,2), (51,40,4,3)])
    rects(tile, '#adb298', [(2,2,11,1), (19,2,13,1), (40,2,21,1),
        (7,3,2,3), (8,6,1,3), (23,3,2,4), (24,7,1,3), (51,3,2,4),
        (2,57,8,3), (9,55,4,3), (16,58,7,2), (26,56,5,4),
        (38,57,5,3), (45,55,3,3), (53,58,8,2)])
    rects(tile, '#9fa58e', [(2,59,6,1), (10,57,2,2), (18,59,4,1),
        (29,58,2,2), (40,59,3,1), (46,57,2,2), (56,59,5,1)])
    if not variant:
        rects(tile, '#d7d8be', [(5,11,4,2), (8,13,3,2), (15,19,5,3),
            (14,22,3,1), (22,11,3,2), (24,13,4,2), (4,28,5,3),
            (8,30,3,2), (16,34,4,3), (19,33,3,2), (24,43,5,2),
            (26,45,3,2), (5,47,3,1), (34,15,5,3), (37,18,3,2),
            (43,30,4,3), (42,33,2,2), (53,11,3,2), (52,13,5,3),
            (35,44,5,2), (38,46,3,1), (53,49,4,2)])
        rects(tile, '#adb298', [(3,21,2,3), (5,24,2,1), (11,39,3,2),
            (13,41,2,1), (21,25,2,2), (22,27,1,3), (28,19,2,1),
            (33,35,3,2), (35,37,2,1), (48,25,2,4), (49,29,1,2)])
    else:
        rects(tile, '#d7d8be', [(4,14,5,2), (8,16,3,2), (15,25,4,3),
            (14,28,2,2), (4,36,4,2), (7,38,3,2), (14,44,5,2),
            (17,46,2,2), (25,17,4,3), (28,20,2,1), (30,34,5,2),
            (34,36,2,2), (43,12,4,3), (46,15,2,2), (49,28,5,3),
            (52,31,2,2), (38,45,4,3), (36,47,3,1), (54,48,4,2)])
        rects(tile, '#adb298', [(3,9,2,2), (12,19,2,3), (13,22,1,3),
            (6,30,3,2), (8,32,2,1), (19,36,2,2), (20,38,1,3),
            (24,48,3,2), (35,26,3,2), (37,28,2,1), (54,18,2,3)])

# Wood: finer edge chips and small patches, retaining the original separate
# panel outlines and grain. Pale undercoat appears only at selected chipped edges.
for tile in (5, 14):
    rects(tile, '#5b7367', [(6,47,3,4), (9,50,4,2), (14,53,4,2),
        (48,33,2,4), (50,37,3,3), (52,41,2,3), (43,52,4,2)])
    if tile == 5:
        rects(tile, '#91a291', [(23,11,4,2), (26,13,3,2), (28,16,2,2),
            (13,33,3,1), (38,23,3,2), (40,25,2,1), (21,45,4,1)])
        rects(tile, '#b6b99e', [(7,49,2,1), (12,52,3,1), (49,35,1,2),
            (53,43,2,1), (36,55,2,1)])
    else:
        rects(tile, '#91a291', [(33,14,4,2), (36,16,3,2), (12,24,3,2),
            (14,26,2,2), (27,40,3,1), (44,47,4,1)])
        rects(tile, '#b6b99e', [(9,50,2,1), (15,54,2,1), (51,38,1,2),
            (44,53,2,1), (29,56,3,1)])

rects(0, '#9c624a', [(5,45,5,3), (8,48,4,2), (20,51,4,2),
    (29,29,3,2), (32,31,2,1), (48,47,4,2), (51,49,3,1)])
rects(0, '#cf9770', [(40,14,4,2), (43,16,3,2), (10,32,3,1),
    (34,42,4,1), (22,23,3,2)])
rects(1, '#dfac81', [(3,11,6,2), (8,13,4,1), (26,10,5,1),
    (40,14,4,1), (51,11,4,2)])
rects(1, '#b57a58', [(15,25,3,2), (17,27,3,1), (47,15,2,3),
    (31,53,3,2), (52,36,3,1)])
rects(3, '#897258', [(9,51,2,3), (11,54,3,1), (51,13,3,1)])
rects(7, '#beb197', [(4,51,4,2), (7,53,3,2), (11,56,4,2),
    (49,46,3,2), (52,48,2,1), (27,35,3,2)])
rects(7, '#9fa58e', [(5,54,2,1), (13,58,3,1), (51,49,2,1)])
rects(11, '#865b4a', [(24,28,4,2), (27,30,3,2), (29,33,2,1),
    (43,11,3,2), (46,13,2,1)])
rects(11, '#ba8c6c', [(10,51,4,1), (13,53,3,1), (54,12,3,1),
    (29,39,4,1), (46,55,3,1)])

data['size_x'] = data['size_y'] = 256
data['metadata']['revision_4'] = {
    'edited_from_pxo_sha256': EXPECTED, 'operation': 'edit original native cels',
    'base_and_structure': 'exact nearest-neighbour 2x duplication',
    'weathering_tiles_edited': changed_tiles,
    'reference': 'AC GIF: smaller wear clusters, edge wear, seam dust',
}
members['data.json'] = json.dumps(data, ensure_ascii=False).encode()
for i, cel in enumerate(layers, 1):
    members[f'image_data/frames/1/layer_{i}'] = bytes(cel)
# Keep all other native project entries. export_atlas.py refreshes the thumbnail
# from actual Pixelorama's output, never from a synthetic flat-image writer.
temporary = SOURCE.with_suffix('.pxo.tmp')
with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name, content in members.items(): archive.writestr(name, content)
temporary.replace(SOURCE)
print('Edited original Pixelorama project:', SOURCE)
