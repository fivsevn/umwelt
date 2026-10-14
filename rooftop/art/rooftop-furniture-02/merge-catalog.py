"""Build the local review catalog from independently verified source families."""
from pathlib import Path
import json, argparse, hashlib
from collections import Counter
ROOT=Path(__file__).resolve().parent
CATEGORIES=['架子','桌椅与居室','栽培与盛放','日用与照明','植物','收藏','枪械','兵器']
FAMILIES=['everyday','rooms-vessels','accents','collection','pots-retained','ceramics-extra','plants-retained']
parser=argparse.ArgumentParser()
parser.add_argument('--complete',action='store_true')
args=parser.parse_args()
items=[]
for family in FAMILIES:
 path=ROOT/family/'catalog.json'
 if not path.exists():
  if args.complete:raise ValueError('Missing family '+family)
  continue
 record=json.loads(path.read_text())
 if not args.complete and (not (ROOT/family/(family+'.blend')).exists()
     or not (ROOT/family/'atlas.pxo').exists()
     or not all((ROOT/'preview'/item['file']).exists() for item in record['items'])):
  continue
 assert record['texelsPerMetre']==16
 for item in record['items']:
  if item['id'].startswith('antique-') or family=='ceramics-extra':item['category']='收藏'
  elif family=='accents':item['category']='日用与照明'
  if item['category']=='架子':item['name']=item['name'].replace('花架','架')
  if args.complete:
   assert (ROOT/'preview'/item['file']).exists(),item['id']
   assert (ROOT/item['sourceBlend']).exists(),item['id']
   assert (ROOT/item['sourcePixelorama']).exists(),item['id']
  assert item['category'] in CATEGORIES,item
  items.append(item)
assert len({item['id'] for item in items})==len(items)
items.sort(key=lambda item:CATEGORIES.index(item['category']))
counts=Counter(item['category'] for item in items)
if args.complete:
 assert counts['收藏']==44 and counts['枪械']==66 and counts['兵器']==20,counts
 assert counts['植物']==110,counts
 assert len(items)==294,len(items)
 checks={family:json.loads((ROOT/family/'source-reopened.json').read_text()) for family in FAMILIES}
 pixel={family:json.loads((ROOT/family/'pixelorama-source-check.json').read_text()) for family in FAMILIES}
 assert all(check.get('passed') for check in checks.values()),checks
 assert all(check.get('nativeCelEqualsPngAndReopenedPng') and check.get('originalConfigRestored') for check in pixel.values())
 (ROOT/'source-validation.json').write_text(json.dumps({'count':len(items),'categoryCounts':dict(counts),'blender':checks,'pixelorama':pixel},ensure_ascii=False,indent=2))
catalog={'texelsPerMetre':16,'categories':CATEGORIES,'sampling':'Shared rooftop outdoor-raster.mjs / pixel-grid.mjs','items':items}
(ROOT/'preview/assets/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2))
print(json.dumps({'count':len(items),'categoryCounts':dict(counts)},ensure_ascii=False))
