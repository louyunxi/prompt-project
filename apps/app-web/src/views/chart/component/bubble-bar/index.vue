<!--
  组件名称：BubbleBar（气泡象形柱状图）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB103.vue

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .bubble-bar 上，echarts 运行时读取同名变量）：
    --bb-tooltip-bg      rgba(3, 21, 32, 0.72)     提示框背景色
    --bb-tooltip-text    #9ED2D8                   提示框文字色
    --bb-axis-text       #9DD1D7                   分类轴/数值轴文字色
    --bb-yaxis-name      #6DC1CB                   y 轴单位名称文字色
    --bb-label-text      #00f6ff                   柱顶数值文字色
    --bb-legend-text     rgba(225, 255, 255, 0.5)  图例文字色
    --bb-split-line      rgba(50, 206, 187, 0.15)  y 轴分隔线色
    --bb-bar-1           #4379DC                   第 1 根气泡柱色
    --bb-bar-2           #FC715F                   第 2 根气泡柱色
    --bb-bar-3           #25C8FD                   第 3 根气泡柱色
    --bb-bar-4           #25C8FD                   第 4 根气泡柱色
    --bb-bar-5           #25F8B0                   第 5 根气泡柱色
    --bb-bar-6           #E3964A                   第 6 根气泡柱色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex（mapGetters）、$echarts 全局注入、plateVO 接口
       数据，本组件已全部去除，改为 mock 数据（「类别一」~「类别六」，单位「单位」）。
    2. 子组件 echartsBar.vue 的 stackBarOption 基础配置 + setOption + _initEcharts 逻辑
       全部内联到本组件；工具函数 debounce 也已内联。
    3. 适配 echarts 5：itemStyle.normal 提为 itemStyle 直接属性，axisLabel/label 的
       textStyle 改为直接属性（color/fontSize/align）。
    4. 图表配置（pictorialBar 气泡 symbol、barWidth 25、barMinHeight 10、6 色数组按
       dataIndex 着色、label 顶部 #00f6ff 16px、tooltip、grid、yAxis 等）与源组件一致。
    5. 该图表无图片物料，无需 assets 资源目录。
-->
<template>
  <div class="bubble-bar">
    <div ref="chartRef" class="bubble-bar__chart"></div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
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

/** 图表数据项（对应源组件 plateMetricList 中的单条数据） */
interface BubbleItem {
  name: string;
  value: number;
  unit: string;
}

/** mock 数据（对应源组件 plateMetricGroupList[0].plateMetricList.slice(0, 6)） */
const mockData: BubbleItem[] = [
  { name: '类别一', value: 128, unit: '单位' },
  { name: '类别二', value: 86, unit: '单位' },
  { name: '类别三', value: 213, unit: '单位' },
  { name: '类别四', value: 152, unit: '单位' },
  { name: '类别五', value: 96, unit: '单位' },
  { name: '类别六', value: 240, unit: '单位' },
];

/** echarts 渲染所需颜色（从 CSS 变量读取） */
interface BubbleColors {
  tooltipBg: string;
  tooltipText: string;
  axisText: string;
  yAxisName: string;
  labelText: string;
  legendText: string;
  splitLine: string;
  barColors: string[];
}

/** 气泡柱 6 色变量名与回退色（按 dataIndex 依次着色） */
const BAR_COLOR_VARS = [
  '--bb-bar-1',
  '--bb-bar-2',
  '--bb-bar-3',
  '--bb-bar-4',
  '--bb-bar-5',
  '--bb-bar-6',
];
const BAR_COLOR_FALLBACKS = [
  '#4379DC',
  '#FC715F',
  '#25C8FD',
  '#25C8FD',
  '#25F8B0',
  '#E3964A',
];

/** 从根元素读取 CSS 颜色变量，读取失败时回退到默认色 */
function readBarColors(el: HTMLElement): BubbleColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    tooltipBg: read('--bb-tooltip-bg', 'rgba(3, 21, 32, 0.72)'),
    tooltipText: read('--bb-tooltip-text', '#9ED2D8'),
    axisText: read('--bb-axis-text', '#9DD1D7'),
    yAxisName: read('--bb-yaxis-name', '#6DC1CB'),
    labelText: read('--bb-label-text', '#00f6ff'),
    legendText: read('--bb-legend-text', 'rgba(225, 255, 255, 0.5)'),
    splitLine: read('--bb-split-line', 'rgba(50, 206, 187, 0.15)'),
    barColors: BAR_COLOR_VARS.map((name, index) =>
      read(name, BAR_COLOR_FALLBACKS[index]),
    ),
  };
}

