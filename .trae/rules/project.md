---
name: project-overview
description: anhui-agri-data-plat project facts -- stack, layout, naming, Vue, commit
globs:
  - "**/*"
alwaysApply: true
---
# anhui-agri-data-plat

> Trae IDE 项目规则 -- 事实层（SoT 镜像）。Claude Code 请读根 CLAUDE.md。
> 修改根 CLAUDE.md 后请跑 `pnpm sync:ai to-trae` 重新生成本文件骨架。
## 1. 项目概述

定位：基于 AI 大模型、面向农业领域（主粮作物物候期知识库等）的智能应用平台，采用
**Turborepo + pnpm workspace** 的 Monorepo 结构，支持 Web（Vite）与 uniapp（小程序）多端应用。

**当前应用清单**：

| 应用 | 包名 | 端口 | 说明 |
|------|------|------|------|
| app-prompt | `@anhui/app-prompt` | 8888 | 后台管理端 |
| app-web | `@anhui/app-web` | 8889 | Web 端示例项目 |

## 2. 技术栈

| 类别 | 技术 | 版本约束 | 说明 |
|------|------|----------|------|
| 前端框架 | Vue 3 | `catalog: ^3.5.13` | 各 app 统一走 workspace catalog |
| 构建工具 | Vite | `catalog: ^6.2.0` | 每个 app 独立 `vite.config.ts` |
| 语言 | TypeScript | ~5.7.x | `strict` |
| 包管理 | pnpm | `>=9.12.0`，`packageManager: pnpm@10.12.4` | workspace 多包 |
| Monorepo | Turborepo | ^2.5.5 | 任务编排 + 缓存 |
| 任务 CLI | `tasksfile`（`gtask`） | ^5.1.1 | 自定义 start/build/deploy 任务（`@scripts/tasks`） |
| 部署 | `@tnnevol/deploy` + `@tnnevol/alioss` | — | SSH 部署 + 阿里云 OSS |
| 通知 | `@tnnevol/robot-ding` | 5.1.0 | 钉钉机器人部署通知 |
| 代码规范 | ESLint 8 + Prettier 2 + Stylelint 15 + commitlint 17 + lint-staged + husky | — | 规则集中在 `configs/lint` |

**环境要求**：Node `^20.19.0 || >=22.12.0`（`.nvmrc` 为 `v22`，volta 固定 `node 22.14.0`）。

## 3. 目录结构

```
anhui-agri-data-plat/
apps/app-prompt/          # 后台管理端
apps/app-web/             # Web 端示例项目
configs/app/              # @anhui/app-config
configs/lint/             # @config/lint
scripts/tasks/            # @scripts/tasks
.trae/                    # Trae IDE 项目规则
.claude/                  # Claude Code 配置
```

## 4. 包管理与 Workspace

- **workspace 包**（`pnpm-workspace.yaml`）：`apps/*`、`docs/*`、`configs/*`、`scripts/*`。
- **catalog 统一版本**：`vite`、`vue`、`vue-router`、`code-inspector-plugin`、`@tnnevol/deploy`、`postcss` 的版本由 catalog 集中管理，子应用引用时写 `catalog:`。
- **内部包**：`@anhui/app-config`（配置）、`@config/lint`（lint）、`@scripts/tasks`（gtask CLI）均为 `workspace:*` 依赖。
- **pnpm 设置**（`.npmrc`）：`shamefully-hoist=true`、`strict-peer-dependencies=false`、`shell-emulator=true`。

## 5. 构建 / 任务体系

### 5.1 两层命令

1. **工程级**（根目录，交互式选择 app 与服务端）：
   - `gtask start` / `gtask build` / `gtask deploy`，对应根 `pnpm start` / `build` / `publish`。
   - 支持 `--mode=development|production`、`--doc`（是否部署文档）、`--checkedAll`（默认全选）。
2. **应用级**（在某个 app 目录内，如 `apps/app-prompt`）：
   - `gtask appStart` / `gtask appBuild --projectName=appPrompt` / `gtask appDeploy`。

### 5.2 任务执行机制

- `scripts/tasks/helper/index.js` 中的 `runTask` 通过 `pnpm ls -r` 扫描 workspace 应用，交互式收集选择后调用 `pnpm -w run turbo:start|build|deploy`，由 Turborepo 并行分发到各应用。
- 注入的环境变量：`MODE`（服务端）、`NODE_ENV`、`PRO_DOCS`、`FOR_ALL_SCREEN`、`ZA_APP_COMMAND`（deploy/build/start）。
- `appConfigToEvn()` 将 `@anhui/app-config` 的配置扁平化为 `VITE_*` 环境变量注入应用。
- 打包时若传 `--projectName`，会将产物 copy 到工程根目录 `dist/`。

### 5.3 常用命令汇总

```bash
# 依赖
pnpm bootstrap

# 工程级
pnpm start      # 启动（交互选应用/服务端）
pnpm build      # 打包
pnpm publish    # 部署

# 单应用（cd apps/app-prompt 后）
pnpm start      # gtask appStart
pnpm build      # gtask appBuild --projectName=appPrompt
pnpm deploy     # gtask appDeploy

# 代码质量
pnpm format             # eslint + stylelint + prettier
pnpm lint:eslint
pnpm lint:prettier
pnpm lint:stylelint
```

## 6. 代码规范

