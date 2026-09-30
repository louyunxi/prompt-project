#!/usr/bin/env node
/**
 * 生成每个组件目录下的 prompt.txt。
 *
 * 用法（在 apps/app-web 目录下）：
 *   pnpm prompt
 *
 * 扫描 src/views/<category>/component/<name>/，
 * 把组件目录内的所有 .vue/.js/.ts/.css/.scss/.less 文件
 * （排除 prompt.txt；注释保留；UTF-8；每个文件压成单行）
 * 与 src/assets/prompt/common.js 的「默认导出字符串」拼接到一起，
 * 输出到 <组件目录>/prompt.txt。
 *
 * 输出格式（无标题、无路径；纯单行代码块，块间用单个空行分隔）：
 *   <common.js 默认导出字符串，单行>
 *
 *   <index.vue 源码，单行>
 *
 *   <其他 *.vue / *.js / *.ts / *.css / *.scss / *.less 源码，单行>
 *   ...
 * 文件顺序：
 *   1. common.js 默认导出字符串（公共提示词）
 *   2. index.vue
 *   3. 其余 *.vue（按文件名升序）
 *   4. *.js（按文件名升序）
 *   5. *.ts（按文件名升序）
 *   6. *.css（按文件名升序）
 *   7. *.scss / *.less / 其他扩展名（按文件名升序）
 *
 * 设计：
 *   - 用 .mjs（ESM）。
 *   - common.js 是 ESM 语法，但 apps/app-web/package.json 未声明
 *     "type": "module"，Node 默认按 CJS 解析会失败，故用正则提取
 *     末尾的 `export default \`...\`;` 字符串内容；如未来 common.js
 *     出现转义反引号或换模板结构，需要相应升级此解析方式。
 *   - 所有文件读写按 utf-8；源码不做语义修改，仅把空白（换行/制表/
 *     连续空格）合并为单个空格，让每个文件块占一行。注释保留。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, '..');
const VIEWS_DIR = path.join(APP_ROOT, 'src', 'views');
const COMMON_PATH = path.join(APP_ROOT, 'src', 'assets', 'prompt', 'common.js');
const OUT_NAME = 'prompt.txt';

/** 扩展名优先级顺序（数值越小越靠前）。index.vue 单独置顶。 */
const EXT_PRIORITY = ['.vue', '.js', '.ts', '.css', '.scss', '.less'];

/**
 * 读取 common.js 的默认导出字符串。
 * @returns {string}
 */
function readCommonData() {
  const source = fs.readFileSync(COMMON_PATH, 'utf-8');
  // 匹配文件末尾的: export default `...`;
  // [\s\S]*? 非贪婪；遇到第一个 ` 结束（依赖当前 common.js 内不出现裸反引号）。
  const m = source.match(/export\s+default\s+`([\s\S]*?)`\s*;?\s*$/);
  if (!m) {
    throw new Error(
      `[prompt] 无法从 ${path.relative(APP_ROOT, COMMON_PATH)} 中解析 \`export default\` 字符串`
    );
  }
  return m[1];
}

/**
 * 列出 src/views/<category>/component/<name>/ 下的所有组件目录。
 * @returns {{ category: string; name: string; dir: string }[]}
 */
function listComponentDirs() {
  if (!fs.existsSync(VIEWS_DIR)) return [];

  const result = [];
  for (const category of fs.readdirSync(VIEWS_DIR)) {
    const categoryDir = path.join(VIEWS_DIR, category);
    if (!fs.statSync(categoryDir).isDirectory()) continue;

    const componentDir = path.join(categoryDir, 'component');
    if (!fs.existsSync(componentDir) || !fs.statSync(componentDir).isDirectory()) continue;

    for (const name of fs.readdirSync(componentDir)) {
      const dir = path.join(componentDir, name);
      if (!fs.statSync(dir).isDirectory()) continue;
      result.push({ category, name, dir });
    }
  }

  result.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });
  return result;
}

/**
 * 收集组件目录下需要打包的文件，按指定顺序排序。
 * @param {string} dir
 * @returns {{ name: string; ext: string; full: string }[]}
 */
function collectFiles(dir) {
  const items = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === OUT_NAME) continue;
    const full = path.join(dir, name);
    if (!fs.statSync(full).isFile()) continue;
    const ext = path.extname(name).toLowerCase();
    items.push({ name, ext, full });
  }

  items.sort((a, b) => {
    // index.vue 始终置顶
    const aIsIndex = a.name === 'index.vue';
    const bIsIndex = b.name === 'index.vue';
    if (aIsIndex && !bIsIndex) return -1;
    if (!aIsIndex && bIsIndex) return 1;

    // 其余按扩展名优先级 + 文件名升序
    const pa = EXT_PRIORITY.indexOf(a.ext);
    const pb = EXT_PRIORITY.indexOf(b.ext);
    const ra = pa === -1 ? EXT_PRIORITY.length : pa;
    const rb = pb === -1 ? EXT_PRIORITY.length : pb;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });

  return items;
}

/**
 * 把任意文本压成单行：所有空白（换行/制表/连续空格）合并为单个空格。
 * 注释、字符串字面量内容保留。
 */
function toOneLine(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * 为单个组件目录生成完整 prompt 文本。
 *
 * 每个代码块压成单行（无标题、无路径），块与块之间用单个空行分隔。
 * 第一个块：common.js 的默认导出字符串（公共提示词）。
 * 后续块：组件目录内的源文件，按 index.vue → *.vue → *.js → *.ts →
 *        *.css → *.scss/.less 排序。
 */
function buildPrompt(_component, commonData) {
  const blocks = [toOneLine(commonData)];

  const dir = path.join(VIEWS_DIR, _component.category, 'component', _component.name);
  const files = collectFiles(dir);
  for (const f of files) {
    blocks.push(toOneLine(fs.readFileSync(f.full, 'utf-8')));
  }

  return blocks.join('\n\n') + '\n';
}

function main() {
  if (!fs.existsSync(COMMON_PATH)) {
    console.error(`[prompt] 找不到公共提示词文件: ${COMMON_PATH}`);
    process.exit(1);
  }

  const commonData = readCommonData();
  const components = listComponentDirs();

  if (components.length === 0) {
    console.log('[prompt] 未发现组件目录（src/views/<category>/component/*）');
    return;
  }

  let count = 0;
  for (const c of components) {
    const content = buildPrompt(c, commonData);
    const outPath = path.join(c.dir, OUT_NAME);
    fs.writeFileSync(outPath, content, 'utf-8');
    count += 1;
    console.log(`[prompt] 已生成 ${path.relative(APP_ROOT, outPath)}`);
  }

  console.log(`\n[prompt] 完成，共生成 ${count} 个 ${OUT_NAME}`);
}

main();