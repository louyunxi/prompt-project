<!--
  分类页：特效（effect）

  职责：以画廊卡片形式展示 src/views/effect/component/<name>/index.vue 下的全部特效组件。
  容器尺寸 / 布局 / 分页与 src/views/chart/index.vue 保持一致：
    - 页面高 calc(100vh - 152px)，网格高 calc(100vh - 240px)，3 列 × 2 行等分；
    - 每页固定 6 个，6 张卡片 + 分页条正好填满一屏，不出滚动条；
    - 当前页码与 hash query（?page=N）双向同步。
  组件由 import.meta.glob 自动收集，新增组件目录无需改动本文件
  （但需在 ./meta.ts 登记标签与展示文案，否则卡片上没有 chip）。

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - vue-router ^4.x（useRoute / useRouter）
    - ant-design-vue ^4.2.6（a-button 自动按需注册）
-->
<template>
  <div class="effect-page">
    <div class="effect-page__header">
      <div class="effect-page__title">特效</div>
      <div class="effect-page__sub">
        共 {{ totalCount }} 个 / 每页 {{ pageSize }} 个 / 第
        {{ currentPage + 1 }} / {{ totalPages }} 页
      </div>
    </div>

    <div class="effect-page__grid">
      <CompCard
        v-for="item in pagedItems"
        :key="item.path"
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

    <div class="effect-page__pager">
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
      category="effect"
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
import { effectMeta, effectTags, type EffectMeta } from './meta';

/** chip 底色：按 meta.tag 上色（原 .effect-page__chip--xxx 迁移而来） */
const TAG_COLORS: Record<string, string> = {
  导航: '#1677ff',
  光效: '#722ed1',
  滚动: '#13c2c2',
};

const route = useRoute();
const router = useRouter();

/** 当前目录下的所有 effect 组件（与 /chart 同款 glob 写法） */
const componentModules = import.meta.glob<{ default: Component }>(
  './component/*/index.vue',
  { eager: true },
);

/** name -> 元信息（标签 + label），用于在卡片上渲染 chip / 取展示文案 */
const metaByName = computed<Record<string, EffectMeta>>(() => {
  const acc: Record<string, EffectMeta> = {};
  effectMeta.forEach((e) => {
    acc[e.name] = e;
  });
  return acc;
});

/** 排序策略：先按标签分组（即 effectTags 声明顺序），再按目录名升序 */
const items = computed(() => {
  return Object.entries(componentModules)
    .map(([path, module]) => {
      const name = path.replace(/^.*\/component\/([^/]+)\/index\.vue$/, '$1');
      return {
        path,
        name,
        srcPath: path.replace(/^\.\//, 'src/views/effect/'),
        component: module.default,
        meta: metaByName.value[name],
      };
    })
    .sort((a, b) => {
      // 未登记 meta 的条目归到末尾
      const at = a.meta ? effectTags.indexOf(a.meta.tag) : effectTags.length;
      const bt = b.meta ? effectTags.indexOf(b.meta.tag) : effectTags.length;
      if (at !== bt) {
        return at - bt;
      }
      return a.name.localeCompare(b.name);
    });
});

/* ============================================================
 * 分页（固定每页 6 个，hash ?page=N 同步，与 /chart 一致）
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

/** 复制组件路径到剪贴板（与 /chart 同款降级策略） */
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
.effect-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  background: var(--bg-color);
  min-height: calc(100vh - 152px);
}

.effect-page__header {
  flex: none;

  .effect-page__title {
    font-size: 24px;
    font-weight: 700;
    color: var(--ink-color);
    letter-spacing: 1px;
  }

  .effect-page__sub {
    margin-top: 6px;
    font-size: 13px;
    color: var(--ink-color-3);
  }
}

/**
 * 6 个组件固定 3 列 × 2 行等分：行高取 1fr，卡片高度完全由视口决定，
 * 不设 min-height 下限 —— 保证分页条始终留在首屏内，不出现滚动条。
 */
.effect-page__grid {
  height: calc(100vh - 240px);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

/**
 * 卡片：全用 @/components/comp-card 的默认样式（--card-bg 主题感知容器，
 * 特效组件普遍带明暗主题覆盖，硬编码 #fff 会让暗色主题下浅色文案落在白底上），
 * 因此 /effect 不需要自己的卡片类名。
 */

.effect-page__pager {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

/** 窄屏降为 2 列 × 3 行，行数同步调整，避免出现第 3 条隐式行破坏「填满」布局 */
@media (max-width: 1280px) {
  .effect-page__grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .effect-page__grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, minmax(0, 1fr));
  }
}
</style>
