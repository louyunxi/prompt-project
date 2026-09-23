<!--
  组件名称：RingProgress（环形进度指标组）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB119.vue
           （子组件 ring-progress-bar.vue 已内联，源：
             D:\sn-project\frp_gov_web\src\components\common\ring-progress-bar.vue）

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 <style> 的 .ring-progress 上，echarts 运行时读取同名变量）：
    --rp-name        #00f1fa   组名称文字色
    --rp-unit        #6dc1cb   组单位文字色
    --rp-info-text   #9dd1d7   内部指标名称文字色
    --rp-info-value  #00f6ff   内部指标数值默认色（第 1 条）
    --rp-info-zero   #9dd1d7   内部指标数值色（第 2 条为 0 时）
    --rp-info-warn   #f5802c   内部指标数值色（第 2 条非 0 时）
    --rp-ring-from   #01c2ff   进度环渐变起始色
    --rp-ring-to     #04f4fd   进度环渐变结束色
    --rp-ring-bg     #25505e   进度环未填充色
    --rp-mask-color  #163d96   外圈刻度盘颜色
    --rp-center-text #25e5fb   中心百分比文字色
    --rp-bg          #04284a   组件深色背景

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vue-count-to（数字递增）、$echarts 全局注入、
       plateVO 接口数据，本组件已全部去除：数字递增改为组件内 rAF 缓动动画
       （easeOutCubic，替代 vue-count-to 默认 easing），数据改为 mock。
    2. ring-progress-bar 子组件已内联进本组件：刻度盘 maskData 由模块级共享变量
       改为实例内生成，避免多实例共享同一配置对象互相污染；环形图用 echarts 双 pie
       绘制（进度环 + 刻度盘），渐变色对象补齐 x2/y2（echarts 5 类型要求）。
    3. 尺寸自适应：源组件用 window.resize 切换 isShow 重渲染，本组件改为
       ResizeObserver 监听各环形容器，触发 chart.resize() 与中心圆尺寸重算，
       onBeforeUnmount 中 disconnect + dispose + 取消动画帧。
    4. 子指标颜色规则与源一致：第 1 条用默认色，第 2 条为 0 显示 --rp-info-zero，
       否则显示 --rp-info-warn。
    5. 图片物料：ring-progress-center-bg.png / ring-progress-center-circle.png
       已拷贝至本组件 assets/ 目录。
-->
<template>
  <div class="ring-progress">
    <div class="ring-progress__data">
      <div
        v-for="(item, index) in mockProgressList"
        :key="index"
        class="ring-progress__item"
      >
        <div class="ring-progress__name">
          <p class="ring-progress__group-name">{{ item.groupName }}</p>
          <p class="ring-progress__group-unit">{{ item.unit }}</p>
        </div>

        <div class="ring-progress__chart-wrap">
          <div
            class="ring-progress__pie-chart"
            :ref="(el) => setChartRef(el, index)"
          ></div>
          <div
            class="ring-progress__center-box"
            :ref="(el) => setCenterBoxRef(el, index)"
          >
            <div class="ring-progress__circle"></div>
            <div
              class="ring-progress__center-text"
              :ref="(el) => setCenterTextRef(el, index)"
            >
              <span>{{ displayedPercent[index] }}%</span>
            </div>
          </div>
        </div>

        <div class="ring-progress__info">
          <template v-for="(info, infoIndex) in item.subList" :key="infoIndex">
            <div v-if="infoIndex <= 1" class="ring-progress__info-item">
              <p class="ring-progress__info-name">{{ info.name }}：</p>
              <p
                class="ring-progress__info-value"
                :style="
                  infoIndex === 1
                    ? {
                        color:
                          info.value === 0
                            ? 'var(--rp-info-zero)'
                            : 'var(--rp-info-warn)',
                      }
                    : undefined
                "
              >
                {{ info.value }}{{ info.unit }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import * as echarts from 'echarts';

/** 数字递增动画总时长（毫秒，对应源 vue-count-to duration 3000） */
const ANIM_DURATION = 3000;

/** 内部子指标（对应源 plateMetricList 单条数据） */
interface SubMetric {
  name: string;
  value: number;
  unit: string;
}

/** 环形进度单项（对应源 plateMetricGroupList 单条数据） */
interface ProgressItem {
  groupName: string;
  unit: string;
  value: number;
  subList: SubMetric[];
}

/** mock 数据（字段已通用化，value 为 0-1 小数表示百分比） */
const mockProgressList: ProgressItem[] = [
  {
    groupName: '元素一',
    unit: '指标',
    value: 0.86,
    subList: [
      { name: '指标一', value: 320, unit: '单位' },
      { name: '指标二', value: 0, unit: '单位' },
    ],
  },
  {
    groupName: '元素二',
    unit: '指标',
    value: 0.62,
    subList: [
      { name: '指标一', value: 180, unit: '单位' },
      { name: '指标二', value: 96, unit: '单位' },
    ],
  },
  {
    groupName: '元素三',
    unit: '指标',
    value: 0.45,
    subList: [
      { name: '指标一', value: 90, unit: '单位' },
      { name: '指标二', value: 150, unit: '单位' },
    ],
  },
];

/** 进度百分比 = 值 ×100 保留 1 位小数（对应源 processPercentage 过滤） */
function toPercentage(value: number): number {
  if (!value) return 0;
  return parseFloat((value * 100).toFixed(1));
}

/** 递增显示小数位数：目标值含小数点则 1 位，否则 0 位（对应源 decimals 计算） */
function toDecimals(target: number): number {
  return String(target).indexOf('.') !== -1 ? 1 : 0;
}

/** echarts 渲染所需颜色（从 CSS 变量读取） */
interface RingColors {
  ringFrom: string;
  ringTo: string;
  ringBg: string;
  maskColor: string;
}

/** 从容器读取 CSS 颜色变量，读取失败时回退到默认色 */
function readRingColors(el: HTMLElement): RingColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    ringFrom: read('--rp-ring-from', '#01c2ff'),
    ringTo: read('--rp-ring-to', '#04f4fd'),
    ringBg: read('--rp-ring-bg', '#25505e'),
    maskColor: read('--rp-mask-color', '#163d96'),
  };
}

