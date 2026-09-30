# 左岸 AI 提示词库（app-web）子系统说明书

> 本文档是 `app-web` 子系统的项目说明书，供 AI Agent（开发助手）在理解、修改、扩展本子系统时使用。请在动手前通读本文件。

## 1. 子系统概述

**名称**：web 端示例项目（`@anhui/app-web`）

**定位**：提示词平台各分类效果展示的 **Web 端示例项目**，按分类（页面布局 / 地图 / 排版 / 弹框布局 / 特效 / 图表 / 小组件 / 背景 / 字体）沉淀可复用的示例组件与视觉规范。

**所属工程**：`anhui-agri-data-plat`（左岸 AI 提示词库）Monorepo，本子系统位于 `apps/app-web`。

## 2. 技术栈

| 类别     | 技术                                  | 说明                                          |
| -------- | ------------------------------------- | --------------------------------------------- |
| 框架     | Vue 3.5                               | Composition API +`<script setup lang="ts">`   |
| 语言     | TypeScript 5.7                        | `strict`                                      |
| 构建     | Vite 6                                | 配置见`vite.config.ts`                        |
| UI 库    | Ant Design Vue 4                      | 组件自动按需注册                              |
| 状态管理 | Pinia 3 + pinia-plugin-persistedstate | 主题持久化                                    |
| 路由     | Vue Router 4                          | `createWebHashHistory`（hash 模式）           |
| 样式     | SCSS（sass-embedded）                 | 主题变量 + 全局 reset                         |
| 图表     | ECharts 5                             | `^5.5.1`（实际安装 5.6.0）                    |
| 动画     | motion-v 2.5                          | `^2.5.1`，React 版 motion/react 的 Vue 移植   |
| SVG 形变 | flubber 0.4                           | `^0.4.2`，路径插值（`interpolate`/`combine`） |
| 圆角路径 | figma-squircle 1                      | `^1.1.0`，`getSvgPath` 生成超椭圆圆角         |
| 包管理   | pnpm + workspace                      | Monorepo（Turborepo）                         |

**关键依赖版本见** `package.json`；`vue`、`vite`、`vue-router` 版本由 workspace `catalog` 统一管理（见根目录 `pnpm-workspace.yaml`）。

## 3. 目录结构

