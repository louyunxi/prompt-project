<template>
  <div class="gallery">
    <div class="gallery__header">
      <div class="gallery__title">{{ title }}</div>
      <div class="gallery__sub">{{ category }}</div>
    </div>

    <div v-if="items.length" class="gallery__grid">
      <div v-for="item in items" :key="item.path" class="gallery__cell">
        <component :is="item.component" />
      </div>
    </div>

    <a-empty v-else class="gallery__empty" description="该分类下暂无组件" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

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
};

/** 收集 views/<category>/component/<name>/index.vue 下的全部组件 */
const componentModules = import.meta.glob<{ default: Component }>(
  '../../views/*/component/*/index.vue',
  { eager: true },
);

const props = defineProps<{ category: string }>();

const title = computed(() => categoryNames[props.category] ?? props.category);

const items = computed(() =>
  Object.entries(componentModules)
    .filter(([path]) => path.includes(`/views/${props.category}/component/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, module]) => ({ path, component: module.default })),
);
</script>

<style lang="scss" scoped>
.gallery {
  width: 100%;
  padding: 24px 32px 40px;
  box-sizing: border-box;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: var(--ink-color);
  }

  &__sub {
    font-size: 13px;
    color: var(--ink-color-3);
  }

  // 一行三个
  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;

    @media (max-width: 1440px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 960px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__cell {
    min-width: 0;
    padding: 16px;
    box-sizing: border-box;
    border: 1px solid var(--line-color);
    border-radius: 8px;
    background: var(--card-bg);
  }

  &__empty {
    padding: 64px 0;
  }
}
</style>
