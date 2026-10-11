"""Native Blender asset authoring for the furniture rebuild.

Coordinates: metres, Blender Z up, origin on ground. Every planar source face
has an independent orthonormal physical 16 px/m chart. Pixelorama authors PNG.
Run family scripts via Blender --background --python SCRIPT -- layout|final|verify.
"""
import bpy, bmesh, math, json, sys, hashlib
from pathlib import Path
from mathutils import Vector,Matrix

ROOT=Path(__file__).resolve().parent
DENSITY=16.0
SIZE=2048
MODE=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'layout'
PALETTE={
 'wood':'#968064','wood-dark':'#715c48','wood-light':'#a28d70',
 'iron-black':'#3c4140','iron-silver':'#a5aeab','steel':'#a1aaa6',
 'steel-dark':'#63716d','steel-light':'#c3c9be','brass':'#a79a6b',
 'rubber':'#3c4540','plastic-white':'#dcded2','plastic-blue':'#5c7f94',
 'plastic-grey':'#959d96','plastic-red':'#a36857','plastic-green':'#758571',
 'foam':'#e2e1d5','soil':'#655548','leaf':'#83925f','leaf-dark':'#5f7758',
 'stem':'#7b8965','cloth':'#a5aaa0','cloth-dark':'#6f7970','cloth-blue':'#8498a0',
 'leather':'#544d45','enamel':'#e0e0d4','enamel-blue':'#4e879c',
 'glass':'#c8dad1','water':'#85aaa1','light':'#e6d6a1',
 'porcelain':'#deded0','ceramic':'#b9a48a','blue-ink':'#486985',
}

def reset():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for c in list(bpy.data.collections):
  if c.name!='Collection':bpy.data.collections.remove(c)
 for m in list(bpy.data.materials):bpy.data.materials.remove(m)

