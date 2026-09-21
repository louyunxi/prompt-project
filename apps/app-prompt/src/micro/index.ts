import { loadMicroApp } from 'qiankun';
import appConfig from '@anhui/app-config';

/**
 * 子应用注册表
 * apps/* 下除 app-prompt 以外的应用都应在此登记，作为嵌入主应用的微应用。
 * 新增子应用时：在 SUB_APPS 中增加一项，并在对应页面调用 loadSubApp 即可。
 */
export interface SubAppConfig {
  /** 子应用名称，需与子应用 vite 插件中 qiankun({ name }) 保持一致 */
  name: string;
  /** 子应用入口地址 */
  entry: string;
}

function resolveEntry(port: number, serverUrlTest: string, serverUrlProd: string): string {
  // 本地开发走 dev server，打包后按环境走线上地址
  if (import.meta.env.DEV) {
    return `https://localhost:${port}/`;
  }
  return import.meta.env.VITE_APP_SERVER === 'prod' ? serverUrlProd : serverUrlTest;
}

export const SUB_APPS: Record<string, SubAppConfig> = {
  'app-web': {
    name: 'app-web',
    entry: resolveEntry(
      appConfig.appWeb.port,
      appConfig.appWeb.serverUrlTest,
      appConfig.appWeb.serverUrlProd,
    ),
  },
};

/**
 * 加载指定子应用，返回 qiankun 的 MicroApp 实例（由调用方负责 mount/unmount）。
 * @param name      子应用 key（见 SUB_APPS）
 * @param container 挂载容器 DOM 元素
 * @param props     透传给子应用 mount 生命周期的自定义属性（如 category）
 */
export function loadSubApp(
  name: string,
  container: HTMLElement,
  props: Record<string, unknown> = {},
): ReturnType<typeof loadMicroApp> {
  const cfg = SUB_APPS[name];
  if (!cfg) {
    throw new Error(`[qiankun] 未注册的子应用：${name}`);
  }
  return loadMicroApp({ name: cfg.name, entry: cfg.entry, container, props });
}
