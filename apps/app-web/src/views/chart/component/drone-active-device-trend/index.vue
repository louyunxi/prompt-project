<!--
  组件名称：DroneActiveDeviceTrend（活跃设备趋势）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\DroneSurveillance\components\Module06.vue

  依赖插件 / 版本：
    - echarts ^5.6.0（本项目已安装）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .dadt-root）：
    --dadt-primary       #00d4aa   主题色 / 边框
    --dadt-border        rgba(0, 212, 170, 0.3) 边框色
    --dadt-border-hover  rgba(0, 212, 170, 0.5) hover 边框色
    --dadt-glow          rgba(0, 212, 170, 0.1) 面板外发光
    --dadt-glow-hover    rgba(0, 212, 170, 0.2) hover 外发光

  迁移说明：
    1. 去除 inject('regionAdcode')，改为使用 340000 省级 mock 数据。
    2. 去除 window.resize 监听，改用 ResizeObserver 监听图表容器尺寸变化。
    3. 保留折点循环高亮 + tooltip 自动轮播动效。
    4. 去除标题与图标，背景统一为舞台色。
    5. tooltip 边框色统一为 #00F6FF。
-->
<template>
  <div class="dadt-root">
    <div
      ref="chartRef"
      class="dadt-chart"
      @mouseover="onChartMouseOver"
      @mouseout="onChartMouseOut"
    ></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onMounted, onBeforeUnmount, ref } from 'vue';

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let highlightTimer: ReturnType<typeof setInterval> | null = null;
let currentHighlightIndex = 0;
let isHovering = false;
let resizeObserver: ResizeObserver | null = null;

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(
      `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')}`,
    );
  }
  return days;
}

const xData = getLast7Days();
const mockData = [9200, 8900, 8700, 10400, 11100, 11800, 12500];

function startHighlight() {
  if (isHovering || !chartInstance) {
    return;
  }
  const dataLength = xData.length;
  if (dataLength === 0) {
    return;
  }

  highlightTimer = setInterval(() => {
    if (isHovering) {
      return;
    }

    chartInstance?.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: currentHighlightIndex,
    });
    chartInstance?.dispatchAction({
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

function initChart() {
  if (!chartRef.value) {
    return;
  }
  chartInstance = echarts.init(chartRef.value);
  updateChart();
}

function updateChart() {
  if (!chartInstance) {
    return;
  }

  const data = mockData;
  const minVal = Math.floor(Math.min(...data) / 1000) * 1000;
  const maxVal = Math.ceil(Math.max(...data) / 1000) * 1000;

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 10, 20, 0.9)',
      borderColor: '#00F6FF',
      textStyle: {
        color: '#e2e8f0',
        fontSize: 12,
      },
      formatter: (params: any) => {
        const date = params[0].axisValue;
        const value = params[0].data;
        return `${date}<br/>活跃设备: ${value}`;
      },
    },
    grid: {
      left: 50,
      right: 10,
      bottom: 20,
      top: 20,
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
      axisLabel: {
        color: '#dedede',
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value',
      min: minVal,
      max: maxVal + 1000,
      interval: Math.ceil((maxVal - minVal) / 5 / 1000) * 1000 || 1000,
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(255, 255, 255, 0.12)',
        },
      },
      axisLine: { show: false },
      axisLabel: {
        color: '#dedede',
        fontSize: 12,
      },
    },
    series: [
      {
        type: 'line',
        data,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#2dcb55',
          width: 4,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(45, 203, 85, 0.25)' },
            { offset: 1, color: 'rgba(45, 203, 85, 0.03)' },
          ]),
        },
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  initChart();
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartRef.value);
  }
  startHighlight();
});

onBeforeUnmount(() => {
  stopHighlight();
  resizeObserver?.disconnect();
  resizeObserver = null;
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style lang="scss" scoped>
.dadt-root {
  --dadt-primary: #00d4aa;
  --dadt-border: rgba(0, 212, 170, 0.3);
  --dadt-border-hover: rgba(0, 212, 170, 0.5);
  --dadt-glow: rgba(0, 212, 170, 0.1);
  --dadt-glow-hover: rgba(0, 212, 170, 0.2);

  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--dadt-border);
  box-shadow: 0 0 20px var(--dadt-glow), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--dadt-border-hover);
    box-shadow: 0 0 30px var(--dadt-glow-hover),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
}

.dadt-chart {
  flex: 1;
  min-height: 0;
}
</style>
