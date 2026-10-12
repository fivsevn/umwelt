import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {extname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BACKGROUND} from '../rooftop/assets/background/empty-rooftop.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const rooftop=join(root,'rooftop');
const textExtensions=new Set(['.mjs','.js','.json','.html','.css','.svg','.txt','.md','.map']);
// Personal matching terms stay outside the repository. These public checks
// enforce anonymous model metadata without repeating any private address.
const privateSignals=[
  ['private home metadata',/["'](?:private[_-]?home|(?:home|street|postal)[_-]?address|address|door[_-]?number|unit[_-]?number|building[_-]?(?:number|address))["']\s*:/i],
  ['location lookup',/(?:google\.[^\s"'<>/]+\/maps|maps\.google\.|openstreetmap\.org\/(?:way|node|relation)\/|api\.openstreetmap\.org\/api\/0\.6\/map\?)/i],
  ['geographic metadata',/["'](?:geographic_origin|homeGoogleCheck|homeId|osm_way_id|osm_relation_id|map_tags|sourcePixel|mapPoint|sourceUrl|mapUrl|latitude|longitude)["']\s*:/i],
  ['private absolute path',/\/(?:Users|home)\/[^\s"'<>]+/],
  ['GPS-labelled coordinates',/["'](?:lat|latitude|lon|lng|longitude)["']\s*:\s*[+-]?(?:\d+(?:\.\d+)?|\.\d+)/i],
];
const privateFiles=/(?:^|\/)(?:map-source\.osm|map-features\.json|model-record\.json|map-[^/]*\.(?:png|jpg|jpeg)|[^/]*\.(?:blend|blend1|pxo))$/i;

function filesIn(folder){
  return readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{
    const path=join(folder,entry.name);
    return entry.isDirectory()?filesIn(path):entry.isFile()?[path]:[];
  });
}
function normalizedText(text){
  return text.replace(/\\u([0-9a-f]{4})/gi,(_,n)=>String.fromCharCode(parseInt(n,16)))
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,hex,decimal)=>String.fromCodePoint(parseInt(hex||decimal,hex?16:10)))
    .replace(/(?:%[0-9a-f]{2})+/gi,encoded=>{try{return decodeURIComponent(encoded);}catch{return encoded;}})
    .normalize('NFKC');
}
function findings(text){
  const normalized=normalizedText(text);
  return privateSignals.filter(([,pattern])=>pattern.test(normalized)).map(([label])=>label);
}
function pngMetadata(buffer){
  if(buffer.length<8||buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')return [];
  const values=[];
  for(let offset=8;offset+12<=buffer.length;){
    const size=buffer.readUInt32BE(offset),end=offset+12+size;
    assert.ok(end<=buffer.length,'PNG chunks must remain valid');
    const type=buffer.toString('ascii',offset+4,offset+8);
    // Compressed textual/EXIF chunks cannot be silently shipped as unread metadata.
    const chunk=buffer.subarray(offset+8,offset+8+size);
    const keywordEnd=type==='iTXt'?chunk.indexOf(0):-1;
    if(type==='zTXt'||type==='eXIf'||(type==='iTXt'&&keywordEnd>=0&&chunk[keywordEnd+1]===1))values.push('private opaque image metadata');
    if(type==='tEXt'||type==='iTXt')values.push(...findings(chunk.toString('utf8')));
    offset=end;
  }
  return values;
}

const publicPaths=filesIn(rooftop).filter(path=>!/(?:^|\/)(?:README[^/]*\.md|AGENTS\.md|\.DS_Store)$/.test(path));

test('game runtime contains no private location text, source paths or map records',()=>{
  const errors=[];
  for(const path of publicPaths){
    const name=relative(root,path).split('\\').join('/');
    for(const reason of findings(name))errors.push(`${name}: ${reason} in filename`);
    if(privateFiles.test(name))errors.push(`${name}: private authoring or map file`);
    if(textExtensions.has(extname(path))){
      for(const reason of findings(readFileSync(path,'utf8')))errors.push(`${name}: ${reason}`);
    }
  }
  assert.deepEqual(errors,[]);
});

test('background metadata only carries local geometry and anonymous authoring references',()=>{
  const forbidden=new Set(['homeid','homegooglecheck','geographic_origin','osm_way_id','osm_relation_id','map_tags','osmid','sourcepixel','mappoint','mapurl','sourceurl','latitude','longitude','lat','lon','lng','privatehome','private_home','private-home','homeaddress','home_address','address','streetaddress','street_address','postaladdress','postal_address','doornumber','door_number','unitnumber','unit_number','buildingnumber','building_number']);
  const errors=[];
  function inspect(value,path='BACKGROUND'){
    if(!value||typeof value!=='object')return;
    for(const [key,item] of Object.entries(value)){
      if(forbidden.has(key.toLowerCase()))errors.push(`${path}.${key}`);
      inspect(item,`${path}.${key}`);
    }
  }
  inspect(BACKGROUND);
  assert.deepEqual(errors,[]);
  assert.deepEqual(findings(JSON.stringify(BACKGROUND)),[]);
});

test('published PNG textures have no opaque EXIF or private textual metadata',()=>{
  const errors=[];
  for(const path of publicPaths.filter(path=>extname(path)==='.png')){
    for(const reason of pngMetadata(readFileSync(path)))errors.push(`${relative(root,path)}: ${reason}`);
  }
  assert.deepEqual(errors,[]);
});

test('privacy scan accepts botanical sources, attribution and game-local geometry',()=>{
  assert.deepEqual(findings('https://powo.science.kew.org/ https://www.openstreetmap.org/copyright https://fivsevn.com'),[]);
  assert.deepEqual(findings('"origin":[0,0],"x":12.5,"y":-7.25'),[]);
  assert.deepEqual(findings('"latitude":0'),['geographic metadata','GPS-labelled coordinates']);
  assert.deepEqual(findings('"private_home":{"address":"anonymous fixture"}'),['private home metadata']);
  assert.ok(findings('https://www.google.com/maps/search/').includes('location lookup'));
  assert.ok(findings('https%3A%2F%2Fwww.google.com%2Fmaps').includes('location lookup'));
});
