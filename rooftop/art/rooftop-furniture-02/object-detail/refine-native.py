"""Incremental Blender detailing. Never replay the original family builders.

Usage: Blender --background --python refine-native.py -- prepare|export FAMILY
The initial revision must be backed up separately before prepare. Existing mesh
and UV data are retained; added charts occupy unused atlas rows.
"""
import bpy, json, sys, math, hashlib
from pathlib import Path
from types import SimpleNamespace

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT))
from assetlib import Asset, Builder, SIZE, present_source

argv = sys.argv[sys.argv.index('--') + 1:]
mode, family = argv[:2]
allObjects = '--all-objects' in argv
folder = ROOT / family
scope = json.loads((HERE / ('scope-round3.json' if allObjects else 'scope.json')).read_text())
ids = {i['modelId'] for i in scope if i['family'] == family}
catalog = json.loads((folder / 'catalog.json').read_text())
records = {i['id']: i for i in catalog['items']}
layout = json.loads((folder / 'texture-layout.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(folder / (family + '.blend')))
bpy.context.preferences.filepaths.save_version = 0
for collection in bpy.data.collections:
    collection.hide_viewport=False
    collection.hide_render=False
bpy.ops.object.select_all(action='DESELECT')

def signature(obj):
    data = {'vertices': [list(v.co) for v in obj.data.vertices],
            'faces': [list(p.vertices) for p in obj.data.polygons],
            'uv': [[list(v.uv) for v in layer.data] for layer in obj.data.uv_layers],
            'matrix': [list(r) for r in obj.matrix_world], 'extras': dict(obj.items())}
    return hashlib.sha256(json.dumps(data, sort_keys=True, default=str).encode()).hexdigest()

original = {o.name: signature(o) for o in bpy.data.objects if o.type == 'MESH'}
builder = Builder.__new__(Builder)
builder.family = family
builder.fields = []
builder.materials = {m.get('finish'): m for m in bpy.data.materials if m.get('finish')}

def asset(id):
    a = Asset.__new__(Asset)
    a.b, a.id, a.col = builder, id, bpy.data.collections[id]
    a.objects, a.surfaces, a.meta = [], records[id]['surfaces'], records[id]
    return a

def gusset(a, name, x, y, z, side, span=.09):
    # Solid wooden knee below the existing apron, within the leg envelope.
    a.extrude('detail-' + name, [(x,z),(x+side*span,z),(x,z-span)], .022,
              'wood-dark', 'joint', center=(0,y,0))

def round2_parts(a, id):
    # Applied frame joinery is inside the existing top overhang. The centre
    # remains the original side panel, now physically recessed by 6 mm.
    if id in ('dresser-wood', 'wardrobe-wood'):
        dresser=id=='dresser-wood'
        x,y,lo,hi=(.347,.181,.15,.704) if dresser else (.441,.207,.17,1.61)
        for side in (-1,1):
            for end in (-1,1):
                a.box(f'detail2-side-stile-{side}-{end}',(.007,.038,hi-lo),
                      (side*x,end*y,(lo+hi)/2),'wardrobe-oak','panel-stile',.002)
            for level,z in enumerate((lo+.019,hi-.019)):
                a.box(f'detail2-side-rail-{side}-{level}',(.007,y*2-.038,.038),
                      (side*x,0,z),'wardrobe-oak','panel-rail',.002)
    elif id.startswith('crate-'):
        mat={'crate-blue':'plastic-blue','crate-gray':'plastic-grey','crate-red':'plastic-red'}[id]
        for side in (-1,1):
            # Under-rim return and rounded hand grip, never across the opening.
            a.box(f'detail2-rim-return-{side}',(.458,.010,.008),(0,side*.1495,.168),mat,'rim-return',.002)
            a.box(f'detail2-hand-grip-{side}',(.018,.102,.009),(side*.241,0,.129),mat,'grip-contact',.003)
    elif id=='galvanized-bucket':
        # Factory seam on the back: restrained folded metal, no painted stripe.
        a.beam('detail2-lock-seam',(0,.126,.042),(0,.151,.259),.008,.003,'iron-silver','folded-seam',.001)
        for side in (-1,1):
            a.cyl(f'detail2-handle-rivet-{side}',.007,.003,(side*.155,0,.241),'steel-dark','rivet',8,rotation=(0,math.pi/2,0))
    elif id=='tasklamp':
        for k,(x,z) in enumerate(((0,.04),(-.13,.30),(.05,.49))):
            a.cyl(f'detail2-pivot-washer-{k}',.015,.003,(x,.025,z),'iron-silver','washer',12,rotation=(math.pi/2,0,0))
    elif id=='radio-small':
        for k,x in enumerate((.062,.155)):
            a.box(f'detail2-knob-index-{k}',(.003,.002,.010),(x,-.105,.129),'steel-dark','dial-mark')
        for side in (-1,1):
            for z in (.060,.241):
                a.cyl(f'detail2-rear-screw-{side}-{z}',.005,.001,(side*.179,.090,z),'iron-silver','hardware',8,rotation=(math.pi/2,0,0))
    elif id in ('sofa-one','sofa-two'):
        for o in list(a.col.objects):
            if 'back-cushion-' not in o.name:continue
            lo=[min(v.co[k] for v in o.data.vertices) for k in range(3)]
            hi=[max(v.co[k] for v in o.data.vertices) for k in range(3)]
            a.beam('detail2-back-welt-'+o.name.split('/')[-1],(lo[0]+.025,lo[1]+.009,hi[2]-.016),
                   (hi[0]-.025,lo[1]+.009,hi[2]-.016),.006,.005,'sofa-leather','seam')

if mode in ('prepare', 'prepare-round2'):
    revisionKey='objectDetailRound2' if mode=='prepare-round2' else 'objectDetailRevision'
    assert not bpy.context.scene.get(revisionKey), 'Current detail already applied; do not overwrite hand edits.'
    for id in sorted(ids):
        a = asset(id)
        if mode=='prepare-round2':
            round2_parts(a,id)
            continue
        if id in ('wood-2', 'wood-3'):
            for level, surface in enumerate(a.surfaces):
                z = surface['height'] - .055
                for s in (-1,1):
                    gusset(a,f'knee-{level}-{s}',s*.381,-.176,z,-s)
        elif id == 'step-rack':
            for level, y in enumerate((-.3075,.005,.3175)):
                for s in (-1,1):
                    a.cyl(f'detail-peg-{level}-{s}',.009,.004,(s*.405,y,.135+level*.25),
                          'wood-light','joint',8,rotation=(0,math.pi/2,0))
        elif id == 'wood-square-table':
            for s in (-1,1):
                for t in (-1,1):gusset(a,f'knee-{s}-{t}',s*.342,t*.342,.593,-s,.085)
        elif id.startswith('crate-'):
            mat = {'crate-blue':'plastic-blue','crate-gray':'plastic-grey','crate-red':'plastic-red'}[id]
            w,d,h=records[id]['width'],records[id]['depth'],records[id]['height']
            # Integral moulded panel and corner webs stay in the wall thickness.
            for s in (-1,1):
                a.box(f'detail-moulded-panel-{s}',(w*.264,.006,h*.256),(0,s*(d/2-.004),h*.60),mat,'moulded-panel',.003)
                for t in (-1,1):
                    a.beam(f'detail-corner-web-{s}-{t}',(t*(w/2-.020),s*(d/2-.005),.027),(t*(w/2-.059),s*(d/2-.005),.070),.009,.005,mat,'wall-rib')
        elif id == 'galvanized-bucket':
            # Two shallow rolled ribs on the tapered outer wall, not the cavity.
            for k,(z,r) in enumerate(((.055,.127),(.224,.151))):
                a.lathe(f'detail-pressed-rib-{k}',[(r-.001,z-.006),(r+.002,z-.003),(r+.003,z+.002),
                          (r+.001,z+.006),(r-.001,z+.006),(r-.001,z-.006)],'iron-silver','pressed-rib',sides=20)
        elif id.startswith('aquarium-'):
            w,d,h = records[id]['width'],records[id]['depth'],records[id]['height']
            for s in (-1,1):
                for t in (-1,1):
                    a.box(f'detail-silicone-joint-{s}-{t}',(.004,.004,h-.012),
                          (s*(w/2-.004),t*(d/2-.004),h/2),'plastic-grey','glass-joint')
        elif id == 'wardrobe-wood':
            for s in (-1,1):
                # Joinery pegs and slim mitred rail around the existing inset.
                for z in (.20,1.525):
                    a.box(f'detail-panel-rail-{s}-{z}',(.325,.006,.022),(s*.199,-.293,z),'wood-light','panel-joint',.002)
                for z in (.32,1.34):
                    a.box(f'detail-hinge-leaf-{s}-{z}',(.041,.004,.053),(s*.351,-.277,z),'steel-dark','hardware')
        elif id == 'dresser-wood':
            for level in range(3):
                z=.225+level*.204
                for s in (-1,1):
                    a.box(f'detail-pull-escutcheon-{level}-{s}',(.026,.005,.041),(s*.061,-.245,z),'steel-dark','hardware',.003)
                # The drawer seam is actual raised joinery, no dark paint outline.
                a.box(f'detail-drawer-lower-rail-{level}',(.527,.006,.014),(0,-.244,z-.073),'wood-light','drawer-joint',.002)
        elif id in ('sofa-one','sofa-two'):
            for o in list(a.col.objects):
                if 'seat-cushion-' not in o.name:continue
                points=[v.co for v in o.data.vertices]
                lo=[min(p[k] for p in points) for k in range(3)]
                hi=[max(p[k] for p in points) for k in range(3)]
                # Welt sits on the front face, below the unchanged seat surface.
                a.beam('detail-welt-'+o.name.split('/')[-1],(lo[0]+.025,lo[1]-.002,lo[2]+.024),
                       (hi[0]-.025,lo[1]-.002,lo[2]+.024),.007,.005,'sofa-leather','seam')
        elif id == 'radio-small':
            for k in range(7):
                a.box(f'detail-dial-tick-{k}',(.003,.002,.008 if k%2 else .014),(.049+k*.020,-.095,.228),'steel-dark','dial-mark')
            for s in (-1,1):
                a.box(f'detail-handle-socket-{s}',(.028,.022,.011),(s*.099,0,.278),'steel-dark','joint')
        elif id == 'tasklamp':
            for k,(x,z) in enumerate(((0,.04),(-.13,.30),(.05,.49))):
                a.cyl(f'detail-pivot-nut-{k}',.012,.005,(x,-.027,z),'steel-dark','hardware',6,rotation=(math.pi/2,0,0))
        elif id == 'solar-lamp':
            for s in (-1,1):
                a.box(f'detail-panel-rail-{s}',(.003,.107,.003),(s*.052,0,.703),'iron-silver','panel-joint')
    # Only new chart allocations: the original face UVs remain byte-identical.
    rows=[];start=layout['usedRows']+2
    for f in sorted(builder.fields,key=lambda f:(-f['h'],-f['w'],f['id'])):
        pw,ph=f['w']+2,f['h']+2
        row=next((r for r in rows if r['h']>=ph and r['x']+pw<=SIZE),None)
        if row is None:
            row={'x':0,'y':start+sum(r['h'] for r in rows),'h':ph};rows.append(row)
        f['x'],f['y']=row['x']+1,row['y']+1;row['x']+=pw
        assert row['y']+ph<SIZE
        mesh=bpy.data.objects[f['object']].data
        for li,(u,v) in zip(f['loopIndices'],f['uvMetres']):
            mesh.uv_layers.active.data[li].uv=((f['x']+u*16)/SIZE,1-(f['y']+v*16)/SIZE)
        layout['fields'].append({k:v for k,v in f.items() if k not in ('loopIndices','object','polygon','uvMetres')})
    if rows:layout['usedRows']=start+sum(r['h'] for r in rows)
    for name,digest in original.items():assert signature(bpy.data.objects[name])==digest, name+' original changed'
    for id in ids:
        objs=[o for o in bpy.data.collections[id].objects if o.type=='MESH']
        old=records[id]
        pts=[v.co for o in objs for v in o.data.vertices]
        for k in range(3):
            assert min(p[k] for p in pts)>=old['boundsMin'][k]-.001, (id,'min',k,[(o.name,min(v.co[k] for v in o.data.vertices)) for o in objs if min(v.co[k] for v in o.data.vertices)<old['boundsMin'][k]-.001])
            assert max(p[k] for p in pts)<=old['boundsMax'][k]+.001, (id,'max',k,[(o.name,max(v.co[k] for v in o.data.vertices)) for o in objs if max(v.co[k] for v in o.data.vertices)>old['boundsMax'][k]+.001])
        old['triangles']=sum(len(p.vertices)-2 for o in objs for p in o.data.polygons)
    (folder/'texture-layout.json').write_text(json.dumps(layout,ensure_ascii=False,separators=(',',':')))
    (folder/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2))
    bpy.context.scene[revisionKey]='2026-10-15-local'
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(family+'.blend')))
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(family+'-layout.blend')))
    reportName=family+('-round2' if mode=='prepare-round2' else '')+'-geometry-check.json'
    (HERE/reportName).write_text(json.dumps({'originalMeshesUnchanged':len(original),
       'addedMeshes':[o.name for o in bpy.data.objects if o.type=='MESH' and o.name not in original],
       'newCharts':len(builder.fields),'boundsAndSupportSurfacesPreserved':True},indent=2))
    print('DETAIL PREPARED',family,len(builder.fields),'new charts')
