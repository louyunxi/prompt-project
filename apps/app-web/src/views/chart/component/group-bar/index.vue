<!--
  组件名称：GroupBar（分组渐变柱状图）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB118.vue

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .group-bar 上，echarts 运行时读取同名变量）：
    --grp-tooltip-bg     #043250                提示框背景色
    --grp-tooltip-text   #9ed2d8                提示框文字色
    --grp-axis-text      #9dd1d7                坐标轴文字色
    --grp-split-line     rgba(50,206,187,0.15)  数值轴分割线色
    --grp-bar1-from      #3a83f2                第一组渐变柱起始色
    --grp-bar1-to        #4adeff                第一组渐变柱结束色
    --grp-bar2-from      #f29d3a                第二组渐变柱起始色
    --grp-bar2-to        #ffed4a                第二组渐变柱结束色
    --grp-bar3-from      #22cc8f                第三组渐变柱起始色
    --grp-bar3-to        #6cfbc7                第三组渐变柱结束色
    --grp-bar4-from      #911eec                第四组渐变柱起始色
    --grp-bar4-to        #b57aff                第四组渐变柱结束色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex（mapGetters）、$echarts 全局注入、
       plateVO 接口数据，本组件已全部去除，改为 mock 数据 + 组件内自包含渲染。
    2. 原依赖函数 debounce、truncateTo8Bytes 已拷贝进本组件（见下方定义）。
    3. 图表配置（tooltip / legend / grid / 分组渐变柱 / dataZoom）与源组件保持一致。
    4. 该图表无图片物料，无需 assets 资源目录。
-->
<template>
  <div class="group-bar">
    <div ref="chartRef" class="group-bar__chart"></div>
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

/** 截取字符串中的前八个字节（拷贝自源组件 truncateTo8Bytes） */
function truncateTo8Bytes(originalString: string): string {
  let truncatedString = '';
  let byteCount = 0;
  for (let i = 0; i < originalString.length; i++) {
    const currentChar = originalString[i];
    const currentCharLength = currentChar.charCodeAt(0) > 255 ? 2 : 1;
    if (byteCount + currentCharLength <= 8) {
      truncatedString += currentChar;
      byteCount += currentCharLength;
    } else {
      break;
    }
  }
  return truncatedString;
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

/** mock 指标分组数据（对应源组件 plateMetricGroupList.filter(...).slice(0, 4)） */
const mockMetricGroupList: MetricGroup[] = [
  {
    metricGroupName: '元素组一',
    metricGroupUnit: '单位',
    plateMetricList: [
      { metricName: '元素一', metricValue: 213.5, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 11.9, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 24.1, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 152.8, metricUnit: '单位' },
    ],
  },
  {
    metricGroupName: '元素组二',
    metricGroupUnit: '单位',
    plateMetricList: [
      { metricName: '元素一', metricValue: 88.2, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 45.6, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 67.3, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 21.4, metricUnit: '单位' },
    ],
  },
  {
    metricGroupName: '元素组三',
    metricGroupUnit: '单位',
    plateMetricList: [
      { metricName: '元素一', metricValue: 140.1, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 73.9, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 35.7, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 96.2, metricUnit: '单位' },
    ],
  },
  {
    metricGroupName: '元素组四',
    metricGroupUnit: '单位',
    plateMetricList: [
      { metricName: '元素一', metricValue: 55.8, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 128.4, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 19.2, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 74.6, metricUnit: '单位' },
    ],
  },
];

/** echarts 渲染所需颜色（从 CSS 变量读取） */
interface GroupBarColors {
  tooltipBg: string;
  tooltipText: string;
  axisText: string;
  splitLine: string;
  bar1From: string;
  bar1To: string;
  bar2From: string;
  bar2To: string;
  bar3From: string;
  bar3To: string;
  bar4From: string;
  bar4To: string;
}

/** 从根元素读取 CSS 颜色变量，读取失败时回退到默认色 */
function readGroupBarColors(el: HTMLElement): GroupBarColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    tooltipBg: read('--grp-tooltip-bg', '#043250'),
    tooltipText: read('--grp-tooltip-text', '#9ed2d8'),
    axisText: read('--grp-axis-text', '#9dd1d7'),
    splitLine: read('--grp-split-line', 'rgba(50, 206, 187, 0.15)'),
    bar1From: read('--grp-bar1-from', '#3a83f2'),
    bar1To: read('--grp-bar1-to', '#4adeff'),
    bar2From: read('--grp-bar2-from', '#f29d3a'),
    bar2To: read('--grp-bar2-to', '#ffed4a'),
    bar3From: read('--grp-bar3-from', '#22cc8f'),
    bar3To: read('--grp-bar3-to', '#6cfbc7'),
    bar4From: read('--grp-bar4-from', '#911eec'),
    bar4To: read('--grp-bar4-to', '#b57aff'),
  };
}

