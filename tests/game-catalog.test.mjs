import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {GAMES, gameDocumentTitle} from '../shared/games.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('game identities agree across folders, desktop icons and public documentation', async () => {
  const desktop = await read('index.html');
  const readmes = {zh: await read('README.md'), en: await read('README_EN.md'), ja: await read('README_JA.md')};
  const naming = await read('docs/naming.md');
  for (const [id, game] of Object.entries(GAMES)) {
    assert.match(id, /^[a-z][a-z0-9-]*$/);
    assert.match(game.program, new RegExp(`^${id.toUpperCase()}\\.(EXE|SYS|BIO)$`));
    const icon = desktop.match(new RegExp(`<a class="desktop-icon[^>]*href="\\./${id}/"[^>]*>([\\s\\S]*?)</a>`))?.[1];
    assert.ok(icon?.includes(game.program), `${id}: fixed desktop filename`);
    const gameReadme = await read(`${id}/README.md`);
    for (const [language, title] of Object.entries(game.titles)) {
      assert.ok(readmes[language].split('\n').some(line => line.startsWith('### ') && line.includes(title)), `${id}: ${language} public heading`);
      assert.ok(gameReadme.includes(title), `${id}: ${language} maintenance title`);
      assert.ok(naming.includes(title), `${id}: ${language} naming guide`);
    }
    assert.match(game.titles.en, /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/);
    assert.ok((await read(`${id}/index.html`)).includes(`<title>${gameDocumentTitle(id, 'zh')}</title>`), `${id}: initial browser title`);
    await access(new URL(`${id}/docs/README.md`, root));
    await access(new URL(`${id}/tests/README.md`, root));
  }
});

test('game README entry points share the same maintenance structure', async () => {
  const expected = ['名称与标识', '游戏入口', '本地运行', '目录与文档', '内容维护', '检查'];
  for (const id of Object.keys(GAMES)) {
    const headings = [...(await read(`${id}/README.md`)).matchAll(/^## (.+)$/gm)].map(match => match[1]);
    assert.deepEqual(headings, expected, id);
  }
});
