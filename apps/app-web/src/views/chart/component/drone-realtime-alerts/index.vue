<!--
  组件名称：DroneRealtimeAlerts（实时异常告警）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\DroneSurveillance\components\Module04.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .dra-root）：
    --dra-primary       #00d4aa   主题色 / 边框
    --dra-border        rgba(0, 212, 170, 0.3) 边框色
    --dra-border-hover  rgba(0, 212, 170, 0.5) hover 边框色
    --dra-glow          rgba(0, 212, 170, 0.1) 面板外发光
    --dra-glow-hover    rgba(0, 212, 170, 0.2) hover 外发光
    --dra-offline       #fb2c36   离线告警色
    --dra-battery       #f0b100   电量告警色
    --dra-yaw           #0091ff   偏航告警色
    --dra-time          #62748e   时间文字色

  迁移说明：
    1. 去除 inject('regionAdcode')，改为使用 340000 省级 mock 数据。
    2. 去除 window.resize 监听，列表滚动通过 requestAnimationFrame 实现。
    3. 保留悬停暂停、滚动到底重置的动效。
    4. 去除标题与图标，背景统一为舞台色。
-->
<template>
  <div class="dra-root">
    <div
      ref="containerRef"
      class="dra-list"
      :class="{ 'is-paused': isPaused }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="dra-wrapper">
        <div
          v-for="item in alerts"
          :key="item.key"
          class="dra-item"
          :class="`dra-item--${item.type}`"
        >
          <div class="dra-item__text">
            {{ typeMap[item.type] }}：{{ item.name }}（{{ item.address }}）
          </div>
          <span class="dra-item__time">{{ item.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

interface AlertRaw {
  type: 'offline' | 'battery' | 'yaw';
  name: string;
  address: string;
  minutesAgo: number;
}

interface AlertItem extends AlertRaw {
  key: string;
  time: string;
}

const props = withDefaults(
  defineProps<{
    /** 滚动速度（像素 / 秒） */
    speed?: number;
  }>(),
  {
    speed: 35,
  },
);

const containerRef = ref<HTMLDivElement | null>(null);
const isPaused = ref(false);

let animationId: number | null = null;
let startTime: number | null = null;
let lastScrollTop = 0;
let maxScroll = 0;

const typeMap: Record<string, string> = {
  offline: '设备离线',
  battery: '电量过低',
  yaw: '偏航航线',
};

const alertDataMap: Record<string, AlertRaw[]> = {
  '340000': [
    { type: 'offline', name: '设备-A1', address: '区域一', minutesAgo: 5 },
    { type: 'battery', name: '设备-B2', address: '区域二', minutesAgo: 12 },
    { type: 'yaw', name: '设备-C3', address: '区域三', minutesAgo: 25 },
    { type: 'battery', name: '设备-B4', address: '区域二', minutesAgo: 35 },
    { type: 'offline', name: '设备-A5', address: '区域四', minutesAgo: 18 },
    { type: 'yaw', name: '设备-C6', address: '区域五', minutesAgo: 48 },
  ],
};

function formatAlertTime(minutesAgo: number): string {
  const now = new Date();
  const targetTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
  const hours = String(targetTime.getHours()).padStart(2, '0');
  const minutes = String(targetTime.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const alerts = computed<AlertItem[]>(() => {
  const data = alertDataMap['340000'];
  return [...data]
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .map((item, i) => ({
      ...item,
      key: `${item.name}-${i}`,
      time: formatAlertTime(item.minutesAgo),
    }));
});

function startAnimation() {
  const tick = (timestamp: number) => {
    if (startTime === null) {
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
    if (container) {
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
    }
  });
}

onMounted(() => {
  updateMaxScroll();
  startAnimation();
});

onBeforeUnmount(() => {
  stopAnimation();
});
</script>

<style lang="scss" scoped>
.dra-root {
  --dra-primary: #00d4aa;
  --dra-border: rgba(0, 212, 170, 0.3);
  --dra-border-hover: rgba(0, 212, 170, 0.5);
  --dra-glow: rgba(0, 212, 170, 0.1);
  --dra-glow-hover: rgba(0, 212, 170, 0.2);
  --dra-offline: #fb2c36;
  --dra-battery: #f0b100;
  --dra-yaw: #0091ff;
  --dra-time: #62748e;

  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--dra-border);
  box-shadow: 0 0 20px var(--dra-glow), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--dra-border-hover);
    box-shadow: 0 0 30px var(--dra-glow-hover),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
}

.dra-list {
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
    background: linear-gradient(180deg, var(--dra-primary) 0%, #00a080 100%);
    border-radius: 3px;
    box-shadow: 0 0 6px rgba(0, 212, 170, 0.4);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    scrollbar-color: rgba(0, 212, 170, 0.5) transparent;

    &::-webkit-scrollbar-thumb {
      opacity: 1;
    }
  }

  &.is-paused {
    overflow-y: auto;
  }
}

.dra-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: hidden;
}

.dra-item {
  width: 100%;
  padding: 9px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--dra-offline);
  background: rgba(251, 44, 54, 0.1);
  border: 1px solid rgba(251, 44, 54, 0.2);
  flex-shrink: 0;

  &__text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    color: var(--dra-time);
    flex-shrink: 0;
    margin-left: 8px;
  }

  &--battery {
    color: var(--dra-battery);
    background: rgba(240, 177, 0, 0.1);
    border: 1px solid rgba(240, 177, 0, 0.2);
  }

  &--yaw {
    color: var(--dra-yaw);
    background: rgba(0, 145, 255, 0.1);
    border: 1px solid rgba(0, 145, 255, 0.2);
  }
}
</style>
