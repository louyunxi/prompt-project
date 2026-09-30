<!--
  组件名称：AssetsFundTrend（资金收支趋势）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\ThreeAssetsSupervision\components\left\FundTrendChart.vue

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .assets-fund-trend 上，echarts 运行时读取同名变量）：
    --aft-border          rgba(0, 212, 255, 0.3)   面板边框色
    --aft-border-hover    rgba(0, 212, 255, 0.5)   面板悬停边框色
    --aft-shadow          rgba(0, 212, 255, 0.1)   面板外发光色
    --aft-legend-text     #94a3b8                 图例文字色
    --aft-tooltip-bg      rgba(15, 23, 42, 0.9)   提示框背景色
    --aft-tooltip-text    #e2e8f0                 提示框文字色
    --aft-axis-text       #94a3b8                 坐标轴文字色
    --aft-axis-line       rgba(148, 163, 184, 0.2) 坐标轴线色
    --aft-axis-name       #64748b                 坐标轴单位色
    --aft-split-line      rgba(148, 163, 184, 0.08) 网格线色
    --aft-line-1          #a78bfa                 系列一（收入）线色
    --aft-line-1-from     rgba(167, 139, 250, 0.25) 系列一面积渐变起始色
    --aft-line-1-to       rgba(167, 139, 250, 0.02) 系列一面积渐变结束色
    --aft-line-2          #10b981                 系列二（支出）线色
    --aft-line-2-from     rgba(16, 185, 129, 0.25) 系列二面积渐变起始色
    --aft-line-2-to       rgba(16, 185, 129, 0.02) 系列二面积渐变结束色
    --aft-pointer         rgba(148, 163, 184, 0.3) 坐标轴指示线色

  迁移说明：
    1. 去除外部依赖：inject('regionAdcode')、多区域 mock 数据。
    2. 改为组件内自包含，仅保留省级（adcode 340000）mock 数据。
    3. 系列名称由「总收入/总支出」改为通用名称「系列一/系列二」。
    4. 使用 ResizeObserver 监听图表容器尺寸变化（替代 window.resize），
       组件销毁时 disconnect 释放 observer 并 dispose echarts 实例。
    5. 保留折线面积图循环高亮动画（1.5s 间隔显示 tooltip 并高亮数据点），
       鼠标悬停时暂停、移出后恢复。
    6. 去除标题与图标，背景统一为舞台色；提示框边框色统一为 #00F6FF。
    7. 图例在组件顶部居中展示，并保留上下 padding。
    8. 面板宽度由源 400px 改为 100%，以适配 CompCard 舞台容器。
-->
<template>
  <div class="assets-fund-trend">
    <div class="legend-bar">
      <span class="legend-item">
        <span class="legend-dot series-1"></span>
        系列一
      </span>
      <span class="legend-item">
        <span class="legend-dot series-2"></span>
        系列二
      </span>
    </div>
    <div
      ref="chartRef"
      class="chart"
      @mouseover="onChartMouseOver"
      @mouseout="onChartMouseOut"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue';
import * as echarts from 'echarts';

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

/** 循环高亮动画 */
let highlightTimer: ReturnType<typeof setInterval> | null = null;
let currentHighlightIndex = 0;
let isHovering = false;

