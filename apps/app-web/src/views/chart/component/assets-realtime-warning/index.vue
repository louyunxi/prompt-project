<!--
  组件名称：AssetsRealTimeWarning（实时预警追踪）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\ThreeAssetsSupervision\components\right\RealTimeWarning.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .assets-realtime-warning 上）：
    --arw-border          rgba(0, 212, 255, 0.3)   面板边框色
    --arw-border-hover    rgba(0, 212, 255, 0.5)   面板悬停边框色
    --arw-shadow          rgba(0, 212, 255, 0.1)   面板外发光色
    --arw-time-color      #64748b                 时间文字色
    --arw-content-color   #e2e8f0                 预警内容文字色
    --arw-item-bg         rgba(255, 255, 255, 0.05) 预警项背景色
    --arw-scrollbar-start #00d4ff                 滚动条渐变起始色
    --arw-scrollbar-end   #0066ff                 滚动条渐变结束色

  迁移说明：
    1. 去除外部依赖：inject('regionAdcode')、多区域 mock 数据。
    2. 改为组件内自包含，仅保留省级（adcode 340000）mock 数据。
    3. 预警类型与内容由业务文案改为通用名称与描述。
    4. 使用 ResizeObserver 监听列表容器尺寸变化（替代 window.resize），
       组件销毁时 disconnect 释放 observer。
    5. 保留列表自动滚动动画（requestAnimationFrame）与悬停暂停交互。
    6. 去除标题、图标与角标，背景统一为舞台色。
    7. 面板宽度由源 400px 改为 100%，以适配 CompCard 舞台容器。
-->
<template>
  <div class="assets-realtime-warning">
    <div
      ref="containerRef"
      class="warning-list"
      :class="{ 'is-paused': isPaused }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="warning-scroll-wrapper">
        <div v-for="item in warnings" :key="item.id" class="warning-item">
          <div class="warning-header">
            <span class="warning-type" :style="{ color: item.color }">{{
              item.type
            }}</span>
            <span class="warning-time">{{ item.time }}</span>
          </div>
          <div class="warning-content-text">{{ item.content }}</div>
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
const warningData = {
  total: 32,
  warnings: [
    {
      id: 1,
      type: '预警类型一',
      color: '#F43F5E',
      time: '10分钟前',
      content: '示例预警内容描述一，用于展示实时预警追踪效果。',
    },
    {
      id: 2,
      type: '预警类型二',
      color: '#F59E0B',
      time: '1小时前',
      content: '示例预警内容描述二，用于展示实时预警追踪效果。',
    },
    {
      id: 3,
      type: '预警类型三',
      color: '#38BDF8',
      time: '3小时前',
      content: '示例预警内容描述三，用于展示实时预警追踪效果。',
    },
    {
      id: 4,
      type: '预警类型一',
      color: '#F43F5E',
      time: '4小时前',
      content: '示例预警内容描述四，用于展示实时预警追踪效果。',
    },
    {
      id: 5,
      type: '预警类型二',
      color: '#F59E0B',
      time: '5小时前',
      content: '示例预警内容描述五，用于展示实时预警追踪效果。',
    },
    {
      id: 6,
      type: '预警类型一',
      color: '#F43F5E',
      time: '6小时前',
      content: '示例预警内容描述六，用于展示实时预警追踪效果。',
    },
    {
      id: 7,
      type: '预警类型二',
      color: '#F59E0B',
      time: '30分钟前',
      content: '示例预警内容描述七，用于展示实时预警追踪效果。',
    },
    {
      id: 8,
      type: '预警类型三',
      color: '#38BDF8',
      time: '1小时前',
      content: '示例预警内容描述八，用于展示实时预警追踪效果。',
    },
    {
      id: 9,
      type: '预警类型一',
      color: '#F43F5E',
      time: '2小时前',
      content: '示例预警内容描述九，用于展示实时预警追踪效果。',
    },
    {
      id: 10,
      type: '预警类型二',
      color: '#F59E0B',
      time: '3小时前',
      content: '示例预警内容描述十，用于展示实时预警追踪效果。',
    },
    {
      id: 11,
      type: '预警类型一',
      color: '#F43F5E',
      time: '4小时前',
      content: '示例预警内容描述十一，用于展示实时预警追踪效果。',
    },
    {
      id: 12,
      type: '预警类型二',
      color: '#F59E0B',
      time: '5小时前',
      content: '示例预警内容描述十二，用于展示实时预警追踪效果。',
    },
    {
      id: 13,
      type: '预警类型一',
      color: '#F43F5E',
      time: '6小时前',
      content: '示例预警内容描述十三，用于展示实时预警追踪效果。',
    },
    {
      id: 14,
      type: '预警类型三',
      color: '#38BDF8',
      time: '7小时前',
      content: '示例预警内容描述十四，用于展示实时预警追踪效果。',
    },
  ],
};

const warnings = warningData.warnings;

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
.assets-realtime-warning {
  --arw-border: rgba(0, 212, 255, 0.3);
  --arw-border-hover: rgba(0, 212, 255, 0.5);
  --arw-shadow: rgba(0, 212, 255, 0.1);
  --arw-time-color: #64748b;
  --arw-content-color: #e2e8f0;
  --arw-item-bg: rgba(255, 255, 255, 0.05);
  --arw-scrollbar-start: #00d4ff;
  --arw-scrollbar-end: #0066ff;

  width: 100%;
  height: 100%;
  padding: 16px;
  padding-right: 0;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--arw-border);
  box-shadow: 0 0 20px var(--arw-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:hover {
    border-color: var(--arw-border-hover);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .warning-list {
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
        var(--arw-scrollbar-start) 0%,
        var(--arw-scrollbar-end) 100%
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

  .warning-scroll-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: hidden;
  }

  .warning-item {
    background: var(--arw-item-bg);
    border-radius: 16px;
    padding: 13px;
    flex-shrink: 0;
  }

  .warning-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .warning-type {
    font-size: 12px;
    font-weight: 500;
  }

  .warning-time {
    font-size: 10px;
    color: var(--arw-time-color);
  }

  .warning-content-text {
    font-size: 13px;
    color: var(--arw-content-color);
    line-height: 1.5;
  }
}
</style>
