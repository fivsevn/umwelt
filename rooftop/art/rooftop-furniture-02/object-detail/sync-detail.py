"""Sync only edited native resources, retaining all catalogue/placement records.

Protected models sharing an atlas receive identical mesh/UV/material payloads
with only the embedded shared PNG refreshed. Their used pixels are protected by
paint-detail.py. Runtime loading already uses the shared family PNG.
"""
from pathlib import Path
import json,struct,hashlib,sys
import numpy as np

HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[3];ROOF=ROOT/'rooftop'
scope=json.loads((HERE/('scope-round3.json' if '--all-objects' in sys.argv else 'scope.json')).read_text());ids={i['modelId'] for i in scope};families={i['family'] for i in scope}
path=ROOF/'item-data.mjs';prefix='// Native Blender records; portraits are baked by the actual game item factory.\nexport const ITEM_DATA = '
items=json.loads(path.read_text().split('export const ITEM_DATA = ',1)[1].rstrip().removesuffix(';'))
def sha(b):return hashlib.sha256(b).hexdigest()
def read_glb(data):
    size=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+size]);return doc,data[28+size:]
def encode(doc,binary):
    raw=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode();raw+=b' '*((-len(raw))%4)
    binary+=b'\0'*((-len(binary))%4)
    return struct.pack('<4sII',b'glTF',2,28+len(raw)+len(binary))+struct.pack('<I4s',len(raw),b'JSON')+raw+struct.pack('<I4s',len(binary),b'BIN\0')+binary
protected=[];edited=[]
for item in items:
    if item['family'] not in families:continue
    model=ROOF/item['file'];data=model.read_bytes();doc,binary=read_glb(data)
    atlas=(ROOF/item['atlas']).read_bytes();image=doc['images'][0];view=doc['bufferViews'][image['bufferView']]
    start=view.get('byteOffset',0);end=start+view['byteLength']
    if item['modelId'] not in ids:
        # Images may be interleaved with mesh buffers. Preserve every original
        # non-image buffer verbatim and only relocate subsequent offsets.
        indices=[j for j in range(len(doc['bufferViews'])) if j!=image['bufferView']]
        def payloads(d,b):
            return [b[d['bufferViews'][j].get('byteOffset',0):d['bufferViews'][j].get('byteOffset',0)+d['bufferViews'][j]['byteLength']] for j in indices]
        original_payloads=payloads(doc,binary);fingerprint=sha(b''.join(original_payloads));embedded=binary[start:end]
        if embedded!=atlas:
            oldend=(end+3)//4*4;newimage=atlas+b'\0'*((-len(atlas))%4)
            delta=len(newimage)-(oldend-start)
            for j in indices:
                v=doc['bufferViews'][j];offset=v.get('byteOffset',0)
                assert offset>=oldend or offset+v['byteLength']<=start
                if offset>=oldend:v['byteOffset']=offset+delta
            view['byteLength']=len(atlas)
            newbin=binary[:start]+newimage+binary[oldend:]
            doc['buffers'][0]['byteLength']=len(newbin)
            data=encode(doc,newbin);model.write_bytes(data)
        d2,b2=read_glb(data);assert payloads(d2,b2)==original_payloads
        protected.append({'id':item['id'],'geometryAndUvSha256':fingerprint,'usedAtlasPixelsPreserved':True})
    else:
        assert binary[start:end]==atlas,item['id']+' embedded canonical PNG'
        def accessor(index):
            a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
            dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]
            n={'VEC3':3,'VEC2':2,'SCALAR':1}[a['type']]
            return np.ndarray((a['count'],n),dtype=dtype,buffer=binary,offset=v.get('byteOffset',0)+a.get('byteOffset',0),
                strides=(v.get('byteStride',np.dtype(dtype).itemsize*n),np.dtype(dtype).itemsize))
        parts=[];triangles=0
        for node in doc['nodes']:
            if 'mesh' not in node:continue
            assert not any(k in node for k in ('matrix','translation','rotation','scale')),node['name']
            for primitive in doc['meshes'][node['mesh']]['primitives']:
                p=accessor(primitive['attributes']['POSITION'])
                parts.append({'name':node['name'],'role':node.get('extras',{}).get('part_role','body'),'min':p.min(axis=0).tolist(),'max':p.max(axis=0).tolist()})
                triangles+=doc['accessors'][primitive['indices']]['count']//3
        # The metadata needs actual parts; support surfaces and bounds are kept.
        if '--all-objects' in sys.argv:
            # Round 3 edits materials only. Preserve the existing collision
            # metadata, including records that deliberately omit physicalParts.
            assert item['triangles']==triangles,item['id']+' geometry changed'
        else:
            item['physicalParts']=parts;item['triangles']=triangles
        edited.append(item['id'])
    item['modelSha256']=sha(data)
path.write_text(prefix+json.dumps(items,ensure_ascii=False,separators=(',',':'))+';\n')
(HERE/('round3-runtime-check.json' if '--all-objects' in sys.argv else 'runtime-check.json')).write_text(json.dumps({'editedObjects':edited,'protectedSharedAtlasObjects':protected,
    'catalogueIdsAndSurfacesPreserved':True},ensure_ascii=False,indent=2))
print('SYNCED',len(edited),'edited objects;',len(protected),'protected meshes with refreshed shared atlas packaging')
