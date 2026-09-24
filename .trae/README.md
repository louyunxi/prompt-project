# .trae/

本目录是 **Trae IDE** 的项目级配置入口，与 `.claude/` 并存但不互相覆盖。

## 文件说明

| 文件 | 用途 | 真源 |
|------|------|------|
| `rules/project.md` | Trae 项目规则（事实层） | 由 `CLAUDE.md` 提炼 + 人工维护 |
| `mcp.json` | Trae MCP 配置 | 优先软链到根 `../.mcp.json`；Windows + git `core.symlinks=false` 时退化为内容镜像 |
| `skills/` | Trae 端 skill 镜像（12 个 skill，~5.7 MB） | 由 `mirror-skills` 从 `.claude/skills/` 复制 |

## 与 Claude Code 的关系

```
项目根/
├── CLAUDE.md         ← Claude Code / Claude Agent SDK 真源（SoT）
├── .clauderules      ← Claude Code 专属额外规则
├── .claude/          ← Claude Code 体系（skills/、settings/、memory/）
├── .mcp.json         ← MCP 真源（两边共用，协议标准）
└── .trae/            ← Trae IDE 体系（本目录）
```

## 同步策略

```bash
pnpm sync:ai check         # 检查 .claude/ 与 .trae/ 一致性
pnpm sync:ai to-trae       # 从 CLAUDE.md 生成 .trae/rules/project.md 骨架
pnpm sync:ai from-trae     # 把 Trae 端手工编辑回写到 CLAUDE.md（diff 报告）
pnpm sync:ai from-trae --apply  # 应用上述回写
pnpm sync:ai from-trae --force  # 强制把所有差异都报出来（--apply 会退化 Claude 端，慎用）
pnpm sync:ai mirror        # 把根 .mcp.json 复制到 .trae/mcp.json（内容镜像模式）
pnpm sync:ai mirror-skills # 把 .claude/skills/* 复制到 .trae/skills/*（Trae AI 就近读取）
```

修改根 `CLAUDE.md` 后建议跑一次 `pnpm sync:ai to-trae`。
修改根 `.mcp.json` 后如使用镜像模式，需要跑 `pnpm sync:ai mirror`（软链模式下无需此步）。
修改 `.claude/skills/*` 后需要跑 `pnpm sync:ai mirror-skills`（Trae 端 AI 会从 `.trae/skills/` 读取）。

### from-trae 行为说明

`from-trae` 默认不会改任何文件，只生成 diff 报告。它会自动跳过两类噪音：

1. **机器骨架章节**：to-trae 生成的事实层永远是 Claude 端的精简版，长度比 < 70% 即视为骨架。
2. **Trae 独有章节**：如「Skill 提示」「Memory 与 Agent 提示」「关键文档入口」「MCP 服务」等 Trae 骨架独有、Claude 端不存在的章节。

如果你真的想在 Trae 端手工编辑某章节并回写到 CLAUDE.md：

1. 在 Trae IDE 里编辑 `.trae/rules/project.md`
2. 在章节正文里加一行 `<!-- hand-edited -->` 标记
3. 跑 `pnpm sync:ai from-trae` 看 diff，确认无误
4. 跑 `pnpm sync:ai from-trae --apply` 应用回写

## 为什么不做符号链接到整个目录？

- Trae 项目规则格式（Markdown + frontmatter）与 Claude Code 的 skills / memory 体系不兼容，无法直接软链
- `.claude/skills/`、`memory/`、`settings.json` 是 Claude Code 的私有约定，Trae 不消费
- 只有 `.mcp.json` 是 MCP 协议标准（两边通用），所以才用软链/镜像

## Windows 下的注意事项

Windows 上 Git Bash 的 `ln -s` 默认会降级为普通文件复制（除非开启开发者模式或使用管理员权限），且 git 的 `core.symlinks` 默认 `false`，仓库内即使创建了符号链接也会被存储为普通文件。

所以 `.trae/mcp.json` 在本项目实际是**内容镜像**，由 `pnpm sync:ai mirror` 维护一致性；其他平台（macOS / Linux）可手动改为真软链以零成本同步。