<template>
  <div class="comp-gallery" :style="cssVars">
    <div class="comp-gallery__header">
      <div class="comp-gallery__title">{{ pageTitle }}</div>
      <div class="comp-gallery__sub">
        共 {{ totalCount }} 个 / 每页 {{ pageSize }} 个 / 第
        {{ currentPage + 1 }} / {{ totalPages }} 页
      </div>
    </div>

    <div v-if="pagedItems.length" class="comp-gallery__grid">
      <CompCard
        v-for="item in pagedItems"
        :key="item.name"
        class="comp-gallery__card"
        :label="item.title"
        :name-title="`${item.name} · ${item.srcPath}`"
        :tag="pageTitle"
        :src-path="item.srcPath"
        @preview="openPreview(item.name)"
        @copy="copyPath(item.srcPath)"
      >
        <component :is="item.component" />
      </CompCard>
    </div>

    <a-empty
      v-else
      class="comp-gallery__empty"
      description="该分类下暂无组件"
    />

    <div v-if="totalPages > 1" class="comp-gallery__pager">
      <a-button :disabled="currentPage === 0" @click="goPage(currentPage - 1)">
        上一页
      </a-button>
      <a-button
        v-for="page in totalPages"
        :key="page"
        :type="page - 1 === currentPage ? 'primary' : 'default'"
        @click="goPage(page - 1)"
      >
        {{ page }}
      </a-button>
      <a-button
        :disabled="currentPage >= totalPages - 1"
        @click="goPage(currentPage + 1)"
      >
        下一页
      </a-button>
    </div>

    <ComponentPreviewModal
      v-model:open="previewOpen"
      :category="props.category"
      :component-name="previewName"
      :title="previewTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import type { Component, CSSProperties } from 'vue';
import CompCard from '@/components/comp-card/index.vue';
import ComponentPreviewModal from '@/components/component-preview/ComponentPreviewModal.vue';

/** 分类目录名 -> 中文标题（与 router / Gallery 保持一致） */
const categoryNames: Record<string, string> = {
  layout: '页面布局',
  map: '地图',
  typography: '排版',
  modal: '弹框布局',
  effect: '特效',
  chart: '图表',
  widget: '小组件',
  background: '背景',
  font: '字体',
  loading: 'Loader',
};

/** views/<category>/component/<name>/index.vue 下的全部组件 */
const componentModules = import.meta.glob<{ default: Component }>(
  '../../views/*/component/*/index.vue',
  { eager: true },
);

/** 同一批 index.vue 的原始源码：用于解析头部注释中的组件中文名称 */
const componentSources = import.meta.glob<string>(
  '../../views/*/component/*/index.vue',
  { query: '?raw', import: 'default', eager: true },
);

/** 与 apps/app-web/src/main.ts 的 TITLE_RE 保持一致 */
const TITLE_RE = /组件名称：[^（(]+[（(]([^）)]+)[）)]/;

/** 解析头部注释 `组件名称：<EnglishName>（<中文名称>）`，失败时回退目录名 */
function resolveTitle(source: string | undefined, fallback: string): string {
  const m = typeof source === 'string' ? source.match(TITLE_RE) : null;
  return m ? m[1].trim() : fallback;
}

const props = withDefaults(
  defineProps<{
    /** 分类目录名：views/<category>/component/<name>/ */
    category: string;
    /** 每页展示数量 */
    pageSize?: number;
    /** 卡片容器背景色 */
    background?: string;
  }>(),
  {
    pageSize: 6,
    background: '#ffffff',
  },
);

const route = useRoute();
const router = useRouter();

/** 卡片背景通过 CSS 变量下发，样式侧只读变量 */
const cssVars = computed<CSSProperties>(() => ({
  '--cg-card-bg': props.background,
}));

const pageTitle = computed(
  () => categoryNames[props.category] ?? props.category,
);