elif mode == 'export':
    image=bpy.data.images.load(str(folder/'atlas.png'),check_existing=False)
    image.pack();image.filepath='//atlas.png';image['sourceSoftware']='Pixelorama'
    for material in bpy.data.materials:
        if not material.use_nodes or material.get('finish') in ('glass','water'):continue
        nodes=material.node_tree.nodes
        textures=[n for n in nodes if n.type=='TEX_IMAGE']
        for tex in textures:tex.image=image
        if not textures:
            tex=nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Closest';tex.extension='EXTEND'
            material.node_tree.links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
    for oldimage in list(bpy.data.images):
        if oldimage!=image and oldimage.type=='IMAGE' and oldimage.users==0:bpy.data.images.remove(oldimage)
    for col in bpy.data.collections:col.hide_viewport=False;col.hide_render=False
    for id in sorted(ids):
        bpy.ops.object.select_all(action='DESELECT')
        objs=[o for o in bpy.data.collections[id].objects if o.type=='MESH']
        for o in objs:o.hide_set(False);o.select_set(True)
        bpy.context.view_layer.objects.active=objs[0]
        bpy.ops.export_scene.gltf(filepath=str(ROOT.parents[1]/'assets/items'/(id+'.glb')),
            export_format='GLB',use_selection=True,export_yup=True,export_texcoords=True,
            export_normals=True,export_materials='EXPORT',export_extras=True)
    present_source(next(iter(sorted(ids))),records[next(iter(sorted(ids)))])
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(family+'.blend')))
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(family+'-layout.blend')))
    print('DETAIL EXPORTED',family,len(ids))
else:raise ValueError(mode)