/** 36 段外圈刻度盘数据（对应源 maskData 生成逻辑，实例内生成避免共享污染） */
function buildMaskData(maskColor: string) {
  const maskData: Array<{
    value: number;
    name: string;
    itemStyle: { color: string };
  }> = [];
  for (let i = 0; i < 36; i++) {
    maskData.push({ value: 0.77, name: '', itemStyle: { color: maskColor } });
    maskData.push({ value: 2, name: '', itemStyle: { color: 'transparent' } });
  }
  return maskData;
}

/** 环形图配置（对应源 chartOption，双 pie：进度环 + 刻度盘） */
function buildChartOption(
  percentage: number,
  colors: RingColors,
): echarts.EChartsOption {
  return {
    series: [
      {
        type: 'pie',
        // 源组件关闭 hover 缩放动画；echarts 5 类型中 PieSeriesOption 无此字段，故用断言放行
        // @ts-expect-error hoverAnimation 不在 PieSeriesOption 类型内
        hoverAnimation: false,
        label: { show: false },
        labelLine: { show: false },
        radius: ['80%', '100%'],
        animationDuration: ANIM_DURATION,
        data: [
          {
            value: percentage,
            name: '',
            itemStyle: {
              color: {
                type: 'linear',
                x: 1,
                y: 0,
                x2: 0,
                y2: 0,
                colorStops: [
                  { offset: 0, color: colors.ringFrom },
                  { offset: 1, color: colors.ringTo },
                ],
                global: false,
              },
            },
          },
          {
            value: 100 - percentage,
            name: '',
            itemStyle: { color: colors.ringBg },
          },
        ],
      },
      {
        type: 'pie',
        hoverAnimation: false,
        label: { show: false },
        labelLine: { show: false },
        radius: ['80%', '100%'],
        data: buildMaskData(colors.maskColor),
      },
    ],
  };
}

/** 各 item 的 echarts 容器 / 中心元素引用（v-for 函数 ref 收集） */
const chartEls: HTMLDivElement[] = [];
const centerBoxEls: HTMLDivElement[] = [];
const centerTextEls: HTMLDivElement[] = [];
const chartInstances: echarts.ECharts[] = [];

function setChartRef(el: unknown, index: number) {
  if (el) chartEls[index] = el as HTMLDivElement;
}

function setCenterBoxRef(el: unknown, index: number) {
  if (el) centerBoxEls[index] = el as HTMLDivElement;
}

function setCenterTextRef(el: unknown, index: number) {
  if (el) centerTextEls[index] = el as HTMLDivElement;
}

/** 中心百分比显示值（字符串，随递增动画更新） */
const displayedPercent = ref<string[]>([]);

/** 活跃动画帧 id 集合 */
const animFrameIds: number[] = [];

/** 中心圆动态尺寸（对应源 processCenterBg：chart 半径 ×0.8 再缩 8px） */
function processCenterBg(index: number) {
  const chartEl = chartEls[index];
  const centerBox = centerBoxEls[index];
  const centerText = centerTextEls[index];
  if (!chartEl || !centerBox || !centerText) return;
  const chartRadius = Math.min(chartEl.clientWidth, chartEl.clientHeight) / 2;
  const centerBgRadius = chartRadius * 0.8;
  const size = centerBgRadius * 2 - 8;
  centerBox.style.width = `${size}px`;
  centerBox.style.height = `${size}px`;
  centerText.style.fontSize = `${size * 0.25}px`;
}

