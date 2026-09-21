# 左岸AI提示词库（app-web）子系统说明书

> 本文档是 `app-web` 子系统的项目说明书，供 AI Agent（开发助手）在理解、修改、扩展本子系统时使用。请在动手前通读本文件。

## 1. 子系统概述

**名称**：web 端示例项目（`@anhui/app-web`）

**定位**：提示词平台各分类效果展示的 **Web 端示例项目**，按分类（页面布局 / 地图 / 排版 / 弹框布局 / 特效 / 图表 / 小组件 / 背景 / 字体）沉淀可复用的示例组件与视觉规范。

**所属工程**：`anhui-agri-data-plat`（左岸AI提示词库）Monorepo，本子系统位于 `apps/app-web`。

## 2. 技术栈

| 类别     | 技术                                  | 说明                                          |
| -------- | ------------------------------------- | --------------------------------------------- |
| 框架     | Vue 3.5                               | Composition API +`<script setup lang="ts">` |
| 语言     | TypeScript 5.7                        | `strict`                                    |
| 构建     | Vite 6                                | 配置见`vite.config.ts`                      |
| UI 库    | Ant Design Vue 4                      | 组件自动按需注册                              |
| 状态管理 | Pinia 3 + pinia-plugin-persistedstate | 主题持久化                                    |
| 路由     | Vue Router 4                          | `createWebHashHistory`（hash 模式）         |
| 样式     | SCSS（sass-embedded）                 | 主题变量 + 全局 reset                         |
| 图表     | ECharts 5                             | `^5.5.1`（实际安装 5.6.0）                  |
| 包管理   | pnpm + workspace                      | Monorepo（Turborepo）                         |

**关键依赖版本见** `package.json`；`vue`、`vite`、`vue-router` 版本由 workspace `catalog` 统一管理（见根目录 `pnpm-workspace.yaml`）。

## 3. 目录结构

```
apps/app-web/
├── src/
│   ├── components/layout/index.vue      # 整体布局（分类导航 + 内容区）
│   ├── router/index.ts                  # 路由配置（9 分类动态生成）
│   ├── store/
│   │   ├── index.ts                     # Pinia 实例 + persistedstate 插件
│   │   └── modules/theme.ts             # 主题状态（light/dark 切换）
│   ├── styles/
│   │   ├── index.scss                   # 入口
│   │   ├── variables.scss               # 主题/功能色变量
│   │   ├── theme.scss                   # 明暗主题（CSS 变量）
│   │   └── global.scss                  # 全局 reset 与基础样式
│   ├── views/
│   │   ├── layout|map|typography|modal|effect|chart|widget|background|font/
│   │   │   ├── index.vue                # 分类展示页
│   │   │   └── component/               # 该分类下的示例组件（见 §8）
│   │   ├── home/index.vue               # 首页
│   │   └── notFound/index.vue           # 404
│   ├── App.vue                          # 根组件（a-config-provider + 主题同步）
│   ├── main.ts                          # 入口
│   └── vite-env.d.ts
├── typings/                             # auto-imports.d.ts / components.d.ts（自动生成）
├── .env.development / .env.production
├── deploy.config.js
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 4. 构建与工程配置

- **别名**：`@` → `src`（一律使用 `@/xxx` 引用）。
- **自动导入**：
  - `unplugin-auto-import`：自动导入 `vue`、`vue-router` API（显式 import 亦不报错）。
  - `unplugin-vue-components` + `AntDesignVueResolver`：`a-xxx` 组件自动按需注册。
- **本地 HTTPS**：`vite-plugin-mkcert`，开发地址 `https://localhost:8889`。
- **端口 / 输出目录**：来自 `@anhui/app-config` 的 `appWeb`（端口 `8889`，`outDir: 'dist/'`）。
- **环境变量**：`VITE_APP_SERVER`（development=test，production=prod）。

## 5. 路由

- 路由模式：hash（`createWebHashHistory`）。
- 首页 `/` 挂载布局组件，子路由为 9 个分类页（由 `buildCategoryRoutes()` 动态生成：`layout/map/typography/modal/effect/chart/widget/background/font`）。
- `/:pathMatch(.*)*` → 404。

