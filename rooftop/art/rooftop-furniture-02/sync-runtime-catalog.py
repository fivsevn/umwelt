"""Derive runtime metadata and 2D thumbnails from the approved native GLBs.

No authoring geometry is recreated here. Bounds, contacts and thumbnail triangles
are read from the exported meshes; botanical/source records remain verbatim.
"""
from pathlib import Path
import json, struct, hashlib, io, math, argparse
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'rooftop/art/rooftop-furniture-02/preview/assets'
OUT = ROOT / 'rooftop/assets/items/thumbs'
OUT.mkdir(parents=True, exist_ok=True)
catalog = json.loads((SOURCE / 'catalog.json').read_text())
arguments = argparse.ArgumentParser()
arguments.add_argument('--only', nargs='+', help='Render selected model IDs without replacing the complete runtime catalog.')
options = arguments.parse_args()
# Preserve portraits already baked by the actual runtime composition. A model
# or default-vessel change requires a fresh native bake, not a review-pot image.
portrait_path=ROOT/'rooftop/art/rooftop-thumbnail-02/audit.json'
native_portraits={r['modelId']:r for r in json.loads(portrait_path.read_text())} if portrait_path.exists() else {}


def glb(path):
    data = path.read_bytes()
    size = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20+size])
    start = 20+size
    binary = data[start+8:]
    def accessor(index):
        a = doc['accessors'][index]; v = doc['bufferViews'][a['bufferView']]
        dtype = {5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]
        width = {'VEC3':3,'VEC2':2,'SCALAR':1}[a['type']]
        offset = v.get('byteOffset',0)+a.get('byteOffset',0)
        stride = v.get('byteStride', np.dtype(dtype).itemsize*width)
        return np.ndarray((a['count'], width), dtype=dtype, buffer=binary, offset=offset, strides=(stride,np.dtype(dtype).itemsize)).copy()
    parts=[]; faces=[]; ground=[]
    images={}
    def material(primitive):
        m=doc.get('materials',[{}])[primitive.get('material',0)].get('pbrMetallicRoughness',{})
        tex=m.get('baseColorTexture')
        if tex:
            image_id=doc['textures'][tex['index']]['source']
            if image_id not in images:
                v=doc['bufferViews'][doc['images'][image_id]['bufferView']]
                images[image_id]=np.asarray(Image.open(io.BytesIO(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])).convert('RGBA'))
            return images[image_id], np.array(m.get('baseColorFactor',[1,1,1,1]))
        return None, np.array(m.get('baseColorFactor',[.5,.5,.5,1]))
    for node in doc['nodes']:
        if 'mesh' not in node: continue
        # Native exports apply all object transforms. Refuse a future export
        # with a nonidentity transform instead of silently guessing its bounds.
        assert not any(k in node for k in ('matrix','translation','rotation','scale')), node['name']
        for primitive in doc['meshes'][node['mesh']]['primitives']:
            positions=accessor(primitive['attributes']['POSITION'])
            lo=positions.min(axis=0); hi=positions.max(axis=0)
            parts.append(dict(name=node.get('name',''),role=node.get('extras',{}).get('part_role','body'),min=lo.tolist(),max=hi.tolist()))
            ground.extend(positions[positions[:,1]<.006].tolist())
            uv=accessor(primitive['attributes']['TEXCOORD_0'])
            texture,factor=material(primitive)
            indices=accessor(primitive['indices']).reshape(-1,3)
            for indices3 in indices:
                p=positions[indices3]; normal=np.cross(p[1]-p[0],p[2]-p[0]); norm=np.linalg.norm(normal)
                if norm < 1e-10: continue
                normal=normal/norm
                # Plain hemisphere + directional value, without product gloss.
                light=.78+.22*max(0,float(np.dot(normal,[-.4,.85,.3])))
                faces.append((p,uv[indices3],texture,factor,light))
    return data,parts,np.array(ground),faces

