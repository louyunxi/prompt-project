<!--
  组件名称：GradientBar（水平渐变柱状图）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB102.vue

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .gradient-bar 上，echarts 运行时读取同名变量）：
    --gb-tooltip-bg     #042940                提示框背景色
    --gb-tooltip-text   #9ed2d8                提示框文字色
    --gb-axis-text      #ffffff                分类轴文字色
    --gb-value-text     #00f6ff                数值轴文字色
    --gb-bar-from       #0afcff                渐变柱起始色
    --gb-bar-to         #0ca0fe                渐变柱结束色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex（mapGetters）、$echarts 全局注入、
       plateVO 接口数据，本组件已全部去除，改为 mock 数据 + 组件内自包含渲染。
    2. 原依赖函数 debounce 已拷贝进本组件（见下方 debounce）。
    3. 图表配置（grid / tooltip / 双 y 轴 / 渐变柱）与源组件保持一致。
    4. 该图表无图片物料，无需 assets 资源目录。
-->
<template>
  <div class="gradient-bar">
    <div ref="chartRef" class="gradient-bar__chart"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue';
import * as echarts from 'echarts';

/** 防抖：高频率触发时只保留最后一次（拷贝自源项目 @/utils/utils） */
function debounce(fn: (...args: unknown[]) => void, delay = 300) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: unknown[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, delay);
  };
}

/** 图表指标项（对应源组件 plateMetricList 中的单条数据） */
interface ChartMetric {
  metricName: string;
  metricValue: number;
  metricUnit: string;
}

/** mock 指标数据（对应源组件 plateMetricGroupList[0].plateMetricList.slice(0, 6).reverse()） */
const mockMetricList: ChartMetric[] = [
  { metricName: '元素一', metricValue: 213, metricUnit: '单位' },
  { metricName: '元素二', metricValue: 11, metricUnit: '单位' },
  { metricName: '元素三', metricValue: 24, metricUnit: '单位' },
  { metricName: '元素四', metricValue: 152, metricUnit: '单位' },
  { metricName: '元素五', metricValue: 86.3, metricUnit: '单位' },
  { metricName: '元素六', metricValue: 128, metricUnit: '单位' },
];

/** echarts 渲染所需颜色（从 CSS 变量读取） */
interface BarColors {
  tooltipBg: string;
  tooltipText: string;
  axisText: string;
  valueText: string;
  barFrom: string;
  barTo: string;
}

/** 从根元素读取 CSS 颜色变量，读取失败时回退到默认色 */
function readBarColors(el: HTMLElement): BarColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    tooltipBg: read('--gb-tooltip-bg', '#042940'),
    tooltipText: read('--gb-tooltip-text', '#9ed2d8'),
    axisText: read('--gb-axis-text', '#ffffff'),
    valueText: read('--gb-value-text', '#00f6ff'),
    barFrom: read('--gb-bar-from', '#0afcff'),
    barTo: read('--gb-bar-to', '#0ca0fe'),
  };
}

/** 基础配置（对应源组件 barOption） */
function buildBaseOption(colors: BarColors): echarts.EChartsOption {
  return {
    grid: {
      show: false,
      top: 10,
      left: '25%',
      right: '24%',
      bottom: 0,
    },
    tooltip: {
      show: true,
      trigger: 'item',
      confine: true,
      formatter: (params: any) => {
        const name = params.name;
        const count = (params.data?.value ?? '') + (params.data?.unit ?? '');
        return `${name}：${count}`;
      },
      backgroundColor: colors.tooltipBg,
      padding: [13, 14, 13, 11],
      textStyle: {
        fontSize: 12,
        color: colors.tooltipText,
      },
    },
    xAxis: {
      type: 'value',
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      name: '',
      nameTextStyle: {
        fontSize: 12,
        color: colors.axisText,
        padding: [0, 0, -10, -6],
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        show: true,
        margin: 80,
        color: colors.axisText,
        fontSize: 12,
        align: 'left',
        lineHeight: 15,
        formatter: (value: string) => {
          const maxLen = 9;
          if (value.length >= maxLen) {
            return `${value.slice(0, maxLen)}\n${value.slice(maxLen)}`;
          }
          return value;
        },
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: '30%',
        data: [],
        stack: '总量',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: colors.barFrom },
              { offset: 1, color: colors.barTo },
            ],
          },
        },
      },
    ],
  };
}

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

/** 初始化图表 */
function initChart() {
  if (!chartRef.value) return;
  const colors = readBarColors(chartRef.value);
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(buildBaseOption(colors));
  refreshChart(colors);
}

/** 用 mock 指标数据刷新图表（对应源组件 refreshChart） */
function refreshChart(colors: BarColors) {
  if (!chartInstance) return;

  const chartOpts: echarts.EChartsOption = {
    yAxis: [
      {
        type: 'category',
        data: mockMetricList.map((item) => item.metricName),
      },
      {
        type: 'category',
        axisTick: { show: false },
        axisLine: { show: false },
        show: true,
        axisLabel: {
          color: colors.valueText,
          fontSize: 14,
          fontWeight: 400,
        },
        data: mockMetricList.map(
          (item) => `${item.metricValue}${item.metricUnit}`,
        ),
      },
    ],
    series: [
      {
        barMinHeight: 5,
        data: mockMetricList.map((item) => ({
          value: item.metricValue,
          year: '2020',
          unit: item.metricUnit,
        })),
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
.gradient-bar {
  --gb-tooltip-bg: #042940;
  --gb-tooltip-text: #9ed2d8;
  --gb-axis-text: #ffffff;
  --gb-value-text: #00f6ff;
  --gb-bar-from: #0afcff;
  --gb-bar-to: #0ca0fe;

  width: 100%;

  &__chart {
    width: 100%;
    height: 320px;
  }
}
</style>