## 6. 状态管理（Pinia）

- `useThemeStore`（`src/store/modules/theme.ts`）：`theme`（`light`/`dark`）、`isDark`、`setTheme`、`toggleTheme`。
- 主题通过 `document.documentElement.setAttribute('data-theme', mode)` 切换，样式用 CSS 变量适配（见 `src/styles/theme.scss`）。
- 持久化 key：`app-web-theme`。

## 7. 代码规范（必读）

### 7.1 命名规范（来自根目录 `.clauderules`）

| 对象       | 规范                 | 示例                  |
| ---------- | -------------------- | --------------------- |
| 组件文件   | PascalCase           | `ChatMessage.vue`   |
| 组合式函数 | `use` + PascalCase | `useAudioStream.ts` |
| 普通文件   | kebab-case           | `open-url.ts`       |
| 变量/函数  | camelCase            | `userName`          |
| 常量       | UPPER_SNAKE_CASE     | `WHITE_LIST`        |
| CSS 类名   | kebab-case           | `.stat-card`        |

### 7.2 格式规范

- 缩进 2 空格；单引号；句末分号；文件末尾换行。
- 对象内空格 `{ foo: 'bar' }`；数组无多余空格 `[1, 2, 3]`；尾随逗号（`trailingComma: 'all'`）。
- ESLint / Prettier / Stylelint 规则集中在 `configs/lint/*.js`，**不要私自改**。

### 7.3 Vue 组件规范

- 使用 `<script setup lang="ts">`。
- Props 用 TS 类型定义，事件用 `defineEmits`。

## 8. 公共组件规范（以 `gradient-bar` 为模版）

> 本章沉淀了 `apps/app-web/src/views/chart/component/gradient-bar/index.vue` 的完整生成过程，作为后续新增**公共组件**的标准模板。该组件由外部项目 `D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB102.vue` 迁移改造而来。
>
> 本规范**不限于图表组件**，适用于整个项目所有 `src/views/<category>/component/<name>/` 下的公共组件。

### 8.1 最小单元与自包含（必读）

- **模版功能展示项目**：`app-web` 是模版功能展示项目，每个 `src/views/<category>/component/<name>/` 目录是一个**最小单元**（如 `chart/component/gradient-bar/`）。
- **自包含**：该组件的全部内容——模板、脚本、样式、内联依赖函数、图片物料——**全部放进该目录内**，**不引用目录外部的资源**。
- **允许的外部依赖**：仅框架（Vue）与图表库（ECharts）本身；图片物料放入 `<组件目录>/assets/`，不使用 `@/assets` 等外部路径。

### 8.2 生成流程

新增一个公共组件按以下顺序执行：

1. **读源组件**：通读源组件代码，识别「图表/视觉核心配置」与「外部依赖」两类内容。外部依赖包括：面板容器（如 GSPlate）、状态管理（vuex `mapGetters`）、全局注入（`$echarts`）、接口数据（`plateVO`）、工具函数（`debounce`）、图表库及其版本。
2. **剥离外部依赖**：将面板容器、状态管理、全局注入、接口数据全部移除，改为**组件内自包含渲染 + mock 数据**。
3. **内联依赖函数**：将依赖的工具函数（如 `debounce`）**拷贝进组件内部**，保持组件零外部依赖（仅依赖框架与图表库本身）。
4. **确定依赖与版本**：新依赖加入本子系统 `package.json` 的 `dependencies`（如 `echarts: ^5.5.1`），执行 `pnpm install --filter @anhui/app-web` 安装。
5. **版本适配**：源项目若使用旧版库（如 echarts 4），需适配到当前版本（echarts 5）：
   - 渐变色对象补全 `x2`/`y2`（echarts 5 类型要求必填）：`{ type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [...] }`。
   - `axisLabel.textStyle` 改为 `axisLabel` 直接属性（`color`/`fontSize`/`align`/`lineHeight`）。
