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
        title="点击复制组件路径"
        @click="copyPath(item.srcPath)"
      >
        <div class="gallery__box">
          <component :is="item.component" />
        </div>
        <div class="gallery__path">{{ item.srcPath }}</div>
      </div>
    </div>

    <a-empty v-else class="gallery__empty" description="该分类下暂无组件" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { message } from 'ant-design-vue';
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
      /** 规范化展示路径：`../../views/x/component/y/index.vue` → `src/views/x/component/y/index.vue` */
      srcPath: path.replace(/^\.\.\/\.\.\//, 'src/'),
      name: path.replace(/^.*\/component\/([^/]+)\/index\.vue$/, '$1'),
      component: module.default,
    }));
  const scoped = props.componentNames.length
    ? all.filter((it) => props.componentNames.includes(it.name))
    : all;
  return scoped.sort((a, b) => a.name.localeCompare(b.name));
});

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

  // 每个 cell 由内部 364 × 312 盒子决定自然宽度；超出 396px 一格就自动换行
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(396px, 1fr));
    gap: 20px;
  }

  &__cell {
    min-width: 0;
    padding: 16px;
    box-sizing: border-box;
    border: 1px solid var(--line-color);
    border-radius: 8px;
    background: var(--card-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: border-color 0.2s;

    &:hover {
      border-color: var(--primary-color);
    }
  }

  /** 组件默认展示尺寸：364 × 312；内容溢出时内部滚动 */
  &__box {
    width: 364px;
    height: 312px;
    overflow: auto;
    box-sizing: border-box;
  }

  /** 组件源码路径，点击 cell 复制 */
  &__path {
    width: 100%;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    color: var(--ink-color-3);
    text-align: center;
    word-break: break-all;
  }

  &__empty {
    padding: 64px 0;
  }

  // 图表分类：卡片深色背景（#05284b，图表组件为暗色主题设计）
  // 排版参考 app-prompt PcCompCard —— 同一行卡片按各自内容高度收缩（自然高度）
  // 图表组件为固定尺寸（高 280~410px、宽 ≥423px），故放宽展示盒并自适应高度，避免出现滚动条
  &--chart {
    .gallery__grid {
      grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
      align-items: start;
    }

    .gallery__cell {
      background: #05284b;
    }

    .gallery__box {
      width: 448px;
      height: auto;
      min-height: 320px;
    }

    .gallery__path {
      color: rgba(255, 255, 255, 0.6);
    }
  }
}
</style>
