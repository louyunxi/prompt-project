<!--
  组件名称：LineArea（多系列渐变面积折线图）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB120.vue

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .line-area 上，echarts 运行时读取同名变量）：
    --la-tooltip-bg       #042940                      提示框背景色
    --la-tooltip-text     #9ed2d8                      提示框文字色
    --la-title-text       #6dc1cb                      空数据标题文字色
    --la-legend-text      rgba(255,255,255,0.5)        图例文字色
    --la-grid-border      #072d4a                      网格边框色
    --la-axis-text        rgba(255,255,255,0.5)        坐标轴文字色
    --la-axis-secondary   #7b8f9d                      分类轴次级文字色
    --la-axis-line        rgba(109,193,203,0.2)        坐标轴线色
    --la-axis-line-dark   #0d394a                      数值轴线色
    --la-split-line       rgba(109,193,203,0.2)        分割线色
    --la-line1            #00f6ff                      第一系列线色
    --la-line1-from       rgba(0,246,255,0.4)          第一系列面积渐变起始色
    --la-line1-to         rgba(0,246,255,0)            第一系列面积渐变结束色
    --la-line2            #f5b03d                      第二系列线色
    --la-line2-from       rgba(245,176,61,0.4)         第二系列面积渐变起始色
    --la-line2-to         rgba(245,176,61,0)           第二系列面积渐变结束色
    --la-line3            #62c37c                      第三系列线色
    --la-line3-from       rgba(98,195,124,0.4)         第三系列面积渐变起始色
    --la-line3-to         rgba(98,195,124,0)           第三系列面积渐变结束色
    --la-line4            #911eec                      第四系列线色
    --la-line4-from       rgba(145,30,236,0.4)         第四系列面积渐变起始色
    --la-line4-to         rgba(145,30,236,0)           第四系列面积渐变结束色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、$echarts 全局注入、plateVO 接口数据，
       本组件已全部去除，改为 mock 数据 + 组件内自包含渲染。
    2. 原依赖函数 debounce 已拷贝进本组件（见下方定义）。
    3. 图表配置（title / legend / grid / 渐变面积折线 / 空数据提示）与源组件保持一致。
    4. 该图表无图片物料，无需 assets 资源目录。
-->
<template>
  <div class="line-area">
    <div ref="chartRef" class="line-area__chart"></div>
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

/** 指标项（对应源组件 plateMetricList 中的单条数据） */
interface MetricItem {
  metricName: string;
  metricValue: number;
  metricUnit: string;
}

/** 指标分组（对应源组件 plateMetricGroupList 中的单组数据） */
interface MetricGroup {
  metricGroupName: string;
  metricGroupUnit: string;
  plateMetricList: MetricItem[];
}

/** mock 指标分组数据（对应源组件 plateMetricGroupList.slice(0, 4)） */
const mockMetricGroupList: MetricGroup[] = [
  {
    metricGroupName: '元素组一',
    metricGroupUnit: '单位',
    plateMetricList: [
      { metricName: '元素一', metricValue: 120, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 200, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 150, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 80, metricUnit: '单位' },
      { metricName: '元素五', metricValue: 70, metricUnit: '单位' },
      { metricName: '元素六', metricValue: 110, metricUnit: '单位' },
    ],
  },
  {
    metricGroupName: '元素组二',
    metricGroupUnit: '单位',
    plateMetricList: [
      { metricName: '元素一', metricValue: 90, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 130, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 110, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 160, metricUnit: '单位' },
      { metricName: '元素五', metricValue: 140, metricUnit: '单位' },
      { metricName: '元素六', metricValue: 100, metricUnit: '单位' },
    ],
  },
  {
    metricGroupName: '元素组三',
    metricGroupUnit: '单位',
    plateMetricList: [
      { metricName: '元素一', metricValue: 60, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 90, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 120, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 100, metricUnit: '单位' },
      { metricName: '元素五', metricValue: 80, metricUnit: '单位' },
      { metricName: '元素六', metricValue: 70, metricUnit: '单位' },
    ],
  },
  {
    metricGroupName: '元素组四',
    metricGroupUnit: '单位',
    plateMetricList: [
      { metricName: '元素一', metricValue: 140, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 110, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 90, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 120, metricUnit: '单位' },
      { metricName: '元素五', metricValue: 150, metricUnit: '单位' },
      { metricName: '元素六', metricValue: 130, metricUnit: '单位' },
    ],
  },
];

