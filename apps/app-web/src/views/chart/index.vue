<template>
  <div class="chart-page">
    <div class="chart-page__header">
      <div class="chart-page__title">图表</div>
      <div class="chart-page__sub">
        共 {{ totalCount }} 个 / 每页 {{ pageSize }} 个 / 第
        {{ currentPage + 1 }} / {{ totalPages }} 页
      </div>
    </div>

    <div class="chart-page__grid">
      <CompCard
        v-for="item in pagedItems"
        :key="item.path"
        class="chart-page__card"
        :label="item.meta?.label || item.name"
        :tag="item.meta?.tag"
        :tag-color="TAG_COLORS[item.meta?.tag ?? '']"
        :src-path="item.srcPath"
        @preview="openPreview(item.name)"
        @copy="copyPath(item.srcPath)"
      >
        <component :is="item.component" />
      </CompCard>
    </div>

    <div class="chart-page__pager">
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
      category="chart"
      :component-name="previewName"
      :title="previewTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import type { Component } from 'vue';
import CompCard from '@/components/comp-card/index.vue';
import ComponentPreviewModal from '@/components/component-preview/ComponentPreviewModal.vue';
import { chartMeta, type ChartMeta } from './meta';

const route = useRoute();
const router = useRouter();

/** chip 底色：按 meta.tag 上色（原 .chart-page__chip--xxx 迁移而来） */
const TAG_COLORS: Record<string, string> = {
  柱状图: '#1677ff',
  环形图: '#13c2c2',
  折线图: '#52c41a',
  饼图: '#722ed1',
  数据展示: '#fa8c16',
};

/** 当前目录下的所有 chart 组件（与 /widget 同款 glob 写法） */
const componentModules = import.meta.glob<{ default: Component }>(
  './component/*/index.vue',
  { eager: true },
);

/** name -> 元信息（标签 + label），用于在卡片上渲染 chip / 取展示文案 */
const metaByName = computed<Record<string, ChartMeta>>(() => {
  const acc: Record<string, ChartMeta> = {};
  chartMeta.forEach((c) => {
    acc[c.name] = c;
  });
  return acc;
});

/** 排序策略：先按标签分组，再按目录名升序（与 /widget 一致） */
const items = computed(() => {
  return Object.entries(componentModules)
    .map(([path, module]) => {
      const name = path.replace(/^.*\/component\/([^/]+)\/index\.vue$/, '$1');
      return {
        path,
        name,
        srcPath: path.replace(/^\.\//, 'src/views/chart/'),
        component: module.default,
        meta: metaByName.value[name],
      };
    })
    .sort((a, b) => {
      const at = a.meta?.tag ?? '';
      const bt = b.meta?.tag ?? '';
      if (at !== bt) {
        return at.localeCompare(bt);
      }
      return a.name.localeCompare(b.name);
    });
});

/* ============================================================
 * 分页（固定每页 6 个，hash ?page=N 同步，参考 /widget 实现）
 * ========================================================== */

const pageSize = ref(6);

const totalCount = computed(() => items.value.length);

/** 把 hash query 里的 page（1-based）解析为 0-based 下标；非法值回退首屏 */
function parsePage(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n - 1 : 0;
}

const currentPage = ref(parsePage(route.query.page));

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / pageSize.value)),
);

/** 当前页要渲染的条目（slice 不变更源数组） */
const pagedItems = computed(() => {
  const start = currentPage.value * pageSize.value;
  return items.value.slice(start, start + pageSize.value);
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

/* ============================================================
 * 组件预览弹框
 * ========================================================== */

/** 当前预览的组件目录名；弹框开关由卡片上的「预览」按钮控制 */
const previewName = ref('');
const previewOpen = ref(false);

/** 弹框标题：优先取 meta.label，回退为组件目录名 */
const previewTitle = computed(
  () =>
    items.value.find((it) => it.name === previewName.value)?.meta?.label ??
    previewName.value,
);

/** 打开预览弹框：先记下组件名，再开框（destroyOnClose 会按新组件重新挂载） */
function openPreview(name: string) {
  previewName.value = name;
  previewOpen.value = true;
}

/** 复制组件路径到剪贴板（参考 /widget 的降级策略） */
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
 * 页面高度 = 内容区可视高度（100vh − 布局上下 padding 28 − 顶栏 60 − 内容区上下 padding 64 = 152），
 * 3 列 × 2 行的网格用 flex 撑满剩余空间，6 张卡片 + 分页条正好填满一屏、不出滚动条。
 * 页面自身不带 padding，间距统一由内容区的 padding 与这里的 gap 提供。
 */
.chart-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  background: var(--bg-color);
  min-height: calc(100vh - 152px);
}

.chart-page__header {
  flex: none;

  .chart-page__title {
    font-size: 24px;
    font-weight: 700;
    color: var(--ink-color);
    letter-spacing: 1px;
  }

  .chart-page__sub {
    margin-top: 6px;
    font-size: 13px;
    color: var(--ink-color-3);
  }
}

/**
 * 6 个组件固定 3 列 × 2 行等分：行高取 1fr，卡片高度完全由视口决定，
 * 不设 min-height 下限 —— 保证分页条始终留在首屏内，不出现滚动条。
 */
.chart-page__grid {
  height: calc(100vh - 240px);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

/**
 * 卡片：尺寸由网格决定，仅覆盖底色与舞台色（浅色外框 + #05284b 深色舞台承载暗色图表）。
 * 结构与信息行样式统一由 @/components/comp-card 提供。
 */
.chart-page__card {
  background: #fff;
  --comp-card-stage-bg: #05284b;
  --comp-card-name-color: #475069;
}

.chart-page__pager {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

/** 窄屏降为 2 列 × 3 行，行数同步调整，避免出现第 3 条隐式行破坏「填满」布局 */
@media (max-width: 1280px) {
  .chart-page__grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .chart-page__grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, minmax(0, 1fr));
  }
}
</style>
