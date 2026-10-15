"""Independent Blender reopen and scoped mesh/physical UV verification."""
import bpy,json,sys,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent
sys.path.insert(0,str(ROOT))
from assetlib import verify_saved
scope=json.loads((HERE/('scope-round3.json' if '--all-objects' in sys.argv else 'scope.json')).read_text())
families=sorted({i['family'] for i in scope})
reports=[]
baseline=Path(sys.argv[sys.argv.index('--')+1])
def fingerprints():
    out={}
    for o in bpy.data.objects:
        if o.type!='MESH':continue
        record={'v':[list(v.co) for v in o.data.vertices],'p':[list(p.vertices) for p in o.data.polygons],
          'uv':[[list(v.uv) for v in layer.data] for layer in o.data.uv_layers],
          'matrix':[list(r) for r in o.matrix_world],'asset':o.get('asset_id'),'role':o.get('part_role')}
        out[o.name]=hashlib.sha256(json.dumps(record,sort_keys=True).encode()).hexdigest()
    return out
for family in families:
    bpy.ops.wm.open_mainfile(filepath=str(baseline/family/(family+'.blend')))
    before=fingerprints()
    verify_saved(family)
    after=fingerprints()
    for name,digest in before.items():assert after[name]==digest,name+' original mesh/UV changed'
    report=json.loads((ROOT/family/'source-reopened.json').read_text())
    for img in bpy.data.images:
        if img.type=='IMAGE':
            assert img.packed_file,'Source image must be packed'
            assert not img.filepath.startswith('/Users/'),'Private image path in Blend'
    reports.append({'family':family,'passed':report['passed'],'assets':len(report['assets']),
       'triangles':report['totalTriangles'],'maxAbsoluteTexelError':report['maxAbsoluteTexelError'],
       'packedImages':report['packedImages'],'originalMeshAndUvFingerprintsPreserved':len(before)})
(HERE/('round3-source-reopen-check.json' if '--all-objects' in sys.argv else 'source-reopen-check.json')).write_text(json.dumps(reports,ensure_ascii=False,indent=2))
print('ALL SELECTED SOURCE FAMILIES REOPENED AND VERIFIED')
