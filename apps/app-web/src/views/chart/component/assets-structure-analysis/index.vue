<!--
  组件名称：AssetsStructureAnalysis（资产结构分析）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\ThreeAssetsSupervision\components\left\AssetStructureAnalysis.vue

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .assets-structure-analysis 上，echarts 运行时读取同名变量）：
    --asa-border          rgba(0, 212, 255, 0.3)   面板边框色
    --asa-border-hover    rgba(0, 212, 255, 0.5)   面板悬停边框色
    --asa-shadow          rgba(0, 212, 255, 0.1)   面板外发光色
    --asa-tooltip-bg      rgba(15, 23, 42, 0.9)   提示框背景色
    --asa-tooltip-text    #e2e8f0                 提示框文字色
    --asa-label-color     #cbd5e1                 饼图标签色
    --asa-label-line      rgba(148, 163, 184, 0.4) 标签引导线色
    --asa-center-text     #f0f9ff                 中心文字色
    --asa-slice-1         #00d4ff                 类型一颜色
    --asa-slice-2         #a78bfa                 类型二颜色
    --asa-slice-3         #34d399                 类型三颜色
    --asa-slice-4         #fbbf24                 类型四颜色

  迁移说明：
    1. 去除外部依赖：inject('regionAdcode')、多区域 mock 数据、router 详情链接。
    2. 改为组件内自包含，仅保留省级（adcode 340000）mock 数据。
    3. 保留源项目业务名称与颜色，仅保留省级（adcode 340000）mock 数据。
    4. 使用 ResizeObserver 监听图表容器尺寸变化（替代 window.resize），
       组件销毁时 disconnect 释放 observer 并 dispose echarts 实例。
    5. 保留饼图循环高亮动画（1.5s 间隔），鼠标悬停时暂停、移出后恢复。
    6. 去除标题与图标，背景统一为舞台色；提示框边框色统一为 #00F6FF。
    7. 面板宽度由源 400px 改为 100%，以适配 CompCard 舞台容器。
-->
<template>
  <div class="assets-structure-analysis">
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

/** 省级 mock 数据 */
const totalAmount = 78959;
const structureValues = [50, 29, 12, 9];

const categoryNames = ['经营性资产', '固定资产', '流动资产', '其他资产'];
const categoryColors = [
  'var(--asa-slice-1)',
  'var(--asa-slice-2)',
  'var(--asa-slice-3)',
  'var(--asa-slice-4)',
];

const structureData = categoryNames.map((name, i) => ({
  name,
  value: structureValues[i],
  color: categoryColors[i],
}));

function startHighlight() {
  if (isHovering || !chartInstance) {
    return;
  }

  highlightTimer = setInterval(() => {
    if (isHovering || !chartInstance) {
      return;
    }

    chartInstance.dispatchAction({ type: 'downplay' });
    chartInstance.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: currentHighlightIndex,
    });

    currentHighlightIndex = (currentHighlightIndex + 1) % structureData.length;
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

/** 从根元素读取 CSS 颜色变量 */
interface AnalysisColors {
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  labelColor: string;
  labelLine: string;
  centerText: string;
}

function readColors(el: HTMLElement): AnalysisColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    tooltipBg: read('--asa-tooltip-bg', 'rgba(15, 23, 42, 0.9)'),
    tooltipBorder: read('--asa-tooltip-border', 'rgba(255, 255, 255, 0.1)'),
    tooltipText: read('--asa-tooltip-text', '#e2e8f0'),
    labelColor: read('--asa-label-color', '#cbd5e1'),
    labelLine: read('--asa-label-line', 'rgba(148, 163, 184, 0.4)'),
    centerText: read('--asa-center-text', '#f0f9ff'),
  };
}

function buildChartOption(colors: AnalysisColors): echarts.EChartsOption {
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: colors.tooltipBg,
      borderColor: '#00F6FF',
      textStyle: { color: colors.tooltipText, fontSize: 12 },
      formatter: (params: any) => `${params.name}: ${params.value}%`,
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['50%', '52%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: 'rgba(15, 23, 42, 0.8)',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          color: colors.labelColor,
          fontSize: 11,
          lineHeight: 16,
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 15,
          minTurnAngle: 0,
          lineStyle: { color: colors.labelLine },
        },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
        },
        data: structureData.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color },
          label: { show: true },
          labelLine: { show: true },
        })),
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: `总资金\n${totalAmount}亿`,
          textAlign: 'center',
          fill: colors.centerText,
          fontSize: 13,
          fontWeight: 'bold',
          lineHeight: 22,
        },
      },
    ] as any,
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
.assets-structure-analysis {
  --asa-border: rgba(0, 212, 255, 0.3);
  --asa-border-hover: rgba(0, 212, 255, 0.5);
  --asa-shadow: rgba(0, 212, 255, 0.1);
  --asa-tooltip-bg: rgba(15, 23, 42, 0.9);
  --asa-tooltip-text: #e2e8f0;
  --asa-label-color: #cbd5e1;
  --asa-label-line: rgba(148, 163, 184, 0.4);
  --asa-center-text: #f0f9ff;
  --asa-slice-1: #00d4ff;
  --asa-slice-2: #a78bfa;
  --asa-slice-3: #34d399;
  --asa-slice-4: #fbbf24;

  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--comp-card-stage-bg, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--asa-border);
  box-shadow: 0 0 20px var(--asa-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:hover {
    border-color: var(--asa-border-hover);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .chart {
    flex: 1;
    min-height: 0;
  }
}
</style>
