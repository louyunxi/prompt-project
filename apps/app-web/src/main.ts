import { createApp } from 'vue';
import type { App as VueApp, Component } from 'vue';
import App from './App.vue';
import Gallery from './components/gallery/index.vue';
import SingleComponent from './components/single-component/index.vue';
import router from './router';
import pinia from './store';
import './styles/index.scss';
import 'ant-design-vue/dist/reset.css';

/** 主应用通过 props.registerApi 拿到的子应用 API（见 MicroContainer.vue / PcCompCard.vue） */
export interface SubAppApi {
  /** 读取 views/<category>/component/<name>/prompt.txt 的原始文本 */
  getPromptContent(componentName: string): Promise<string>;
  /**
   * 返回指定 category 下的组件元数据列表（按 name 排序）。
   * title 取自组件 index.vue 头部 `<!-- 组件名称：xxx（中文标题） -->` 注释，
   * 解析失败时回退到 name，确保主应用始终有可显示的标题。
   */
  listComponents(category: string): Promise<ComponentMeta[]>;
}

/** 单个组件的元数据（来自 views/<category>/component/<name>/index.vue） */
export interface ComponentMeta {
  /** 目录名（kebab-case），用于路径定位与 prompt.txt 读取 */
  name: string;
  /** 中文标题，取自注释；解析失败时回退为 name */
  title: string;
}

/** qiankun 注入的 props */
interface MicroProps {
  /** 挂载容器（qiankun 传入，即子应用 index.html 中的 #app 元素） */
  container?: Element | string;
  /** 主应用分类名 */
  category?: string;
  /** 主应用回调：子应用把自身 API 注入此回调 */
  registerApi?: (api: SubAppApi) => void;
  /** 单组件模式：只渲染指定 name 的组件（与 category 配合定位路径） */
  componentName?: string;
  /** 仅注册 API，不渲染任何业务组件（discovery 阶段使用） */
  apiOnly?: boolean;
}

// views/<category>/component/<name>/index.vue 下的全部组件
// 路径相对当前文件（src/main.ts）所在目录，所以是 ./views/...
const componentModules = import.meta.glob<{ default: Component }>(
  './views/*/component/*/index.vue',
  { eager: true },
);

// views/<category>/component/<name>/prompt.txt（?raw 把内容作为默认导出字符串）
const promptModules = import.meta.glob<string>(
  './views/*/component/*/prompt.txt',
  { query: '?raw', import: 'default', eager: true },
);

// views/<category>/component/<name>/index.vue 的原始源码（用于解析头部注释中的标题）
const componentSources = import.meta.glob<string>(
  './views/*/component/*/index.vue',
  { query: '?raw', import: 'default', eager: true },
);

/**
 * 从组件 index.vue 源码头部注释中提取中文标题。
 * 约定注释格式：`组件名称：<EnglishName>（<ChineseTitle>）`，
 * 解析失败（如注释缺失/格式变更）时回退为 name，避免主应用拿到 undefined。
 */
const TITLE_RE = /组件名称：[^（(]+[（(]([^）)]+)[）)]/;

function extractTitleFromSource(source: string, fallback: string): string {
  if (typeof source !== 'string') return fallback;
  const m = source.match(TITLE_RE);
  return m ? m[1].trim() : fallback;
}