6. **新建组件目录**：`src/views/<category>/component/<kebab-case-name>/index.vue`。
7. **引用展示**：在分类页 `src/views/<category>/index.vue` 中 `import` 并展示组件。
8. **颜色提炼**：见 §8.6。
9. **通用化 mock 数据**：见 §8.7。

### 8.3 命名规范

- **组件以功能/效果命名**，禁止使用业务相关命名。例：图表效果是「水平渐变柱状图」，命名为 `GradientBar`，而非 `CropYieldBar`（种植产量）。
- 组件名 / 函数名 / 类名 / 图片名均要求**简单易懂**：组件名 `GradientBar`，目录 `gradient-bar`，CSS 类前缀 `gradient-bar`，函数 `initChart` / `refreshChart` / `handleResize` / `debounce`。

### 8.4 头部注释规范（每个组件必写）

组件文件顶部必须包含以下内容：

```html
<!--
  组件名称：GradientBar（水平渐变柱状图）
  来源迁移：<源文件绝对路径>

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量：...（见 §8.6，如组件含颜色则必须列出）

  迁移说明：
    1. 去除了哪些外部依赖、改为 mock 数据。
    2. 拷贝了哪些依赖函数。
    3. 配置与源组件的一致性说明。
    4. 是否包含图片物料（无则说明无需 assets）。
-->
```

### 8.5 颜色变量规范

- 组件内所有颜色**统一提炼为 CSS 自定义属性**，命名前缀 `--<组件短名>-*`（如 `--gb-*`），定义在组件根元素的 `<style>` 中。
- **顶部注释必须逐项列出颜色变量表**（变量名 / 色值 / 用途）。
- 引用方式分两处：
  - SCSS 样式：直接用 `var(--gb-xxx)`。
  - ECharts（canvas 渲染不支持 CSS 变量）：通过 `getComputedStyle` 运行时读取同名变量（封装为 `readBarColors()`，读取失败回退到默认色）。

> 这样做的收益：作为公共组件，使用者可仅通过覆盖 CSS 变量完成换肤，无需改动 JS 配置。

### 8.6 通用 mock 数据规范

- 组件内的示例数据**不得包含业务名称**，改用通用命名：
  - 元素名「水稻产量」→「元素一」。
  - 单位「万吨」→「单位」。

### 8.7 图片物料规范

- 若组件需要图片物料，从来源项目拷贝后放入 `<组件目录>/assets/` 下，命名易懂（kebab-case）。
- 纯 ECharts / CSS 绘制的组件无图片物料，无需 `assets` 目录，并在头部注释中注明。

### 8.9 特别规则

- 1.所有 `views/chart/component/*` 组件**不要给整个组件（根元素）设置 `background` 与 `box-shadow`**。**局部的可以有**：例如 ECharts tooltip 的 `backgroundColor`、单个柱体 / 元素的配色与阴影等局部效果允许。
- 

## 9. 常用命令

```bash
# 子系统（在 apps/app-web 目录）
pnpm start      # 启动开发服务器（https://localhost:8889）
pnpm build      # 生产构建（输出 dist/）
pnpm deploy     # 构建并 SSH 部署
pnpm preview    # 预览构建产物

# 工程级（在根目录）
pnpm bootstrap            # 安装依赖
pnpm start                # 启动（gtask，多应用）
pnpm build                # 构建
pnpm publish              # 部署
pnpm format               # 全部格式检查
```

## 10. AI Agent 开发注意事项

1. **改代码前先读本文件与相关源文件**，不要臆测结构。
2. **路径引用**统一使用 `@/` 别名，禁止相对深层路径 `../../`。
3. **新增示例组件**：遵循 §8 的公共组件规范；组件放入 `src/views/<category>/component/<name>/`，在分类页 `index.vue` 中引用展示。
4. **新增依赖**：加入本子系统 `package.json`，并在组件头部注释注明版本与 node/pnpm 运行环境。
5. **颜色**：组件颜色一律提炼为 CSS 变量并在顶部注释列举（§8.6）。
6. **禁止**：私自修改 `configs/lint/*`、根目录 `.*rc.js`、`pnpm-workspace.yaml`、`turbo.json` 等工程级配置。