/** 当前分类下的组件条目（按目录名升序，与 Gallery 排序一致） */
const items = computed(() =>
  Object.entries(componentModules)
    .filter(([path]) => path.includes(`/views/${props.category}/component/`))
    .map(([path, module]) => {
      const name = path.replace(/^.*\/component\/([^/]+)\/index\.vue$/, '$1');
      return {
        name,
        title: resolveTitle(componentSources[path], name),
        component: module.default,
        /** 规范化展示路径：`../../views/x/component/y/index.vue` → `src/views/x/component/y/index.vue` */
        srcPath: path.replace(/^\.\.\/\.\.\//, 'src/'),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name)),
);

const totalCount = computed(() => items.value.length);

/* ============================================================
 * 分页（固定每页 6 个，hash ?page=N 同步，参考 /widget 实现）
 * ========================================================== */

/** 把 hash query 里的 page（1-based）解析为 0-based 下标；非法值回退首屏 */
function parsePage(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n - 1 : 0;
}

const currentPage = ref(parsePage(route.query.page));

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / props.pageSize)),
);

/** 当前页要渲染的条目（slice 不变更源数组） */
const pagedItems = computed(() => {
  const start = currentPage.value * props.pageSize;
  return items.value.slice(start, start + props.pageSize);
});

/** 切页：边界检查 + 同步 hash + 滚到顶 */
function goPage(page: number) {
  if (page < 0 || page >= totalPages.value || page === currentPage.value) {
    return;
  }
  currentPage.value = page;
  router.replace({ query: { ...route.query, page: page + 1 } });
  window.scrollTo({ top: 0 });
}

/** 浏览器前进 / 后退、手改 hash 时同步当前页 */
watch(
  () => route.query.page,
  (value) => {
    const page = parsePage(value);
    if (page !== currentPage.value && page < totalPages.value) {
      currentPage.value = page;
    }
  },
);

/** 组件数 / pageSize 变化导致总页数变少时，收敛当前页避免越界 */
watch(
  totalPages,
  (tp) => {
    if (currentPage.value >= tp) {
      currentPage.value = tp - 1;
    }
  },
  { immediate: true },
);

/* ============================================================
 * 组件预览弹框
 * ========================================================== */

/** 当前预览的组件目录名；弹框开关由卡片上的「预览」按钮控制 */
const previewName = ref('');
const previewOpen = ref(false);

/** 弹框标题：优先取组件中文名（注释解析结果），回退为目录名 */
const previewTitle = computed(
  () =>
    items.value.find((it) => it.name === previewName.value)?.title ??
    previewName.value,
);

/** 打开预览弹框：先记下组件名，再开框（destroyOnClose 会按新组件重新挂载） */
function openPreview(name: string) {
  previewName.value = name;
  previewOpen.value = true;
}

/**
 * 复制组件路径到剪贴板
 * navigator.clipboard 不可用时回退 execCommand 方案
 */
async function copyPath(path: string) {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(path);
    } else {
      const ta = document.createElement('textarea');
      ta.value = path;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    message.success(`已复制：${path}`);
  } catch {
    message.error('复制失败，请手动复制');
  }
}
</script>

<style lang="scss" scoped>
/**
 * 与 /chart 页面同款骨架：
 * 页面高度 = 内容区可视高度（100vh − 布局上下 padding 28 − 顶栏 60 − 内容区上下 padding 64 = 152），
 * 3 列 × 2 行的网格把剩余空间撑满，6 张卡片 + 分页条正好填满一屏、不出滚动条。
 * 页面自身不带 padding，间距统一由内容区的 padding 与这里的 gap 提供。
 */
.comp-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  background: var(--bg-color);
  min-height: calc(100vh - 152px);
}

.comp-gallery__header {
  flex: none;

  .comp-gallery__title {
    font-size: 24px;
    font-weight: 700;
    color: var(--ink-color);
    letter-spacing: 1px;
  }

  .comp-gallery__sub {
    margin-top: 6px;
    font-size: 13px;
    color: var(--ink-color-3);
  }
}

/**
 * 6 个组件固定 3 列 × 2 行等分：行高取 1fr，卡片高度完全由视口决定，
 * 不设 min-height 下限 —— 保证分页条始终留在首屏内，不出现滚动条。
 */
.comp-gallery__grid {
  height: calc(100vh - 240px);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

/**
 * 卡片：尺寸由网格决定，仅覆盖底色（--cg-card-bg，排版分类为纯白）。
 * 结构与信息行样式统一由 @/components/comp-card 提供。
 */
.comp-gallery__card {
  background: var(--cg-card-bg);
}

.comp-gallery__empty {
  padding: 64px 0;
}

.comp-gallery__pager {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

/** 窄屏降为 2 列 × 3 行，行数同步调整，避免出现第 3 条隐式行破坏「填满」布局 */
@media (max-width: 1280px) {
  .comp-gallery__grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .comp-gallery__grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, minmax(0, 1fr));
  }
}
</style>
