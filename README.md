# 左岸AI提示词库

提示词模板管理与分享平台，支持 PC 端和移动端访问。

## 环境要求

- **Node.js**：^20.19.0 || >=22.12.0
- **pnpm**：>=9.12.0

## 快速开始

```bash
# 安装依赖
pnpm bootstrap

# 启动开发服务器
pnpm start

# 生产构建
pnpm build

# 发布部署
pnpm publish
```

## 应用启动

```bash
# app-prompt（后台管理端，端口 8888）
cd apps/app-prompt
pnpm start      # 开发
pnpm build      # 生产构建
pnpm preview    # 预览构建产物

# app-web（Web 端示例项目，端口 8889）
cd apps/app-web
pnpm start
pnpm build
pnpm preview
```

## 项目结构

```
├── apps/
│   ├── app-prompt/           # 左岸AI提示词库（后台管理端，端口 8888）
│   └── app-web/              # Web 端示例项目（端口 8889，含 ECharts 分类示例）
├── configs/                  # 工程配置
└── scripts/                  # 构建脚本（gtask）

## 开发规范

### Git 提交规范

```
feat:      新功能
fix:       修复 Bug
style:     代码风格（无影响运行）
perf:      性能优化
refactor:  重构
test:      测试相关
docs:      文档/注释
chore:     依赖更新/脚手架配置
```

**扩展规范**：
- 任务关联：`feat: task#任务号`
- Bug 修复：`fix: bug#bug号`

### 代码格式化

```bash
# 检查所有格式
pnpm format

# ESLint 检查
pnpm lint:eslint

# Prettier 检查
pnpm lint:prettier

# Stylelint 检查
pnpm lint:stylelint
```

## 特性

- 🎯 Vue 3 + TypeScript + Vite 技术栈
- 📱 PC/Mobile 双端适配
- 🧩 提示词模板管理与分享
- 🔧 Turborepo Monorepo 架构
- 📦 pnpm Workspace 高效管理
