# 左岸AI提示词库（app-prompt）子系统说明书

> 本文档是 `app-prompt` 子系统的项目说明书，供 AI Agent（开发助手）在理解、修改、扩展本子系统时使用。请在动手前通读本文件。

## 1. 子系统概述

**名称**：左岸AI提示词库（`@anhui/app-prompt`）

**定位**：提示词模板管理与分享平台的 **后台管理端（Admin）**，面向内部人员（"左岸内部专用"），提供 PC 端 / H5 端 / uniapp 小程序三端提示词模板的分类浏览与管理能力。

**所属工程**：`anhui-agri-data-plat`（左岸AI提示词库）Monorepo，本子系统位于 `apps/app-prompt`。

**当前状态**：核心框架（登录、布局、路由、首页）已完成；`提示词模版` 下的具体分类页、`页面制作`、`收藏`、`图库` 均为占位页（"页面建设中"），待后续填充业务。

## 2. 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3.5 | Composition API + `<script setup lang="ts">` |
| 语言 | TypeScript 5.7 | `strict: true` |
| 构建 | Vite 6 | 配置见 `vite.config.ts` |
| UI 库 | Ant Design Vue 4 | 组件自动按需注册 |
| 图标 | @ant-design/icons-vue 7 | 需显式 import（见 §7.2） |
| 状态管理 | Pinia 3 + pinia-plugin-persistedstate | 持久化到 localStorage |
| 路由 | Vue Router 4 | `createWebHashHistory`（hash 模式） |
| 样式 | SCSS（sass-embedded） | 主题变量 + 全局 reset |
| 包管理 | pnpm + workspace | Monorepo（Turborepo） |
| 工程配置 | @anhui/app-config | 端口 / 输出目录 / API 密钥 |

**关键依赖版本见** `package.json`；`vue`、`vite`、`vue-router` 版本由 workspace `catalog` 统一管理（见根目录 `pnpm-workspace.yaml`）。

## 3. 目录结构

```
apps/app-prompt/
├── public/                 # 静态资源（favicon）
├── src/
│   ├── assets/images/      # 图片资源（logo、bg、天气动效素材）
│   ├── components/
│   │   ├── layout/index.vue        # 后台整体布局（侧边栏 + 顶栏 + 内容区）
│   │   └── weatherEffect/qing.vue  # Canvas 粒子/数据流动效（登录页背景）
│   ├── router/index.ts     # 路由配置 + 登录守卫
│   ├── store/
│   │   ├── index.ts        # Pinia 实例 + persistedstate 插件
│   │   └── modules/user.ts # 用户状态（登录/登出）
│   ├── styles/
│   │   ├── index.scss      # 入口（forward variables + global）
│   │   ├── variables.scss  # 主题/功能色变量
│   │   └── global.scss     # 全局 reset 与基础样式
│   ├── views/
│   │   ├── home/           # 首页（统计卡片 + mock 数据）
│   │   ├── login/          # 登录页
│   │   ├── page-maker/     # 页面制作（占位）
│   │   ├── favorite/       # 收藏（占位）
│   │   ├── gallery/        # 图库（占位）
│   │   ├── notFound/       # 404
│   │   └── prompt/         # 提示词模版（3 端 × 9 分类）
│   │       ├── pc/         # PC 端
│   │       ├── h5/         # H5 端
│   │       └── uniapp/     # uniapp 小程序
│   ├── App.vue             # 根组件（a-config-provider 中文语言包）
│   ├── main.ts             # 入口
│   └── vite-env.d.ts
├── typings/                # auto-imports.d.ts / components.d.ts（自动生成）
├── .env.development        # VITE_APP_SERVER=test
├── .env.production         # VITE_APP_SERVER=prod
├── deploy.config.js        # SSH 部署配置（anhui-admin）
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 4. 构建与工程配置

### 4.1 Vite 配置（`vite.config.ts`）

- **别名**：`@` → `src`（代码中一律使用 `@/xxx` 引用）。
- **自动导入**：
  - `unplugin-auto-import`：自动导入 `vue`、`vue-router` 的 API（`ref`、`computed`、`watch`、`onMounted`、`useRoute`、`useRouter` 等无需显式 import，显式 import 亦不报错）。
  - `unplugin-vue-components` + `AntDesignVueResolver`：`a-xxx` 组件自动按需注册，**无需手动 import**（`a-layout`、`a-menu`、`a-card`、`a-form` 等直接使用）。
- **本地 HTTPS**：`vite-plugin-mkcert`，开发地址为 `https://localhost:8888`。
- **base 路径**：`build`/`deploy` 时设为 `./`（相对路径），开发时 `/`。
- **端口 / 输出目录**：来自 `@anhui/app-config` 的 `appPrompt`（端口 `8888`，`outDir: 'dist/'`）。

