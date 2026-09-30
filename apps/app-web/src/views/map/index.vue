<template>
  <div class="map-page">
    <div class="map-page__header">
      <div class="map-page__heading">
        <div class="map-page__title">地图</div>
        <div class="map-page__sub">
          共 {{ filteredCount }} 个 / 每页 {{ PAGE_SIZE }} 个 / 第
          {{ currentPage + 1 }} / {{ totalPages }} 页
        </div>
      </div>
      <a-input
        v-model:value="searchKey"
        class="map-page__search"
        placeholder="搜索组件名或标签"
        allow-clear
      >
        <template #prefix><SearchOutlined /></template>
      </a-input>
    </div>

    <div class="map-page__grid">
      <template v-if="pagedItems.length">
        <CompCard
          v-for="item in pagedItems"
          :key="item.path"
          class="map-page__card"
          stage-layout="stretch"
          :label="item.meta?.label || item.name"
          :tag="item.meta?.tag"
          :tag-color="TAG_COLORS[item.meta?.tag ?? '']"
          :src-path="item.srcPath"
          @preview="openPreview(item.name)"
          @copy="copyPath(item.srcPath)"
        >
          <component :is="item.component" />
        </CompCard>
      </template>
      <div v-else class="map-page__empty">未找到匹配的组件</div>
    </div>

    <div class="map-page__pager">
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
      category="map"
      :component-name="previewName"
      :title="previewTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import type { Component } from 'vue';
import CompCard from '@/components/comp-card/index.vue';
import ComponentPreviewModal from '@/components/component-preview/ComponentPreviewModal.vue';
import { mapMeta, type MapMeta } from './meta';

/** chip 底色：按 meta.tag 上色（原 .map-page__chip--xxx 迁移而来） */
const TAG_COLORS: Record<string, string> = {
  底图: '#1677ff',
  区域: '#13c2c2',
  绘制: '#faad14',
};

const route = useRoute();
const router = useRouter();

/** 当前目录下的所有 map 组件（与 /chart、/widget 同款 glob 写法） */
const componentModules = import.meta.glob<{ default: Component }>(
  './component/*/index.vue',
  { eager: true },
);

/** name -> 元信息（标签 + label），用于在卡片上渲染 chip / 取展示文案 */
const metaByName = computed<Record<string, MapMeta>>(() => {
  const acc: Record<string, MapMeta> = {};
  mapMeta.forEach((m) => {
    acc[m.name] = m;
  });
  return acc;
});

/** 排序策略：先按标签分组，再按目录名升序（与 /chart、/widget 一致） */
const items = computed(() => {
  return Object.entries(componentModules)
    .map(([path, module]) => {
      const name = path.replace(/^.*\/component\/([^/]+)\/index\.vue$/, '$1');
      return {
        path,
        name,
        srcPath: path.replace(/^\.\//, 'src/views/map/'),
        component: module.default,
        meta: metaByName.value[name],
      };
    })
    .sort((a, b) => {
      // 显式标注 string：当前只有「底图」一个标签，不标注会被 TS 收窄成 never
      const at: string = a.meta?.tag ?? '';
      const bt: string = b.meta?.tag ?? '';
      if (at !== bt) {
        return at.localeCompare(bt);
      }
      return a.name.localeCompare(b.name);
    });
});

/* ============================================================
 * 搜索（组件名 / 标签名，均不分大小写、包含即命中）
 * ========================================================== */

const searchKey = ref('');

/** 命中目录名、meta.label（组件名）或 meta.tag（标签）任一即保留 */
const filteredItems = computed(() => {
  const keyword = searchKey.value.trim().toLowerCase();
  if (!keyword) {
    return items.value;
  }
  return items.value.filter((item) =>
    [item.name, item.meta?.label ?? '', item.meta?.tag ?? ''].some((text) =>
      text.toLowerCase().includes(keyword),
    ),
  );
});

const filteredCount = computed(() => filteredItems.value.length);

/* ============================================================
 * 分页（固定每页 4 个，2×2 正好一屏，hash ?page=N 同步）
 * ========================================================== */

const PAGE_SIZE = 4;

/** 把 hash query 里的 page（1-based）解析为 0-based 下标；非法值回退首屏 */
function parsePage(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n - 1 : 0;
}

const currentPage = ref(parsePage(route.query.page));

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredCount.value / PAGE_SIZE)),
);

/** 当前页要渲染的条目（slice 不变更源数组） */
const pagedItems = computed(() => {
  const start = currentPage.value * PAGE_SIZE;
  return filteredItems.value.slice(start, start + PAGE_SIZE);
});

/** 搜索词变化时回到第一页，避免停在已被过滤掉的空页 */
watch(searchKey, () => {
  currentPage.value = 0;
  router.replace({ query: { ...route.query, page: 1 } });
  window.scrollTo({ top: 0 });
});

/** 搜索 / 切页导致总页数变少时，收敛当前页避免越界 */
watch(totalPages, (tp) => {
  if (currentPage.value >= tp) {
    currentPage.value = tp - 1;
  }
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

/** 复制组件路径到剪贴板（参考 /chart、/widget 的降级策略） */
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
 * 页面高度 = 内容区可视高度（100vh − 布局上下 padding 28 − 顶栏 60 − 内容区上下 padding 36 = 124），
 * 正好填满内容区、不出现滚动条；溢出风险由内部网格消化（overflow hidden 兜底）。
 * 页面自身不带 padding，间距统一由内容区的 padding 与这里的 gap 提供。
 */
.map-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
  background: var(--bg-color);
  height: calc(100vh - 124px);
  overflow: hidden;
}

.map-page__header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  .map-page__title {
    font-size: 24px;
    font-weight: 700;
    color: var(--ink-color);
    letter-spacing: 1px;
  }

  .map-page__sub {
    margin-top: 6px;
    font-size: 13px;
    color: var(--ink-color-3);
  }
}

.map-page__search {
  flex: none;
  width: 240px;
  border-radius: 8px;
}

/**
 * 2 列 × 2 行等分：行高取 1fr，卡片高度完全由剩余空间决定，
 * 不设 min-height 下限 —— 保证分页条始终留在首屏内，不出现滚动条。
 */
.map-page__grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

/**
 * 卡片：纯白容器；内部舞台用深色底（卫星影像的兜底底色，主题无关）承载地图组件。
 * 底部信息行参考 /chart 卡片：左侧 chip（组件属性）+ 名称、右侧预览 / 复制路径。
 */
/**
 * 卡片：尺寸由网格决定，仅覆盖底色与舞台色（浅色外框 + 深色底图舞台）。
 * 地图组件要铺满整块舞台，故模板上用 stage-layout="stretch"。
 * 结构与信息行样式统一由 @/components/comp-card 提供。
 */
.map-page__card {
  background: #fff;
  --comp-card-stage-bg: #0b1a2b;
  --comp-card-name-color: #475069;
}

/** 搜索无结果时占满整个网格区域 */
.map-page__empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--ink-color-3);
}

.map-page__pager {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>
