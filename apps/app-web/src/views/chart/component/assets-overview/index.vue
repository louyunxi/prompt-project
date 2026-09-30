<!--
  组件名称：AssetsOverview（全省三资总览）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\ThreeAssetsSupervision\components\left\AssetOverview.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .assets-overview 上）：
    --ao-border          rgba(0, 212, 255, 0.3)   面板边框色
    --ao-border-hover    rgba(0, 212, 255, 0.5)   面板悬停边框色
    --ao-glow            rgba(0, 212, 255, 0.1)   面板外发光色
    --ao-title-color     #e2e8f0                 标题文字色
    --ao-icon-color      #00d4ff                 图标色
    --ao-label-color     #94a3b8                 指标标签色
    --ao-value-color     #65e4fd                 指标数值色
    --ao-unit-color      #64748b                 单位文字色
    --ao-trend-up        #10b981                 增长趋势色
    --ao-trend-down      #ef4444                 下降趋势色
    --ao-card-bg         rgba(0, 180, 220, 0.08) 指标卡片背景色
    --ao-card-bg-strong  rgba(0, 180, 220, 0.12) 底部大卡片背景色
    --ao-coverage-color  #64748b                 覆盖说明文字色
    --ao-coverage-count  #65e4fd                 覆盖数量高亮色

  迁移说明：
    1. 去除外部依赖：inject('regionAdcode')、gsap 动画库、多区域 mock 数据，
       改为组件内自包含，仅保留省级（adcode 340000）mock 数据。
    2. 移除 router、API、外部图片等引用。
    3. 数字滚动动画由 gsap 改为 requestAnimationFrame 实现。
    4. 数字初始值不为 0，每 6 秒在基准值附近波动并重新播放增长动画。
    5. 去除标题与图标，背景统一为舞台色。
    6. 面板宽度由源 400px 改为 100%，以适配 CompCard 舞台容器。
-->
<template>
  <div class="assets-overview">
    <div class="stats-container">
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">资金总额</div>
            <div class="stat-value">
              <span class="value-number">{{
                formatNumber(displayFundTotal)
              }}</span>
              <span class="value-unit">亿元</span>
            </div>
            <div class="stat-trend up">
              <span class="trend-icon">↑</span>
              <span>{{ fundTotalGrowth }}%</span>
              同比
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-label">资产总额</div>
            <div class="stat-value">
              <span class="value-number">{{
                formatNumber(displayAssetTotal)
              }}</span>
              <span class="value-unit">亿元</span>
            </div>
            <div class="stat-trend up">
              <span class="trend-icon">↑</span>
              <span>{{ assetTotalGrowth }}%</span>
              同比
            </div>
          </div>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-card stat-full">
          <div class="stat-content">
            <div class="stat-label">资源总面积（万亩）</div>
            <div class="stat-value">
              <span class="value-number">{{
                formatNumber(displayAreaTotal)
              }}</span>
              <span class="coverage">
                覆盖
                <strong class="coverage-count">{{
                  coveredVillages.toLocaleString()
                }}</strong>
                个行政村
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';

const BASE_FUND = 1245.6;
const BASE_ASSET = 8932.1;
const BASE_AREA = 14580.23;
const BASE_VILLAGES = 15243;
const BASE_FUND_GROWTH = 4.2;
const BASE_ASSET_GROWTH = 6.8;

let currentFund = BASE_FUND;
let currentAsset = BASE_ASSET;
let currentArea = BASE_AREA;
let currentVillages = BASE_VILLAGES;

const displayFundTotal = ref(BASE_FUND);
const displayAssetTotal = ref(BASE_ASSET);
const displayAreaTotal = ref(BASE_AREA);
const coveredVillages = ref(BASE_VILLAGES);
const fundTotalGrowth = ref(BASE_FUND_GROWTH);
const assetTotalGrowth = ref(BASE_ASSET_GROWTH);

function formatNumber(num: number): string {
  return num.toFixed(1);
}

let animationFrameId: number | null = null;
let loopTimer: ReturnType<typeof setInterval> | null = null;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface ValueState {
  fund: number;
  asset: number;
  area: number;
  villages: number;
}

