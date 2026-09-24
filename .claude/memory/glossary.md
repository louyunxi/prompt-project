# Glossary · 完整词典

> 凡是 hot cache (`CLAUDE.md`) 装不下的术语、人名、项目代号都落在这里。
> 维护规则见 `.claude/skills/memory-management/SKILL.md`。

## Acronyms（通用缩写）

| 缩写 | 含义 | 上下文 |
|------|------|--------|
| _(暂无，遇到后补)_ |  |  |

## Internal Terms（项目内部黑话）

| 术语 | 含义 |
|------|------|
| **gtask** | `@scripts/tasks` 包暴露的二进制，对应 `gtask start` / `gtask build` / `gtask deploy` / `gtask appStart` / `gtask appBuild` / `gtask appDeploy` |
| **runTask** | `scripts/tasks/helper/index.js` 里的核心函数，用 `pnpm ls -r` 扫 workspace 应用 |
| **appConfigToEvn** | 把 `@anhui/app-config` 扁平化成 `VITE_*` 环境变量注入应用的工具函数 |
| **serviceListMap** | `scripts/tasks/config/index.js` 里的服务端列表（`test` / `prod`） |
| **SEND_CONFIG** | 同上文件里的钉钉机器人 webhook / secret 配置 |
| **IGNORE_WORKSPACE** | 同上文件里不作为可运行应用的目录（packages/configs/grounds/docs/internal） |
| **catalog** | `pnpm-workspace.yaml` 里集中管理的依赖版本（vue / vite / vue-router / code-inspector-plugin / @tnnevol/deploy / postcss） |
| **workspace 包** | 内部包：`@anhui/app-config`（配置）、`@config/lint`（lint）、`@scripts/tasks`（gtask CLI） |
| **datasetKey / datasetId** | Dify 知识库数据集的访问密钥 / 数据集 ID，分 Prod/Test |
| **difyUrl / weatherAdminUrl** | Dify 问答服务 / 气象后台的地址，分 Prod/Test |
| **Dify 数据集 API** | 见根目录 `api.md`（正式服 `https://multiapi.ahnw.cc`） |
| **FOR_ALL_SCREEN** | gtask 注入的开关，appH5 是否兼容双屏 |
| **PRO_DOCS** | gtask 注入的开关，是否部署文档 |

## Nicknames → Full Names

| 昵称 | 全名 / 角色 |
|------|-------------|
| _(暂无，遇到后补)_ |  |

## Project Codenames

| 代号 | 项目 |
|------|------|
| **app-prompt** | `@anhui/app-prompt`，左岸AI提示词库后台管理端（端口 8888） |
| **app-web** | `@anhui/app-web`，Web 端示例项目（端口 8889） |
| **app-farming-model** | 历史模板描述，当前仓库已不含，仅作历史参考 |