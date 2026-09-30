<!--
  组件名称：AssetsLandResource（土地资源分类）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\ThreeAssetsSupervision\components\right\LandResourceChart.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .assets-land-resource 上）：
    --alr-border          rgba(0, 212, 255, 0.3)   面板边框色
    --alr-border-hover    rgba(0, 212, 255, 0.5)   面板悬停边框色
    --alr-shadow          rgba(0, 212, 255, 0.1)   面板外发光色
    --alr-name-color      #fff                    类别名称默认色
    --alr-value-color     #fff                    数值文字色
    --alr-track-bg        rgba(255, 255, 255, 0.06) 进度条轨道背景色
    --alr-scrollbar-start #00d4ff                 滚动条渐变起始色
    --alr-scrollbar-end   #0066ff                 滚动条渐变结束色

  迁移说明：
    1. 去除外部依赖：inject('regionAdcode')、多区域 mock 数据。
    2. 改为组件内自包含，仅保留省级（adcode 340000）mock 数据。
    3. 土地资源类别由业务名称改为通用名称：类别一~类别十三。
    4. 使用 ResizeObserver 监听列表容器尺寸变化（替代 window.resize），
       组件销毁时 disconnect 释放 observer。
    5. 保留列表自动滚动动画（requestAnimationFrame）与悬停暂停交互。
    6. 去除标题与图标，背景统一为舞台色。
    7. 面板宽度由源 400px 改为 100%，以适配 CompCard 舞台容器。
-->
<template>
  <div class="assets-land-resource">
    <div
      ref="containerRef"
      class="land-list"
      :class="{ 'is-paused': isPaused }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="land-scroll-wrapper">
        <div
          v-for="(item, index) in displayItems"
          :key="index"
          class="land-item"
          @mouseenter="onItemHover(index)"
          @mouseleave="onItemLeave"
        >
          <span class="land-name" :style="{ color: item.color }">{{
            item.name
          }}</span>
          <div class="land-bar-wrapper">
            <div
              class="land-bar"
              :style="{
                width: getBarWidth(item.value) + '%',
                background: item.color,
              }"
            ></div>
          </div>
          <span class="land-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const containerRef = ref<HTMLDivElement>();
const isPaused = ref(false);
const hoveredIndex = ref(-1);

/** 滚动动画帧 ID */
let animationId: number | null = null;
let startTime: number | null = null;
let lastScrollTop = 0;
let maxScroll = 0;

const categories = [
  { name: '类别一', color: '#06b6d4' },
  { name: '类别二', color: '#22d3ee' },
  { name: '类别三', color: '#34d399' },
  { name: '类别四', color: '#10b981' },
  { name: '类别五', color: '#059669' },
  { name: '类别六', color: '#84cc16' },
  { name: '类别七', color: '#f59e0b' },
  { name: '类别八', color: '#f97316' },
  { name: '类别九', color: '#a78bfa' },
  { name: '类别十', color: '#8b5cf6' },
  { name: '类别十一', color: '#6366f1' },
  { name: '类别十二', color: '#94a3b8' },
  { name: '类别十三', color: '#64748b' },
];

/** 省级 mock 数据 */
const landValues = [
  3200, 2480, 860, 2800, 680, 1680, 1200, 950, 680, 420, 240, 380, 510,
];

const maxValue = ref(0);

const displayItems = computed(() =>
  categories.map((cat, i) => ({
    name: cat.name,
    color: cat.color,
    value: landValues[i],
  })),
);

function getBarWidth(value: number): number {
  return maxValue.value > 0 ? (value / maxValue.value) * 100 : 0;
}

function startAnimation() {
  stopAnimation();

  const tick = (timestamp: number) => {
    if (isPaused.value) {
      animationId = null;
      return;
    }

    if (!startTime) {
      startTime = timestamp;
    }
    const elapsed = timestamp - startTime;
    const delta = elapsed / 50;

    lastScrollTop += delta;

    if (maxScroll > 0 && lastScrollTop >= maxScroll) {
      lastScrollTop = 0;
    }

    if (containerRef.value) {
      containerRef.value.scrollTop = lastScrollTop;
    }

    startTime = timestamp;
    animationId = requestAnimationFrame(tick);
  };

  animationId = requestAnimationFrame(tick);
}

function stopAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  startTime = null;
}

function handleMouseEnter() {
  isPaused.value = true;
  stopAnimation();
}

function handleMouseLeave() {
  isPaused.value = false;
  if (containerRef.value) {
    lastScrollTop = containerRef.value.scrollTop;
  }
  startAnimation();
}

function onItemHover(index: number) {
  hoveredIndex.value = index;
}

function onItemLeave() {
  hoveredIndex.value = -1;
}

function updateMaxScroll() {
  requestAnimationFrame(() => {
    const container = containerRef.value;
    if (!container) {
      return;
    }
    const wrapper = container.querySelector(
      '.land-scroll-wrapper',
    ) as HTMLElement | null;
    if (!wrapper) {
      return;
    }

    const totalHeight = wrapper.scrollHeight;
    const scrollableHeight = totalHeight - container.clientHeight;
    if (scrollableHeight <= 0) {
      maxScroll = 0;
      stopAnimation();
      return;
    }

    maxScroll = scrollableHeight;
    if (lastScrollTop > maxScroll) {
      lastScrollTop = 0;
      container.scrollTop = 0;
    }
  });
}

/** 容器尺寸变化观察器 */
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  maxValue.value = Math.max(...landValues);
  updateMaxScroll();
  setTimeout(startAnimation, 100);

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(updateMaxScroll);
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  stopAnimation();
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style scoped lang="scss">
.assets-land-resource {
  --alr-border: rgba(0, 212, 255, 0.3);
  --alr-border-hover: rgba(0, 212, 255, 0.5);
  --alr-shadow: rgba(0, 212, 255, 0.1);
  --alr-name-color: #fff;
  --alr-value-color: #fff;
  --alr-track-bg: rgba(255, 255, 255, 0.06);
  --alr-scrollbar-start: #00d4ff;
  --alr-scrollbar-end: #0066ff;

  width: 100%;
  height: 100%;
  padding: 16px;
  padding-right: 0;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--alr-border);
  box-shadow: 0 0 20px var(--alr-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:hover {
    border-color: var(--alr-border-hover);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .land-list {
    flex: 1;
    width: calc(100% - 5px);
    overflow-x: hidden;
    overflow-y: auto;
    position: relative;
    min-height: 0;
    padding-right: 5px;
    box-sizing: border-box;
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    transition: scrollbar-color 0.3s;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: linear-gradient(
        180deg,
        var(--alr-scrollbar-start) 0%,
        var(--alr-scrollbar-end) 100%
      );
      border-radius: 3px;
      box-shadow: 0 0 6px rgba(0, 180, 255, 0.4);
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover {
      scrollbar-color: rgba(0, 212, 255, 0.5) transparent;

      &::-webkit-scrollbar-thumb {
        opacity: 1;
      }
    }

    &.is-paused {
      overflow-y: auto;
    }
  }

  .land-scroll-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-x: hidden;
    overflow-y: hidden;
  }

  .land-item {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 24px;
    flex-shrink: 0;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateX(3px);
    }
  }

  .land-name {
    width: 56px;
    font-size: 12px;
    font-weight: 500;
    color: var(--alr-name-color);
    flex-shrink: 0;
  }

  .land-bar-wrapper {
    flex: 1;
    height: 12px;
    background: var(--alr-track-bg);
    border-radius: 3px;
    overflow: hidden;
  }

  .land-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 0.8s ease;
  }

  .land-value {
    width: 42px;
    font-size: 12px;
    font-weight: 600;
    color: var(--alr-value-color);
    text-align: right;
    flex-shrink: 0;
    font-family: 'DIN', 'Roboto', sans-serif;
  }
}
</style>