```
apps/app-web/
├── src/
│   ├── components/
│   │   ├── layout/index.vue             # 整体布局（分类导航 + 内容区）
│   │   ├── comp-card/index.vue          # 分类页卡片公共容器（见 §8.13）
│   │   ├── comp-gallery/index.vue       # 排版分类的画廊页（typography 用）
│   │   └── component-preview/           # 组件预览弹框（见 §8.14）
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
│   │   ├── layout|map|typography|modal|effect|chart|widget|background|font|loading/
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

| 对象       | 规范               | 示例                |
| ---------- | ------------------ | ------------------- |
| 组件文件   | PascalCase         | `ChatMessage.vue`   |
| 组合式函数 | `use` + PascalCase | `useAudioStream.ts` |
| 普通文件   | kebab-case         | `open-url.ts`       |
| 变量/函数  | camelCase          | `userName`          |
| 常量       | UPPER_SNAKE_CASE   | `WHITE_LIST`        |
| CSS 类名   | kebab-case         | `.stat-card`        |

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
- **允许的外部依赖**：仅框架（Vue）与项目已声明的第三方库（ECharts、motion-v、flubber、figma-squircle、ant-design-vue / @ant-design/icons-vue）；图片物料放入 `<组件目录>/assets/`，不使用 `@/assets` 等外部路径。**目录内允许多个 SFC / 辅助文件**（如 `index.vue` + `TaskItem.vue`），`index.vue` 必须是入口。

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
- **暗色主题覆盖**（组件根类必须写进 `:global()` 选择器内）：
  ```scss
  :global(html[data-theme='dark'] .gb-root) {
    --gb-bar: #4a9eff;
  }
  ```
  ⚠️ **禁止**写成 `:global([data-theme='dark']) .gb-root { ... }`——Vue 的 scoped 编译会把尾部类名丢掉，编译结果为 `[data-theme=dark]{...}`，变量落到 `<html>` 上并被组件自身的同名定义覆盖，暗色**静默失效**。
- 例外：若组件配色本身由 props 驱动且已内置多套主题（如 `color="black|white|blue"`），或色值写死在 SVG 属性 / `feColorMatrix values` 等 CSS 变量无法表达的位置，可不提炼 `--*` 变量，但**必须在头部注释列出全部色值与原因**。

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

### 8.10 响应式规范

- 所有 `src/views/<category>/component/*/` 组件**尽可能考虑响应式**，通过**媒体查询**控制不同屏幕的兼容性。
- 组件样式需保证在以下三档屏幕下**展示大致相同**（布局不塌陷、文字/图形不错位、整体观感一致）：
  - `≤1280px`：小屏笔记本
  - `1281px – 1919px`：常规笔记本 / 桌面
  - `≥1920px`：大屏显示器

### 8.11 跨项目复制组件规范

复制 / 参考其他项目，在 `apps\app-web\src\views\**\component\**` 下实现相同功能组件时，必须遵守：

1. **完全还原功能效果**：组件的功能与视觉效果要与源组件保持一致，尽可能还原。
2. **不复制 API 接口**：去除源组件中的所有接口请求逻辑，改为**参考原组件数据结构模拟 mock 数据**；数据结构可**适当简化**，但字段命名要**通用**（不用业务字段名），文案标题也要**通用**（不用业务文案）。
3. **图片物料一并拷贝**：源组件涉及到的图片物料**全部拷贝过来**，放入 `<组件目录>/assets/` 下（命名 kebab-case、易懂）。
4. **按分类放置**：根据项目的 category 将组件放到合适的 `apps\app-web\src\views\**\` 分类目录中：
   - ECharts 图表组件 → 放入 `apps\app-web\src\views\chart\`。
   - 普通排版布局 → 放入 `apps\app-web\src\views\typography\`。
   - 其余类推（背景 →`background`、特效 →`effect`、字体 →`font`、弹框 →`modal`、地图 →`map` 等）。

### 8.12 rare-ui（React）组件迁移（2026-09）

源仓库 `E:\桌面\rare-ui-main\`（Next.js + Tailwind + `motion/react`）。组件源码在
`components/ui/<name>.tsx`，效果示例在 `app/components/(docs)/<name>/demo.tsx`。

**已迁入 18 个组件**：

| 分类     | 组件目录（`src/views/<cat>/component/`）                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `effect` | `bounce-sidebar` `fluid-orb` `gooey-nav` `grid-reveal` `hook-sidebar` `matrix-orb` `proximity-sidebar` `scroll-progress`                                        |
| `widget` | `animated-counter` `delete-button` `duration-picker` `emoji-reaction` `folder-component` `notification-bell` `otp-input` `step-player` `task-list` `voice-note` |

`widget/meta.ts` 中 tag 为「交互」（`folder-component` 等 9 个）与「数据展示」
（`animated-counter`）；`effect/meta.ts` 中 tag 为「导航」「光效」「滚动」。

两个分类页都由 `import.meta.glob` 自动收录组件目录，**新增目录本身无需改页**，
但要在对应 `meta.ts` 登记（`name` / `tag` / `label`），否则卡片上不显示 chip 标签。

**React → Vue 对照**：

| React                             | Vue 3                                         |
| --------------------------------- | --------------------------------------------- |
| `useState` / `useMemo`            | `ref` / `computed`                            |
| `useEffect` / `useLayoutEffect`   | `onMounted` / `watch(..., { flush: 'post' })` |
| `useRef`（DOM）                   | `ref<HTMLElement \| null>(null)`              |
| 回调 props（`onXxx`）             | `defineEmits`                                 |
| `createContext` / `useContext`    | `provide` / `inject`                          |
| `className={cn(...)}`             | `class` + `:class`（`cn()` 一律不引入）       |
| `next/link` `usePathname`         | 普通 `<a>` / `<button>` + 本地 `ref`          |
| `react-use-measure`               | 内联 `ResizeObserver`                         |
| `@radix-ui/react-slot`（asChild） | 去掉，固定根元素 + 原生 `<slot />`            |
| `lucide-react`                    | `@ant-design/icons-vue`                       |
| `react-apple-emojis`              | 原生 emoji 字形（不新增依赖、不联网）         |

**motion-v 要点**：

- 标签名与 React 版一致（`<motion.div>` `<motion.button>` `<motion.svg>` `<motion.path>` `<motion.li>` …）。
- `onAnimationComplete` 是 **prop**：`:on-animation-complete="fn"`。
- `useReducedMotion()` 返回 `Ref<boolean>`，取值须 `.value`。
- 点击态用 **`whilePress`**（不是 `whileTap`）。
- `animate` / `transition` 对象原样照搬（spring 参数可保留）。
- **居中不要用 `transform`**：motion-v 把 `x/y/rotate/rotateX` 写进内联 `transform`，会整体覆盖 SCSS 里的 `transform: translate(-50%, -50%)`。需要居中的 `motion.*` 元素请改用 CSS `translate: -50% -50%`。
- `defineProps` 的 `withDefaults` **不能引用局部声明的变量**（会被提升，编译报错），默认值必须内联字面量。

**容器适配**：这些组件最终渲染在画廊卡片内（宽约 240px 起、高 `calc(50vh - 180px)`，
外层 `display:flex` 居中 + `overflow:hidden`）。组件必须在受约束容器内可用——不要依赖
整屏 `100vh` 或 `position: fixed`；侧边栏类在自身根元素内定位（根 `position: relative`

- 内部绝对定位）；滚动类（`scroll-progress`）把滚动来源改为组件自身的滚动容器。

### 8.13 分类页（`src/views/<category>/index.vue`）布局标准

**参考模板：`src/views/chart/index.vue`**（`widget` / `background` / `effect` 同构）。

- **结构**：`header`（标题 + `共 N 个 / 每页 M 个 / 第 X / Y 页`）→ `grid` → `pager`，类名用 `xxx-page__*` BEM。
- **尺寸**：页面 `display:flex; flex-direction:column; gap:16px`，`min-height: calc(100vh - 152px)`，
  **页面自身不加 padding**（间距由内容区 padding + gap 提供）；网格 `height: calc(100vh - 240px)`，
  `3 列 × 2 行` 等分（`repeat(3, 1fr)` / `repeat(2, minmax(0, 1fr))`），`gap: 16px`。
- **分页**：**固定每页 6 个**（3×2 正好一屏，因此不要用动态 pageSize），`?page=N` hash 双向同步，
  切页时 `window.scrollTo({ top: 0 })`。分页条 `justify-content: center; gap: 8px`，**不加 margin**（靠页面 gap）。
- **卡片**：**统一使用公共容器组件 `@/components/comp-card`（`<CompCard>`）**，禁止各页再手写
  卡片 / stage / meta / chip / 名称 / 预览按钮的 DOM 与样式。
  - 组件职责：`stage`（flex 居中 + `overflow: hidden` + `:deep(> *)` 抹平组件自带 min-height）
    与 `meta`（左侧 chip + 名称，右侧「预览」（Play 图标）+「复制路径」，预览见 §8.14）、
    卡片圆角 `8px`、投影 `0 2px 8px -2px rgba(120, 120, 120, 0.25)`。
  - Props：`label`（必填，卡片名称）、`nameTitle`（tooltip，缺省用 label）、`tag`（chip 文案，
    不传不渲染 chip）、`tagColor`（chip 底色，各页自己的 tag→色值映射）、`srcPath`（复制按钮 tooltip）、
    `stageLayout`（`center` 默认居中留白 / `stretch` 子项铺满，地图用）。
  - Emits：`preview`、`copy`（页面各自接 `openPreview` / `copyPath`）。
  - **尺寸由各页面自己决定**：页面在 `<CompCard>` 上挂自己的卡片类名（class 透传到根元素），
    在里面写高度 / padding / 底色，并用 CSS 变量微调：
    `--comp-card-bg`、`--comp-card-padding`、`--comp-card-stage-bg`、`--comp-card-stage-min-height`、
    `--comp-card-meta-gap`、`--comp-card-meta-padding`、`--comp-card-name-color`、
    `--comp-card-chip-bg`、`--comp-card-radius`、`--comp-card-shadow`（取值见组件头部注释）。
- **卡片底色**：舞台背景恒为固定色时可直接硬编码（如 `chart` 的 `#fff` + `#05284b` 画布）；
  组件自身带明暗主题自适配的（如 `effect`）必须用默认的 `var(--card-bg)`，否则暗色主题下浅色文案落在白底上。
- **响应式**：`≤1280px` 降为 2 列 × 3 行，`≤760px` 降为 1 列 × 6 行（行数同步调整，
  避免出现隐式行破坏「一屏填满」）。

### 8.14 组件预览弹框（`src/components/component-preview/`）

卡片右下角的「预览」按钮，把 `/component-preview` 页的多容器预览区搬进弹框，
在当前页放大查看组件在 8 种常见容器尺寸下的渲染效果，无需跳转到「组件预览」页。

| 文件 | 职责 |
| --- | --- |
| `component-preview/index.vue` | 「组件预览」页（分类 / 组件两级选择器 + 预览区） |
| `component-preview/PreviewStage.vue` | 多容器预览区：8 个固定尺寸容器，每个容器内 flex 上下左右居中 |
| `component-preview/ComponentPreviewModal.vue` | **公共预览弹框**：宽 `80vw`、内容区高 `80vh`，内部即 `PreviewStage` |

**用法**（分类页 / 画廊卡片逐条持有 `previewName`）：

```html
<ComponentPreviewModal
  v-model:open="previewOpen"
  category="chart"
  :component-name="previewName"
  :title="previewTitle"
/>
```

- `destroyOnClose` 默认 `true`：预览区会同时挂载 8 份组件实例（echarts 等有重量级副作用），
  每次打开重新挂载可保证在正确容器尺寸下初始化、关闭即释放。
- 弹框尺寸覆盖写在组件内，选择器为 `:global(.component-preview-modal ...)`——
  a-modal 通过 teleport 挂到 body，scoped 样式够不到；三层类名是为了压过 `PreviewStage`
  自身的 scoped 规则（如 `min-height: 520px`）。
- 已接入：`chart` / `widget` / `effect` / `background` / `loading` 分类页，
  以及 `components/comp-gallery/index.vue`（typography）。新增分类页按同样方式接入。

## 9. 各板块特别注意

### 9.1 `views/chart` 板块（echarts 组件）

**所有 `src/views/chart/component/*/index.vue` 下的 echarts 组件，必须使用 `ResizeObserver` 监听容器（`chartRef`）尺寸变化，并在 `onBeforeUnmount` 中 `disconnect()` 释放观察器。禁止只依赖 `window.resize` 事件。**

**理由**：本子系统的 chart 组件经常被主应用（`apps/app-prompt` 的 `MicroContainer`）通过 qiankun 微前端 + DOM 移动的方式挂载到不同容器。`window.resize` 只在浏览器窗口缩放时触发，**无法覆盖**以下关键场景：

1. 组件从隐藏容器（`hiddenContainer`）`appendChild` 到真实容器（PcCompCard slot），父节点变化触发 reflow。
2. 主应用 grid 布局重排 / 父容器尺寸变化。
3. 主题切换、CSS 变量更新导致容器尺寸变化。

**实现模板**：

```typescript
/**
 * 尺寸自适应（防抖）：通过 ResizeObserver 监听 chartRef 容器尺寸变化，
 * 触发 echarts resize。覆盖三种场景：
 *   1. 窗口缩放（chartRef 尺寸跟着变）
 *   2. DOM 被 appendChild 到新容器（父节点变化触发 reflow）
 *   3. 父容器 grid 重排（如主应用把组件移到 PcCompCard slot）
 * 比 window.resize 监听更准确；组件销毁时 disconnect 释放 observer。
 */
