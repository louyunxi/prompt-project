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

/**
 * dev：返回子应用 dev server 绝对 URL，浏览器 fetch 时直连 8889/8889+ 端口，
 *      跨域由子应用 vite dev server 的 server.cors 头放行，享受 ESM + HMR。
 * 生产：返回子应用线上部署地址（build 产物）。
 */
function resolveEntry(
  port: number,
  serverUrlTest: string,
  serverUrlProd: string,
): string {
  if (import.meta.env.DEV) {
    // mkcert 自签证书包含 localhost；用 hostname 而非 IP，避免 IP 不在证书 SAN 内的报错。
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
 * 兼容 vite-plugin-qiankun-lite 的 publicPath 探测。
 *
 * 背景：
 * - vite-plugin-qiankun-lite 的 helper 脚本会设
 *     `nativeGlobal.__QIANKUN_WINDOW__["app-web"] = nativeGlobal.proxy || nativeGlobal`
 *   sandbox 模式下 proxy 不存在，于是 `__QIANKUN_WINDOW__["app-web"]` 最终指向真实 window。
 * - qiankun 注入的 `__POWERED_BY_QIANKUN__` / `__INJECTED_PUBLIC_PATH_BY_QIANKUN__`
 *   写在 sandboxProxy.fakeWindow 上，不会回流到真实 window。
 * - 子应用 vite-plugin-qiankun-lite 注入的 lifecycle 脚本使用
 *     `__QIANKUN_WINDOW__["app-web"].__INJECTED_PUBLIC_PATH_BY_QIANKUN__`
 *   去解析动态 import('/src/main.ts') 的真实 URL，若真实 window 上拿不到值，
 *   URL 会塌缩成 '/src/main.ts'，被主应用 8888 解析为自身路径 → 404 → import 永远 pending → bootstrap 4s 超时。
 *
 * 解决：dev 模式下在主应用 window 上挂同名 getter，让该表达式能解析到正确的子应用 entry；
 * sandbox proxy.get trap 优先级高于 realWindow，所以 sandbox 内子应用访问仍走 fakeWindow 注入的值，互不冲突。
 */
function patchQiankunGlobals(entry: string): void {
  Object.defineProperty(window, '__POWERED_BY_QIANKUN__', {
    configurable: true,
    get: () => true,
  });
  Object.defineProperty(window, '__INJECTED_PUBLIC_PATH_BY_QIANKUN__', {
    configurable: true,
    get: () => entry,
  });
}

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
  // dev 模式下挂载 getter，修复 vite-plugin-qiankun-lite + qiankun ProxySandbox
  // 的 publicPath 探测问题（详见 patchQiankunGlobals 注释）。
  if (import.meta.env.DEV) {
    patchQiankunGlobals(cfg.entry);
  }
  return loadMicroApp({ name: cfg.name, entry: cfg.entry, container, props });
}