# 左岸AI提示词库（anhui-agri-data-plat）项目说明书

> 本文档是「左岸AI提示词库」工程的**总项目说明书**，供 AI Agent（开发助手）在理解、修改、扩展整个工程时使用。请在动手前通读本文件；各子应用还有各自的说明书（如 `apps/app-prompt/AGENTS.md`）。

## 1. 项目概述

**工程名**：`anhui-agri-data-plat`（左岸AI提示词库）

**定位**：基于 AI 大模型、面向农业领域（主粮作物物候期知识库等）的智能应用平台，采用 **Turborepo + pnpm workspace** 的 Monorepo 结构，支持 Web（Vite）与 uniapp（小程序）多端应用。

**当前应用清单**：

| 应用 | 包名 | 说明 | 状态 |
|------|------|------|------|
| app-prompt | `@anhui/app-prompt` | 左岸AI提示词库（后台管理端，端口 8888） | 开发中（详见 [apps/app-prompt/CLAUDE.md](apps/app-prompt/CLAUDE.md)） |
| app-web | `@anhui/app-web` | Web 端示例项目（端口 8889，含 ECharts 等分类组件） | 开发中（详见 [apps/app-web/CLAUDE.md](apps/app-web/CLAUDE.md)） |

> 注：根目录 `CLAUDE.md` 中提到的 `app-farming-model` 为历史模板描述，当前仓库实际仅含 `app-prompt`。

## 2. 技术栈（工程级）

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
├── apps/                     # 业务应用（pnpm workspace）
│   ├── app-prompt/           # 左岸AI提示词库（后台管理端）
│   └── app-web/              # Web 端示例项目（按分类沉淀可复用组件）
├── configs/                  # 工程级配置（workspace 包）
│   ├── app/                  # 应用 + API 配置（@anhui/app-config）
│   │   ├── index.js          # 端口/输出目录/Dify 密钥等
│   │   └── types/index.d.ts  # 配置 TS 类型
│   └── lint/                 # 共享 lint 规则（@config/lint）
│       ├── eslint.js
│       ├── prettier.js
│       ├── stylelint.js
│       ├── commitlint.js
│       └── lintstaged.js
├── scripts/tasks/            # gtask 任务定义（@scripts/tasks）
│   ├── index.js              # CLI 入口（bin: gtask）
│   ├── config/index.js       # 服务节点/钉钉通知/忽略项
│   ├── helper/index.js       # 任务核心逻辑（workspace 扫描、runTask 等）
│   ├── helper/logger.js      # log4js 日志
│   └── src/
│       ├── start.js          # gtask start（工程启动）
│       ├── build.js          # gtask build（工程打包）
│       ├── deploy.js         # gtask deploy（工程部署）
│       ├── app.start.js      # gtask appStart（单应用启动）
│       ├── app.build.js      # gtask appBuild（单应用打包）
│       └── app.deploy.js     # gtask appDeploy（单应用部署）
├── .clauderules              # 全局开发规范（命名/格式/Vue/API/Git）
├── CLAUDE.md                 # 历史项目说明（含 app-farming-model 模板描述）
├── README.md                 # 简要说明
├── api.md                    # Dify 知识库数据集 API 文档
├── .mcp.json                 # 可用 MCP 服务
├── pnpm-workspace.yaml       # workspace 定义 + catalog
├── turbo.json                # Turborepo 任务配置
├── package.json              # 根包（脚本/依赖）
└── 各类 .*rc / .editorconfig  # lint/格式/编辑器配置
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

## 6. 配置说明

### 6.1 应用/API 配置（`configs/app/index.js`）

- `appPrompt`：host `0.0.0.0`、port `8888`、outDir `dist/`、测试/正式线上地址。
- `apiConfig`：Dify 问答服务地址（`difyUrlProd/Test`）、气象后台地址（`weatherAdminUrlProd/Test`）、知识库数据集密钥（`datasetKeyProd/Test`）与主粮作物物候期知识库 ID（`datasetIdProd/Test`）。

### 6.2 任务配置（`scripts/tasks/config/index.js`）

- `serviceListMap`：`test`（mode=development，默认勾选）、`prod`（mode=production）。
- `SEND_CONFIG`：钉钉机器人 webhook/secret（部署通知）。
- `IGNORE_WORKSPACE`：`packages/*`、`configs/*`、`scripts/*`、`docs/*`、`internal/*`（这些不作为可运行应用）。

