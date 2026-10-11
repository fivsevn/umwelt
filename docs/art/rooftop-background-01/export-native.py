"""Export evaluated native meshes and compact repeated collection transforms."""
from mathutils import Matrix
segments={};instances={};assembly_boxes={};assembly_worlds={};seen_boxes=set()
triangles=0;object_count=0;cube=None
change=Matrix(((1,0,0,0),(0,0,1,0),(0,-1,0,0),(0,0,0,1)))
for evaluated in bpy.context.evaluated_depsgraph_get().object_instances:
 obj=evaluated.object;world=evaluated.matrix_world;normal_matrix=world.to_3x3().inverted().transposed()
 if obj.type!='MESH' or obj.get('export_skip'):continue
 object_count+=1;me=obj.data;me.calc_loop_triangles();kind=me.materials[0].name
 triangles+=len(me.loop_triangles)
 parent=evaluated.parent.original if evaluated.is_instance and evaluated.parent else None
 repeated=parent and parent.instance_type=='COLLECTION'
 assembly=parent.instance_collection.name if repeated else None
 if obj.get('runtime_box'):
  if repeated:
   assembly_worlds.setdefault(assembly,{})[parent.name]=change@parent.matrix_world@change.inverted()
   key=(assembly,kind,obj.original.name)
   if key in seen_boxes:continue
   seen_boxes.add(key)
   placement=parent.matrix_world.inverted()@world
  else:placement=world
  points=[]
  for v in me.vertices:
   p=placement@v.co;points.append(Vector((p.x,p.z,-p.y)))
  center=sum(points,Vector())/8
  axes=[points[1]-points[0],points[3]-points[0],points[4]-points[0]]
  matrix=[*axes[0],0,*axes[1],0,*axes[2],0,*center,1]
  if repeated:assembly_boxes.setdefault((assembly,kind),[]).extend(matrix)
  else:instances.setdefault(kind,[]).extend(matrix)
  if cube is None:
   cube=[];local_normal=placement.to_3x3().inverted().transposed()
   for tri in me.loop_triangles:
    n=local_normal@tri.normal;n=Vector((n.x,n.z,-n.y)).normalized()
    for li in tri.loops:
     p=points[me.loops[li].vertex_index]-center
     q=[p.dot(axis)/axis.length_squared for axis in axes]
     normal=[n.dot(axis.normalized())for axis in axes]
     cube.extend([*q,*normal,0,0])
  continue
 values=segments.setdefault(kind,[]);uv=me.uv_layers.active.data
 for tri in me.loop_triangles:
  n=(normal_matrix@tri.normal).normalized()
  for li in tri.loops:
   p=world@me.vertices[me.loops[li].vertex_index].co;v=uv[li].uv
   values.extend([p.x,p.z,-p.y,n.x,n.z,-n.y,v.x,v.y])
data=bytearray();parts=[]
def append(values):
 offset=len(data);data.extend(struct.pack('<'+'f'*len(values),*values));return offset
cube_offset=append(cube)
world_sections={}
for name,worlds in assembly_worlds.items():
 values=[m[row][column]for m in worlds.values()for column in range(4)for row in range(4)]
 world_sections[name]={'worldOffset':append(values),'worldCount':len(worlds)}
for kind in dict.fromkeys([*instances,*[kind for _,kind in assembly_boxes]]):
 values=instances.get(kind,[]);direct_count=len(values)//16
 part={'field':kind,'mode':'instances','offset':append(values),'directCount':direct_count,'count':direct_count,'rect':fields[kind],'assemblies':[]}
 for (name,field),local in assembly_boxes.items():
  if field!=kind:continue
  group={'sourceOffset':append(local),'sourceCount':len(local)//16,**world_sections[name]}
  part['assemblies'].append(group);part['count']+=group['sourceCount']*group['worldCount']
 parts.append(part)
for kind,values in segments.items():
 parts.append({'field':kind,'mode':'mesh','offset':append(values),'vertices':len(values)//8,'rect':fields[kind]})
(DEST/'empty-rooftop.bin').write_bytes(data)
manifest={'format':'blender-mesh-f32-v1','stride':8,'cube':{'offset':cube_offset,'vertices':len(cube)//8},'source':'docs/art/rooftop-background-01/empty-rooftop.blend','texture':'terrace-book.png','binary':'empty-rooftop.bin','parts':parts,'triangles':triangles,'objects':object_count,'sixthFloor':{'floor':0,'eave':EAVE,'ridge':RIDGE,'base':BASE},'row':{'homes':6,'northTerraces':6,'southTerraces':6,'pairs':3,'interPairSetback':12,'centres':[p[0]for p in homes],'mirrors':[p[1]for p in homes]},'sha256':hashlib.sha256(data).hexdigest(),'neighbourhood':{'north':'finite enclosed-balcony apartments','south':'matching paired-terrace apartments','skylineDirections':360,'nativeStreetLife':True,'shops':shop_count,'homeShops':0,'parkedCars':len(parkings),'layoutSource':'map-layout.json','oldBlocks':mapped_blocks,'towers':map_towers,'mapUrl':map_layout['mapUrl']},'textureSha256':hashlib.sha256((DEST/'terrace-book.png').read_bytes()).hexdigest()}
(DEST/'empty-rooftop.mjs').write_text('export const BACKGROUND = Object.freeze('+json.dumps(manifest,indent=2)+');\n')
(HERE/'blender-authoring.json').write_text(json.dumps({'software':'Blender','version':bpy.app.version_string,'native_source_saved':True,'runtime_from_evaluated_native_mesh':True,'mesh_objects':object_count,'authored_mesh_objects':len([o for o in bpy.data.objects if o.type=='MESH']),'triangles':triangles,'bytes':len(data),'packed_texture_sha256':hashlib.sha256(bytes(image.packed_file.data)).hexdigest(),'native_collection_instances':sum(len(g)for g in assembly_worlds.values())},indent=2))
print('EXPORTED',triangles,'triangles',len(data),'bytes; collection transforms shared')
