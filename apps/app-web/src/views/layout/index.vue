<template>
  <div class="layout-page">
    <div class="layout-page__header">
      <div class="layout-page__title">布局</div>
      <div class="layout-page__sub">
        共 {{ totalCount }} 个 / 每页 {{ pageSize }} 个 / 第
        {{ currentPage + 1 }} / {{ totalPages }} 页
      </div>
    </div>

    <div class="layout-page__grid">
      <CompCard
        v-for="item in pagedItems"
        :key="item.path"
        class="layout-page__card"
        :label="item.meta?.label || item.name"
        :tag="item.meta?.tag"
        :tag-color="TAG_COLORS[item.meta?.tag ?? '']"
        :src-path="item.srcPath"
        stage-layout="stretch"
        @preview="openPreview(item.name)"
        @copy="copyPath(item.srcPath)"
      >
        <component :is="item.component" />
      </CompCard>
    </div>

    <div class="layout-page__pager">
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
      category="layout"
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
import { layoutMeta, type LayoutMeta } from './meta';

/** chip 底色：按 meta.tag 上色（参考 /background 实现） */
const TAG_COLORS: Record<string, string> = {
  容器: '#1677ff',
};

const route = useRoute();
const router = useRouter();

/** 当前目录下的所有 layout 组件（与 /background 同款 glob 写法） */
const componentModules = import.meta.glob<{ default: Component }>(
  './component/*/index.vue',
  { eager: true },
);

/** name -> 元信息（标签 + label），用于在卡片上渲染 chip / 取展示文案 */
const metaByName = computed<Record<string, LayoutMeta>>(() => {
  const acc: Record<string, LayoutMeta> = {};
  layoutMeta.forEach((b) => {
    acc[b.name] = b;
  });
  return acc;
});

/** 排序策略：先按标签分组，再按目录名升序（与 /background 一致） */
const items = computed(() => {
  return Object.entries(componentModules)
    .map(([path, module]) => {
      const name = path.replace(/^.*\/component\/([^/]+)\/index\.vue$/, '$1');
      return {
        path,
        name,
        srcPath: path.replace(/^\.\//, 'src/views/layout/'),
        component: module.default,
        meta: metaByName.value[name],
      };
    })
    .sort((a, b) => {
      const at = (a.meta?.tag ?? '') as string;
      const bt = (b.meta?.tag ?? '') as string;
      if (at !== bt) {
        return at.localeCompare(bt);
      }
      return a.name.localeCompare(b.name);
    });
});

/* ============================================================
 * 分页（固定每页 6 个，hash ?page=N 同步，参考 /background 实现）
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

const previewName = ref('');
const previewOpen = ref(false);

const previewTitle = computed(
  () =>
    items.value.find((it) => it.name === previewName.value)?.meta?.label ??
    previewName.value,
);

function openPreview(name: string) {
  previewName.value = name;
  previewOpen.value = true;
}

/** 复制组件路径到剪贴板（参考 /background 的降级策略） */
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
.layout-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  background: var(--bg-color);
  min-height: calc(100vh - 152px);
}

.layout-page__header {
  flex: none;

  .layout-page__title {
    font-size: 24px;
    font-weight: 700;
    color: var(--ink-color);
    letter-spacing: 1px;
  }

  .layout-page__sub {
    margin-top: 6px;
    font-size: 13px;
    color: var(--ink-color-3);
  }
}

.layout-page__grid {
  height: calc(100vh - 240px);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.layout-page__card {
  background: #061222;
  --comp-card-name-color: #fff;
}

.layout-page__pager {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 1280px) {
  .layout-page__grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .layout-page__grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, minmax(0, 1fr));
  }
}
</style>
