# Memory · Hot Cache

> 双层记忆体系的 hot cache。日常最常用的"人员/术语/项目"先放这里，查不到再去 `glossary.md` / `people/` / `projects/` / `context/`。
> 目标：覆盖 90% 日常解码需求，控制在 ~80 行以内。
> 维护规则见 `.claude/skills/memory-management/SKILL.md`。

## Me

发哥，前端开发工程师。主技术栈：HTML / CSS / JS / TS / Vue / React。
全局配置：`C:\Users\80640\.claude\CLAUDE.md`（开发偏好 + memory-mcp + serena）。

## People

| Who | Role |
|-----|------|
| _(暂无，遇到后补)_ |  |
→ 完整档案：`people/`；术语表：`glossary.md`

## Terms（项目常用缩写/黑话）

| 缩写 | 含义 |
|------|------|
| **gtask** | 自定义任务 CLI（`@scripts/tasks`），根目录 `pnpm start/build/publish` 都走它 |
| **appPrompt** | `@anhui/app-prompt`，左岸AI提示词库后台管理端（端口 8888） |
| **appWeb** | `@anhui/app-web`，Web 端示例（含 ECharts 分类组件，端口 8889） |
| **Dify** | 知识库问答服务（difyUrlProd/Test 在 `configs/app/index.js`） |
| **dataset** | Dify 知识库数据集（datasetKey / datasetId 同样在 `configs/app`） |
| **ZA_APP_COMMAND** | gtask 注入的环境变量（start/build/deploy），影响 Vite base |
| **catalog** | pnpm-workspace.yaml 集中管理的依赖版本（vue/vite/vue-router 等） |
→ 完整 glossary：`glossary.md`

## Projects（当前活跃）

| Name | What | Port |
|------|------|------|
| **app-prompt** | 左岸AI提示词库后台 | 8888 |
| **app-web** | Web 端示例 / 组件分类沉淀 | 8889 |
→ 详情：`projects/app-prompt.md` / `projects/app-web.md`

## Preferences（开发习惯）

- 代码导航优先用 **jCodeMunch-MCP**（不用 Read/Grep/Glob/Bash 翻代码）
- 改文件前 `Read` 一遍（harness 要求 Read 之后才能 Edit/Write）
- 不主动启动 dev server / build（端口冲突严重），由发哥手动启动
- 修改优先用 `Edit`，多文件差异输出
- 输出简洁，不加多余注释/docstring

## Quick Notes

- 配置文件含敏感信息的（`deploy.config.js` / `.key.js` / `.osskey.js`）已 `.gitignore`，**禁止提交**
- 项目级配置只读：根 `pnpm-workspace.yaml` / `turbo.json` / `configs/lint/*` / `scripts/tasks/*` 不要私自改
- 新增子应用：放 `apps/`，在 `configs/app/index.js` 加 key
- 同目录 `CLAUDE.md` ↔ `AGENTS.md` 必须保持一致