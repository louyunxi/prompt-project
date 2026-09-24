#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');
const AGENTS_MD = path.join(ROOT, 'AGENTS.md');
const TRAE_DIR = path.join(ROOT, '.trae');
const TRAE_RULES_DIR = path.join(TRAE_DIR, 'rules');
const TRAE_PROJECT_MD = path.join(TRAE_RULES_DIR, 'project.md');
const ROOT_MCP_JSON = path.join(ROOT, '.mcp.json');
const TRAE_MCP_JSON = path.join(TRAE_DIR, 'mcp.json');
const CLAUDE_SKILLS_DIR = path.join(ROOT, '.claude', 'skills');
const TRAE_SKILLS_DIR = path.join(TRAE_DIR, 'skills');

function checkClaudeAgentsSync() {
  if (!fs.existsSync(CLAUDE_MD) || !fs.existsSync(AGENTS_MD)) {
    return { ok: false, reason: 'CLAUDE.md or AGENTS.md missing' };
  }
  const a = fs.readFileSync(CLAUDE_MD, 'utf8');
  const b = fs.readFileSync(AGENTS_MD, 'utf8');
  if (a !== b) {
    return {
      ok: false,
      reason: 'CLAUDE.md vs AGENTS.md mismatch (' + a.length + ' vs ' + b.length + ' bytes)',
    };
  }
  return { ok: true };
}

function checkMcpConfig() {
  if (!fs.existsSync(TRAE_MCP_JSON)) {
    return { ok: false, reason: '.trae/mcp.json missing' };
  }
  let lst;
  try {
    lst = fs.lstatSync(TRAE_MCP_JSON);
  } catch (err) {
    return { ok: false, reason: 'cannot lstat .trae/mcp.json: ' + err.message };
  }
  // 优先：符号链接 → 检查指向
  if (lst.isSymbolicLink()) {
    const target = fs.readlinkSync(TRAE_MCP_JSON);
    const resolved = path.resolve(path.dirname(TRAE_MCP_JSON), target);
    if (resolved !== ROOT_MCP_JSON) {
      return { ok: false, reason: '.trae/mcp.json symlink points to ' + target + ', expected ../.mcp.json' };
    }
    return { ok: true, mode: 'symlink' };
  }
  // 兜底：普通文件 → 校验内容一致（Windows + git core.symlinks=false 时无法用真符号链接）
  const a = fs.readFileSync(ROOT_MCP_JSON, 'utf8');
  const b = fs.readFileSync(TRAE_MCP_JSON, 'utf8');
  if (a !== b) {
    return {
      ok: false,
      reason: '.trae/mcp.json is a plain file but content differs from root .mcp.json; run `cp .mcp.json .trae/mcp.json`',
    };
  }
  return {
    ok: true,
    mode: 'mirror',
    warn: '.trae/mcp.json 是内容镜像（非软链）；修改根 .mcp.json 后需手动 `cp .mcp.json .trae/mcp.json`',
  };
}

function checkTraeRules() {
  if (!fs.existsSync(TRAE_PROJECT_MD)) {
    return { ok: false, reason: '.trae/rules/project.md missing' };
  }
  const content = fs.readFileSync(TRAE_PROJECT_MD, 'utf8');
  if (!content.startsWith('---\n')) {
    return { ok: false, reason: '.trae/rules/project.md missing Trae frontmatter' };
  }
  return { ok: true };
}

/**
 * 检查 .trae/skills/ 是否与 .claude/skills/ 同步。
 * Windows 下用文件大小 + 修改时间粗比对；精确比对靠 --apply 后每次完整 mirror。
 */