/** 基础配置（stackBarOption 与源组件 barConsumerGoodsData 深合并结果，适配 echarts 5） */
function buildBaseOption(colors: BubbleColors): echarts.EChartsOption {
  return {
    tooltip: {
      show: true,
      trigger: 'axis',
      axisPointer: {
        type: 'none',
      },
      backgroundColor: colors.tooltipBg,
      position: 'top',
      padding: [13, 14, 13, 11],
      textStyle: {
        fontSize: 12,
        color: colors.tooltipText,
      },
      formatter: (params: any) => {
        const first = (Array.isArray(params) ? params[0] : params) || {};
        const unit = first.data?.unit || '';
        return `${first.name || ''} : ${first.value ? first.value : 0}${unit}`;
      },
    },
    legend: {
      icon: 'circle',
      itemWidth: 6,
      right: 10,
      textStyle: {
        color: colors.legendText,
      },
    },
    grid: {
      top: '20%',
      left: '12%',
      bottom: '15%',
      height: '55%',
    },
    xAxis: {
      type: 'category',
      axisTick: {
        show: false,
      },
      axisLabel: {
        margin: 12,
        rotate: 0,
        color: colors.axisText,
        fontSize: 12,
        align: 'center',
      },
      axisLine: {
        show: false,
      },
      data: [],
    },
    yAxis: {
      splitNumber: 3,
      name: '单位：单位',
      nameTextStyle: {
        align: 'right',
        color: colors.yAxisName,
        fontSize: 12,
        padding: [0, 0, 0, 0],
      },
      nameGap: 20,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: colors.splitLine,
        },
      },
      axisLabel: {
        margin: 12,
        color: colors.axisText,
        fontSize: 12,
      },
    },
    dataZoom: [{ show: false }],
    series: [
      {
        type: 'pictorialBar',
        barCategoryGap: '5%',
        symbol: 'path://M0,15 L10,15 C6,15 6,5 5,0 C4.5,5 4.5,15 0,15 z',
        barWidth: 25,
        barMinHeight: 10,
        itemStyle: {
          // 每个柱子的颜色即为 barColors 数组里的每一项（按 dataIndex 着色）
          // color 支持回调，但 EChartsOption 的 itemStyle.color 类型为 ZRColor（非函数），故整体断言为 any
          color: ((params: any) =>
            colors.barColors[params.dataIndex] || colors.barColors[0]) as any,
        },
        label: {
          show: true,
          position: 'top',
          color: colors.labelText,
          fontSize: 16,
        },
        data: [],
      },
    ],
  };
}

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

/** 初始化图表（对应源组件 _initEcharts：init + setOption 基础配置） */
function initChart() {
  if (!chartRef.value) return;
  const colors = readBarColors(chartRef.value);
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(buildBaseOption(colors));
  refreshChart();
}

/** 用 mock 数据刷新图表（对应源组件 drawBar 的 setOption 数据部分） */
function refreshChart() {
  if (!chartInstance) return;

  const chartOpts: echarts.EChartsOption = {
    xAxis: {
      data: mockData.map((item) => item.name),
    },
    series: [
      {
        data: mockData.map((item) => ({
          value: item.value,
          unit: item.unit,
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
.bubble-bar {
  --bb-tooltip-bg: rgba(3, 21, 32, 0.72);
  --bb-tooltip-text: #9ed2d8;
  --bb-axis-text: #9dd1d7;
  --bb-yaxis-name: #6dc1cb;
  --bb-label-text: #00f6ff;
  --bb-legend-text: rgba(225, 255, 255, 0.5);
  --bb-split-line: rgba(50, 206, 187, 0.15);
  --bb-bar-1: #4379dc;
  --bb-bar-2: #fc715f;
  --bb-bar-3: #25c8fd;
  --bb-bar-4: #25c8fd;
  --bb-bar-5: #25f8b0;
  --bb-bar-6: #e3964a;

  width: 100%;

  &__chart {
    width: 100%;
    height: 320px;
  }

  // ≤1280px：小屏笔记本，图表容器略收矮
  @media (max-width: 1280px) {
    &__chart {
      height: 300px;
    }
  }

  // ≥1920px：大屏显示器，图表容器略加高
  @media (min-width: 1920px) {
    &__chart {
      height: 340px;
    }
  }
}
</style>
