/**
 * @deprecated 2026-09-24
 *
 * 历史遗留占位：原 vue-cli 时代的 preview 工具。
 * 仓库已迁移到 Vite，本文件残留的 vue-cli-service / vue.config.js / Koa 中间件
 * 链路已全部失效（仓库中已无 vue.config.js，app 全部使用 Vite）。
 *
 * 保留本文件仅为占位，防止历史 import 路径立即崩溃。
 * 新代码请使用各 app 自带的 Vite preview（pnpm preview）。
 */
module.exports = function buildPreview() {
  throw new Error(
    '[buildPreview] 已废弃：项目已迁移到 Vite，请使用 pnpm preview 替代。',
  );
};