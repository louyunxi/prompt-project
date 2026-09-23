<!--
  组件名称：DonutRing（环形占比图 + 图例）
  来源迁移：
    - D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB108.vue（主组件）
    - D:\sn-project\frp_gov_web\src\components\echarts\echartsPie.vue（环形图子组件）
    - D:\sn-project\frp_gov_web\src\components\jy\pieText.vue（图例子组件）

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .donut-ring 上，echarts 运行时读取同名变量）：
    --dr-tooltip-bg     #043250                         图表提示框背景色
    --dr-tooltip-text   #9ed2d8                         图表提示框文字色
    --dr-title-text     #ffffff                         中心标题 / 图例标题文字色
    --dr-num-text       #00f6ff                         中心汇总数值文字色
    --dr-unit-text      #00f6ff                         中心汇总单位文字色
    --dr-center-border  rgba(31,100,185,0.66)           中心圆形边框色
    --dr-center-shadow  #113477                         中心圆形内阴影色（局部元素，允许 box-shadow）
    --dr-progress-text  #7d88a7                         图例占比文字色
    （10 色调色板为 JS 常量 PALETTE，与源组件一致，见 script 内注释）

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex（mapGetters）、$echarts 全局注入、plateVO 接口数据，
       本组件已全部去除，改为 mock 数据 + 组件内自包含渲染。
    2. 子组件 echartsPie / pieText 已全部内联：Option 构建、echarts init、中心 slot 文字区、图例
       （竖线图标 + formatUnitStr 单位 & 拆分）均在本组件内实现。
    3. 图表配置（radius ['70%','78%'] / minAngle 20 / tooltip 背景 #043250 position 'right' /
       value 为 0 时置 null 保证颜色不错位 / unitMu 单位含万时 value/10000 后显示）与源组件保持一致。
    4. 该图表无图片物料，无需 assets 资源目录。
-->
<template>
  <div class="donut-ring">
    <div class="donut-ring__chart-wrap">
      <div class="donut-ring__square-wrapper">
        <div class="donut-ring__square">
          <div ref="chartRef" class="donut-ring__chart"></div>
          <div class="donut-ring__center">
            <p class="donut-ring__center-title">{{ title }}</p>
            <p class="donut-ring__center-value">
              <span class="donut-ring__center-num">{{ categoryTotal }}</span>
              <span class="donut-ring__center-unit">{{ unit }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="donut-ring__legend">
      <div
        v-for="(item, index) in mockData"
        :key="index"
        class="donut-ring__legend-item"
      >
        <div class="donut-ring__legend-inner">
          <span class="donut-ring__legend-icon">
            <i :style="{ backgroundColor: PALETTE[index] }"></i>
            <i :style="{ backgroundColor: PALETTE[index] }"></i>
            <i :style="{ backgroundColor: PALETTE[index] }"></i>
          </span>
          <div class="donut-ring__legend-text">
            <p class="donut-ring__legend-title" v-html="item.name"></p>
            <p class="donut-ring__legend-progress" v-if="item.progress">
              占比：{{ item.progress }}%
            </p>
            <p
              class="donut-ring__legend-value"
              :style="{ color: PALETTE[index] }"
            >
              <span class="donut-ring__legend-num">{{ item.value }}</span>
              <span class="donut-ring__legend-unit">
                {{ formatUnitStr(item.unit, true) }}
              </span>
              <br />
              <span
                v-if="item.unit && item.unit.indexOf('&') !== -1"
                class="donut-ring__legend-feed-unit"
              >
                {{ formatUnitStr(item.unit, false) }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import * as echarts from 'echarts';

/**
 * 10 色调色板（与源组件 pieCategoryData.color 保持一致）：
 *   1 #3ce1a3 青绿    2 #31abe4 天蓝    3 #ccc166 土黄    4 #646cc8 蓝紫    5 #c97f63 陶土
 *   6 #7a5fa8 紫      7 #85c963 草绿    8 #d25e9d 玫红    9 #997a0e 赭黄   10 #2732b2 深蓝
 */
const PALETTE: string[] = [
  '#3ce1a3',
  '#31abe4',
  '#ccc166',
  '#646cc8',
  '#c97f63',
  '#7a5fa8',
  '#85c963',
  '#d25e9d',
  '#997a0e',
  '#2732b2',
];

/** 图例/扇区数据项（对应源 plateMetricList 中的单条数据） */
interface LegendItem {
  name: string;
  value: number;
  unit: string;
  progress?: number;
}

/** mock 数据（对应源 plateMetricList.slice(0, 6)，共 6 项，通用命名） */
const mockData: LegendItem[] = [
  { name: '元素一', value: 213, unit: '单位' },
  { name: '元素二', value: 11, unit: '单位' },
  { name: '元素三', value: 24, unit: '单位' },
  { name: '元素四', value: 152, unit: '单位' },
  { name: '元素五', value: 86.3, unit: '单位' },
  { name: '元素六', value: 128, unit: '单位' },
];

/** 中心汇总标题（对应源 metricGroupName） */
const title = '元素汇总';

/** 中心汇总单位（对应源 metricGroupUnit） */
const unit = '单位';

/** 中心汇总总值 = mock 数据合计（对应源 metricGroupValue） */
const categoryTotal = mockData.reduce((sum, item) => sum + item.value, 0);

/** 单位含万时是否按 /10000 换算后显示（源组件 echartPieData.unitMu，mock 数据不触发） */
const unitMu = false;

/** echarts 渲染所需颜色（从 CSS 变量读取） */
interface PieColors {
  tooltipBg: string;
  tooltipText: string;
}

/** 从根元素读取 CSS 颜色变量，读取失败时回退到默认色 */
function readPieColors(el: HTMLElement): PieColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    tooltipBg: read('--dr-tooltip-bg', '#043250'),
    tooltipText: read('--dr-tooltip-text', '#9ed2d8'),
  };
}