### 6.3 部署配置

- 各应用通过 `deploy.config.js`（如 `apps/app-prompt/deploy.config.js`）配置 SSH 服务器（host/port/username/password 为加密值，`distPath`、`webDir` 等）。
- 部署触发 `deploy publish --env=test|prod`，前后发送钉钉通知。

## 7. 环境变量

| 变量 | 说明 |
|------|------|
| `MODE` / `NODE_ENV` | 服务端模式（development/production），由 gtask 注入 |
| `ZA_APP_COMMAND` | 运行方式（start/build/deploy），影响 Vite base 路径 |
| `PRO_DOCS` | 是否部署文档 |
| `FOR_ALL_SCREEN` | appH5 是否兼容双屏 |
| `VITE_APP_SERVER` | 子应用环境（test/prod） |
| `VITE_*`（动态） | 由 `appConfigToEvn` 从 `@anhui/app-config` 生成 |

## 8. 代码规范

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

## 9. API 接口

- 知识库数据集的文档/元数据/分段管理等 REST 接口，详见根目录 `api.md`（Dify 数据集 API，正式服 `https://multiapi.ahnw.cc`）。

## 10. 可用 Skills 与 MCP

### 10.1 Skills（供开发助手调用）

`.claude/skills/` 目录下已按项目实际需求精简 11 个 Skill：

| Skill | 场景 |
|-------|------|
| vue / vue-best-practices / vue-router-best-practices | Vue 3 开发 |
| vueuse-functions | VueUse 组合式工具函数（按需引入） |
| pinia | 状态管理 |
| vite | 构建配置 |
| pnpm | 包管理 |
| turborepo | Monorepo 任务编排 |
| ui-ux-pro-max / frontend-design | UI/UX 还原 |
| drawio | 架构图 / ERD / UML / 流程图 |

### 10.2 MCP（`.mcp.json`）

| MCP | 用途 |
|-----|------|
| playwright | 浏览器自动化测试 |
| git | Git 操作 |
| context7 | 库/框架文档查询 |
| figma | Figma 设计稿读取 |
| jcodemunch | 代码检索与符号定位（首选；不要再用 Read/Grep 翻代码） |

## 11. AI Agent 开发注意事项

1. **先读文档再动手**：根 `AGENTS.md`（本文档）+ `.clauderules` + 目标子应用 `AGENTS.md`。
2. **新增子应用**：在 `apps/` 建目录、在 `pnpm-workspace.yaml` 无需改动（已通配 `apps/*`）、在 `configs/app/index.js` 增加应用配置 key、在根 `package.json` 关注 `turbo:*` 脚本即可。
3. **版本依赖**：`vue`/`vite`/`vue-router` 等用 catalog 统一，新增统一依赖优先走 catalog。
4. **内部包引用**：配置用 `@anhui/app-config`，lint 用 `@config/lint`，任务用 `@scripts/tasks`（均为 `workspace:*`）。
5. **部署/密钥**：`deploy.config.js`、`.key.js`、`.osskey.js` 等含敏感信息，已在 `.gitignore` 中排除，**切勿提交**。
6. **文档一致性**：根 `CLAUDE.md` 与 `README.md` 含历史模板描述，与当前实际（仅 `app-prompt`）有出入，以本文档与实际代码为准。
7. **服务启动由用户主导（不可自动启动）**：
   - AI Agent **不得主动启动任何 dev server / 构建服务**（`vite` / `pnpm start` / `gtask start` / `gtask appStart` / `npx vite` 等），除非用户在本轮会话中**明确指示**「启动」「跑起来」「启动服务」。
   - 修改代码后如果需要重启服务才能生效，**只在回复中提醒用户手动重启**，不要替用户执行启动/重启命令。
   - 调试期间需要短跑命令（如 `pnpm build`、`curl`、`Get-NetTCPConnection` 等只读/瞬时命令）是可以的；持续监听端口的长跑进程（`pnpm start` / `npx vite`）一律由用户决定。
   - 原因：本机端口冲突严重（8888 / 8889 等），agent 自动启停极易造成旧进程未释放、端口被占、新进程 fallback 到别的端口，排查成本远高于「让用户自己按需启动」。
   - 排查端口冲突时可以用 `Get-NetTCPConnection -LocalPort <port> -State Listen` 查 PID，但**不要直接 `Stop-Process`** 杀掉用户的进程，除非用户明确授权。