const handleResize = debounce(() => {
  chartInstance?.resize();
}, 200);

/** chartRef 尺寸变化观察器 */
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  nextTick(() => {
    initChart();
    if (chartRef.value) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(chartRef.value);
    }
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  chartInstance?.dispose();
  chartInstance = null;
});
```

**检查清单**：每个 chart 组件新增/修改后，确认：

- [ ] 有 `let resizeObserver: ResizeObserver | null = null;` 声明
- [ ] `onMounted` 内 `initChart` 后调 `resizeObserver.observe(chartRef.value)`
- [ ] `onBeforeUnmount` 内调 `resizeObserver?.disconnect()` 并置 `null`
- [ ] 没有 `window.addEventListener('resize', ...)`（用 ResizeObserver 取代）

### 9.2 其他板块

后续新增板块如有类似「跨容器挂载 / DOM 迁移 / 父布局动态变化」的场景，应遵循 §9.1 的同等原则：用观察元素自身的 observer（如 `ResizeObserver`、`MutationObserver`）取代 window 级事件，确保在 DOM 迁移后仍能正确响应。

## 10. AI Agent 开发注意事项

1. **改代码前先读本文件与相关源文件**，不要臆测结构。
2. **路径引用**统一使用 `@/` 别名，禁止相对深层路径 `../../`。
3. **新增示例组件**：遵循 §8 的公共组件规范；组件放入 `src/views/<category>/component/<name>/`，在分类页 `index.vue` 中引用展示。
4. **新增依赖**：加入本子系统 `package.json`，并在组件头部注释注明版本与 node/pnpm 运行环境。
5. **颜色**：组件颜色一律提炼为 CSS 变量并在顶部注释列举（§8.6）。
6. **禁止**：私自修改 `configs/lint/*`、根目录 `.*rc.js`、`pnpm-workspace.yaml`、`turbo.json` 等工程级配置。