### 4.2 环境变量

| 变量 | 取值 | 说明 |
|------|------|------|
| `VITE_APP_SERVER` | `test` / `prod` | 环境切换（development=test，production=prod） |

### 4.3 应用配置（`@anhui/app-config`）

由 `configs/app/index.js` 提供，`appPrompt` 定义端口/线上地址；`apiConfig` 定义 Dify 知识库服务的 `difyUrl`、`datasetKey`、`datasetId`（主粮作物物候期知识库）。API 明细见根目录 `api.md`。

## 5. 路由与权限

- **路由模式**：hash（`createWebHashHistory`）。
- **路由表**（`src/router/index.ts`）：
  - `/login`：登录页（白名单）。
  - `/`：布局（`layout`），子路由：`''`（首页）、`page-maker`、`prompt`（嵌套三端九分类）、`favorite`、`gallery`。
  - `/:pathMatch(.*)*`：404。
- **提示词路由动态生成**：`buildPromptRoutes()` 遍历 3 平台（`pc`/`h5`/`uniapp`）× 9 分类（`layout`/`map`/`typography`/`modal`/`effect`/`chart`/`widget`/`background`/`font`）自动生成路由与菜单。
- **登录守卫**：`router.beforeEach` 校验 `userStore.userName` 或从 localStorage `admin-user` 解析的用户名，未登录跳转 `/login`；白名单仅 `/login`。

## 6. 状态管理（Pinia）

- 唯一 store：`useUserStore`（`src/store/modules/user.ts`）。
- 状态：`userName`（仅缓存用户名，不保存密码）、计算属性 `isLoggedIn`。
- 动作：`login(username, password)`、`logout()`。
- **持久化**：`persist: { key: 'admin-user', pick: ['userName'] }`，写入 localStorage。
- **登录规则（硬编码，注意）**：账号必须全英文（`/^[a-zA-Z]+$/`），密码固定为 `zaxh123456`。

## 7. 代码规范（必读）

### 7.1 命名规范（来自根目录 `.clauderules`）

| 对象 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `ChatMessage.vue` |
| 组合式函数 | `use` + PascalCase | `useAudioStream.ts` |
| 普通文件 | kebab-case | `open-url.ts` |
| 变量/函数 | camelCase | `userName` |
| 常量 | UPPER_SNAKE_CASE | `WHITE_LIST` |
| CSS 类名 | kebab-case | `.stat-card` |

### 7.2 格式规范

- 缩进 2 空格；单引号；句末分号；文件末尾换行。
- 对象内空格 `{ foo: 'bar' }`；数组无多余空格 `[1, 2, 3]`。
- 空行最多不超过 2 行；尾随逗号（`trailingComma: 'all'`）。
- ESLint / Prettier / Stylelint 规则集中在 `configs/lint/*.js`，各 app 通过根目录 `.*rc.js` 引用，**不要私自改**。

### 7.3 Vue 组件规范

- 使用 `<script setup lang="ts">`。
- Props 用 TS 类型定义；事件用 `defineEmits`。
- `a-xxx` 组件自动注册，但**图标必须显式 import**：`import { HomeOutlined } from '@ant-design/icons-vue'`。