class Asset:
 def __init__(self,builder,id,name,category,placement='both',**meta):
  self.b=builder;self.id=id;self.objects=[];self.surfaces=[]
  self.meta=dict(id=id,name=name,category=category,placement=placement,source='Blender + Pixelorama',**meta)
  self.col=bpy.data.collections.new(id);bpy.context.scene.collection.children.link(self.col)
 def mesh(self,name,vertices,faces,mat='wood',role='body',bevel=0):
  mesh=bpy.data.meshes.new(self.id+'/'+name);mesh.from_pydata(vertices,[],faces);mesh.update()
  obj=bpy.data.objects.new(self.id+'/'+name,mesh);self.col.objects.link(obj)
  return self._finish(obj,mat,role,bevel)
 def _finish(self,obj,mat,role,bevel):
  for c in list(obj.users_collection):
   if c!=self.col:c.objects.unlink(obj)
  if obj.name not in self.col.objects:self.col.objects.link(obj)
  bpy.context.view_layer.objects.active=obj;obj.select_set(True)
  if obj.matrix_basis!=Matrix.Identity(4):bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
  if bevel:
   mod=obj.modifiers.new('Single-step structural edge','BEVEL');mod.width=bevel;mod.segments=1
   bpy.ops.object.modifier_apply(modifier=mod.name)
  obj.select_set(False)
  bm=bmesh.new();bm.from_mesh(obj.data);bm.normal_update()
  bent=[f for f in bm.faces if len(f.verts)>3 and max(abs((v.co-f.verts[0].co).dot(f.normal)) for v in f.verts)>1e-6]
  if bent:bmesh.ops.triangulate(bm,faces=bent)
  bm.to_mesh(obj.data);bm.free()
  obj.data.materials.append(self.b.material(mat))
  for p in obj.data.polygons:p.use_smooth=False
  obj.data.update();obj['asset_id']=self.id;obj['part_role']=role;obj['finish']=mat
  self.objects.append(obj);self.b.record(self,obj,mat,role)
  return obj
 def box(self,name,dim,center,mat='wood',role='body',bevel=0,rotation=None):
  bpy.ops.mesh.primitive_cube_add(size=1,location=center);obj=bpy.context.object
  obj.name=self.id+'/'+name;obj.dimensions=dim
  if rotation is not None:obj.rotation_euler=rotation
  return self._finish(obj,mat,role,bevel)
 def cyl(self,name,radius,depth,center,mat='steel',role='body',vertices=12,radius_top=None,rotation=None):
  bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=radius,radius2=radius if radius_top is None else radius_top,depth=depth,location=center)
  obj=bpy.context.object;obj.name=self.id+'/'+name
  if rotation is not None:obj.rotation_euler=rotation
  return self._finish(obj,mat,role,0)
 def beam(self,name,start,end,width,depth=None,mat='wood',role='brace',bevel=0):
  a,b=Vector(start),Vector(end);vec=b-a
  return self.box(name,(width,depth or width,vec.length),(a+b)/2,mat,role,bevel,vec.to_track_quat('Z','Y').to_euler())
 def tube(self,name,path,radius,mat='steel',role='tube',sides=8,closed=False):
  pts=[Vector(p) for p in path];verts=[]
  for i,p in enumerate(pts):
   tangent=(pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)]).normalized()
   if tangent.length<.1:tangent=Vector((0,0,1))
   helper=Vector((0,0,1)) if abs(tangent.z)<.9 else Vector((0,1,0))
   u=tangent.cross(helper).normalized();v=tangent.cross(u).normalized()
   verts.extend([tuple(p+radius*(u*math.cos(j*math.tau/sides)+v*math.sin(j*math.tau/sides))) for j in range(sides)])
  faces=[]
  for i in range(len(pts)-1):
   for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
  if not closed:faces.extend([tuple(reversed(range(sides))),tuple(range((len(pts)-1)*sides,len(pts)*sides))])
  else:
   for j in range(sides):faces.append(((len(pts)-1)*sides+j,(len(pts)-1)*sides+(j+1)%sides,(j+1)%sides,j))
  return self.mesh(name,verts,faces,mat,role)
 def lathe(self,name,profile,mat='ceramic',role='body',sides=20,center=(0,0,0),radius_scale=None,segment_materials=None):
  # Closed profile traverses outer wall, rim, inner wall, floor and underside.
  # Repeating the first profile point closes the solid shell without fake disks.
  pts=[]
  for k,(r,z) in enumerate(profile):
   for j in range(sides):
    a=j*math.tau/sides;scale=radius_scale(a,k) if radius_scale else 1
    pts.append((center[0]+r*scale*math.cos(a),center[1]+r*scale*math.sin(a),center[2]+z))
  faces=[]
  for k in range(len(profile)-1):
   for j in range(sides):faces.append((k*sides+j,k*sides+(j+1)%sides,(k+1)*sides+(j+1)%sides,(k+1)*sides+j))
  # Closed axis endpoints are degenerate collapsed circles; triangles produce a real floor.
  if segment_materials:
   objects=[]
   for k in range(len(profile)-1):
    objects.append(self.mesh(name+f'-band-{k}',pts,faces[k*sides:(k+1)*sides],segment_materials[k],role+f':band-{k}'))
   return objects
  return self.mesh(name,pts,faces,mat,role)
 def extrude(self,name,outline,depth,mat='steel',role='body',axis='Y',center=(0,0,0)):
  # Outline in X/Z, with real front/back and closed thickness.
  n=len(outline);verts=[(center[0]+x,center[1]+y,center[2]+z) for y in (-depth/2,depth/2) for x,z in outline]
  faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
  return self.mesh(name,verts,faces,mat,role)
 def surface(self,id,name,height,width,depth,center=(0,0),shape='rectangle',**options):
  self.surfaces.append(dict(id=id,name=name,height=height,width=width,depth=depth,center=list(center),shape=shape,**options))

