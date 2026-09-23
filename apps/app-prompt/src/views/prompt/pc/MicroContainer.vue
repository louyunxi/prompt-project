<template>
  <!--
    PC 端所有二级菜单分类的「统一渲染器」：
    - 加载子应用（app-web）→ hiddenContainer
    - 通过 registerApi 拿 SubAppApi → listComponents(category) 动态获取组件列表
    - 列表加载完成后，把子应用渲染的 [data-component-name] 节点 appendChild 到 PcCompCard slot
    - 严格遵循 app-prompt/AGENTS.md §10「PC 端二级菜单公共接口规则」：每个子应用组件一对一用 PcCompCard 包裹
  -->
  <div class="micro-container">
    <div class="micro-container__header">
      <span class="micro-container__sub">
        {{ components.length }} 个组件
      </span>
    </div>

    <div v-if="loading" class="micro-container__loading">
      <a-spin :size="56" class="micro-container__loading-spin" />
      <span class="micro-container__loading-text">加载中...</span>
    </div>

    <a-alert
      v-else-if="errorMessage"
      class="micro-container__error"
      type="error"
      :message="errorMessage"
      show-icon
    />

    <div v-else-if="components.length === 0" class="micro-container__empty">
      <a-empty description="该分类下暂无组件" />
    </div>

    <div v-else class="micro-container__grid">
      <PcCompCard
        v-for="comp in components"
        :key="comp.name"
        :component-name="comp.name"
        :title="comp.title"
        :api="subAppApi"
        :background="category === 'chart' ? '#05284b' : undefined"
      >
        <div
          :ref="(el) => bindMountEl(el as Element | null, comp.name)"
          class="micro-container__slot"
        />
      </PcCompCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { nextTick } from 'vue';
import { loadSubApp } from '@/micro';
import PcCompCard from '@/components/common/PcCompCard.vue';

/** 与 apps/app-web/src/main.ts 的 SubAppApi 保持一致 */
interface SubAppApi {
  getPromptContent?: (name: string) => Promise<string> | string;
  listComponents?: (category: string) => Promise<Array<ComponentMeta>>;
}

/** 单个组件元数据（来自子应用 views/<category>/component/<name>/index.vue） */
interface ComponentMeta {
  /** 目录名（kebab-case） */
  name: string;
  /** 中文标题；解析失败时由子应用回退为 name */
  title: string;
}

const route = useRoute();

/** 当前分类：route.meta.category（如 layout/map/typography/chart/background 等 9 分类） */
const category = computed(() => String(route.meta.category ?? ''));

/** 页面标题：route.meta.title 优先，没有时回退为分类名 */
const pageTitle = computed(
  () => (route.meta?.title as string) || category.value || '提示词',
);

const loading = ref(true);
const errorMessage = ref('');
const components = ref<ComponentMeta[]>([]);
const subAppApi = ref<SubAppApi | null>(null);

const mountEls = new Map<string, HTMLElement>();
let microApp: ReturnType<typeof loadSubApp> | null = null;
let hiddenContainer: HTMLElement | null = null;
/** 组件级 cancelled：用户切走页面或切分类时立即生效，避免 mountAll 后续步骤往已卸载组件里塞 DOM */
let cancelled = false;

function bindMountEl(el: Element | null, name: string) {
  const htmlEl = el instanceof HTMLElement ? el : null;
  if (htmlEl) mountEls.set(name, htmlEl);
  else mountEls.delete(name);
}

function createHiddenContainer(): HTMLElement {
  const div = document.createElement('div');
  // 给一个真实可见尺寸：子应用 Gallery 在此渲染 .gallery__grid（grid 3 列），
  // .gallery__cell 宽度 ≈ hiddenContainer/3，子组件 width:100% 的 echarts 容器
  // 才能拿到真实 clientWidth/Height 完成 init。
  // visibility:hidden 不影响 clientWidth，只是不渲染像素。
  div.style.cssText = [
    'position:fixed',
    'left:-9999px',
    'top:-9999px',
    'width:1280px',
    'height:800px',
    'overflow:hidden',
    'visibility:hidden',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(div);
  return div;
}

/** 等到 registerApi 回调被触发，最多等 timeoutMs */
function waitForApi(
  getApi: () => SubAppApi | null,
  timeoutMs = 8000,
): Promise<SubAppApi> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const api = getApi();
      if (api) return resolve(api);
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('registerApi 未触发（超时）'));
      }
      setTimeout(tick, 30);
    };
    tick();
  });
}

/** 等到 loadMicroApp 完成首次挂载（microApp.loadPromise） */
function awaitLoaded(app: ReturnType<typeof loadSubApp>): Promise<void> {
  const p = (app as unknown as { loadPromise?: Promise<unknown> }).loadPromise;
  if (p && typeof p.then === 'function') {
    return p.then(() => undefined).catch(() => undefined);
  }
  return new Promise<void>((resolve) => {
    const onLoad = (
      app as unknown as { onLoad?: (cb: () => void) => () => void }
    ).onLoad;
    if (typeof onLoad === 'function') onLoad(() => resolve());
    else setTimeout(resolve, 1500);
  });
}

/**
 * 用 MutationObserver 监听 hiddenContainer 的 [data-component-name] 节点出现，
 * 等到数量 >= expectedCount 后返回；最多等 timeoutMs。
 */