/** 从 componentModules / componentSources / promptModules 中筛出指定 category 下的组件元数据 */
function listComponentMeta(category: string): ComponentMeta[] {
  const items: ComponentMeta[] = [];
  const re = new RegExp(`/views/${category}/component/([^/]+)/index\\.vue$`);
  for (const [path, mod] of Object.entries(componentModules)) {
    const m = path.match(re);
    if (!m) continue;
    const name = m[1];
    const source = componentSources[path];
    items.push({
      name,
      title: extractTitleFromSource(typeof source === 'string' ? source : '', name),
    });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

/** 从 promptModules 中读取 prompt.txt 原始文本（按 componentName 匹配） */
function readPrompt(componentName: string): string {
  for (const [path, content] of Object.entries(promptModules)) {
    if (path.endsWith(`/${componentName}/prompt.txt`)) {
      return typeof content === 'string' ? content : String(content ?? '');
    }
  }
  return '';
}

let appInstance: VueApp<Element> | null = null;

function render(props: MicroProps = {}) {
  const { container, category, componentName, registerApi, apiOnly } = props;
  // 独立运行时使用自身路由与布局；作为微应用时按主应用传入的 category 平铺组件
  const isMicro = Boolean(container);
  const useSingle = isMicro && Boolean(componentName) && !apiOnly;

  const target = isMicro
    ? (typeof container === 'string'
        ? document.querySelector<HTMLElement>(container)
        : container) ?? document.querySelector<HTMLElement>('#app')
    : document.querySelector<HTMLElement>('#app');

  if (!target) {
    console.error('[app-web] 未找到挂载节点');
    return;
  }

  // 避免重复 mount：卸载旧实例
  appInstance?.unmount();
  appInstance = null;

  // apiOnly：仅注册 API，不渲染任何业务组件（discovery 阶段）
  // 单组件模式（主应用 PcCompCard 一对一挂载）→ SingleComponent
  // 微应用平铺模式（主应用旧 MicroContainer）→ Gallery
  // 独立运行 → App
  if (apiOnly && isMicro) {
    if (typeof registerApi === 'function') {
      registerApi({
        getPromptContent: async (name) => readPrompt(name),
        listComponents: async (cat) => listComponentMeta(cat),
      });
    }
    return;
  }

  appInstance = createApp(
    useSingle ? SingleComponent : isMicro ? Gallery : App,
    isMicro
      ? {
          category: category ?? '',
          ...(useSingle ? { componentName } : {}),
        }
      : undefined,
  );
  appInstance.use(pinia);
  if (!isMicro) appInstance.use(router);
  appInstance.mount(target);

  // 只要是微应用，就把 API 暴露给主应用（无论渲染 Gallery / SingleComponent）
  if (isMicro && typeof registerApi === 'function') {
    registerApi({
      getPromptContent: async (name) => readPrompt(name),
      listComponents: async (cat) => listComponentMeta(cat),
    });
  }
}

/* ============================================================
 * qiankun 生命周期（具名导出）
 * - dev/build 模式 HTML 由 vite-plugin-qiankun-lite 改写，
 *   末尾插入 `import('/src/main.ts').then((lc) => { window['app-web'].bootstrap/mount/...
 *     .resolve(lc[xxx]) })`，因此 main.ts 必须具名 export 这四个函数。
 * - 独立运行（直接访问 https://localhost:8889/）时，qiankun lifecycle 协议不生效，
 *   走最下方的 mount() 兜底逻辑。
 * ========================================================== */

export async function bootstrap() {
  // 仅在微应用首次加载时执行一次
  console.log('[app-web] bootstrap');
}

export async function mount(props: MicroProps) {
  console.log('[app-web] mount', props);
  render(props);
}

export async function unmount() {
  console.log('[app-web] unmount');
  appInstance?.unmount();
  appInstance = null;
}

export async function update(props: MicroProps) {
  console.log('[app-web] update', props);
  void props;
}

// 独立运行（非 qiankun 环境）下：直接挂载。
// 主应用 dev 模式下会在 window 上挂 `__POWERED_BY_QIANKUN__` getter，
// `globalThis === window` 因此也能拿到 true；这样无论 main.ts 是在 sandbox 内执行
// 还是被动态 import() 加载到主应用 scope 执行，都能正确识别环境。
const isInQiankun = Boolean(
  (globalThis as { __POWERED_BY_QIANKUN__?: boolean }).__POWERED_BY_QIANKUN__,
);
if (!isInQiankun) {
  render();
}