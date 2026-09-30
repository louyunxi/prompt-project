<!--
  组件名称：DroneCityRankingTop5（地市投入排行 Top5）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\DroneSurveillance\components\Module05.vue

  依赖插件 / 版本：
    - echarts ^5.6.0（本项目已安装）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .dcrt-root）：
    --dcrt-primary       #00d4aa   主题色 / 边框
    --dcrt-border        rgba(0, 212, 170, 0.3) 边框色
    --dcrt-border-hover  rgba(0, 212, 170, 0.5) hover 边框色
    --dcrt-glow          rgba(0, 212, 170, 0.1) 面板外发光
    --dcrt-glow-hover    rgba(0, 212, 170, 0.2) hover 外发光

  迁移说明：
    1. 去除 inject('regionAdcode')，改为使用 340000 省级 mock 数据。
    2. 去除 window.resize 监听，改用 ResizeObserver 监听图表容器尺寸变化。
    3. 保留柱条循环高亮 + tooltip 自动轮播动效。
    4. 去除标题与图标，背景统一为舞台色。
    5. tooltip 边框色统一为 #00F6FF。
-->
<template>
  <div class="dcrt-root">
    <div
      ref="chartRef"
      class="dcrt-chart"
      @mouseover="onChartMouseOver"
      @mouseout="onChartMouseOut"
    ></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onMounted, onBeforeUnmount, ref } from 'vue';

interface RankingData {
  xAxis: string[];
  data: number[];
}

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let highlightTimer: ReturnType<typeof setInterval> | null = null;
let currentHighlightIndex = 0;
let isHovering = false;
let resizeObserver: ResizeObserver | null = null;

const mockData: RankingData = {
  xAxis: ['区域一', '区域二', '区域三', '区域四', '区域五'],
  data: [3240, 2105, 1850, 1420, 1100],
};

function startHighlight() {
  if (isHovering || !chartInstance) {
    return;
  }
  const dataLength = mockData.data.length;
  if (dataLength === 0) {
    return;
  }

  let lastHighlightIndex = -1;

  highlightTimer = setInterval(() => {
    if (isHovering) {
      return;
    }

    if (lastHighlightIndex >= 0) {
      chartInstance?.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
        dataIndex: lastHighlightIndex,
      });
    }

    chartInstance?.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: currentHighlightIndex,
    });

    chartInstance?.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: currentHighlightIndex,
    });

    lastHighlightIndex = currentHighlightIndex;
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

  const { xAxis, data } = mockData;
  const maxVal = Math.max(...data);
  const niceMax = Math.ceil(maxVal / 50) * 50;
  const interval = Math.ceil(niceMax / 4 / 50) * 50;

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 10, 20, 0.9)',
      borderColor: '#00F6FF',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params: any) => `${params.name}: ${params.value}`,
    },
    grid: {
      left: 40,
      right: 10,
      bottom: 20,
      top: 20,
    },
    xAxis: {
      type: 'category',
      data: xAxis,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
      axisLabel: {
        color: '#dedede',
        fontSize: 12,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
      max: niceMax,
      interval,
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
        type: 'bar',
        barWidth: '25%',
        data,
        itemStyle: {
          color: '#34a8eb',
          borderRadius: [8, 8, 0, 0],
        },
        label: {
          show: true,
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 600,
          position: 'outside',
          formatter: '{c}',
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
.dcrt-root {
  --dcrt-primary: #00d4aa;
  --dcrt-border: rgba(0, 212, 170, 0.3);
  --dcrt-border-hover: rgba(0, 212, 170, 0.5);
  --dcrt-glow: rgba(0, 212, 170, 0.1);
  --dcrt-glow-hover: rgba(0, 212, 170, 0.2);

  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--dcrt-border);
  box-shadow: 0 0 20px var(--dcrt-glow), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--dcrt-border-hover);
    box-shadow: 0 0 30px var(--dcrt-glow-hover),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
}

.dcrt-chart {
  flex: 1;
  min-height: 0;
}
</style>