### 7.4 图标使用注意（易踩坑）

`@ant-design/icons-vue` 并非包含所有图标，部分图标名（如 `SunnyOutlined`、`RainOutlined`、`ThunderboltOutlined`、`FireOutlined`、`ExperimentOutlined`）仅在 React 版存在，误用会导致 Vite 预构建报 `SyntaxError`。**缺失图标用 `CloudOutlined` / `ToolOutlined` 替代**。

### 7.5 Git 提交规范

```
feat:      新功能       fix:       修复 Bug
perf:      性能优化     refactor:  重构
style:     代码格式     test:      测试
docs:      文档/注释    chore:     依赖/脚手架
build/ci/workflow/types/wip/revert
```

- 任务关联：`feat: task#任务号`；Bug 修复：`fix: bug#bug号`（commitlint 已配置，header 最长 108 字符）。

## 8. 样式规范

- 主题变量集中在 `src/styles/variables.scss`（主色 `$primary-color: #015ca7`，文字/背景/功能色均在此维护）。
- 全局样式在 `src/styles/global.scss`（reset、滚动条、字体）。
- 组件样式使用 `<style lang="scss" scoped>`；穿透第三方组件样式用 `:deep()`。
- 动效/渐变组件内用 SCSS 局部变量与 `@mixin`（参考 `layout/index.vue`、`home/index.vue`）。

## 9. 常用命令

### 9.1 子系统命令（在 `apps/app-prompt` 目录）

```bash
pnpm start      # 启动开发服务器（https://localhost:8888）
pnpm build      # 生产构建（输出 dist/）
pnpm deploy     # 构建并 SSH 部署
pnpm preview    # 预览构建产物
```

### 9.2 工程级命令（在根目录）

```bash
pnpm bootstrap        # 安装依赖
pnpm start            # 启动（gtask，多应用）
pnpm build            # 构建
pnpm publish          # 部署
pnpm format           # 全部格式检查
pnpm lint:eslint      # ESLint
pnpm lint:prettier    # Prettier
pnpm lint:stylelint   # Stylelint
```

## 10. PC 端二级菜单公共接口规则（PcCompCard）

> 本规则约束 **PC 端二级菜单所有页面** 展示子应用（`app-web`）组件的方式，确保 PC 端是子应用组件的「公共接口」。

### 10.1 强制性约束

`src/views/prompt/pc/**` 下凡是展示子应用组件的页面，**必须** 使用 `src/components/common/PcCompCard.vue`（`<PcCompCard>`）将每个子应用组件**一对一包裹**，**禁止** 直接把子应用 DOM 渲染到页面里、或用其他自定义容器替代。