function waitForChildItems(
  expectedCount: number,
  timeoutMs = 5000,
): Promise<HTMLElement[]> {
  return new Promise((resolve) => {
    if (!hiddenContainer) {
      resolve([]);
      return;
    }
    const tryResolve = () => {
      const items = hiddenContainer.querySelectorAll<HTMLElement>(
        '[data-component-name]',
      );
      if (items.length >= expectedCount) {
        observer.disconnect();
        resolve(Array.from(items));
      }
    };
    const observer = new MutationObserver(tryResolve);
    observer.observe(hiddenContainer, { childList: true, subtree: true });
    // 初始检查一次（DOM 可能已经在了）
    tryResolve();
    setTimeout(() => {
      observer.disconnect();
      const items = hiddenContainer.querySelectorAll<HTMLElement>(
        '[data-component-name]',
      );
      console.warn(
        `[MicroContainer] 等待子应用 DOM 超时（${timeoutMs}ms），实际拿到 ${items.length} 个`,
      );
      resolve(Array.from(items));
    }, timeoutMs);
  });
}

async function unmountCurrent() {
  cancelled = true;
  if (microApp) {
    try {
      await microApp.unmount();
    } catch (err) {
      console.warn('[MicroContainer] unmount failed:', err);
    }
    microApp = null;
  }
  if (hiddenContainer?.parentNode) {
    hiddenContainer.parentNode.removeChild(hiddenContainer);
  }
  hiddenContainer = null;
  mountEls.clear();
}

/**
 * 单 microApp 方案：
 * - 子应用渲染 Gallery 到 hiddenContainer（每个组件渲染到一个
 *   `data-component-name="<name>"` 的 .gallery__cell）
 * - 等子应用 mount + 完成首次渲染（nextTick x 几轮）
 * - 把 hiddenContainer 内的 [data-component-name] 节点 appendChild 到对应 PcCompCard slot
 * - Vue 3 通过 vnode.el 跟踪真实 DOM，DOM 父节点变化不影响 patch，
 *   子组件响应式更新仍能正常工作。
 */
async function mountAll() {
  const cat = category.value;
  if (!cat) {
    errorMessage.value = '缺少分类参数（route.meta.category）';
    loading.value = false;
    return;
  }
  cancelled = false;
  hiddenContainer = createHiddenContainer();
  let registeredApi: SubAppApi | null = null;

  // 1) 加载子应用，拿到 API + 组件名列表
  try {
    microApp = loadSubApp('app-web', hiddenContainer, {
      category: cat,
      registerApi: (api) => {
        registeredApi = api;
      },
    });
    await Promise.all([waitForApi(() => registeredApi), awaitLoaded(microApp)]);
    if (cancelled) return;
    if (!registeredApi) throw new Error('子应用 registerApi 未触发');
    subAppApi.value = registeredApi;

    const meta = registeredApi.listComponents
      ? await registeredApi.listComponents(cat)
      : [];
    if (cancelled) return;
    if (!meta.length) {
      components.value = [];
      loading.value = false;
      return;
    }
    components.value = meta;
  } catch (err) {
    if (cancelled) return;
    errorMessage.value = `发现子应用组件失败：${(err as Error).message ?? err}`;
    console.error('[MicroContainer] discovery failed:', err);
    loading.value = false;
    return;
  }

  // 2) 关键时序：必须先把 loading 改 false，v-else 那段 PcCompCard + slot 才进 DOM，
  //    bindMountEl 才有机会被 Vue 调用，mountEls 才有数据。
  loading.value = false;
  await nextTick();
  if (cancelled) return;

  // 3) 等子应用 Gallery 完成首次渲染（mount 是同步的，多半已经已经在了，
  //    MutationObserver 首次 tryResolve 就能满足）。
  const items = await waitForChildItems(components.value.length);
  if (cancelled) return;

  // 4) 移动 DOM
  for (const item of items) {
    const name = item.getAttribute('data-component-name');
    if (!name) continue;
    const slot = mountEls.get(name);
    if (!slot) {
      console.warn(`[MicroContainer] 缺少挂载节点：${name}`);
      continue;
    }
    slot.appendChild(item);
  }
}

onMounted(async () => {
  try {
    await mountAll();
  } finally {
    loading.value = false;
  }
});

watch(category, async () => {
  // 切换分类：先卸载旧实例，再按新 category 重新挂载
  await unmountCurrent();
  loading.value = true;
  errorMessage.value = '';
  components.value = [];
  try {
    await mountAll();
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(async () => {
  await unmountCurrent();
});
</script>

<style lang="scss" scoped>
.micro-container {
  width: 100%;
  min-height: 400px;
  padding: 24px 32px 40px;
  box-sizing: border-box;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 24px;
  }

  &__title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--ink-color, #1f2937);
  }

  &__sub {
    font-size: 13px;
    color: var(--ink-color-3, #9ca3af);
  }

  &__loading {
    min-height: 240px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px;
    margin: 16px 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: var(--ink-color-3, #666);
    box-sizing: border-box;
  }

  &__loading-text {
    font-size: 18px;
    color: var(--ink-color-3, #666);
    letter-spacing: 1px;
  }

  &__error {
    margin-bottom: 16px;
  }

  &__empty {
    padding: 48px 0;
  }

  // 一行三个
  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start; // 同一行卡片不再向最高项看齐，按各自内容高度收缩
    gap: 20px;

    @media (max-width: 1440px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 960px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  /** PcCompCard slot：子应用 .gallery__cell 会被 appendChild 到这里 */
  &__slot {
    width: 100%;
    min-height: 200px;
    box-sizing: border-box;
  }
}
</style>