function checkSkillsMirror() {
  if (!fs.existsSync(CLAUDE_SKILLS_DIR)) {
    return { ok: true, mode: 'no-claude-skills', warn: '.claude/skills/ 不存在，跳过 skills 镜像检查' };
  }
  if (!fs.existsSync(TRAE_SKILLS_DIR)) {
    return {
      ok: false,
      reason: '.trae/skills/ 不存在；运行 `pnpm sync:ai mirror-skills` 创建',
    };
  }
  const claudeSkills = listSkillNames(CLAUDE_SKILLS_DIR);
  const traeSkills = listSkillNames(TRAE_SKILLS_DIR);
  const missing = claudeSkills.filter(function (n) { return traeSkills.indexOf(n) === -1; });
  const extra = traeSkills.filter(function (n) { return claudeSkills.indexOf(n) === -1; });
  if (missing.length > 0 || extra.length > 0) {
    return {
      ok: false,
      reason:
        'skills 不一致。' +
        (missing.length ? ' 缺失: ' + missing.join(', ') : '') +
        (extra.length ? ' 多余: ' + extra.join(', ') : ''),
    };
  }
  // 逐文件大小比对（粗粒度，捕获明显不一致；精确比对在 mirror 时做 SHA）
  for (const name of claudeSkills) {
    const a = path.join(CLAUDE_SKILLS_DIR, name, 'SKILL.md');
    const b = path.join(TRAE_SKILLS_DIR, name, 'SKILL.md');
    if (!fs.existsSync(a) || !fs.existsSync(b)) continue;
    const sa = fs.statSync(a);
    const sb = fs.statSync(b);
    if (sa.size !== sb.size) {
      return {
        ok: false,
        reason: name + '/SKILL.md 大小不一致 (' + sa.size + ' vs ' + sb.size + ')，运行 mirror-skills',
      };
    }
  }
  return { ok: true, mode: 'mirror', count: claudeSkills.length };
}

function listSkillNames(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(function (n) {
      const full = path.join(dir, n);
      return fs.statSync(full).isDirectory();
    });
}

