<template>
  <div class="component-preview">
    <div class="component-preview__toolbar">
      <a-select
        v-model:value="selectedCategory"
        class="component-preview__select"
        placeholder="选择类型"
        allow-clear
        :options="categoryOptions"
        @change="handleCategoryChange"
      />
      <a-select
        v-model:value="selectedComponent"
        class="component-preview__select"
        placeholder="选择组件"
        allow-clear
        :disabled="!selectedCategory"
        :options="componentOptions"
      />
      <span
        v-if="currentPath"
        class="component-preview__path"
        title="点击复制组件路径"
        @click="copyPath(currentPath)"
      >
        {{ currentPath }}
      </span>
    </div>

    <PreviewStage
      :category="selectedCategory"
      :component-name="selectedComponent"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { message } from 'ant-design-vue';
import type { Component } from 'vue';
import { useComponentPreviewStore } from '@/store/modules/component-preview';
import PreviewStage from './PreviewStage.vue';

const componentModules = import.meta.glob<{ default: Component }>(
  '../../views/*/component/*/index.vue',
  { eager: true },
);

interface ComponentEntry {
  category: string;
  name: string;
  /** 相对 src 的组件入口路径，如 src/views/chart/component/gradient-bar/index.vue */
  path: string;
}

const entries: ComponentEntry[] = Object.entries(componentModules).map(
  ([path]) => {
    const m = path.match(/\/views\/([^/]+)\/component\/([^/]+)\/index\.vue$/);
    return {
      category: m?.[1] ?? '',
      name: m?.[2] ?? '',
      path: `src${m?.[0] ?? ''}`,
    };
  },
);

/** 一级选择器：views 下所有含 component 目录的类型名 */
const categories = [...new Set(entries.map((e) => e.category))].sort();

const componentPreviewStore = useComponentPreviewStore();
const { category: selectedCategory, componentName: selectedComponent } =
  storeToRefs(componentPreviewStore);

const categoryOptions = computed(() =>
  categories.map((c) => ({ label: c, value: c })),
);

/** 二级选择器：当前类型下所有组件名 */
const componentsOfCategory = computed(() =>
  entries.filter((e) => e.category === selectedCategory.value),
);

const componentOptions = computed(() =>
  componentsOfCategory.value.map((e) => ({ label: e.name, value: e.name })),
);

/** 当前选中组件的入口路径 */
const currentPath = computed(() => {
  const entry = componentsOfCategory.value.find(
    (e) => e.name === selectedComponent.value,
  );
  return entry?.path ?? '';
});

function handleCategoryChange() {
  selectedComponent.value = undefined;
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
</script>

<style lang="scss" scoped>
.component-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__select {
    width: 200px;
  }

  &__path {
    font-size: 12px;
    color: var(--ink-color);
    opacity: 0.6;
    cursor: pointer;
    user-select: none;

    &:hover {
      opacity: 1;
      color: var(--primary-color);
    }
  }
}
</style>