- **目的**：统一 PC 端「复制 prompt / 编辑 / 换肤」等公共操作的展示与触发面；保证后续新增子应用组件或新增二级菜单页时无需重复设计外壳。
- **位置**：`apps/app-prompt/src/components/common/PcCompCard.vue`（**这是 PC 端子应用组件唯一的公共接口**）。
- **适用范围**：所有 PC 端二级菜单页（`layout` / `map` / `typography` / `modal` / `effect` / `chart` / `widget` / `background` / `font` 等 9 分类）。
- **统一入口**：[MicroContainer.vue](file:///e:/AI/prompt-project/apps/app-prompt/src/views/prompt/pc/MicroContainer.vue) 是 PC 端二级菜单**唯一的渲染器**，router 自动把所有 9 个分类路由到它；它内部按 `route.meta.category` 加载子应用并对每个组件用 `<PcCompCard>` 包裹。**不要** 在 PC 端为单个分类新增 `index.vue`（h5/uniapp 才需要，PC 端全部走 MicroContainer）。

### 10.2 PcCompCard Props 契约

| Prop | 必填 | 说明 |
|------|------|------|
| `componentName` | ✅ | 子应用组件名（kebab-case，与子应用 `views/<category>/component/<name>/` 目录名一致），用于从 `prompt.txt` 读取文本 |
| `title` | ❌ | 中文标题；省略时回退为 `componentName`；与 `componentName` 不一致时右侧追加 `<a-tag>` 显示组件名 |
| `api` | ❌ | 子应用通过 `props.registerApi` 注入的 `SubAppApi`（见 `apps/app-web/src/main.ts`），用于「复制 prompt」按钮；未传或 API 未就绪时按钮提示「子应用 API 尚未就绪」 |

### 10.3 使用模板（参考 MicroContainer.vue）

```vue
<PcCompCard
  v-for="comp in components"
  :key="comp.name"
  :component-name="comp.name"
  :title="comp.title"
  :api="subAppApi"
>
  <!-- 子应用组件挂载点：典型做法是 appendChild 子应用渲染出的节点到此容器 -->
  <div :ref="(el) => bindMountEl(el as Element | null, comp.name)" class="..." />
</PcCompCard>
```

子应用组件列表与 `api` 通过 `subAppApi.listComponents(category)` 动态获取（详见 `MicroContainer.vue` 的 `mountAll`），**禁止** 在主应用里硬编码子应用组件名或中文标题。

### 10.4 新增 PC 端二级菜单分类的检查清单

- [ ] 路由在 `src/router/index.ts` 的 `categories` 数组中追加分类名（如 `'my-cat'`），router 自动生成路由并指向 `MicroContainer.vue`。
- [ ] 子应用新增 `apps/app-web/src/views/<category>/index.vue`（Gallery 页）和 `apps/app-web/src/views/<category>/component/<name>/index.vue`（每个组件），组件 HTML 头部加上注释 `<!-- 组件名称：MyName（中文标题） -->` 以便 `TITLE_RE` 解析。
- [ ] **不需要** 在 PC 端新增任何 `index.vue`——`MicroContainer.vue` 会按 `route.meta.category` 自动加载对应分类。
- [ ] 每个子应用组件的 DOM 通过 slot 容器注入（典型：子应用渲染到隐藏节点，主应用 `appendChild` 到 slot）。
- [ ] 主应用 `MicroContainer.vue` 不需要任何改动。

### 10.5 命名与引用

- 文件名 / 组件名 / 类型别名一律使用 **`PcCompCard`**（`P` 大写、`Comp` 是 Component 缩写）；不要使用 `CompCard`、`PcCard` 等旧名或其他自定义命名。
- 所有引用通过 `@/components/common/PcCompCard.vue` 导入；不要直接 import 子应用组件。

## 11. AI Agent 开发注意事项

1. **改代码前先读本文件与相关源文件**，不要臆测结构。
2. **路径引用**统一使用 `@/` 别名，禁止相对深层路径 `../../`。
3. **新增页面**：在 `src/views/` 下建目录，路由在 `src/router/index.ts` 登记，菜单在 `components/layout/index.vue` 的 `menuItems` 中同步。
4. **占位页模板**：功能未实现前沿用现有 `.page-placeholder`（"页面建设中"）风格，避免引入额外依赖。
5. **组件库**：优先使用 Ant Design Vue 组件（自动注册），不要手写等价组件。
6. **动效**：如需 Canvas 动效参考 `weatherEffect/qing.vue`。
7. **不落库的接口**：当前首页数据为 mock（`setTimeout` 模拟），真实接入走 Dify 数据集 API（见 `api.md`），密钥/ID 在 `configs/app/index.js` 的 `apiConfig`。
8. **登录态**：任何需要登录的改动，务必遵守 §5 的守卫逻辑与 §6 的持久化 key `admin-user`。
9. **类型**：新增 store/API 类型定义时，遵循 `configs/app/types/index.d.ts` 的结构组织方式。
10. **禁止**：私自修改 `configs/lint/*`、根目录 `.*rc.js`、`pnpm-workspace.yaml`、`turbo.json` 等工程级配置。