items=[]
for item in catalog['items']:
    item=dict(item); model_id=item['id']
    if options.only and model_id not in options.only: continue
    data,parts,contact,faces=glb(SOURCE / (model_id+'.glb'))
    item['modelId']=model_id
    if item.get('originalRuntimeId'): item['id']=item['originalRuntimeId']
    elif item['family']=='rooms-vessels' and model_id.startswith('antique-'): item['id']='vessel-'+model_id
    item['file']='assets/items/'+model_id+'.glb'
    item['atlas']='assets/items/'+item['family']+'-atlas.png'
    item['thumbnail']='assets/items/thumbs/'+model_id+'.png'
    item['modelSha256']=hashlib.sha256(data).hexdigest()
    # Keeping the exact native part bounds makes support collision independent
    # of sprite bounds and of the retired procedural furniture builders.
    if item['surfaces']:
        item['physicalParts']=parts
    if len(contact):
        lo=contact.min(axis=0); hi=contact.max(axis=0)
        item['contactBounds']={'width':float(hi[0]-lo[0]),'depth':float(hi[2]-lo[2]),'center':[float((hi[0]+lo[0])/2),float((hi[2]+lo[2])/2)]}
    portrait=native_portraits.get(model_id)
    if portrait:
        assert portrait['sourceModelSha256']==item['modelSha256'], 'Rebake changed native portrait: '+model_id
        assert hashlib.sha256((ROOT/'rooftop'/item['atlas']).read_bytes()).hexdigest()==portrait['atlasSha256'], 'Rebake changed portrait material: '+model_id
        assert hashlib.sha256((OUT/(model_id+'.png')).read_bytes()).hexdigest()==portrait['pngSha256'], 'Portrait identity changed: '+model_id
        if item['category']=='植物':
            expected='vessel-'+item['defaultPot']
            assert expected==portrait['defaultPot'], 'Rebake changed default vessel: '+model_id
            assert native_portraits[expected]['sourceModelSha256']==portrait['vesselModelSha256'], 'Rebake changed vessel model: '+model_id
            assert native_portraits[expected]['atlasSha256']==portrait['vesselAtlasSha256'], 'Rebake changed vessel material: '+model_id
        item['thumbnailProjection']=portrait['projection']
        item['thumbnailFactory']='actual-native-item-assembly-v2'
        items.append(item)
        continue
    # Render a derivative of the actual new mesh for canvas fallback and books.
    # Projection is an orthographic isometric view; it never drives placement.
    angle=math.radians(35); elevation=math.radians(24)
    c,s=math.cos(angle),math.sin(angle)
    def projection(p):
        x=p[:,0]*c-p[:,2]*s; z=p[:,0]*s+p[:,2]*c
        return np.column_stack((x,-p[:,1]*math.cos(elevation)+z*math.sin(elevation))),z*math.cos(elevation)+p[:,1]*math.sin(elevation)
    rendered=[]
    for p,uv,texture,factor,light in faces:
        q,depth=projection(p); rendered.append((q,depth,uv,texture,factor,light))
    all_points=np.concatenate([q for q,*_ in rendered]); lo=all_points.min(axis=0); hi=all_points.max(axis=0)
    scale=132/max(hi-lo); pixels=np.zeros((144,144,4),dtype=np.uint8)
    depth_buffer=np.full((144,144),-np.inf)
    item['thumbnailProjection']={'min':lo.tolist(),'max':hi.tolist(),'metresPerPixel':float(1/scale),
        'anchor':(72-(lo+hi)*scale/2).tolist()}
    for q,depth,uv,texture,factor,light in rendered:
        q=(q-(lo+hi)/2)*scale+72
        left,top=np.maximum(0,np.floor(q.min(axis=0)).astype(int))
        right,bottom=np.minimum(143,np.ceil(q.max(axis=0)).astype(int))
        if right<left or bottom<top: continue
        x,y=np.meshgrid(np.arange(left,right+1)+.5,np.arange(top,bottom+1)+.5)
        denominator=(q[1,1]-q[2,1])*(q[0,0]-q[2,0])+(q[2,0]-q[1,0])*(q[0,1]-q[2,1])
        if abs(denominator)<1e-8: continue
        a=((q[1,1]-q[2,1])*(x-q[2,0])+(q[2,0]-q[1,0])*(y-q[2,1]))/denominator
        b=((q[2,1]-q[0,1])*(x-q[2,0])+(q[0,0]-q[2,0])*(y-q[2,1]))/denominator
        weights=np.stack((a,b,1-a-b),axis=-1)
        z=weights@depth
        visible=(weights.min(axis=-1)>=-1e-7)&(z>depth_buffer[top:bottom+1,left:right+1])
        if not visible.any(): continue
        if texture is not None:
            coordinates=weights@uv
            # glTF TEXCOORD_0 already uses an image-top origin. The production
            # loader has flipY=false; another flip samples empty atlas regions.
            tex_x=np.clip((coordinates[...,0]*texture.shape[1]).astype(int),0,texture.shape[1]-1)
            tex_y=np.clip((coordinates[...,1]*texture.shape[0]).astype(int),0,texture.shape[0]-1)
            colors=texture[tex_y,tex_x].astype(float)*factor
        else:
            colors=np.broadcast_to(factor*255,(*x.shape,4)).copy()
        colors[...,:3]*=light
        colors=np.clip(colors,0,255).astype(np.uint8)
        visible &= colors[...,3]>0
        pixels[top:bottom+1,left:right+1][visible]=colors[visible]
        depth_buffer[top:bottom+1,left:right+1][visible]=z[visible]
    image=Image.fromarray(pixels)
    image.save(OUT/(model_id+'.png'),optimize=True)
    items.append(item)
if not options.only:
    target=ROOT/'rooftop/item-data.mjs'
    temporary=target.with_suffix('.tmp')
    temporary.write_text('// Generated from the approved 294 native exports by rooftop/art/rooftop-furniture-02/sync-runtime-catalog.py.\nexport const ITEM_DATA = '+json.dumps(items,ensure_ascii=False,separators=(',',':'))+';\n')
    temporary.replace(target)
print(json.dumps({'items':len(items),'thumbnails':len(items),'catalogSha256':hashlib.sha256((SOURCE/'catalog.json').read_bytes()).hexdigest()}))
