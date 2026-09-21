# 安徽大数据平台 - 万农问天

基于 AI 大模型的农业智能问答平台，支持 PC 端和移动端访问。

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
cd apps/app-farming-model

# 开发启动
pnpm start

# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

## 项目结构

```
├── apps/
│   └── app-farming-model/    # 农业模型主应用
├── configs/                   # 工程配置
├── packages/                 # 内部共享包
└── scripts/                  # 构建脚本
```

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
- 🤖 AI 大模型智能问答
- 🌦️ 天气效果可视化
- 🔧 Turborepo Monorepo 架构
- 📦 pnpm Workspace 高效管理