class Builder:
 def __init__(self,family):
  reset();self.family=family;self.assets=[];self.fields=[];self.materials={}
  self.path=ROOT/family;self.path.mkdir(exist_ok=True)
  self.atlas=ROOT/'preview'/'assets'/(family+'-atlas.png')
 def asset(self,id,name,category,placement='both',**meta):
  assert id not in [a.id for a in self.assets],id
  a=Asset(self,id,name,category,placement,**meta);self.assets.append(a);return a
 def material(self,name):
  if name in self.materials:return self.materials[name]
  mat=bpy.data.materials.new(self.family+':'+name);mat.use_nodes=True
  color=PALETTE.get(name, name if name.startswith('#') else '#a1a79c')
  rgba=tuple(int(color[i:i+2],16)/255 for i in (1,3,5))+(1,)
  bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=rgba
  bs.inputs['Roughness'].default_value=.85;bs.inputs['Metallic'].default_value=0
  if name in ('glass','water'):
   bs.inputs['Alpha'].default_value=.18 if name=='glass' else .32
   bs.inputs['Roughness'].default_value=.25
   if hasattr(mat,'surface_render_method'):mat.surface_render_method='DITHERED'
   mat.diffuse_color=rgba[:3]+(.18 if name=='glass' else .32,)
  mat['finish']=name;mat['texels_per_metre']=DENSITY;mat['base_hex']=color
  self.materials[name]=mat;return mat
 def record(self,asset,obj,mat,role):
  mesh=obj.data
  for l in list(mesh.uv_layers):mesh.uv_layers.remove(l)
  uv=mesh.uv_layers.new(name='Physical 16 px per metre')
  for face in mesh.polygons:
   points=[mesh.vertices[i].co.copy() for i in face.vertices]
   edges=[(points[(i+1)%len(points)]-p).length for i,p in enumerate(points)]
   if max(edges)<1e-7 or face.area<1e-10:continue
   longest=max(range(len(points)),key=lambda i:edges[i]);u=(points[(longest+1)%len(points)]-points[longest]).normalized()
   major=max(range(3),key=lambda k:abs(u[k]));u=u if u[major]>=0 else -u
   normal=face.normal.normalized();v=normal.cross(u).normalized();p0=points[0]
   coords=[((p-p0).dot(u),(p-p0).dot(v)) for p in points]
   umin=min(x for x,y in coords);vmin=min(y for x,y in coords)
   us=max(x for x,y in coords)-umin;vs=max(y for x,y in coords)-vmin
   origin=p0+u*umin+v*vmin
   f=dict(id=obj.name+':'+str(face.index),asset=asset.id,component=obj.name.split('/',1)[-1],material=mat,
    baseColor=self.materials[mat]['base_hex'],role=role,faceNormal=list(normal),center=list(face.center),
    uAxis=list(u),vAxis=list(v),paintOrigin=list(origin),uMetres=us,vMetres=vs,
    w=max(1,math.ceil(us*DENSITY-1e-6)),h=max(1,math.ceil(vs*DENSITY-1e-6)),
    uvMetres=[(x-umin,y-vmin) for x,y in coords],object=obj.name,polygon=face.index,loopIndices=list(face.loop_indices))
   self.fields.append(f)
 def pack(self):
  shelves=[]
  for f in sorted(self.fields,key=lambda f:(-(f['h']+2),-(f['w']+2),f['id'])):
   pw,ph=f['w']+2,f['h']+2;row=next((s for s in shelves if s['h']>=ph and s['x']+pw<=SIZE),None)
   if row is None:
    row=dict(x=0,y=sum(s['h'] for s in shelves),h=ph);shelves.append(row)
   assert row['y']+ph<=SIZE,'Atlas overflow'
   f['x']=row['x']+1;f['y']=row['y']+1;row['x']+=pw
   mesh=bpy.data.objects[f['object']].data
   for li,(u,v) in zip(f['loopIndices'],f['uvMetres']):mesh.uv_layers.active.data[li].uv=((f['x']+u*DENSITY)/SIZE,1-(f['y']+v*DENSITY)/SIZE)
  self.usedRows=sum(s['h'] for s in shelves)
 def measure(self,asset):
  coords=[v.co for o in asset.objects for v in o.data.vertices]
  mins=[min(v[k] for v in coords) for k in range(3)];maxs=[max(v[k] for v in coords) for k in range(3)]
  return mins,maxs,[maxs[k]-mins[k] for k in range(3)]
 def plans(self):
  for a in self.assets:
   mi,ma,dim=self.measure(a)
   a.meta.update(width=dim[0],depth=dim[1],height=dim[2],boundsMin=mi,boundsMax=ma,
    file='assets/'+a.id+'.glb',family=self.family,surfaces=a.surfaces,footprint=a.meta.get('footprint') or dict(width=dim[0],depth=dim[1]),
    triangles=sum(len(p.vertices)-2 for o in a.objects for p in o.data.polygons),sourceBlend=self.family+'/'+self.family+'.blend',
    sourcePixelorama=self.family+'/'+self.family+'-atlas.pxo')
  (self.path/'catalog.json').write_text(json.dumps(dict(texelsPerMetre=DENSITY,items=[a.meta for a in self.assets]),ensure_ascii=False,indent=2))
  public=[{k:v for k,v in f.items() if k not in ('loopIndices','object','polygon','uvMetres')} for f in self.fields]
  (self.path/'texture-layout.json').write_text(json.dumps(dict(size=SIZE,texelsPerMetre=DENSITY,padding=1,usedRows=self.usedRows,fields=public),ensure_ascii=False,separators=(',',':')))
 def apply_atlas(self):
  assert self.atlas.is_file(),'Awaiting native Pixelorama export: '+str(self.atlas)
  img=bpy.data.images.load(str(self.atlas),check_existing=True);img.pack();img['sourceSoftware']='Pixelorama'
  for name,mat in self.materials.items():
   if name in ('glass','water'):continue
   node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=img;node.interpolation='Closest';node.extension='EXTEND'
   mat.node_tree.links.new(node.outputs['Color'],mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 def export(self):
  for a in self.assets:
   bpy.ops.object.select_all(action='DESELECT')
   for o in a.objects:o.hide_set(False);o.select_set(True)
   obj=a.objects[0];bpy.context.view_layer.objects.active=obj
   obj['placement']=a.meta['placement'];obj['surfaces']=json.dumps(a.surfaces,ensure_ascii=False)
   bpy.ops.export_scene.gltf(filepath=str(ROOT/'preview'/a.meta['file']),export_format='GLB',use_selection=True,
    export_yup=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_extras=True)
 def finish(self,mode=None):
  mode=mode or MODE;self.pack();self.plans()
  if mode=='final':self.apply_atlas();self.export()
  present_source(self.assets[0].id,self.assets[0].meta)
  path=self.path/(self.family+('.blend' if mode=='final' else '-layout.blend'))
  bpy.context.scene['family']=self.family;bpy.context.scene['texelsPerMetre']=DENSITY;bpy.context.scene['sourceSoftware']='Blender + Pixelorama'
  bpy.ops.wm.save_as_mainfile(filepath=str(path))
  self.validate(path.name)
  print('FAMILY READY',self.family,mode,len(self.assets),'assets',len(self.fields),'UV charts',self.usedRows,'atlas rows')
 def validate(self,file):
  report=dict(family=self.family,source=file,texelsPerMetre=DENSITY,assets=[],errors=[])
  for a in self.assets:
   mi,ma,dim=self.measure(a)
   tris=sum(len(p.vertices)-2 for o in a.objects for p in o.data.polygons)
   for s in a.surfaces:
    if not mi[2]-.01<=s['height']<=ma[2]+.01:report['errors'].append(a.id+':surface height '+s['id'])
   report['assets'].append(dict(id=a.id,objects=len(a.objects),triangles=tris,dimensions=dim,boundsMin=mi,boundsMax=ma,surfaces=len(a.surfaces)))
  report['passed']=not report['errors'];report['totalTriangles']=sum(a['triangles'] for a in report['assets'])
  (self.path/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
  assert report['passed'],report['errors']

def present_source(first,meta):
 for col in bpy.data.collections:
  if col.name=='Collection':continue
  col.hide_viewport=col.name!=first;col.hide_render=col.name!=first
 from mathutils import Euler
 for screen in bpy.data.screens:
  for area in screen.areas:
   if area.type=='VIEW_3D':
    view=area.spaces.active.region_3d
    view.view_perspective='ORTHO';view.view_rotation=Euler((math.radians(65),0,math.radians(35))).to_quaternion()
    view.view_location=(0,0,meta['height']*.5)
    view.view_distance=max(meta['width'],meta['depth'],meta['height'],.25)*2.5

def verify_saved(family):
 path=ROOT/family/(family+'.blend');bpy.ops.wm.open_mainfile(filepath=str(path))
 report=dict(source='Independent native Blender reopening',family=family,assets=[],errors=[],texelsPerMetre=DENSITY)
 for col in bpy.data.collections:
  objects=[o for o in col.objects if o.type=='MESH' and o.get('asset_id')]
  if not objects:continue
  pts=[o.matrix_world@v.co for o in objects for v in o.data.vertices]
  mins=[min(v[k] for v in pts) for k in range(3)];maxs=[max(v[k] for v in pts) for k in range(3)]
  maxerr=0;maxabs=0;invalidedges=0;edges=0
  for o in objects:
   if o.modifiers:report['errors'].append(o.name+':unapplied modifiers')
   mesh=o.data;uv=mesh.uv_layers.active
   if uv is None:report['errors'].append(o.name+':missing UV');continue
   for p in mesh.polygons:
    if p.area<1e-10:continue
    if p.use_smooth:report['errors'].append(o.name+':smooth shading')
    ids=list(p.loop_indices)
    for i,li in enumerate(ids):
     lj=ids[(i+1)%len(ids)];a=mesh.vertices[mesh.loops[li].vertex_index].co;c=mesh.vertices[mesh.loops[lj].vertex_index].co
     metres=(c-a).length
     if metres<1e-7:continue
     px=(uv.data[lj].uv-uv.data[li].uv).length*SIZE
     err=abs(px/metres-DENSITY);abserr=abs(px-metres*DENSITY)
     maxerr=max(maxerr,err);maxabs=max(maxabs,abserr);edges+=1
     if err>.03 and abserr>.0003:invalidedges+=1
  if invalidedges:report['errors'].append(col.name+':physical UV mismatch '+str(maxerr)+' density / '+str(maxabs)+' texels')
  report['assets'].append(dict(id=objects[0]['asset_id'],triangles=sum(len(p.vertices)-2 for o in objects for p in o.data.polygons),
   boundsMin=mins,boundsMax=maxs,maxDensityError=maxerr,maxAbsoluteTexelError=maxabs,invalidUVEdges=invalidedges,edgesChecked=edges))
 report['maxDensityError']=max((a['maxDensityError'] for a in report['assets']),default=0)
 report['maxAbsoluteTexelError']=max((a['maxAbsoluteTexelError'] for a in report['assets']),default=0)
 report['packedImages']=[dict(name=i.name,size=list(i.size),packed=bool(i.packed_file),sha256=hashlib.sha256(bytes(i.packed_file.data)).hexdigest() if i.packed_file else None) for i in bpy.data.images if i.type=='IMAGE']
 report['passed']=not report['errors'];report['totalTriangles']=sum(a['triangles'] for a in report['assets'])
 (ROOT/family/'source-reopened.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 assert report['passed'],report['errors'];print('NATIVE SOURCE VERIFIED',family,len(report['assets']),report['totalTriangles'])
