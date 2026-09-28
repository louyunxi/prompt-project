import { loadSubApp } from '@/micro';

/**
 * PC 端组件清单公共函数
 *
 * 通过加载子应用（app-web）的 apiOnly 模式，拿到 9 个分类下的全部组件元数据，
 * 供首页「AI 组件智能匹配」等场景做候选列表使用。
 * 组件元数据由子应用动态扫描（views/<category>/component/<name>/index.vue），
 * 主应用不硬编码组件名 / 中文标题（遵循 app-prompt/CLAUDE.md §10 规则）。
 */

/** 单个 PC 组件元数据 */
export interface PcComponent {
  /** 组件目录名（kebab-case） */
  name: string;
  /** 中文标题 */
  title: string;
  /** 所属分类（layout/map/typography/...） */
  category: string;
  /** 分类中文名 */
  categoryName: string;
}

/** 与 apps/app-web/src/main.ts 的 SubAppApi 保持一致（只取所需字段） */
interface SubAppApi {
  listComponents?: (
    category: string,
  ) => Promise<Array<Pick<PcComponent, 'name' | 'title'>>>;
}

/** PC 端 9 个分类（与 src/router/index.ts 的 categories 保持一致） */
const CATEGORY_NAMES: Array<[string, string]> = [
  ['layout', '页面布局'],
  ['map', '地图'],
  ['typography', '排版'],
  ['modal', '弹框布局'],
  ['effect', '特效'],
  ['chart', '图表'],
  ['widget', '小组件'],
  ['background', '背景'],
  ['font', '字体'],
];

/** 等到 registerApi 回调触发，最多等 timeoutMs */
function waitForApi(
  getApi: () => SubAppApi | null,
  timeoutMs = 8000,
): Promise<SubAppApi> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const api = getApi();
      if (api) {
        return resolve(api);
      }
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('子应用 registerApi 未触发（超时）'));
      }
      setTimeout(tick, 30);
    };
    tick();
  });
}

/** 离屏容器：子应用 apiOnly 模式不渲染业务组件，仅需要一个挂载节点 */
function createHiddenContainer(): HTMLElement {
  const div = document.createElement('div');
  div.style.cssText =
    'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;visibility:hidden;pointer-events:none;';
  document.body.appendChild(div);
  return div;
}

async function loadAll(): Promise<PcComponent[]> {
  const container = createHiddenContainer();
  let registeredApi: SubAppApi | null = null;
  let app: ReturnType<typeof loadSubApp> | null = null;
  try {
    app = loadSubApp('app-web', container, {
      apiOnly: true,
      registerApi: (api: unknown) => {
        registeredApi = api as SubAppApi;
      },
    });
    const api = await waitForApi(() => registeredApi);

    const items: PcComponent[] = [];
    for (const [category, categoryName] of CATEGORY_NAMES) {
      const meta = api.listComponents ? await api.listComponents(category) : [];
      for (const m of meta) {
        items.push({ name: m.name, title: m.title, category, categoryName });
      }
    }
    return items;
  } finally {
    try {
      await app?.unmount();
    } catch {
      // 卸载失败不影响结果
    }
    container.remove();
  }
}

let cached: Promise<PcComponent[]> | null = null;

/**
 * 获取 PC 端全部组件清单（按分类分组顺序返回）。
 * 结果在模块内缓存，同一会话只加载一次子应用；失败后重试会重新加载。
 */
export function fetchPcComponents(): Promise<PcComponent[]> {
  if (!cached) {
    cached = loadAll().catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}
