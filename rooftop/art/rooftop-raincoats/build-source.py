"""Author separate transparent rainwear in Blender; export only rainwear meshes.
Re-run only for a deliberate source rebuild. --export reopens the edited Blend.
"""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
BLEND=ROOT/'raincoats.blend'
OUT=ROOT.parents[1]/'fashion/raincoat-meshes.mjs'
U=5.6/3

def export():
    data=[]
    for o in bpy.data.objects:
        if o.type!='MESH' or 'rainJoint' not in o: continue
        data.append(dict(name=o.name,actor=o['rainActor'],joint=o['rainJoint'],kind=o['rainKind'],
            vertices=[[round(v.x*U,6),round(v.z*U,6),round(-v.y*U,6)] for v in (o.matrix_basis @ vertex.co for vertex in o.data.vertices)],
            faces=[list(p.vertices) for p in o.data.polygons]))
    assert len(data)>=12
    OUT.write_text('// Exported from rooftop/art/rooftop-raincoats/raincoats.blend.\nexport const RAINCOAT_MESHES = '+json.dumps(data,separators=(',',':'))+';\n')
    print('Exported',len(data),'rainwear parts;',sum(len(p['vertices']) for p in data),'vertices')

if '--export' in sys.argv or '--verify' in sys.argv:
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    if '--export' in sys.argv: export()
    else:
        parts=[o for o in bpy.data.objects if 'rainJoint' in o]
        assert len(parts)>=12 and all(o.data.polygons for o in parts)
        assert all(o.data.materials[0].diffuse_color[3]<.7 for o in parts)
        assert all(o.data.uv_layers for o in parts)
        assert all(im.packed_file for im in bpy.data.images if im.type=='IMAGE' and im.has_data)
        print('Reopened source: rainwear, UVs, transparency and packed reference textures verified')
    sys.exit(0)

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
# Preserve the original authored character as a fitting reference, without editing it.
with bpy.data.libraries.load(str(ROOT.parent/'rooftop-actors-02/fashion/fashion-actors.blend'),link=False) as (src,dst):
    dst.collections=['smoking']
reference=dst.collections[0];bpy.context.scene.collection.children.link(reference)
for im in bpy.data.images:
    if im.type=='IMAGE' and im.has_data:
        im.pack();im.filepath='//../../assets/pixel/material-book.png'
materials={}
for kind,opacity in [('film',.18),('seam',.55)]:
    mat=bpy.data.materials.new('clear-EVA-'+kind);mat.diffuse_color=(.79,.91,.94,opacity);mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.79,.91,.94,1);bs.inputs['Alpha'].default_value=opacity;bs.inputs['Roughness'].default_value=.2
    if hasattr(mat,'surface_render_method'):mat.surface_render_method='DITHERED'
    materials[kind]=mat
collection=bpy.data.collections.new('Transparent rainwear');bpy.context.scene.collection.children.link(collection)
parents={}
for actor,joint,pos in [('person','body',(0,0,0)),('person','head',(0,1.89,0)),('person','arm0',(-.315,1.48,0)),('person','arm1',(.315,1.48,0)),('pig','pig',(0,0,0)),('pig','pigFace',(0,0,0))]:
    o=bpy.data.objects.new(actor+'-'+joint,None);collection.objects.link(o)
    scale=1.16 if actor=='person' else 1
    o.location=(pos[0]/U*scale+(0 if actor=='person' else .8),-pos[2]/U*scale,pos[1]/U*scale);o.scale=(scale,)*3
    parents[actor,joint]=o

def mesh(name,actor,joint,verts,faces,kind='film'):
    m=bpy.data.meshes.new(name);m.from_pydata([(x/U,-z/U,y/U) for x,y,z in verts],[],faces);m.update()
    uv=m.uv_layers.new(name='Physical surface UV')
    for face in m.polygons:
        n=face.normal;ref=Vector((1,0,0)) if abs(n.z)>.98 else Vector((0,0,1));a=(ref-n*ref.dot(n)).normalized();b=n.cross(a)
        for i in face.loop_indices:
            p=m.vertices[m.loops[i].vertex_index].co;uv.data[i].uv=(p.dot(a),p.dot(b))
    o=bpy.data.objects.new(name,m);collection.objects.link(o);o.parent=parents[actor,joint];m.materials.append(materials[kind]);o['rainActor']=actor;o['rainJoint']=joint;o['rainKind']=kind
    return o

