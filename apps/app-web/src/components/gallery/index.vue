<template>
  <div class="gallery" :class="{ 'gallery--chart': category === 'chart' }">
    <div class="gallery__header">
      <div class="gallery__title">{{ title }}</div>
      <div class="gallery__sub">{{ category }}</div>
    </div>

    <div v-if="items.length" class="gallery__grid">
      <div
        v-for="item in items"
        :key="item.name"
        :data-component-name="item.name"
        class="gallery__cell"
      >
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

const props = withDefaults(
  defineProps<{
    category: string;
    /** 可选：仅渲染指定组件名；不传则扫描该 category 下全部组件 */
    componentNames?: string[];
  }>(),
  { componentNames: () => [] as string[] },
);

const title = computed(() => categoryNames[props.category] ?? props.category);

const items = computed(() => {
  const all = Object.entries(componentModules)
    .filter(([path]) => path.includes(`/views/${props.category}/component/`))
    .map(([path, module]) => ({
      path,
      name: path.replace(/^.*\/component\/([^/]+)\/index\.vue$/, '$1'),
      component: module.default,
    }));
  const scoped = props.componentNames.length
    ? all.filter((it) => props.componentNames.includes(it.name))
    : all;
  return scoped.sort((a, b) => a.name.localeCompare(b.name));
});
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

  // 图表分类：卡片深色背景（#05284b，图表组件为暗色主题设计）
  // 排版参考 app-prompt PcCompCard —— 同一行卡片按各自内容高度收缩（自然高度）
  &--chart {
    .gallery__grid {
      align-items: start;
    }

    .gallery__cell {
      background: #05284b;
    }
  }
}
</style>
