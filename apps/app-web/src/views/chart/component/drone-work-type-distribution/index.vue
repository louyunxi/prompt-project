<!--
  组件名称：DroneWorkTypeDistribution（作业类型分布）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\DroneSurveillance\components\Module02.vue

  依赖插件 / 版本：
    - echarts ^5.6.0（本项目已安装）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .dwtd-root）：
    --dwtd-primary       #00d4aa   主题色 / 图标 / 边框
    --dwtd-bg            rgba(5, 12, 19, 0.75) 面板底色
    --dwtd-border        rgba(0, 212, 170, 0.3) 边框色
    --dwtd-border-hover  rgba(0, 212, 170, 0.5) hover 边框色
    --dwtd-glow          rgba(0, 212, 170, 0.1) 面板外发光
    --dwtd-glow-hover    rgba(0, 212, 170, 0.2) hover 外发光
    --dwtd-title         #e2e8f0   标题文字
    --dwtd-tooltip-bg    rgba(0, 30, 20, 0.9) tooltip 背景

  迁移说明：
    1. 去除 inject('regionAdcode')，改为使用 340000 省级 mock 数据。
    2. 去除 window.resize 监听，改用 ResizeObserver 监听图表容器尺寸变化。
    3. 保留扇区循环高亮 + tooltip 自动轮播动效。
    4. 无图片物料，无需 assets 目录。
-->
<template>
  <div class="dwtd-root">
    <div
      ref="chartRef"
      class="dwtd-chart"
      @mouseover="onChartMouseOver"
      @mouseout="onChartMouseOut"
    ></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onMounted, onBeforeUnmount, ref } from 'vue';

interface WorkTypeItem {
  value: number;
  name: string;
  color: string;
}

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let highlightTimer: ReturnType<typeof setInterval> | null = null;
let currentHighlightIndex = 0;
let isHovering = false;
let resizeObserver: ResizeObserver | null = null;

const mockData: WorkTypeItem[] = [
  { value: 45, name: '类型一', color: '#2dcb55' },
  { value: 28, name: '类型二', color: '#34a8eb' },
  { value: 12, name: '类型三', color: '#f58015' },
  { value: 15, name: '类型四', color: '#a652c8' },
];

function startHighlight() {
  if (isHovering || !chartInstance) {
    return;
  }
  const dataLength = mockData.length;
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

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 10, 20, 0.9)',
      borderColor: '#00F6FF',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params: any) => `${params.name}: ${params.value}%`,
    },
    legend: {
      right: '5%',
      top: 'center',
      orient: 'vertical',
      textStyle: {
        color: '#e2e2e2',
        fontSize: 12,
      },
      itemGap: 15,
      icon: 'circle',
    },
    series: [
      {
        type: 'pie',
        center: ['35%', '50%'],
        radius: ['55%', '80%'],
        label: { show: false },
        labelLine: { show: false },
        data: mockData.map((d) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: d.color },
        })),
      },
    ],
  };

  chartInstance.setOption(option);
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
.dwtd-root {
  --dwtd-primary: #00d4aa;
  --dwtd-border: rgba(0, 212, 170, 0.3);
  --dwtd-border-hover: rgba(0, 212, 170, 0.5);
  --dwtd-glow: rgba(0, 212, 170, 0.1);
  --dwtd-glow-hover: rgba(0, 212, 170, 0.2);

  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--dwtd-border);
  box-shadow: 0 0 20px var(--dwtd-glow), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--dwtd-border-hover);
    box-shadow: 0 0 30px var(--dwtd-glow-hover),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
}

.dwtd-chart {
  flex: 1;
  min-height: 0;
}
</style>