/** 保留小数（拷贝自源项目 @/common/fn 的 maxDecimalPlaces），unitMu 换算时使用 */
function maxDecimalPlaces(
  { value = 0, places = 2 }: { value?: number; places?: number } = {},
): number {
  if (Number.isNaN(value) || value === undefined || value === null) {
    return value;
  }
  if (!Number.isInteger(value)) {
    const valueStr = String(value);
    const decimal = valueStr.match(/\.(\d+)/)?.[1] ?? '';
    if (decimal.length >= places) {
      return (
        Math.round(Number(valueStr) * Math.pow(10, places)) /
        Math.pow(10, places)
      );
    }
  }
  return parseFloat(String(value));
}

/** 单位按 & 拆分为两行（拷贝自源 pieText.formatUnitStr，flag=true 取前半段，false 取后半段） */
function formatUnitStr(str: string, flag: boolean): string {
  if (str && str.indexOf('&') !== -1) {
    const index = str.indexOf('&');
    return flag ? str.substring(0, index) : str.substring(index + 1, str.length);
  }
  return str;
}

/** 基础配置（对应源 pieOption） */
function buildBaseOption(colors: PieColors): echarts.EChartsOption {
  return {
    tooltip: {
      show: true,
      trigger: 'item',
      backgroundColor: colors.tooltipBg,
      position: 'right',
      padding: [13, 14, 13, 11],
      textStyle: {
        fontSize: 12,
        color: colors.tooltipText,
      },
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: '',
        type: 'pie',
        radius: ['70%', '78%'],
        minAngle: 20,
        label: { show: false },
        labelLine: { show: false },
      },
    ],
  };
}

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

/** 初始化图表 */
function initChart() {
  if (!chartRef.value) {
    return;
  }
  const colors = readPieColors(chartRef.value);
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(buildBaseOption(colors));
  refreshChart();
}

/** 用 mock 数据刷新图表（对应源 echartsPie.drawPie 的 setOption 部分） */
function refreshChart() {
  if (!chartInstance) {
    return;
  }

  const chartOpts: echarts.EChartsOption = {
    tooltip: {
      confine: true,
      formatter: (params: any) => {
        let val: number | string = params.value;
        // 单位含万时换算后再显示（mock 数据不触发）
        if (unitMu) {
          val = maxDecimalPlaces({ value: params.value / 10000 });
        }
        return `${params.name}：${val}${params.data?.unit || unit}`;
      },
    },
    color: PALETTE,
    series: [
      {
        type: 'pie',
        // value 为 0 时置 null（扇区不显示且颜色不错位，对应源 initModule 逻辑）
        // map 回调返回值声明为 any：null 值不在 PieDataItemOption 的 number 类型内
        data: mockData.map(
          (item): any => ({
            name: item.name,
            value: item.value || null,
            unit: item.unit,
          }),
        ),
      },
    ],
  };
  chartInstance.setOption(chartOpts);
}