### 8.1 命名规范（`.clauderules`）

| 对象 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `ChatMessage.vue` |
| 组合式函数 | `use` + PascalCase | `useAudioStream.ts` |
| 普通文件 | kebab-case | `open-url.ts` |
| 变量/函数 | camelCase | `userName` |
| 常量 | UPPER_SNAKE_CASE | `WHITE_LIST` |
| CSS 类名 | kebab-case | `.stat-card` |

### 8.2 格式规范

- 缩进 2 空格、单引号、句末分号、文件末尾换行（`.editorconfig`、`prettier.config.js`）。
- 对象内空格 `{ foo: 'bar' }`；数组无多余空格 `[1, 2, 3]`；尾随逗号 `all`；printWidth 80。
- 具体 ESLint/Stylelint 规则见 `configs/lint/eslint.js`、`configs/lint/stylelint.js`（各 app 通过根 `.*rc.js` 引用）。

### 8.3 Git 提交规范（commitlint）

```
feat: 新功能      fix: 修复 Bug      perf: 性能优化
refactor: 重构    style: 代码格式    test: 测试
docs: 文档        chore: 杂项        build/ci/workflow/types/wip/revert
```

- 任务关联：`feat: task#任务号`；Bug：`fix: bug#bug号`；header 最长 108 字符。

### 8.4 Vue 组件规范

- `<script setup lang="ts">`；Props 用 TS 类型；事件用 `defineEmits`。
- 组件按功能分目录存放；PC/Mobile 组件分版本存放。
- 移动端适配用 `postcss-px-to-viewport`（基准 375px，排除 `/pc/` 路径）。

## 7. API 接口

- 知识库数据集的文档/元数据/分段管理等 REST 接口，详见根目录 `api.md`（Dify 数据集 API，正式服 `https://multiapi.ahnw.cc`）。

## 8. MCP 服务

项目根 `.mcp.json` 已声明以下 MCP（Trae IDE 也能识别）：

- **playwright** — 浏览器自动化测试
- **git** — Git 操作
- **context7** — 库/框架文档查询
- **figma** — Figma 设计稿读取
- **jcodemunch** — 代码检索与符号定位（首选探索工具）

## 9. 关键文档入口

| 文档 | 内容 |
|------|------|
| `README.md` | 简要说明 |
| `CLAUDE.md` | Claude Code 项目说明书（与 `AGENTS.md` 同步） |
| `.clauderules` | Claude Code 专属开发规范 |
| `api.md` | Dify 知识库数据集 API 文档 |
| `apps/app-prompt/CLAUDE.md` | app-prompt 子应用说明 |
| `apps/app-web/CLAUDE.md` | app-web 子应用说明 |

## 10. 与根 CLAUDE.md 的关系

- 本文件**只镜像事实层**，不包含 Claude Code 专属的会话行为约束。
- 当根 `CLAUDE.md` 变更后，请运行 `pnpm sync:ai to-trae` 重新生成本文件骨架，再人工核对 Trae frontmatter。
- 反向同步（Trae → Claude）通常**不需要**，因为事实层只在 Claude Code 端维护。

## 11. Skill 提示（Claude Code skills 的间接引用）

Trae 没有显式 skills 目录约定。本项目把 `.claude/skills/` 内容镜像到 `.trae/skills/`（`pnpm sync:ai mirror-skills`），
遇到下面这些任务时，AI 应主动 `Read` 对应的 skill 文件，把它当作结构化提示词使用，而不是凭直觉给建议。
优先读 `.trae/skills/`（就近），真源在 `.claude/skills/`：

| 任务类型 | 参考 skill | 入口（优先 Trae 镜像） |
|----------|-----------|------|
| Vue 3 组件/API/性能 | vue / vue-best-practices | `.trae/skills/vue/SKILL.md`、`.trae/skills/vue-best-practices/SKILL.md` |
| Vue Router 路由设计 | vue-router-best-practices | `.trae/skills/vue-router-best-practices/SKILL.md` |
| VueUse 组合式工具 | vueuse-functions | `.trae/skills/vueuse-functions/SKILL.md` |
| Pinia 状态管理 | pinia | `.trae/skills/pinia/SKILL.md` |
| Vite 配置/构建 | vite | `.trae/skills/vite/SKILL.md` |
| pnpm workspace/版本 | pnpm | `.trae/skills/pnpm/SKILL.md` |
| Turborepo 编排 | turborepo | `.trae/skills/turborepo/SKILL.md` |
| UI/UX 还原 / 设计稿转代码 | ui-ux-pro-max / frontend-design | `.trae/skills/ui-ux-pro-max/SKILL.md`、`.trae/skills/frontend-design/SKILL.md` |
| 架构图 / ERD / 流程图 | drawio | `.trae/skills/drawio/SKILL.md` |
| Claude memory 管理 | memory-management | `.trae/skills/memory-management/SKILL.md` |

## 12. Memory 与 Agent 提示

- **没有文件级 memory**：Trae 记忆主要靠 user rules（IDE 设置面板里）与对话历史。
  跨会话长期记忆需在每次新对话开始时由用户手动提示，或在 user rules 里固化。
- **没有 subagent 机制**：复杂任务靠 AI 自行拆分（如「先分析依赖、再定位文件、最后改代码」），
  不能像 Claude Code 那样派发后台 subagent。