/** 基础配置（对应源组件 barOption） */
function buildBaseOption(colors: GroupBarColors): echarts.EChartsOption {
  return {
    tooltip: {
      show: true,
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'none' },
      backgroundColor: colors.tooltipBg,
      position: 'top',
      padding: [13, 14, 13, 11],
      textStyle: { fontSize: 12, color: colors.tooltipText },
      formatter: (params: any) => {
        let str = `${params[0]?.name}<br/>`;
        params.forEach((ele: any) => {
          str += `${ele.data.title ? ele.data.title + '：' : ''}${
            ele.value || ''
          }${ele.data.unit || ''}<br/>`;
        });
        return str;
      },
    },
    legend: {
      show: true,
      type: 'plain',
      icon: 'circle',
      itemWidth: 6,
      left: 'center',
      padding: [18, 0, 0, 0],
      height: 20,
      textStyle: { color: colors.axisText },
    },
    grid: { top: 50, right: 30, bottom: 35, left: 60 },
    xAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLabel: {
        padding: [5, 5, 0, 0],
        hideOverlap: true,
        interval: 0,
        inside: false,
        color: colors.axisText,
        formatter: (params: string) => params.slice(0, 8),
      },
      axisLine: { show: false },
    },
    yAxis: {
      splitNumber: 3,
      nameTextStyle: { align: 'right', color: colors.axisText },
      nameGap: 20,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: colors.splitLine } },
      axisLabel: { color: colors.axisText },
    },
    series: [],
  };
}

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

/** 初始化图表 */
function initChart() {
  if (!chartRef.value) return;
  const colors = readGroupBarColors(chartRef.value);
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(buildBaseOption(colors));
  refreshChart(colors);
}

/** 用 mock 指标分组数据刷新图表（对应源组件 refreshChart） */
function refreshChart(colors: GroupBarColors) {
  if (!chartInstance) return;

  const groupList = mockMetricGroupList
    .filter((ele) => ele.plateMetricList && ele.plateMetricList.length)
    .slice(0, 4);

  const maxLength = groupList[0]?.plateMetricList?.length || 0;

  const gradients = [
    [colors.bar1From, colors.bar1To],
    [colors.bar2From, colors.bar2To],
    [colors.bar3From, colors.bar3To],
    [colors.bar4From, colors.bar4To],
  ];

  const chartOpts: echarts.EChartsOption = {
    xAxis: [
      {
        data: groupList[0]?.plateMetricList.map((item) =>
          truncateTo8Bytes(item.metricName),
        ),
        axisLabel: {
          margin: maxLength > 6 ? 6 : 12,
          rotate: maxLength > 6 ? 45 : 0,
        },
      },
    ],
    yAxis: [
      {
        name: groupList[0]?.metricGroupUnit
          ? `单位：${groupList[0].metricGroupUnit}`
          : '',
      },
    ],
    grid: {
      bottom: maxLength > 12 ? 60 : maxLength > 6 ? 50 : 35,
    },
    series: groupList.map((ele, index) => ({
      barMinHeight: 3,
      barWidth: '20%',
      type: 'bar',
      barGap: 0.2,
      name: ele.metricGroupName,
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: gradients[index][0] || '#3D82E4' },
          { offset: 1, color: gradients[index][1] || '#00F6FF' },
        ],
      },
      data: ele.plateMetricList.map((item) => ({
        title: ele.metricGroupName || '',
        value: item.metricValue || 0,
        unit: item.metricUnit || '',
        name: item.metricName || '',
      })),
    })),
    dataZoom: maxLength > 12
      ? {
          show: true,
          type: 'slider',
          showDetail: false,
          moveHandleSize: 0,
          height: 8,
          start: 0,
          end: (12 / maxLength) * 100,
          xAxisIndex: [0],
          zoomLock: true,
          bottom: 5,
        }
      : { show: false },
  };
  chartInstance.setOption(chartOpts);
  chartInstance.resize();
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
.group-bar {
  --grp-tooltip-bg: #043250;
  --grp-tooltip-text: #9ed2d8;
  --grp-axis-text: #9dd1d7;
  --grp-split-line: rgba(50, 206, 187, 0.15);
  --grp-bar1-from: #3a83f2;
  --grp-bar1-to: #4adeff;
  --grp-bar2-from: #f29d3a;
  --grp-bar2-to: #ffed4a;
  --grp-bar3-from: #22cc8f;
  --grp-bar3-to: #6cfbc7;
  --grp-bar4-from: #911eec;
  --grp-bar4-to: #b57aff;

  width: 100%;

  &__chart {
    width: 100%;
    height: 320px;
  }
}
</style>
