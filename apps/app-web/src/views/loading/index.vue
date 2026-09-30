<template>
  <div class="loading-page">
    <div class="loading-header">
      <div class="loading-title">Loader</div>
      <div class="loading-sub">
        共 {{ totalCount }} 个 / 每页 {{ pageSize }} 个 / 第
        {{ currentPage + 1 }} / {{ totalPages }} 页
      </div>
    </div>

    <div ref="gridRef" class="loading-grid">
      <CompCard
        v-for="item in pagedItems"
        :key="item.path"
        class="loading-card"
        :label="item.name"
        :src-path="item.srcPath"
        @preview="openPreview(item.name)"
        @copy="copyPath(item.srcPath)"
      >
        <component :is="item.component" />
      </CompCard>
    </div>

    <div class="loading-pager">
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
      category="loading"
      :component-name="previewName"
      :title="previewTitle"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  nextTick,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import type { Component } from 'vue';
import CompCard from '@/components/comp-card/index.vue';
import ComponentPreviewModal from '@/components/component-preview/ComponentPreviewModal.vue';

const route = useRoute();
const router = useRouter();

/**
 * Dynamically load all components under this category.
 * Globs ./component/<name>/index.vue relative to this file.
 */
const componentModules = import.meta.glob<{ default: Component }>(
  './component/*/index.vue',
  { eager: true },
);

/**
 * 前排固定展示的 Loader 组件（按此顺序排在最前，其余按名称升序）。
 * 来源：把通用加载组件从 widget/ 迁入后置顶，便于人工核验效果。
 */
const PINNED_LOADING = ['ball-loading', 'gs-loading-01'];

const items = computed(() => {
  return Object.entries(componentModules)
    .map(([path, module]) => ({
      path,
      /** 规范化展示路径：`./component/x/index.vue` → `src/views/loading/component/x/index.vue` */
      srcPath: path.replace(/^\.\//, 'src/views/loading/'),
      name: path.replace(/^.*\/component\/([^/]+)\/index\.vue$/, '$1'),
      component: module.default,
    }))
    .sort((a, b) => {
      const ai = PINNED_LOADING.indexOf(a.name);
      const bi = PINNED_LOADING.indexOf(b.name);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) {
          return 1;
        }
        if (bi === -1) {
          return -1;
        }
        return ai - bi;
      }
      return a.name.localeCompare(b.name);
    });
});

const totalCount = computed(() => items.value.length);

/* ============================================================
 * 组件预览弹框
 * ========================================================== */

/** 当前预览的组件目录名；弹框开关由卡片上的「预览」按钮控制 */
const previewName = ref('');
const previewOpen = ref(false);

/** 弹框标题取组件目录名（本分类无 meta 配置） */
const previewTitle = computed(() => previewName.value);

/** 打开预览弹框：先记下组件名，再开框（destroyOnClose 会按新组件重新挂载） */
function openPreview(name: string) {
  previewName.value = name;
  previewOpen.value = true;
}

/** 复制组件路径到剪贴板 */
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

/* ============================================================
 * 动态 pageSize：根据视口高度 + 网格列数，让一页尽量填满视口、
 * 不出现 Y 轴滚动条。刷新 / 缩放 / 前进后退都会重算。
 * ========================================================== */

const GAP = 16; // grid gap
const MIN_COL_WIDTH = 240; // 与 .loading-grid minmax(240px, 1fr) 对应
const CHROME = 200; // header + pager + padding 的预留高度

const gridRef = ref<HTMLElement | null>(null);

/** 每页展示数量（动态） */
const pageSize = ref(10);

/** 把 hash query 里的 page（1-based）解析为 0-based 下标；非法值回退首屏 */
function parsePage(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n - 1 : 0;
}

const currentPage = ref(parsePage(route.query.page));

function calcPageSize() {
  if (typeof window === 'undefined') {
    return;
  }
  const vh = window.innerHeight;
  // 卡片目标高度与 .loading-card 的 min-height: calc(50vh - 180px) 对齐
  const cardH = Math.max(120, vh * 0.5 - 180);
  const gridW =
    gridRef.value?.clientWidth ?? document.documentElement.clientWidth - 260;
  const cols = Math.max(1, Math.floor((gridW + GAP) / (MIN_COL_WIDTH + GAP)));
  const rows = Math.max(1, Math.floor((vh - CHROME + GAP) / (cardH + GAP)));
  pageSize.value = Math.max(1, rows * cols);
}

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / pageSize.value)),
);

/** Components on the current page (slice does not mutate) */
const pagedItems = computed(() => {
  const start = currentPage.value * pageSize.value;
  return items.value.slice(start, start + pageSize.value);
});

/** Switch page with bounds check, sync to hash query (1-based), scroll to top */
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

/** pageSize 动态变化导致总页数变少时，收敛当前页避免越界 */
watch(totalPages, (tp) => {
  if (currentPage.value >= tp) {
    currentPage.value = tp - 1;
  }
});

const handleResize = () => calcPageSize();

onMounted(async () => {
  await nextTick();
  calcPageSize();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style lang="scss" scoped>
.loading-page {
  display: flex;
  flex-direction: column;
  padding: 20px 20px;
  box-sizing: border-box;
  background: var(--bg-color);
  min-height: calc(100vh - 160px);
}

.loading-header {
  margin-bottom: 20px;

  .loading-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--ink-color);
    letter-spacing: 1px;
  }

  .loading-sub {
    margin-top: 6px;
    font-size: 13px;
    color: var(--ink-color-3);
  }
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

/** 卡片尺寸由页面决定（与 widget 同款）；内部结构/间距走 comp-card 的变量 */
.loading-card {
  height: calc(50vh - 180px);
  padding: 12px;
  --comp-card-stage-bg: #f5f5f5;
  --comp-card-stage-min-height: 180px;
  --comp-card-meta-gap: 12px;
  --comp-card-meta-padding: 0;
}

.loading-pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}
</style>