/** 数字递增动画：rAF 从 0 缓动递增到目标百分比（替代源 vue-count-to） */
function startCountAnimation(index: number, target: number) {
  const startTime = performance.now();
  const decimals = toDecimals(target);

  const tick = (now: number) => {
    const progress = Math.min((now - startTime) / ANIM_DURATION, 1);
    // easeOutCubic 缓动（与 vue-count-to 默认 easing 一致）
    const eased = 1 - Math.pow(1 - progress, 3);
    displayedPercent.value[index] = (target * eased).toFixed(decimals);
    if (progress < 1) {
      animFrameIds.push(requestAnimationFrame(tick));
    }
  };
  animFrameIds.push(requestAnimationFrame(tick));
}

/** 初始化全部环形图实例 */
function initCharts() {
  if (!chartEls.length) return;
  const colors = readRingColors(chartEls[0]);
  chartEls.forEach((el, index) => {
    if (!el) return;
    const item = mockProgressList[index];
    if (!item) return;
    const percentage = toPercentage(item.value);
    displayedPercent.value[index] = '0';
    const chart = echarts.init(el);
    chart.setOption(buildChartOption(percentage, colors));
    chartInstances[index] = chart;
    processCenterBg(index);
    startCountAnimation(index, percentage);
  });
}

/** 防抖（拷贝自源项目工具函数） */
function debounce(fn: (...args: unknown[]) => void, delay = 200) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: unknown[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, delay);
  };
}

/** 尺寸自适应（防抖）：ResizeObserver 驱动，替代源 window.resize 重渲染方案 */
const handleResize = debounce(() => {
  chartInstances.forEach((chart) => chart?.resize());
  chartEls.forEach((_, index) => processCenterBg(index));
}, 200);

/** 环形容器尺寸观察器 */
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  nextTick(() => {
    initCharts();
    resizeObserver = new ResizeObserver(handleResize);
    chartEls.forEach((el) => {
      if (el) resizeObserver?.observe(el);
    });
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  chartInstances.forEach((chart) => chart?.dispose());
  chartInstances.length = 0;
  animFrameIds.forEach((id) => cancelAnimationFrame(id));
  animFrameIds.length = 0;
});
</script>

<style lang="scss" scoped>
.ring-progress {
  --rp-name: #00f1fa;
  --rp-unit: #6dc1cb;
  --rp-info-text: #9dd1d7;
  --rp-info-value: #00f6ff;
  --rp-info-zero: #9dd1d7;
  --rp-info-warn: #f5802c;
  --rp-ring-from: #01c2ff;
  --rp-ring-to: #04f4fd;
  --rp-ring-bg: #25505e;
  --rp-mask-color: #163d96;
  --rp-center-text: #25e5fb;
  --rp-bg: #04284a;

  box-sizing: border-box;
  width: 100%;
  height: 360px;
  background: var(--rp-bg);
  position: relative;

  &__data {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  &__item {
    box-sizing: border-box;
    flex: 1;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__name {
    min-width: 25%;
    text-align: center;
    font-weight: bold;
  }

  &__group-name {
    line-height: 25px;
    font-size: 18px;
    color: var(--rp-name);
  }

  &__group-unit {
    line-height: 25px;
    font-size: 14px;
    color: var(--rp-unit);
  }

  &__chart-wrap {
    box-sizing: border-box;
    width: 60px;
    height: 60px;
    position: relative;
  }

  &__pie-chart {
    width: 100%;
    height: 100%;
    margin: 0 auto;
  }

  &__center-box {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: url('./assets/ring-progress-center-bg.png') no-repeat center
      center;
    background-size: 100% 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__circle {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: url('./assets/ring-progress-center-circle.png') no-repeat
      center center;
    background-size: 100% 100%;
    animation: ring-progress-turn 5s linear infinite;
  }

  &__center-text {
    position: relative;
    z-index: 1;
    font-size: 0;
    font-weight: bold;
    line-height: 1;
    color: var(--rp-center-text);
    white-space: nowrap;
  }

  &__info {
    box-sizing: border-box;
    min-width: 118px;
  }

  &__info-item {
    margin: 8px 0;
    display: flex;
    font-size: 14px;
    font-weight: 400;
    color: var(--rp-info-text);
  }

  &__info-value {
    font-weight: bold;
    color: var(--rp-info-value);
  }

  @keyframes ring-progress-turn {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(90deg);
    }
    50% {
      transform: rotate(180deg);
    }
    75% {
      transform: rotate(270deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1280px) {
    height: 320px;

    &__item {
      padding: 0 12px;
    }

    &__group-name {
      font-size: 16px;
    }

    &__info-item {
      font-size: 13px;
    }
  }

  @media (min-width: 1920px) {
    height: 400px;

    &__group-name {
      font-size: 20px;
    }
  }
}
</style>