/** 动态生成最近 6 个月 */
function getLast6Months(): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getMonth() + 1}月`);
  }
  return months;
}

const months = getLast6Months();

/** 省级 mock 数据 */
const fundData = {
  series1: [9.2, 11.5, 14.5, 18.3, 22.1, 26.8],
  series2: [7.8, 9.5, 12.1, 15.6, 19.2, 22.5],
};

function getYAxisConfig() {
  const maxVal = Math.max(...fundData.series1, ...fundData.series2);
  const yMax = Math.ceil(maxVal * 1.2);
  const interval = Math.ceil(yMax / 4);
  return { yMax, interval };
}

function startHighlight() {
  if (isHovering || !chartInstance) {
    return;
  }
  const dataLength = months.length;
  if (dataLength === 0) {
    return;
  }

  highlightTimer = setInterval(() => {
    if (isHovering || !chartInstance) {
      return;
    }

    chartInstance.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: currentHighlightIndex,
    });
    chartInstance.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: currentHighlightIndex,
    });

    currentHighlightIndex = (currentHighlightIndex + 1) % dataLength;
  }, 1500);
}

function stopHighlight() {
  if (highlightTimer) {
    clearInterval(highlightTimer);
    highlightTimer = null;
  }
}

function onChartMouseOver() {
  isHovering = true;
  stopHighlight();
  chartInstance?.dispatchAction({ type: 'hideTip' });
  chartInstance?.dispatchAction({ type: 'downplay' });
}

function onChartMouseOut() {
  isHovering = false;
  startHighlight();
}

/** 从根元素读取 CSS 颜色变量 */
interface TrendColors {
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  axisText: string;
  axisLine: string;
  axisName: string;
  splitLine: string;
  line1: string;
  line1From: string;
  line1To: string;
  line2: string;
  line2From: string;
  line2To: string;
  pointer: string;
}

function readColors(el: HTMLElement): TrendColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    tooltipBg: read('--aft-tooltip-bg', 'rgba(15, 23, 42, 0.9)'),
    tooltipBorder: read('--aft-tooltip-border', 'rgba(255, 255, 255, 0.1)'),
    tooltipText: read('--aft-tooltip-text', '#e2e8f0'),
    axisText: read('--aft-axis-text', '#94a3b8'),
    axisLine: read('--aft-axis-line', 'rgba(148, 163, 184, 0.2)'),
    axisName: read('--aft-axis-name', '#64748b'),
    splitLine: read('--aft-split-line', 'rgba(148, 163, 184, 0.08)'),
    line1: read('--aft-line-1', '#a78bfa'),
    line1From: read('--aft-line-1-from', 'rgba(167, 139, 250, 0.25)'),
    line1To: read('--aft-line-1-to', 'rgba(167, 139, 250, 0.02)'),
    line2: read('--aft-line-2', '#10b981'),
    line2From: read('--aft-line-2-from', 'rgba(16, 185, 129, 0.25)'),
    line2To: read('--aft-line-2-to', 'rgba(16, 185, 129, 0.02)'),
    pointer: read('--aft-pointer', 'rgba(148, 163, 184, 0.3)'),
  };
}

function buildChartOption(colors: TrendColors): echarts.EChartsOption {
  const { yMax, interval } = getYAxisConfig();

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.tooltipBg,
      borderColor: '#00F6FF',
      textStyle: { color: colors.tooltipText, fontSize: 12 },
      axisPointer: {
        type: 'line',
        lineStyle: { color: colors.pointer },
        label: { show: false },
      },
      formatter: (params: any) => {
        const items = params
          .map(
            (p: any) =>
              `<span style="color:${p.color}">●</span> ${p.seriesName}: ${p.value}亿元`,
          )
          .join('<br/>');
        return items;
      },
    },
    legend: { show: false },
    grid: {
      top: 30,
      bottom: 20,
      left: 40,
      right: 7,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: colors.axisLine } },
      axisTick: { show: false },
      axisLabel: { color: colors.axisText, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '亿元',
      nameTextStyle: {
        color: colors.axisName,
        fontSize: 10,
        padding: [0, 35, 0, 0],
      },
      min: 0,
      max: yMax,
      interval: interval,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: colors.axisName, fontSize: 10 },
      splitLine: { lineStyle: { color: colors.splitLine } },
    },
    series: [
      {
        name: '系列一',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: fundData.series1,
        lineStyle: { color: colors.line1, width: 2 },
        itemStyle: { color: colors.line1 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors.line1From },
            { offset: 1, color: colors.line1To },
          ]),
        },
      },
      {
        name: '系列二',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: fundData.series2,
        lineStyle: { color: colors.line2, width: 2 },
        itemStyle: { color: colors.line2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors.line2From },
            { offset: 1, color: colors.line2To },
          ]),
        },
      },
    ],
  };
}

/** 防抖：高频率触发时只保留最后一次 */
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

/** 渲染图表（init 与 resize 重建共用） */
function renderChart() {
  if (!chartInstance || !chartRef.value) {
    return;
  }
  const colors = readColors(chartRef.value);
  chartInstance.setOption(buildChartOption(colors), { notMerge: true });
}

/** 初始化图表 */
function initChart() {
  if (!chartRef.value) {
    return;
  }
  chartInstance = echarts.init(chartRef.value);
  renderChart();
  chartInstance.resize();
  startHighlight();
}

/**
 * 尺寸自适应（防抖）：通过 ResizeObserver 监听 chartRef 容器尺寸变化，
 * 触发 echarts resize；组件销毁时 disconnect 释放 observer。
 */
const handleResize = debounce(() => {
  chartInstance?.resize();
}, 200);

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
  stopHighlight();
  resizeObserver?.disconnect();
  resizeObserver = null;
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style scoped lang="scss">
.assets-fund-trend {
  --aft-border: rgba(0, 212, 255, 0.3);
  --aft-border-hover: rgba(0, 212, 255, 0.5);
  --aft-shadow: rgba(0, 212, 255, 0.1);
  --aft-legend-text: #94a3b8;
  --aft-tooltip-bg: rgba(15, 23, 42, 0.9);
  --aft-tooltip-text: #e2e8f0;
  --aft-axis-text: #94a3b8;
  --aft-axis-line: rgba(148, 163, 184, 0.2);
  --aft-axis-name: #64748b;
  --aft-split-line: rgba(148, 163, 184, 0.08);
  --aft-line-1: #a78bfa;
  --aft-line-1-from: rgba(167, 139, 250, 0.25);
  --aft-line-1-to: rgba(167, 139, 250, 0.02);
  --aft-line-2: #10b981;
  --aft-line-2-from: rgba(16, 185, 129, 0.25);
  --aft-line-2-to: rgba(16, 185, 129, 0.02);
  --aft-pointer: rgba(148, 163, 184, 0.3);

  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--aft-border);
  box-shadow: 0 0 20px var(--aft-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:hover {
    border-color: var(--aft-border-hover);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .legend-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 400;
    color: var(--aft-legend-text);
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.series-1 {
      background: var(--aft-line-1);
    }

    &.series-2 {
      background: var(--aft-line-2);
    }
  }

  .chart {
    flex: 1;
    min-height: 0;
  }
}
</style>