def seam(name,actor,joint,points,r=.009):
    verts=[];faces=[]
    for a,b in zip(points,points[1:]):
        a,b=Vector(a),Vector(b);d=(b-a).normalized();ref=Vector((0,1,0)) if abs(d.y)<.9 else Vector((1,0,0));u=d.cross(ref).normalized()*r;v=d.cross(u).normalized()*r;n=len(verts)
        for p in [a,b]:
            for j in range(4):verts.append(tuple(p+u*math.cos(j*math.pi/2)+v*math.sin(j*math.pi/2)))
        faces.extend([[n+i,n+(i+1)%4,n+4+(i+1)%4,n+4+i]for i in range(4)])
    mesh(name,actor,joint,verts,faces,'seam')

def ring(w,d,y):
    # Bevelled corners and separate folds, not a solid transparent box.
    return [(-w*.38,y,d/2),(w*.38,y,d/2),(w/2,y,d*.30),(w/2,y,-d*.30),(w*.38,y,-d/2),(-w*.38,y,-d/2),(-w/2,y,-d*.30),(-w/2,y,d*.30)]

def tube(name,actor,joint,rings):
    verts=sum(rings,[]);faces=[]
    for k in range(len(rings)-1):
        for j in range(8):faces.append([k*8+j,k*8+(j+1)%8,(k+1)*8+(j+1)%8,(k+1)*8+j])
    mesh(name,actor,joint,verts,faces)
    for i in [0,len(rings)-1]:seam(name+'-edge-'+str(i),actor,joint,rings[i]+rings[i][:1],.007)

# Open neck, open hem, long translucent front, visible centre fastening.
tube('Dongdong-coat','person','body',[ring(1.10,.75,.55),ring(.79,.59,1.10),ring(.66,.49,1.52),ring(.28,.30,1.64)])
seam('Dongdong-front-placket','person','body',[(0,.56,.378),(0,1.10,.299),(0,1.52,.249),(0,1.64,.153)],.012)
for i in range(2):
    # Sleeves use their existing shoulder joints and stay clear of the hands.
    tube('Dongdong-sleeve-'+str(i),'person','arm'+str(i),[ring(.38,.43,-.53),ring(.46,.47,-.25),ring(.39,.43,.06)])
# Faceted hood, clear sides and crown; the face opening is deliberately empty.
hood=[(-.29,-.27,.30),(.29,-.27,.30),(-.32,.24,.30),(.32,.24,.30),(-.22,.38,.16),(.22,.38,.16),(-.30,-.27,-.31),(.30,-.27,-.31),(-.30,.24,-.31),(.30,.24,-.31),(-.20,.37,-.24),(.20,.37,-.24)]
mesh('Dongdong-hood','person','head',hood,[[0,6,8,2],[1,3,9,7],[2,8,10,4],[3,5,11,9],[4,10,11,5],[6,7,9,11,10,8],[2,4,5,3]])
seam('Dongdong-hood-opening','person','head',[hood[i]for i in [0,2,4,5,3,1]],.011)
# Pig cape: open underneath and at the back for legs and curled tail.
verts=[(-.44,.28,.39),(-.44,.28,-.55),(-.40,.78,.39),(-.40,.78,-.55),(-.26,.88,.39),(-.26,.88,-.55),(.26,.88,.39),(.26,.88,-.55),(.40,.78,.39),(.40,.78,-.55),(.44,.28,.39),(.44,.28,-.55)]
mesh('Pig-cape','pig','pig',verts,[[i,i+1,i+3,i+2]for i in range(0,10,2)])
for side,idx in [('front',0),('back',1)]:seam('Pig-cape-'+side,'pig','pig',verts[idx::2],.009)
for side in [-1,1]:seam('Pig-cape-hem-'+str(side),'pig','pig',[(side*.44,.28,-.55),(side*.44,.28,.39)],.008)
# The hood covers ears while leaving eyes and nose visible through an open front.
h=[(-.35,.29,.65),(-.36,.82,.65),(-.26,.96,.48),(.26,.96,.48),(.36,.82,.65),(.35,.29,.65),(-.35,.29,.16),(-.36,.82,.16),(-.26,.96,.16),(.26,.96,.16),(.36,.82,.16),(.35,.29,.16)]
mesh('Pig-hood','pig','pigFace',h,[[i,i+6,i+7,i+1]for i in range(5)])
seam('Pig-hood-opening','pig','pigFace',h[:6],.01)
seam('Pig-chest-fastening','pig','pig', [(-.34,.30,.63),(0,.26,.68),(.34,.30,.63)],.015)
bpy.context.scene['source']='Separate transparent rainwear; original wardrobe collection retained as fitting reference'
bpy.context.scene.unit_settings.system='METRIC'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.shading.type='MATERIAL';area.spaces.active.region_3d.view_distance=3;area.spaces.active.region_3d.view_location=Vector((.4,0,.7))
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND),compress=True)
export()
