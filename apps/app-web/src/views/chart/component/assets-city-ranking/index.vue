<!--
  组件名称：AssetsCityRanking（各市监管指数排行）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\ThreeAssetsSupervision\components\right\CityRankingIndex.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .assets-city-ranking 上）：
    --acr-border          rgba(0, 212, 255, 0.3)   面板边框色
    --acr-border-hover    rgba(0, 212, 255, 0.5)   面板悬停边框色
    --acr-shadow          rgba(0, 212, 255, 0.1)   面板外发光色
    --acr-name-color      #e0f0ff                 区域名称色
    --acr-score-color     #e0f0ff                 分数文字色
    --acr-track-bg        #1e293b                 进度条轨道背景色
    --acr-fill-start      #0284c7                 进度条渐变起始色
    --acr-fill-end        #38bdf8                 进度条渐变结束色
    --acr-scrollbar-start #00d4ff                 滚动条渐变起始色
    --acr-scrollbar-end   #0066ff                 滚动条渐变结束色

  迁移说明：
    1. 去除外部依赖：inject('regionAdcode')、多区域 mock 数据。
    2. 改为组件内自包含，仅保留省级（adcode 340000）mock 数据。
    3. 城市名称改为通用名称：区域一~区域十六。
    4. 使用 ResizeObserver 监听列表容器尺寸变化（替代 window.resize），
       组件销毁时 disconnect 释放 observer。
    5. 保留列表自动滚动动画（requestAnimationFrame）与悬停暂停交互，
       保留进度条宽度过渡动画。
    6. 去除标题与图标，背景统一为舞台色。
    7. 面板宽度由源 400px 改为 100%，以适配 CompCard 舞台容器。
-->
<template>
  <div class="assets-city-ranking">
    <div
      ref="containerRef"
      class="ranking-list"
      :class="{ 'is-paused': isPaused }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="ranking-scroll-wrapper">
        <div
          v-for="(item, index) in rankings"
          :key="item.name"
          class="ranking-item"
        >
          <div class="ranking-info">
            <span class="ranking-no">{{ index + 1 }}. {{ item.name }}</span>
            <span class="ranking-score">{{ item.score }}</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: (item.score / 100) * 100 + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 滚动速度系数 */
    speed?: number;
  }>(),
  {
    speed: 25,
  },
);

const containerRef = ref<HTMLDivElement>();
const isPaused = ref(false);

/** 滚动动画帧 ID */
let animationId: number | null = null;
let startTime: number | null = null;
let lastScrollTop = 0;
let maxScroll = 0;

/** 省级 mock 数据 */
interface RankingItem {
  name: string;
  score: number;
}

const rankings: RankingItem[] = [
  { name: '区域一', score: 98.5 },
  { name: '区域二', score: 96.2 },
  { name: '区域三', score: 94.8 },
  { name: '区域四', score: 93.6 },
  { name: '区域五', score: 92.1 },
  { name: '区域六', score: 90.7 },
  { name: '区域七', score: 89.3 },
  { name: '区域八', score: 88.5 },
  { name: '区域九', score: 87.2 },
  { name: '区域十', score: 86.8 },
  { name: '区域十一', score: 85.4 },
  { name: '区域十二', score: 84.1 },
  { name: '区域十三', score: 83.6 },
  { name: '区域十四', score: 82.3 },
  { name: '区域十五', score: 81.5 },
  { name: '区域十六', score: 80.2 },
];

function startAnimation() {
  const tick = (timestamp: number) => {
    if (!startTime) {
      startTime = timestamp;
    }
    const elapsed = timestamp - startTime;
    const delta = (elapsed * props.speed) / 1000;

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
  startTime = null;
  startAnimation();
}

function updateMaxScroll() {
  requestAnimationFrame(() => {
    const container = containerRef.value;
    if (!container) {
      return;
    }

    const scrollableHeight = container.scrollHeight - container.clientHeight;
    if (scrollableHeight <= 0) {
      lastScrollTop = 0;
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
  updateMaxScroll();
  startAnimation();

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
.assets-city-ranking {
  --acr-border: rgba(0, 212, 255, 0.3);
  --acr-border-hover: rgba(0, 212, 255, 0.5);
  --acr-shadow: rgba(0, 212, 255, 0.1);
  --acr-name-color: #e0f0ff;
  --acr-score-color: #e0f0ff;
  --acr-track-bg: #1e293b;
  --acr-fill-start: #0284c7;
  --acr-fill-end: #38bdf8;
  --acr-scrollbar-start: #00d4ff;
  --acr-scrollbar-end: #0066ff;

  width: 100%;
  height: 100%;
  padding: 16px;
  padding-right: 0;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--acr-border);
  box-shadow: 0 0 20px var(--acr-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:hover {
    border-color: var(--acr-border-hover);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .ranking-list {
    flex: 1;
    width: calc(100% - 5px);
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
        var(--acr-scrollbar-start) 0%,
        var(--acr-scrollbar-end) 100%
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

  .ranking-scroll-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: hidden;
  }

  .ranking-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  .ranking-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ranking-no {
    font-size: 13px;
    color: var(--acr-name-color);
  }

  .ranking-score {
    font-size: 14px;
    font-weight: 600;
    color: var(--acr-score-color);
  }

  .progress-bar {
    height: 6px;
    background: var(--acr-track-bg);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(
      90deg,
      var(--acr-fill-start) 0%,
      var(--acr-fill-end) 100%
    );
    transition: width 0.8s ease;
  }
}
</style>