function extractSection(text, header) {
  const idx = text.indexOf(header);
  if (idx === -1) return '';
  const rest = text.slice(idx);
  const m = rest.slice(header.length).search(/^## \d+\. /m);
  const end = m === -1 ? rest.length : header.length + m;
  return rest.slice(0, end).trim();
}

function stripHeader(section) {
  return section.replace(/^## \d+\..*\n/, '').trim();
}

function generateTraeProjectMd() {
  if (!fs.existsSync(CLAUDE_MD)) return { ok: false, reason: 'root CLAUDE.md missing' };
  const claude = fs.readFileSync(CLAUDE_MD, 'utf8');

  const factSections = ['## 2. ', '## 3. ', '## 4. ', '## 5. ', '## 6. ', '## 8. ', '## 9. '];
  const lines = claude.split('\n');
  const kept = [];
  let keep = false;
  for (const line of lines) {
    if (/^## \d+\. /.test(line)) {
      keep = factSections.some(function (h) {
        return line.indexOf(h) === 0;
      });
    }
    if (keep) kept.push(line);
  }
  const numbered = kept.join('\n');

  function grab(prefix) {
    const idx = numbered.indexOf(prefix);
    if (idx === -1) return '';
    const rest = numbered.slice(idx);
    const m = rest.slice(prefix.length).search(/^## \d+\. /m);
    const end = m === -1 ? rest.length : prefix.length + m;
    return stripHeader(rest.slice(0, end));
  }

  const techStack = grab('## 2. ');
  const workspace = grab('## 4. ');
  const build = grab('## 5. ');
  const codeStyle = grab('## 8. ');
  const api = grab('## 9. ');

  const body = [
    '## 1. 项目概述', '',
    '定位：基于 AI 大模型、面向农业领域（主粮作物物候期知识库等）的智能应用平台，采用',
    '**Turborepo + pnpm workspace** 的 Monorepo 结构，支持 Web（Vite）与 uniapp（小程序）多端应用。', '',
    '**当前应用清单**：', '',
    '| 应用 | 包名 | 端口 | 说明 |',
    '|------|------|------|------|',
    '| app-prompt | `@anhui/app-prompt` | 8888 | 后台管理端 |',
    '| app-web | `@anhui/app-web` | 8889 | Web 端示例项目 |', '',
    '## 2. 技术栈', '',
    techStack, '',
    '## 3. 目录结构', '',
    '```',
    'anhui-agri-data-plat/',
    'apps/app-prompt/          # 后台管理端',
    'apps/app-web/             # Web 端示例项目',
    'configs/app/              # @anhui/app-config',
    'configs/lint/             # @config/lint',
    'scripts/tasks/            # @scripts/tasks',
    '.trae/                    # Trae IDE 项目规则',
    '.claude/                  # Claude Code 配置',
    '```', '',
    '## 4. 包管理与 Workspace', '',
    workspace, '',
    '## 5. 构建 / 任务体系', '',
    build, '',
    '## 6. 代码规范', '',
    codeStyle, '',
    '## 7. API 接口', '',
    api, '',
    '## 8. MCP 服务', '',
    '项目根 `.mcp.json` 已声明以下 MCP（Trae IDE 也能识别）：', '',
    '- **playwright** — 浏览器自动化测试',
    '- **git** — Git 操作',
    '- **context7** — 库/框架文档查询',
    '- **figma** — Figma 设计稿读取',
    '- **jcodemunch** — 代码检索与符号定位（首选探索工具）', '',
    '## 9. 关键文档入口', '',
    '| 文档 | 内容 |',
    '|------|------|',
    '| `README.md` | 简要说明 |',
    '| `CLAUDE.md` | Claude Code 项目说明书（与 `AGENTS.md` 同步） |',
    '| `.clauderules` | Claude Code 专属开发规范 |',
    '| `api.md` | Dify 知识库数据集 API 文档 |',
    '| `apps/app-prompt/CLAUDE.md` | app-prompt 子应用说明 |',
    '| `apps/app-web/CLAUDE.md` | app-web 子应用说明 |', '',
    '## 10. 与根 CLAUDE.md 的关系', '',
    '- 本文件**只镜像事实层**，不包含 Claude Code 专属的会话行为约束。',
    '- 当根 `CLAUDE.md` 变更后，请运行 `pnpm sync:ai to-trae` 重新生成本文件骨架，再人工核对 Trae frontmatter。',
    '- 反向同步（Trae → Claude）通常**不需要**，因为事实层只在 Claude Code 端维护。',
    '',
    '## 11. Skill 提示（Claude Code skills 的间接引用）',
    '',
    'Trae 没有显式 skills 目录约定。本项目把 `.claude/skills/` 内容镜像到 `.trae/skills/`（`pnpm sync:ai mirror-skills`），',
    '遇到下面这些任务时，AI 应主动 `Read` 对应的 skill 文件，把它当作结构化提示词使用，而不是凭直觉给建议。',
    '优先读 `.trae/skills/`（就近），真源在 `.claude/skills/`：',
    '',
    '| 任务类型 | 参考 skill | 入口（优先 Trae 镜像） |',
    '|----------|-----------|------|',
    '| Vue 3 组件/API/性能 | vue / vue-best-practices | `.trae/skills/vue/SKILL.md`、`.trae/skills/vue-best-practices/SKILL.md` |',
    '| Vue Router 路由设计 | vue-router-best-practices | `.trae/skills/vue-router-best-practices/SKILL.md` |',
    '| VueUse 组合式工具 | vueuse-functions | `.trae/skills/vueuse-functions/SKILL.md` |',
    '| Pinia 状态管理 | pinia | `.trae/skills/pinia/SKILL.md` |',
    '| Vite 配置/构建 | vite | `.trae/skills/vite/SKILL.md` |',
    '| pnpm workspace/版本 | pnpm | `.trae/skills/pnpm/SKILL.md` |',
    '| Turborepo 编排 | turborepo | `.trae/skills/turborepo/SKILL.md` |',
    '| UI/UX 还原 / 设计稿转代码 | ui-ux-pro-max / frontend-design | `.trae/skills/ui-ux-pro-max/SKILL.md`、`.trae/skills/frontend-design/SKILL.md` |',
    '| 架构图 / ERD / 流程图 | drawio | `.trae/skills/drawio/SKILL.md` |',
    '| Claude memory 管理 | memory-management | `.trae/skills/memory-management/SKILL.md` |',
    '',
    '## 12. Memory 与 Agent 提示',
    '',
    '- **没有文件级 memory**：Trae 记忆主要靠 user rules（IDE 设置面板里）与对话历史。',
    '  跨会话长期记忆需在每次新对话开始时由用户手动提示，或在 user rules 里固化。',
    '- **没有 subagent 机制**：复杂任务靠 AI 自行拆分（如「先分析依赖、再定位文件、最后改代码」），',
    '  不能像 Claude Code 那样派发后台 subagent。',
    ''
  ].join('\n');

  const frontmatter = [
    '---',
    'name: project-overview',
    'description: anhui-agri-data-plat project facts -- stack, layout, naming, Vue, commit',
    'globs:',
    '  - "**/*"',
    'alwaysApply: true',
    '---',
    ''
  ].join('\n');

  const intro = [
    '# anhui-agri-data-plat',
    '',
    '> Trae IDE 项目规则 -- 事实层（SoT 镜像）。Claude Code 请读根 CLAUDE.md。',
    '> 修改根 CLAUDE.md 后请跑 `pnpm sync:ai to-trae` 重新生成本文件骨架。',
    ''
  ].join('\n');

  const final = frontmatter + intro + body;

  if (!fs.existsSync(TRAE_RULES_DIR)) fs.mkdirSync(TRAE_RULES_DIR, { recursive: true });
  fs.writeFileSync(TRAE_PROJECT_MD, final, 'utf8');
  return { ok: true, bytes: final.length };
}

function cmdCheck() {
  const checks = [
    { name: 'CLAUDE.md ↔ AGENTS.md 一致', ...checkClaudeAgentsSync() },
    { name: '.trae/mcp.json 与根 .mcp.json 一致（软链或内容镜像）', ...checkMcpConfig() },
    { name: '.trae/rules/project.md 存在且含 frontmatter', ...checkTraeRules() },
    { name: '.trae/skills/ 与 .claude/skills/ 同步', ...checkSkillsMirror() },
  ];
  let allOk = true;
  console.log('AI IDE 配置一致性检查\n');
  for (const c of checks) {
    const mark = c.ok ? '[OK]' : '[FAIL]';
    console.log('  ' + mark + ' ' + c.name);
    if (c.warn) {
      console.log('     WARN: ' + c.warn);
    }
    if (!c.ok) {
      console.log('     -> ' + c.reason);
      allOk = false;
    }
  }
  console.log('');
  if (allOk) {
    console.log('所有检查通过。');
  } else {
    console.log('存在不一致，请按上方提示修复，或运行 `pnpm sync:ai to-trae` 重新生成骨架。');
    process.exitCode = 1;
  }
}

function cmdToTrae() {
  console.log('重新生成 .trae/rules/project.md ...');
  const r = generateTraeProjectMd();
  if (r.ok) {
    console.log('已写入 ' + r.bytes + ' 字节到 .trae/rules/project.md');
  } else {
    console.error('生成失败: ' + r.reason);
    process.exitCode = 1;
  }
}

function cmdMirrorMcp() {
  if (!fs.existsSync(ROOT_MCP_JSON)) {
    console.error('根 .mcp.json 不存在，无法镜像');
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(TRAE_DIR)) fs.mkdirSync(TRAE_DIR, { recursive: true });
  const content = fs.readFileSync(ROOT_MCP_JSON, 'utf8');
  fs.writeFileSync(TRAE_MCP_JSON, content, 'utf8');
  console.log('已将根 .mcp.json 复制到 .trae/mcp.json（' + content.length + ' 字节）');
  console.log('   Windows / git core.symlinks=false 时使用此模式；其他平台可改为符号链接以零成本同步。');
}

/**
 * 把 .claude/skills/* 完整复制到 .trae/skills/。
 *
 * 设计：不是符号链接（Windows 不友好）。每次镜像：
 *  - 删除 .trae/skills/ 下不在 .claude/skills/ 里的目录
 *  - 逐个 cp -r 每个 skill 目录
 *  - 输出每个 skill 的字节数
 *
 * 提示：发哥在 Trae IDE 里"修改" .trae/skills/xxx 不会被反向同步回 Claude Code，
 *       所以日常只在 .claude/skills/ 维护 skills。
 */
function cmdMirrorSkills() {
  if (!fs.existsSync(CLAUDE_SKILLS_DIR)) {
    console.error('.claude/skills/ 不存在，无法镜像');
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(TRAE_DIR)) fs.mkdirSync(TRAE_DIR, { recursive: true });
  if (!fs.existsSync(TRAE_SKILLS_DIR)) fs.mkdirSync(TRAE_SKILLS_DIR, { recursive: true });

  const claudeSkills = listSkillNames(CLAUDE_SKILLS_DIR);
  const traeSkills = listSkillNames(TRAE_SKILLS_DIR);

  // 删除 Trae 端多余目录
  const toRemove = traeSkills.filter(function (n) { return claudeSkills.indexOf(n) === -1; });
  for (const n of toRemove) {
    const full = path.join(TRAE_SKILLS_DIR, n);
    fs.rmSync(full, { recursive: true, force: true });
    console.log('  - 删除多余: ' + n);
  }

  // 复制每个 skill
  for (const name of claudeSkills) {
    const src = path.join(CLAUDE_SKILLS_DIR, name);
    const dst = path.join(TRAE_SKILLS_DIR, name);
    copyDirSync(src, dst);
    const totalBytes = countBytes(dst);
    console.log('  + 同步: ' + name + ' (' + totalBytes + ' 字节)');
  }
  console.log('已镜像 ' + claudeSkills.length + ' 个 skill 到 .trae/skills/');
}

function copyDirSync(src, dst) {
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function countBytes(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += countBytes(full);
    else if (entry.isFile()) total += fs.statSync(full).size;
  }
  return total;
}

function cmdToClaude() {
  console.log('to-claude 为备用命令 -- 事实层只在 CLAUDE.md 维护。');
  console.log('如需把 .trae/rules/project.md 的事实层回写到 CLAUDE.md，请用 `from-trae [--apply]`。');
}

/**
 * 把 Trae 端 .trae/rules/project.md 的事实层回写到 CLAUDE.md / AGENTS.md。
 *
 * 算法：
 *  1. 解析 .trae/rules/project.md，跳过 frontmatter，提取 ## N 段。
 *  2. 解析 CLAUDE.md，按 ## N 段切片。
 *  3. 对每个 Trae 端 ## N 段：
 *     - 找到 CLAUDE.md 中对应的 ## N.（按编号匹配，前缀一致即视为同一节）
 *     - 如果 Trae 端内容明显比 Claude 端「精简」（机器骨架特征，长度比 < 0.7），跳过
 *     - 如果内容真正不同（人工编辑），标记为「需回写」
 *     - 完全相同则跳过
 *  4. 默认只输出 diff（不发哥明确 --apply 不动文件）
 *  5. --apply 时，按 ## N 段原地替换 CLAUDE.md 内容（同步到 AGENTS.md）
 *  6. 保留 CLAUDE.md 末尾的会话级指令（§7 §11 §12 等不会被 Trae 端覆盖）
 *     —— 因为我们只替换 ## N 段，不动其他段落。
 *
 * 防「精简骨架→Claude 端」退化：
 *   Trae 端事实层由 to-trae 自动从 CLAUDE.md 提取并精简，永远是 Claude 端的子集。
 *   如果直接 --apply，会把 Claude 端更丰富的版本退化。
 *   因此引入「长度比」启发式 + 「人工标记」检测：
 *   - 长度比 < 0.7：认为是机器骨架，跳过（不报差异、不回写）
 *   - Trae 端章节内含 `<!-- hand-edited -->` 标记：强制视为人工编辑，绕过长度比检查
 *   - --force：忽略长度比，强制报所有差异（高级用户手动用）
 */

const SKELETON_RATIO = 0.7;
const HAND_EDITED_TAG = '<!-- hand-edited -->';

function syncFromTrae(apply, force) {
  if (!fs.existsSync(TRAE_PROJECT_MD)) {
    return { ok: false, reason: '.trae/rules/project.md 不存在' };
  }
  if (!fs.existsSync(CLAUDE_MD)) {
    return { ok: false, reason: '根 CLAUDE.md 不存在' };
  }
  const trae = fs.readFileSync(TRAE_PROJECT_MD, 'utf8');
  const claude = fs.readFileSync(CLAUDE_MD, 'utf8');

  const traeBody = trae.replace(/^---\n[\s\S]*?\n---\n/, '');
  const traeSections = parseSections(traeBody);
  const claudeSections = parseSections(claude);

  const diffs = [];
  const skipped = [];
  for (const t of traeSections) {
    // 只回写纯数字章节（如 ## 1.、## 2.），跳过 ## 11./## 12. 这种
    // Trae 端独有的「Skill 提示」「Memory 提示」章节
    const m = t.header.match(/^## (\d+)\.\s*(.+)$/);
    if (!m) continue;
    const num = m[1];
    const traeTitle = m[2].trim();

    // 按标题关键词匹配 Claude 端对应章节（不按编号！
    // —— 因为 Trae 骨架会重编号，跟 Claude 端原编号对不上）。
    // 匹配规则：标题去除括号/数字/标点后的「核心关键词」一致。
    const c = findClaudeSectionByTitle(claudeSections, traeTitle);
    if (!c) {
      // Claude 端没有同标题章节，说明这是 Trae 端独有（如「Skill 提示」「Memory 与 Agent 提示」）
      skipped.push({ header: t.header, reason: 'Trae 独有章节，无对应 Claude 章节' });
      continue;
    }
    if (c.body.trim() === t.body.trim()) continue;

    const traeLen = t.body.trim().length;
    const claudeLen = c.body.trim().length;
    const ratio = claudeLen > 0 ? traeLen / claudeLen : 1;
    const handEdited = t.body.indexOf(HAND_EDITED_TAG) !== -1;

    // 启发式：Trae 端明显精简（机器骨架特征）+ 没有人工标记 → 跳过
    if (!force && !handEdited && ratio < SKELETON_RATIO) {
      skipped.push({
        header: t.header,
        ratio: Math.round(ratio * 100) + '%',
        traeLen: traeLen,
        claudeLen: claudeLen,
        claudeHeader: c.header,
      });
      continue;
    }

    diffs.push({
      traeHeader: t.header,
      claudeHeader: c.header,
      traeBody: t.body,
      claudeBody: c.body,
      handEdited: handEdited,
      ratio: Math.round(ratio * 100) + '%',
    });
  }

  if (diffs.length === 0 && skipped.length === 0) {
    console.log('Trae 端事实层与 CLAUDE.md 完全一致，无需回写。');
    return { ok: true, applied: 0 };
  }

  if (diffs.length === 0) {
    console.log('Trae 端事实层与 CLAUDE.md 无有效差异（已自动跳过 ' + skipped.length + ' 项）。');
    console.log('   提示：to-trae 生成的章节永远是 Claude 端的精简版，正常情况下不应回写。');
    console.log('   如需在 Trae 端手工编辑后回写，请在对应章节里加 ' + HAND_EDITED_TAG + ' 标记后再跑 from-trae。');
    console.log('   或者加 --force 强制报告所有差异（--apply 会把 Claude 端退化为 Trae 端精简版，慎用）。');
    if (skipped.length > 0) {
      console.log('');
      console.log('跳过的项：');
      for (const s of skipped) {
        console.log('  - ' + s.header + (s.claudeHeader ? ' ↔ ' + s.claudeHeader : '') +
          (s.ratio ? ' (' + s.ratio + ')' : '') +
          (s.reason ? ' [' + s.reason + ']' : ''));
      }
    }
    return { ok: true, applied: 0, skipped: skipped.length };
  }

  console.log('Trae → Claude 事实层差异（' + diffs.length + ' 章节需回写，' + skipped.length + ' 项已跳过）：\n');
  for (const d of diffs) {
    const tag = d.handEdited ? ' [HAND-EDITED]' : ' [' + d.ratio + ']';
    console.log('--- ' + d.traeHeader + ' ↔ ' + d.claudeHeader + tag + ' ---');
    console.log('  Trae (' + d.traeBody.trim().length + ' 字符):');
    console.log(indent(d.traeBody.trim(), '    '));
    console.log('  Claude (' + d.claudeBody.trim().length + ' 字符):');
    console.log(indent(d.claudeBody.trim(), '    '));
    console.log('');
  }
  if (skipped.length > 0) {
    console.log('已跳过的项：');
    for (const s of skipped) {
      console.log('  - ' + s.header + (s.claudeHeader ? ' ↔ ' + s.claudeHeader : '') +
        (s.ratio ? ' (' + s.ratio + ')' : '') +
        (s.reason ? ' [' + s.reason + ']' : ''));
    }
    console.log('');
  }

  if (!apply) {
    console.log('如需应用以上差异到 CLAUDE.md / AGENTS.md，请加 --apply');
    return { ok: true, applied: 0, diffs: diffs.length };
  }

  // --apply：按章节原始片段（Claude 端）替换为 Trae 端内容
  let updated = claude;
  for (const d of diffs) {
    const c = claudeSections.find(function (x) {
      return x.header === d.claudeHeader;
    });
    if (!c) continue;
    const newBody = d.traeBody.replace(HAND_EDITED_TAG, '').trimEnd();
    updated = updated.replace(c.raw, d.claudeHeader + '\n' + newBody + '\n');
  }
  fs.writeFileSync(CLAUDE_MD, updated, 'utf8');
  fs.writeFileSync(AGENTS_MD, updated, 'utf8');
  console.log('已应用 ' + diffs.length + ' 章节到 CLAUDE.md / AGENTS.md');
  return { ok: true, applied: diffs.length };
}

/**
 * 按标题关键词在 Claude 端章节里找匹配项。
 * 匹配策略：去除标题中的括号内容、数字、标点、空格，转小写后比对。
 * 例：「代码规范」↔「代码规范（含 .clauderules）」→ 命中
 */
function findClaudeSectionByTitle(claudeSections, traeTitle) {
  const norm = function (s) {
    return s
      .replace(/[（(][^）)]*[）)]/g, '') // 去括号内容
      .replace(/[^一-龥a-zA-Z0-9]/g, '') // 去标点
      .toLowerCase();
  };
  const t = norm(traeTitle);
  for (const c of claudeSections) {
    const headerTitle = (c.header.match(/^## \d+\.\s*(.+)$/) || [])[1] || c.header;
    if (norm(headerTitle) === t) return c;
  }
  return null;
}

/** 把 markdown 按 ## N. 章节切分，header + body + 原始片段。 */
function parseSections(md) {
  const lines = md.split('\n');
  const sections = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(/^(## \d+\. .+)$/);
    if (m) {
      if (current) sections.push(current);
      current = { header: m[1], body: '', raw: m[1] + '\n' };
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line;
      current.raw += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections;
}

function indent(text, prefix) {
  return text
    .split('\n')
    .map(function (l) {
      return prefix + l;
    })
    .join('\n');
}

const sub = process.argv[2];
const apply = process.argv.indexOf('--apply') !== -1;
const force = process.argv.indexOf('--force') !== -1;
switch (sub) {
  case 'check':
    cmdCheck();
    break;
  case 'to-trae':
    cmdToTrae();
    break;
  case 'mirror':
    cmdMirrorMcp();
    break;
  case 'mirror-skills':
    cmdMirrorSkills();
    break;
  case 'from-trae':
    syncFromTrae(apply, force);
    break;
  case 'to-claude':
    cmdToClaude();
    break;
  default:
    console.log('用法: node scripts/sync-ai-config.js <check|to-trae|mirror|mirror-skills|from-trae [--apply|--force]|to-claude>');
    process.exitCode = 1;
}