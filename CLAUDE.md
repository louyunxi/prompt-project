# 左岸AI提示词库

## 项目概述

左岸AI提示词库基于 AI 大模型提供农业领域的智能问答服务，支持 PC 端和移动端双端访问。

## 技术栈

- **前端框架**：Vue 3 (Composition API + `<script setup>`)
- **构建工具**：Vite 5
- **样式方案**：SCSS + postcss-px-to-viewport（移动端适配）
- **状态管理**：Pinia + pinia-plugin-persistedstate
- **路由**：Vue Router
- **HTTP**：Axios
- **UI 库**：Ant Design Vue 4 + Ant Design X Vue
- **Monorepo**：Turborepo
- **包管理**：pnpm
- **其他**：TypeScript、WebSocket、音视频、微信 JSSDK

## 目录结构

```
anhui-agri-wannong-wentian/
├── apps/
│   └── app-farming-model/          # 农业模型主应用
│       └── src/
│           ├── api/                # API 接口
│           ├── assets/             # 静态资源
│           ├── components/         # 公共组件
│           │   ├── common/         # 通用组件
│           │   ├── ChatMessage/   # 聊天消息
│           │   ├── MessageList/    # 消息列表
│           │   ├── QuestionBox/    # 问题输入框
│           │   ├── UploadImg/      # 图片上传
│           │   ├── weatherEffect/   # 天气动效
│           │   └── ...
│           ├── config/             # 配置文件
│           ├── hooks/              # 组合式函数
│           ├── router/             # 路由配置
│           ├── store/              # Pinia 状态
│           ├── utils/              # 工具函数
│           └── views/              # 页面视图
│               ├── chatFlow/       # 聊天对话
│               ├── login/          # 登录页
│               └── Demo/           # Demo 示例
├── configs/                        # 工程配置
│   ├── apis/                      # API 配置
│   ├── app/                       # 应用配置
│   ├── lint/                      # ESLint/Prettier/Stylelint
│   └── tsconfig/                  # TypeScript 配置
├── packages/                       # 内部包
└── scripts/                       # 构建脚本
```

## 公共组件

| 组件 | 说明 |
|------|------|
| `ChatMessage` | 聊天消息气泡（PC/Mobile） |
| `MessageList` | 消息列表容器 |
| `QuestionBox` | 问题输入框 |
| `HistoryDrawer` | 历史会话抽屉 |
| `UploadImg` | 图片上传组件 |
| `AreaSelect` | 区域选择器 |
| `SolarDetailPopup` | 详情弹窗 |
| `WeatherEffect` | 天气动效组件 |
| `DragVerifyImgChip` | 拖拽验证 |
| `SwipeAction` | 滑动操作 |

## 公共方法/工具

| 工具 | 说明 |
|------|------|
| `useAudioStream` | 音频流处理 |
| `useBaseAppInfo` | 应用基础信息 |
| `useSafeArea` | 安全区域适配 |
| `appSDK` | App SDK 桥接 |
| `imageCompressor` | 图片压缩 |
| `openURL` | URL 处理 |
| `pauseAllMedia` | 暂停所有媒体 |

## 配置信息

### 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_APP_SERVER` | prod/development 环境切换 |
| `ZA_APP_COMMAND` | 运行方式（deploy/build） |

### API 配置

- **开发环境**：`https://dify.snkoudai.com`
- **生产环境**：`https://multiapi.ahnw.cc`
- **气象后台**：`https://wnwt.snkoudai.com`

### 代理配置

| 路径 | 目标服务 |
|------|----------|
| `/dify-api` | Dify API |
| `/weather-admin` | 气象管理后台 |
| `/tts` | TTS 服务 |
| `/video-proxy` | 视频代理 |

## 启动/打包/发布命令

| 命令 | 说明 |
|------|------|
| `pnpm bootstrap` | 安装依赖 |
| `pnpm start` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm publish` | 发布部署 |
| `pnpm format` | 代码格式化检查 |
| `pnpm lint:eslint` | ESLint 检查 |
| `pnpm lint:stylelint` | Stylelint 检查 |
| `pnpm lint:prettier` | Prettier 检查 |

### App 子项目命令

```bash
cd apps/app-farming-model
pnpm start      # 开发启动
pnpm build      # 生产构建
pnpm deploy     # 部署
pnpm preview    # 预览构建结果
```

## 代码规范

### 格式规范

- **缩进**：2 空格
- **引号**：单引号
- **分号**：需要
- **对象括号**：内部需要空格 `{ foo: 'bar' }`
- **数组括号**：内部无多余空格 `[1, 2, 3]`

### Vue 规范

- 使用 `<script setup lang="ts">` 语法
- 组件文件使用 PascalCase 命名
- Props 使用 TypeScript 类型定义
- 事件使用 `defineEmits` 声明
- 组合式函数以 `use` 开头

### 图标使用规范

**问题原因**：`@ant-design/icons-vue` 并非包含所有图标，部分图标名称仅在 `@ant-design/icons`（React 版）存在。Vite 在预构建时检测到不存在的导出会直接报 `SyntaxError`。

**可用图标查询方式**：
1. 查看项目已有使用：`grep "Outlined" apps/**/src/**/*.vue`
2. 查看 ant-design-vue 源码：`node_modules/ant-design-vue/es/icons/index.js`

**常见缺失图标**（勿使用）：
| 错误写法 | 替代方案 |
|---------|---------|
| `SunnyOutlined` | `CloudOutlined` |
| `RainOutlined` | `CloudOutlined` |
| `ThunderboltOutlined` | `CloudOutlined` |
| `FireOutlined` | `CloudOutlined` |
| `ExperimentOutlined` | `ToolOutlined` |


### Git 提交规范

```
feat:      新功能
fix:       修复 Bug
style:     代码格式（不影响运行）
perf:      性能优化
refactor:  重构
test:      测试相关
docs:      文档/注释
chore:     依赖更新/脚手架配置
```

- feat/fix 扩展：`feat: task#任务号`、`fix: bug#bug号`

## UI 还原规范

- 使用 Figma MCP 读取设计稿
- 颜色使用设计 Token
- 间距使用 4 的倍数（px 值除以 4）
- 实现 hover/active/disabled 状态
- 移动端使用 postcss-px-to-viewport 适配

---

## 可用 Skills

| Skill | 使用场景 |
|-------|----------|
| vue | Vue 3 相关问题 |
| vue-best-practices | Vue 最佳实践 |
| vue-router-best-practices | Vue Router 使用 |
| pinia | Pinia 状态管理 |
| vite | Vite 构建配置 |
| pnpm | pnpm 包管理 |
| ui-ux-pro-max | UI/UX 设计还原 |
| frontend-design | 前端设计规范 |
| drawio | Draw.io 图表生成（ERD、UML、流程图、架构图） |

## 可用 MCP

| MCP | 使用场景 |
|-----|----------|
| serena | 代码符号分析、引用查找 |
| figma | Figma 设计稿读取 |
| playwright | 浏览器自动化测试 |
| context7 | 库/框架文档查询 |
| git | Git 操作 |
| zentao-11-3 | 禅道任务管理 |
| api | Apifox API 调试 |
