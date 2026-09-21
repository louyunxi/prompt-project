/// <reference types="vite/client" />

interface Window {
  /** qiankun 注入的标识：为 true 时表示运行在微前端主应用内 */
  __POWERED_BY_QIANKUN__?: boolean;
}