/** echarts 渲染所需颜色（从 CSS 变量读取） */
interface LineAreaColors {
  tooltipBg: string;
  tooltipText: string;
  titleText: string;
  legendText: string;
  gridBorder: string;
  axisText: string;
  axisSecondary: string;
  axisLine: string;
  axisLineDark: string;
  splitLine: string;
  line1: string;
  line1From: string;
  line1To: string;
  line2: string;
  line2From: string;
  line2To: string;
  line3: string;
  line3From: string;
  line3To: string;
  line4: string;
  line4From: string;
  line4To: string;
}

/** 从根元素读取 CSS 颜色变量，读取失败时回退到默认色 */
function readLineAreaColors(el: HTMLElement): LineAreaColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    tooltipBg: read('--la-tooltip-bg', '#042940'),
    tooltipText: read('--la-tooltip-text', '#9ed2d8'),
    titleText: read('--la-title-text', '#6dc1cb'),
    legendText: read('--la-legend-text', 'rgba(255, 255, 255, 0.5)'),
    gridBorder: read('--la-grid-border', '#072d4a'),
    axisText: read('--la-axis-text', 'rgba(255, 255, 255, 0.5)'),
    axisSecondary: read('--la-axis-secondary', '#7b8f9d'),
    axisLine: read('--la-axis-line', 'rgba(109, 193, 203, 0.2)'),
    axisLineDark: read('--la-axis-line-dark', '#0d394a'),
    splitLine: read('--la-split-line', 'rgba(109, 193, 203, 0.2)'),
    line1: read('--la-line1', '#00f6ff'),
    line1From: read('--la-line1-from', 'rgba(0, 246, 255, 0.4)'),
    line1To: read('--la-line1-to', 'rgba(0, 246, 255, 0)'),
    line2: read('--la-line2', '#f5b03d'),
    line2From: read('--la-line2-from', 'rgba(245, 176, 61, 0.4)'),
    line2To: read('--la-line2-to', 'rgba(245, 176, 61, 0)'),
    line3: read('--la-line3', '#62c37c'),
    line3From: read('--la-line3-from', 'rgba(98, 195, 124, 0.4)'),
    line3To: read('--la-line3-to', 'rgba(98, 195, 124, 0)'),
    line4: read('--la-line4', '#911eec'),
    line4From: read('--la-line4-from', 'rgba(145, 30, 236, 0.4)'),
    line4To: read('--la-line4-to', 'rgba(145, 30, 236, 0)'),
  };
}

/** 基础配置（对应源组件 lineOption） */
function buildBaseOption(colors: LineAreaColors): echarts.EChartsOption {
  return {
    title: {
      show: false,
      text: '暂无数据',
      textStyle: { fontSize: 16, color: colors.titleText },
      left: 'center',
      top: 'center',
    },
    legend: {
      show: true,
      width: '80%',
      top: 6,
      right: 10,
      textStyle: {
        fontSize: 12,
        lineHeight: 12,
        padding: [0, 0, -5, 0],
        color: colors.legendText,
        fontWeight: 800,
        fontFamily: 'Microsoft YaHei',
      },
      itemStyle: {},
      icon: 'circle',
      itemHeight: 6,
      itemWidth: 10,
    },
    grid: {
      show: true,
      borderColor: colors.gridBorder,
      top: 38,
      right: 30,
      bottom: 35,
      left: 60,
    },
    tooltip: {
      show: true,
      trigger: 'axis',
      backgroundColor: colors.tooltipBg,
      padding: [13, 14, 13, 11],
      textStyle: { fontSize: 12, color: colors.tooltipText },
      formatter: (params: any) => {
        let relVal = params[0].name;
        for (let i = 0, l = params.length; i < l; i++) {
          const value = params[i].data.isHas ? params[i].value : '--';
          relVal =
            relVal +
            '<br/>' +
            params[i].seriesName +
            '：' +
            value +
            params[i].data.unit;
        }
        return relVal;
      },
    },
    xAxis: {
      data: [],
      boundaryGap: false,
      axisLabel: {
        padding: [5, 5, 0, 0],
        hideOverlap: true,
        interval: 0,
        inside: false,
        color: colors.axisText,
        fontWeight: 800,
        fontFamily: 'Microsoft YaHei',
        align: 'center',
      },
      axisTick: { show: false },
      axisLine: { show: true, lineStyle: { color: colors.axisLine } },
      z: 10,
    },
    yAxis: {},
    series: [],
  };
}

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

