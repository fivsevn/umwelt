import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const require = createRequire(new URL('../../tools/engine/package.json', import.meta.url));
const sharp = require('sharp');
const directory = fileURLToPath(new URL('.', import.meta.url));
const destination = fileURLToPath(new URL('../../assets/emotes/gsm/', import.meta.url));
const source = await readFile(join(directory, 'atlas.png'));
const metadata = await sharp(source).metadata();
if (metadata.width !== 1254 || metadata.height !== 1254 || !metadata.hasAlpha) {
  throw new Error('Expected the approved 1254 × 1254 transparent atlas.');
}

const reactions = [
  ['neutral', '路过', '守宫侧着身四爪着地，半眯着眼微笑，带环纹的粗尾巴向上卷起。'],
  ['huh', '啊？', '守宫坐着抬头张嘴，头顶有一个问号，粗尾巴盘在一旁。'],
  ['speechless', '无语', '守宫伏着身体，一只前爪托着脸颊，半闭着眼，嘴角向下。'],
  ['angry', '气死', '守宫挺起身子皱眉，四爪撑地，头顶有红色怒气符号，尾巴高高竖起。'],
  ['cry', '呜呜', '守宫把头贴在地面趴着，闭着眼流下两道蓝色眼泪，尾巴蜷在身后。'],
  ['laugh', '笑翻', '守宫露着肚皮向后翻倒，张嘴大笑，前后爪弯着，头旁有黄色强调线。'],
  ['melon', '吃瓜', '守宫坐着用两只前爪抱住西瓜片，瞪圆眼睛看向一边，粗尾巴盘在身侧。'],
  ['flat', '趴平', '守宫四肢摊开伏在地上，眼皮低垂，卷起的尾巴搭在身后。'],
  ['okay', '收到', '守宫坐着举起一只前爪打招呼，睁大眼张嘴笑，爪边有黄色短线。'],
  ['doubt', '不信', '守宫坐着偏头斜眼看，一只前爪抵着下巴，嘴巴抿起。'],
  ['disgust', '嫌弃', '守宫皱嘴斜眼，一只前爪朝外推开，另一只前爪撑地，尾巴横在身后。'],
  ['heh', '呵呵', '守宫坐着闭眼抬起下巴，嘴边吐出一小团气，尾巴盘在身体后面。'],
  ['heated', '急了', '守宫把身子伏低向前瞪眼张嘴，粗尾巴高高翘起，旁边有红色双感叹号。'],
  ['clap', '拍爪', '守宫闭眼笑着坐起，两只前爪在胸前相拍，旁边有黄色拍击线。'],
  ['tableflip', '掀垫', '守宫张大嘴巴举起两只前爪，把一块格子方垫掀向右上方。'],
  ['hold-it', '憋住', '守宫闭眼鼓着微红的脸颊，两只前爪捂在嘴边，粗尾巴卷在身侧。'],
  ['ignore', '懒得回', '守宫转过身背对前方，只回头斜看，粗尾巴盘在脚边。'],
  ['sweat', '流汗', '守宫趴坐着半眯眼伸舌头，头顶悬着一大滴蓝色汗状符号。'],
  ['guilty', '心虚', '守宫把脸低在两只前爪上，眉眼低垂，脸颊泛红，头顶有小问号。'],
  ['play-dead', '装死', '守宫翻着肚皮仰躺，眼睛画成叉号，露着小舌头，四爪蜷起，头上有旋转线。'],
  ['crash', '宕机', '守宫僵着四爪伏在地面，两眼睁圆，嘴微张，头顶转着螺旋线。'],
  ['peek', '探头', '守宫从石头后探出头，一只前爪扣住石边，石旁有草，头边有黄色强调线。'],
  ['wait', '蹲后续', '守宫趴着把两只前爪交叠在下巴下面，半眯眼向侧面看。'],
  ['plead', '求求', '守宫坐着抬起亮晶晶的大眼睛，双前爪合在胸前，脸颊微红。'],
  ['leave', '溜了', '守宫朝右快速爬走，侧头微笑，四肢张开，粗尾巴甩在身后，左侧有速度线。'],
];

// The approved drawing has uneven cells. Leave's speed lines need extra room.
const rows = [0, 250, 490, 730, 970, 1254];
const columns = [0, 254, 488, 744, 980, 1254];
const lastRowColumns = [0, 254, 488, 744, 950, 1254];
const crops = reactions.map(([id], index) => {
  const row = Math.floor(index / 5);
  const column = index % 5;
  const boundaries = row === 4 ? lastRowColumns : columns;
  return { id, left: boundaries[column], top: rows[row],
    width: boundaries[column + 1] - boundaries[column], height: rows[row + 1] - rows[row] };
});

await mkdir(destination, { recursive: true });
const exported = [];
for (const crop of crops) {
  const { id, ...region } = crop;
  // Preserve source transparency: no trim, mask, threshold or repaint.
  const resized = await sharp(source).extract(region)
    .resize(140, 140, { fit: 'inside', kernel: 'lanczos3' })
    .toBuffer({ resolveWithObject: true });
  const horizontal = 160 - resized.info.width;
  const vertical = 160 - resized.info.height;
  const image = await sharp(resized.data).extend({
    left: Math.floor(horizontal / 2), right: Math.ceil(horizontal / 2),
    top: Math.floor(vertical / 2), bottom: Math.ceil(vertical / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).webp({ lossless: true, effort: 6 }).toBuffer();
  await writeFile(join(destination, `${id}.webp`), image);
  exported.push(image);
}

await writeFile(join(destination, 'manifest.json'), JSON.stringify({
  version: 1, name: 'GSM',
  items: reactions.map(([id, name, alt]) => ({ id, name, src: `assets/emotes/gsm/${id}.webp`, alt })),
}, null, 2) + '\n');
await writeFile(join(directory, 'crops.json'), JSON.stringify({
  source: 'atlas.png', sourceWidth: 1254, sourceHeight: 1254,
  outputSize: 160, contentMaximum: 140, crops,
}, null, 2) + '\n');

const escapeXML = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const labels = reactions.map(([id, name], index) => {
  const x = (index % 5) * 192 + 96;
  const y = Math.floor(index / 5) * 204 + 268;
  return `<text x="${x}" y="${y}" text-anchor="middle" font-size="17">${escapeXML(name)}</text>` +
    `<text x="${x}" y="${y + 19}" text-anchor="middle" font-size="12" fill="#777366">${id}</text>`;
}).join('');
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1120"><g font-family="sans-serif" fill="#413a27"><text x="32" y="38" font-size="26">GSM / 守宫反应图</text><text x="32" y="66" font-size="14" fill="#777366">25 approved hand-drawn reactions · transparent 160px WebP</text>${labels}</g></svg>`);
await sharp({ create: { width: 960, height: 1120, channels: 4, background: '#ffffff' } })
  .composite([
    ...exported.map((input, index) => ({ input, left: (index % 5) * 192 + 16, top: Math.floor(index / 5) * 204 + 90 })),
    { input: overlay, left: 0, top: 0 },
  ]).png().toFile(join(directory, 'preview.png'));
console.log(`Exported ${exported.length} transparent 160 × 160 WebP reactions from the approved atlas.`);