function animateValues(from: ValueState, to: ValueState, duration: number) {
  const startTime = performance.now();

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeOutCubic(progress);

    displayFundTotal.value = from.fund + (to.fund - from.fund) * ease;
    displayAssetTotal.value = from.asset + (to.asset - from.asset) * ease;
    displayAreaTotal.value = from.area + (to.area - from.area) * ease;
    coveredVillages.value = Math.round(
      from.villages + (to.villages - from.villages) * ease,
    );

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(tick);
    }
  };

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  animationFrameId = requestAnimationFrame(tick);
}

function refreshData() {
  const nextFund = BASE_FUND * (0.95 + Math.random() * 0.1);
  const nextAsset = BASE_ASSET * (0.95 + Math.random() * 0.1);
  const nextArea = BASE_AREA * (0.95 + Math.random() * 0.1);
  const nextVillages = Math.round(
    BASE_VILLAGES * (0.98 + Math.random() * 0.04),
  );
  const nextFundGrowth = BASE_FUND_GROWTH * (0.9 + Math.random() * 0.2);
  const nextAssetGrowth = BASE_ASSET_GROWTH * (0.9 + Math.random() * 0.2);

  fundTotalGrowth.value = parseFloat(nextFundGrowth.toFixed(1));
  assetTotalGrowth.value = parseFloat(nextAssetGrowth.toFixed(1));

  animateValues(
    {
      fund: currentFund,
      asset: currentAsset,
      area: currentArea,
      villages: currentVillages,
    },
    {
      fund: nextFund,
      asset: nextAsset,
      area: nextArea,
      villages: nextVillages,
    },
    1500,
  );

  currentFund = nextFund;
  currentAsset = nextAsset;
  currentArea = nextArea;
  currentVillages = nextVillages;
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

<style scoped lang="scss">
.assets-overview {
  --ao-border: rgba(0, 212, 255, 0.3);
  --ao-border-hover: rgba(0, 212, 255, 0.5);
  --ao-glow: rgba(0, 212, 255, 0.1);
  --ao-title-color: #e2e8f0;
  --ao-icon-color: #00d4ff;
  --ao-label-color: #94a3b8;
  --ao-value-color: #65e4fd;
  --ao-unit-color: #64748b;
  --ao-trend-up: #10b981;
  --ao-trend-down: #ef4444;
  --ao-card-bg: rgba(0, 180, 220, 0.08);
  --ao-card-bg-strong: rgba(0, 180, 220, 0.12);
  --ao-coverage-color: #64748b;
  --ao-coverage-count: #65e4fd;

  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--ao-border);
  box-shadow: 0 0 20px var(--ao-glow), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:hover {
    border-color: var(--ao-border-hover);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .stats-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    min-height: 0;
    gap: 8px;
  }

  .stats-row {
    display: grid;
    grid-template-columns: 1fr 0fr;

    &:first-child {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: var(--ao-card-bg);
    border: 1px solid rgba(0, 212, 255, 0.15);
    border-radius: 10px;
    padding: 10px;

    &.stat-full {
      background: var(--ao-card-bg-strong);
      border-color: rgba(0, 212, 255, 0.25);
    }
  }

  .stat-trend {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    font-weight: 500;
    align-self: flex-start;

    &.up {
      color: var(--ao-trend-up);

      .trend-icon {
        font-size: 14px;
        font-weight: bold;
        padding-right: 2px;
        padding-left: 2px;
      }
    }

    &.down {
      color: var(--ao-trend-down);
    }
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-label {
    font-size: 13px;
    color: var(--ao-label-color);
    font-weight: 500;
  }

  .stat-value {
    display: flex;
    align-items: baseline;
    gap: 3px;

    .value-number {
      font-size: 26px;
      font-weight: 700;
      color: var(--ao-value-color);
      font-family: 'DIN', 'Roboto', sans-serif;
      line-height: 1.4;
      letter-spacing: -0.5px;
    }
  }

  .value-unit {
    font-size: 11px;
    color: var(--ao-unit-color);
    font-weight: 500;
  }

  .coverage {
    font-size: 12px;
    color: var(--ao-coverage-color);
    padding-left: 5px;

    .coverage-count {
      color: var(--ao-coverage-count);
    }
  }
}
</style>