/** 初始化图表 */
function initChart() {
  if (!chartRef.value) return;
  const colors = readLineAreaColors(chartRef.value);
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(buildBaseOption(colors));
  refreshChart(colors);
}

/** 用 mock 指标分组数据刷新图表（对应源组件 refreshChart） */
function refreshChart(colors: LineAreaColors) {
  if (!chartInstance) return;

  const groupList = mockMetricGroupList.slice(0, 4);
  const groupOneInfo = groupList[0]?.plateMetricList ?? [];
  const xAxisDate = groupOneInfo.map((item) => item.metricName);
  const unit = groupList[0]?.metricGroupUnit;

  const lineColors = [
    { line: colors.line1, from: colors.line1From, to: colors.line1To },
    { line: colors.line2, from: colors.line2From, to: colors.line2To },
    { line: colors.line3, from: colors.line3From, to: colors.line3To },
    { line: colors.line4, from: colors.line4From, to: colors.line4To },
  ];

  const list = groupList.map((item, index) => {
    const c = lineColors[index];
    return {
      name: item.metricGroupName,
      data: item.plateMetricList.map((t) => ({
        unit: t.metricUnit || '',
        isHas: Boolean(t.metricValue),
        value: t.metricValue || 0,
      })),
      itemStyle: { borderColor: c.line },
      symbol: 'circle',
      symbolSize: 2,
      color: c.line,
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: c.from },
            { offset: 1, color: c.to },
          ],
          global: false,
        },
      },
      lineStyle: { color: c.line },
    };
  });

  chartInstance.setOption({
    xAxis: {
      data: xAxisDate,
      show: groupOneInfo.length > 0,
      axisLabel: {
        color: colors.axisSecondary,
        align: 'center',
        interval: xAxisDate.length > 12 ? 2 : 0,
      },
    },
    title: {
      show: groupOneInfo.length === 0,
      text: '暂无数据',
    },
    yAxis: {
      show: groupOneInfo.length > 0,
      name: unit ? `单位：${unit}` : '',
      nameTextStyle: {
        fontSize: 12,
        color: colors.axisText,
        fontWeight: 800,
        fontFamily: 'Microsoft YaHei',
        padding: [3, 0, 0, 4],
      },
      axisLine: { show: false, lineStyle: { color: colors.axisLineDark } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: colors.splitLine } },
      axisLabel: {
        color: colors.legendText,
        fontWeight: 800,
        fontFamily: 'Microsoft YaHei',
      },
    },
    legend: { show: groupOneInfo.length > 0 },
    series: list,
  });
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
.line-area {
  --la-tooltip-bg: #042940;
  --la-tooltip-text: #9ed2d8;
  --la-title-text: #6dc1cb;
  --la-legend-text: rgba(255, 255, 255, 0.5);
  --la-grid-border: #072d4a;
  --la-axis-text: rgba(255, 255, 255, 0.5);
  --la-axis-secondary: #7b8f9d;
  --la-axis-line: rgba(109, 193, 203, 0.2);
  --la-axis-line-dark: #0d394a;
  --la-split-line: rgba(109, 193, 203, 0.2);
  --la-line1: #00f6ff;
  --la-line1-from: rgba(0, 246, 255, 0.4);
  --la-line1-to: rgba(0, 246, 255, 0);
  --la-line2: #f5b03d;
  --la-line2-from: rgba(245, 176, 61, 0.4);
  --la-line2-to: rgba(245, 176, 61, 0);
  --la-line3: #62c37c;
  --la-line3-from: rgba(98, 195, 124, 0.4);
  --la-line3-to: rgba(98, 195, 124, 0);
  --la-line4: #911eec;
  --la-line4-from: rgba(145, 30, 236, 0.4);
  --la-line4-to: rgba(145, 30, 236, 0);

  width: 100%;

  &__chart {
    width: 100%;
    height: 320px;
  }
}
</style>
