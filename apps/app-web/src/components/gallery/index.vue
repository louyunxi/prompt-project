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
        <div class="gallery__meta-row">
          <span
            v-if="item.meta"
            class="gallery__chip"
            :class="`gallery__chip--${item.meta.tag}`"
            :title="item.meta.label"
            @click.stop
          >
            {{ item.meta.tag }}
          </span>
          <div class="gallery__path">{{ item.srcPath }}</div>
        </div>
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
  loading: 'Loader',
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
    /**
     * 可选：组件名 -> 元信息（标签 / 展示文案）。命中时在卡片下方渲染 chip，
     * 不传则不渲染 chip（其它分类不影响）。
     */
    cellMeta?: Record<string, { tag: string; label: string }>;
  }>(),
  { componentNames: () => [], cellMeta: () => ({}) },
);

const title = computed(() => categoryNames[props.category] ?? props.category);

const items = computed(() => {
  const all = Object.entries(componentModules)
    .filter(([path]) => path.includes(`/views/${props.category}/component/`))
    .map(([path, module]) => {
      const name = path.replace(/^.*\/component\/([^/]+)\/index\.vue$/, '$1');
      return {
        path,
        /** 规范化展示路径：`../../views/x/component/y/index.vue` → `src/views/x/component/y/index.vue` */
        srcPath: path.replace(/^\.\.\/\.\.\//, 'src/'),
        name,
        component: module.default,
        meta: props.cellMeta[name],
      };
    });
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
  padding: 20px 20px;
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

  /** chip + path 同行容器，chip 在左、path 占满剩余宽度 */
  &__meta-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /** 分类标签 chip，由 cellMeta 注入；颜色按 tag 区分 */
  &__chip {
    flex-shrink: 0;
    font-size: 11px;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 4px;
    color: #fff;
    background: var(--primary-color);
    cursor: default;
    white-space: nowrap;
  }

  &__chip--数据展示 {
    background: #1677ff;
  }

  &__chip--按钮 {
    background: #722ed1;
  }

  &__empty {
    padding: 64px 0;
  }

  // 图表分类：卡片深色背景（#05284b，图表组件为暗色主题设计）
  // 排版参考 app-prompt PcCompCard —— 同一行卡片按各自内容高度收缩（自然高度）
  // 图表组件为固定尺寸（高 280~410px、宽 ≥423px），故放宽展示盒并固定展示高度，
  // 让 chart 组件的 height: 100% 能真正铺满父容器（之前 height: auto + min-height: 320，
  // 子 height: 100% 解析为 auto 导致组件实际只有 min-height 240，底部空 80px）
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
      height: 360px;
    }

    .gallery__path {
      color: rgba(255, 255, 255, 0.6);
    }
  }
}
</style>
