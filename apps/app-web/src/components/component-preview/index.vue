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
}

const entries: ComponentEntry[] = Object.entries(componentModules).map(
  ([path]) => {
    const m = path.match(/\/views\/([^/]+)\/component\/([^/]+)\/index\.vue$/);
    return { category: m?.[1] ?? '', name: m?.[2] ?? '' };
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

function handleCategoryChange() {
  selectedComponent.value = undefined;
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
}
</style>