/**
 * 尺寸自适应（防抖）：通过 ResizeObserver 监听 chartRef 容器尺寸变化，
 * 触发 echarts resize。覆盖三种场景：
 *   1. 窗口缩放（chartRef 尺寸跟着变）
 *   2. DOM 被 appendChild 到新容器（父节点变化触发 reflow）
 *   3. 父容器 grid 重排（如主应用把组件移到 PcCompCard slot）
 * 比 window.resize 监听更准确；组件销毁时 disconnect 释放 observer。
 */
const handleResize = debounce(() => {
  chartInstance?.resize();
}, 200);

/** 防抖：高频率触发时只保留最后一次（拷贝自源项目 @/utils/utils） */
function debounce(fn: (...args: unknown[]) => void, delay = 300) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: unknown[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, delay);
  };
}

/** chartRef 尺寸变化观察器 */
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  nextTick(() => {
    initChart();
    if (chartRef.value) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(chartRef.value);
    }
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style lang="scss" scoped>
.donut-ring {
  // —— 颜色变量（顶部注释已列出） ——
  --dr-tooltip-bg: #043250;
  --dr-tooltip-text: #9ed2d8;
  --dr-title-text: #ffffff;
  --dr-num-text: #00f6ff;
  --dr-unit-text: #00f6ff;
  --dr-center-border: rgba(31, 100, 185, 0.66);
  --dr-center-shadow: #113477;
  --dr-progress-text: #7d88a7;
  // —— 尺寸变量（响应式三档仅调整变量） ——
  --dr-center-title-size: 16px;
  --dr-center-num-size: 24px;
  --dr-center-unit-size: 14px;
  --dr-legend-title-size: 16px;
  --dr-legend-num-size: 24px;
  --dr-legend-unit-size: 14px;
  --dr-icon-w: 20px;
  --dr-icon-h: 49px;
  --dr-icon-dot: 9px;
  --dr-icon-line-x: 4px;
  --dr-icon-line-y: 9px;
  --dr-icon-line-h: 36px;
  --dr-icon-tail-h: 4px;
  --dr-icon-tail-y: 45px;
  --dr-pad-side: 15px;
  --dr-legend-inner-odd: 50%;
  --dr-chart-width: 45%;
  --dr-chart-max: 300px;

  position: relative;
  overflow: hidden;
  width: 100%;
  height: 320px;

  // 图表区：宽 45% 方形（源 .echarts-warp，z-index 3 使 tooltip 浮于图例之上）
  &__chart-wrap {
    position: relative;
    z-index: 3;
    width: var(--dr-chart-width);
    max-width: var(--dr-chart-max);
    height: 95%;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin-left: auto;
    margin-right: auto;
  }

  &__square-wrapper {
    position: relative;
    width: 100%;
    height: 0;
  }

  &__square {
    position: absolute;
    width: 100%;
    padding-top: 100%;
    transform: translateY(-50%);
  }

  // echarts 容器（方形，高度 = 图表区宽度的 45% 左右）
  &__chart {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  // 中心汇总文字区（对应源 center-text，62% 圆形）
  &__center {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    align-items: center;
    width: 62%;
    height: 62%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid var(--dr-center-border);
    // 局部元素阴影，允许 box-shadow（规则 §8.9）
    box-shadow: 0 0 50px var(--dr-center-shadow) inset;

    &-title {
      font-size: var(--dr-center-title-size);
      color: var(--dr-title-text);
      margin-bottom: 12px;
    }

    &-num {
      font-size: var(--dr-center-num-size);
      font-weight: bold;
      color: var(--dr-num-text);
    }

    &-unit {
      font-size: var(--dr-center-unit-size);
      color: var(--dr-unit-text);
      white-space: nowrap;
      margin-left: 4px;
    }
  }

  // 图例区（对应源 .pie-text-list，绝对定位铺满）
  &__legend {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;

    // 第 1、3、5 项：宽 60% 左内边距，内层宽 50%
    // 第 2、4、6 项：宽 24% 右内边距，内层宽 100%
    &-item {
      &:nth-child(2n-1) {
        padding-left: var(--dr-pad-side);
        width: 60%;

        .donut-ring__legend-inner {
          width: var(--dr-legend-inner-odd);
        }
      }
      &:nth-child(2n) {
        padding-right: var(--dr-pad-side);
        width: 24%;

        .donut-ring__legend-inner {
          width: 100%;
        }
      }
    }
  }

  // 图例项内层（对应源 .pie-text-wrapper）
  &__legend-inner {
    display: flex;
    align-items: center;
  }

  // 左侧 20x49px 竖线图标（对应源 .icon：圆点 + 半透明竖线 + 底部横线）
  &__legend-icon {
    position: relative;
    width: var(--dr-icon-w);
    height: var(--dr-icon-h);
    flex-shrink: 0;

    i {
      position: absolute;

      &:first-child {
        top: 0;
        left: 0;
        width: var(--dr-icon-dot);
        height: var(--dr-icon-dot);
      }

      &:nth-child(2) {
        left: var(--dr-icon-line-x);
        top: var(--dr-icon-line-y);
        height: var(--dr-icon-line-h);
        width: 1px;
        opacity: 0.4;
      }

      &:nth-child(3) {
        left: var(--dr-icon-line-x);
        top: var(--dr-icon-tail-y);
        height: var(--dr-icon-tail-h);
        width: 1px;
      }
    }
  }

  &__legend-text {
    flex: 1;
    min-width: 0;
  }

  &__legend-title {
    font-size: var(--dr-legend-title-size);
    color: var(--dr-title-text);
    margin-bottom: 12px;
    line-height: 18px;
  }

  &__legend-progress {
    margin-bottom: 10px;
    font-size: 14px;
    color: var(--dr-progress-text);
  }

  &__legend-num {
    font-size: var(--dr-legend-num-size);
    font-weight: bold;
  }

  &__legend-unit {
    font-size: var(--dr-legend-unit-size);
    padding-left: 4px;
  }

  &__legend-feed-unit {
    font-size: var(--dr-legend-unit-size);
    padding-top: 5px;
    display: inline-block;
  }

  // —— 响应式：≤1280px 小屏笔记本 ——
  @media (max-width: 1280px) {
    height: 280px;
    --dr-chart-width: 48%;
    --dr-chart-max: 260px;
    --dr-center-title-size: 14px;
    --dr-center-num-size: 20px;
    --dr-center-unit-size: 12px;
    --dr-legend-title-size: 14px;
    --dr-legend-num-size: 20px;
    --dr-legend-unit-size: 12px;
    --dr-icon-w: 16px;
    --dr-icon-h: 40px;
    --dr-icon-dot: 7px;
    --dr-icon-line-x: 3px;
    --dr-icon-line-y: 7px;
    --dr-icon-line-h: 30px;
    --dr-icon-tail-h: 3px;
    --dr-icon-tail-y: 37px;
    --dr-pad-side: 10px;
    --dr-legend-inner-odd: 55%;
  }

  // —— 响应式：≥1920px 大屏显示器 ——
  @media (min-width: 1920px) {
    height: 360px;
    --dr-chart-width: 45%;
    --dr-chart-max: 340px;
    --dr-center-title-size: 18px;
    --dr-center-num-size: 28px;
    --dr-center-unit-size: 16px;
    --dr-legend-title-size: 18px;
    --dr-legend-num-size: 28px;
    --dr-legend-unit-size: 16px;
    --dr-icon-w: 24px;
    --dr-icon-h: 59px;
    --dr-icon-dot: 11px;
    --dr-icon-line-x: 5px;
    --dr-icon-line-y: 11px;
    --dr-icon-line-h: 43px;
    --dr-icon-tail-h: 5px;
    --dr-icon-tail-y: 54px;
    --dr-pad-side: 20px;
  }
}
</style>
