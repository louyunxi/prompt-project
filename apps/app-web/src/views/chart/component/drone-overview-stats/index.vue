<!--
  组件名称：DroneOverviewStats（无人机实时总览）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\DroneSurveillance\components\Module01.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .dos-root）：
    --dos-primary       #00d4aa   主题色 / 边框 / 增长标签
    --dos-border        rgba(0, 212, 170, 0.3) 边框色
    --dos-border-hover  rgba(0, 212, 170, 0.5) hover 边框色
    --dos-glow          rgba(0, 212, 170, 0.1) 面板外发光
    --dos-glow-hover    rgba(0, 212, 170, 0.2) hover 外发光
    --dos-sub           #90a1b9   次级文字
    --dos-total         #1cce79   总数强调色
    --dos-area          #f1f5f9   面积数值色
    --dos-rate          #0091ff   完成率数值色
    --dos-card          rgba(5, 12, 19, 0.4) 子卡片底色

  迁移说明：
    1. 仅保留「在线总数 / 今日作业面积 / 任务完成率」三块统计，去除视频播放器与 hls.js 依赖。
    2. 去除 inject('regionAdcode')，改为使用 340000 省级 mock 数据。
    3. 去除 gsap 依赖，数字增长动画改用 requestAnimationFrame 实现。
    4. 数字初始值不为 0，每 6 秒在基准值附近波动并重新播放增长动画。
    5. 去除标题与图标，背景统一为舞台色。
-->
<template>
  <div class="dos-root">
    <div class="dos-top">
      <p class="dos-top__label">在线总数（个）</p>
      <div class="dos-top__value">
        <span class="dos-total">{{ displayTotal }}</span>
        <span class="dos-growth">{{ growthText }}</span>
      </div>
    </div>

    <div class="dos-middle">
      <div class="dos-card">
        <p class="dos-card__label">今日作业量（单位）</p>
        <p class="dos-card__value dos-card__value--area">{{ displayArea }}</p>
      </div>
      <div class="dos-card">
        <p class="dos-card__label">任务完成率</p>
        <p class="dos-card__value dos-card__value--rate">
          {{ displayCompletion }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';

const BASE_TOTAL = 12458;
const BASE_AREA = 345.6;
const BASE_COMPLETION = 94.2;

const displayTotal = ref('0');
const displayArea = ref('0.0');
const displayCompletion = ref('0.0%');
const growthText = ref('↑ 12.5%');

let currentTotal = BASE_TOTAL;
let currentArea = BASE_AREA;
let currentCompletion = BASE_COMPLETION;

let animationFrameId: number | null = null;
let loopTimer: ReturnType<typeof setInterval> | null = null;

function formatTotal(value: number): string {
  return Math.round(value).toLocaleString();
}

function formatArea(value: number): string {
  return value.toFixed(1);
}

function formatCompletion(value: number): string {
  return `${value.toFixed(1)}%`;
}

function animateValue(
  fromValue: number,
  toValue: number,
  duration: number,
  setter: (v: number) => void,
) {
  const startTime = performance.now();

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = fromValue + (toValue - fromValue) * ease;
    setter(current);

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(step);
    }
  };

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  animationFrameId = requestAnimationFrame(step);
}

function refreshData() {
  const nextTotal = Math.round(BASE_TOTAL * (0.95 + Math.random() * 0.1));
  const nextArea = BASE_AREA * (0.95 + Math.random() * 0.1);
  const nextCompletion = Math.min(
    99.9,
    BASE_COMPLETION * (0.97 + Math.random() * 0.06),
  );

  const growth = ((nextTotal - BASE_TOTAL) / BASE_TOTAL) * 100;
  growthText.value = `${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth).toFixed(1)}%`;

  animateValue(currentTotal, nextTotal, 1500, (v) => {
    displayTotal.value = formatTotal(v);
  });
  animateValue(currentArea, nextArea, 1500, (v) => {
    displayArea.value = formatArea(v);
  });
  animateValue(currentCompletion, nextCompletion, 1500, (v) => {
    displayCompletion.value = formatCompletion(v);
  });

  currentTotal = nextTotal;
  currentArea = nextArea;
  currentCompletion = nextCompletion;
}

onMounted(() => {
  refreshData();
  loopTimer = setInterval(refreshData, 6000);
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  if (loopTimer) {
    clearInterval(loopTimer);
  }
});
</script>

<style lang="scss" scoped>
.dos-root {
  --dos-primary: #00d4aa;
  --dos-border: rgba(0, 212, 170, 0.3);
  --dos-border-hover: rgba(0, 212, 170, 0.5);
  --dos-glow: rgba(0, 212, 170, 0.1);
  --dos-glow-hover: rgba(0, 212, 170, 0.2);
  --dos-sub: #90a1b9;
  --dos-total: #1cce79;
  --dos-area: #f1f5f9;
  --dos-rate: #0091ff;
  --dos-card: rgba(5, 12, 19, 0.4);

  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--dos-border);
  box-shadow: 0 0 20px var(--dos-glow), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--dos-border-hover);
    box-shadow: 0 0 30px var(--dos-glow-hover),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
}

.dos-top {
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(28, 206, 121, 0.1) -7%,
    rgba(0, 0, 0, 0) 99%
  );

  &__label {
    margin: 0 0 4px;
    font-size: 14px;
    color: var(--dos-sub);
  }

  &__value {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }
}

.dos-total {
  font-size: 40px;
  font-weight: 700;
  color: var(--dos-total);
  line-height: 1;
}

.dos-growth {
  font-size: 12px;
  color: var(--dos-primary);
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 212, 170, 0.15);
}

.dos-middle {
  display: flex;
  gap: 16px;
  flex: 1;
}

.dos-card {
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  background: var(--dos-card);
  display: flex;
  flex-direction: column;
  justify-content: center;

  &__label {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--dos-sub);
  }

  &__value {
    margin: 0;
    font-size: 22px;
    font-weight: 600;

    &--area {
      color: var(--dos-area);
    }

    &--rate {
      color: var(--dos-rate);
    }
  }
}

@media (max-width: 760px) {
  .dos-total {
    font-size: 32px;
  }
}
</style>
