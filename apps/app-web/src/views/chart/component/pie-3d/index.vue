<!--
  组件名称：Pie3D（3D 立体饼图）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB104.vue
  源子组件：D:\sn-project\frp_gov_web\src\components\echarts\Pie3D01.vue
  源工具函数：D:\sn-project\frp_gov_web\src\utils\chart.js

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - echarts-gl ^2.0.9（3D surface 渲染，import 顺序：先 echarts 再 echarts-gl）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .pie-3d 上，echarts 运行时读取同名变量）：
    --p3d-title-color   #9dd1d7   标题文字色（描述区 label）
    --p3d-value-color   #efde46   数值文字色（描述区 totalCount）
    --p3d-unit-color    #efde46   单位文字色（描述区 unit）
    --p3d-tooltip-bg    #043250   提示框背景色
    --p3d-tooltip-text  #9ed2d8   提示框文字色
    --p3d-label-name    #9dd1d7   饼图标签名称色（rich b）
    --p3d-label-value   #00f6ff   饼图标签数值色（rich c/d）

  10 色调色板（JS 常量 PIE_COLORS，保留源组件数组，按索引取色）：
    #3ce1a3  #31abe4  #ccc166  #646cc8  #c97f63
    #7a5fa8  #85c963  #d25e9d  #997a0e  #2732b2

  迁移说明：
    1. 去除外部依赖：GSPlate 面板容器、vuex、$echarts 全局注入、plateVO 接口数据，
       改为组件内自包含渲染 + 通用 mock 数据（元素一~元素六 / 单位）。
    2. 内联依赖函数：Pie3D01.vue（optionDataExpand）与 utils/chart.js
       （getPie3D / getParametricEquation / getHeight3D / formatFloat）全部拷贝进本组件。
    3. 配置与源组件一致：grid3D viewControl（alpha 28 / distance 240 / 旋转缩放平移关闭）、
       center ["10%","50%"]、labelSeries 透明标签层（opacity 0、radius ["10%","40%"]、
       startAngle -20、clockwise false）、click/mouseover/globalout 交互
       （选中位移 offsetX/Y 0.1、hover 放大 1.05）；
       tooltip formatter 内联源 BKMB104 的覆盖逻辑（${seriesName}：${pieData.value + pieData.unit}）。
    4. 适配修复：a) 源 click 事件中 getParametricEquation 第 6 参误用 selectedIndex
       （首次点击会因 option.series[''] 为 undefined 抛错），改为当前 seriesIndex 对应数据；
       b) click 增加与 tooltip/mouseover 一致的 labelSeries 等系列守卫，避免点击标签层崩溃；
       c) label.normal 扁平化为 label（echarts 5 已废弃 normal 写法）。
    5. 图片物料：chart-pie-3d-base-bg.png（拷贝自源 chart-pie-3d-01-base-bg.png）
       放入本组件 assets/，作为背景铺满图表区域（.pie-3d__bg 子元素装饰，pointer-events 穿透）。
-->
<template>
  <div class="pie-3d">
    <div class="pie-3d__bg"></div>
    <div class="pie-3d__des">
      <p class="pie-3d__des-label">{{ title }}</p>
      <p class="pie-3d__des-value">{{ totalCount }}</p>
      <p class="pie-3d__des-unit">{{ unit }}</p>
    </div>
    <div ref="chartRef" class="pie-3d__chart"></div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import * as echarts from 'echarts';
// 仅副作用引入（注册 3D 系列），echarts-gl 无官方 TS 类型声明、也不暴露具名导出，
// 故不做类型声明，直接以副作用 import 方式引入（side-effect import 无需类型即通过检查）
import 'echarts-gl';

/** 10 色调色板（保留源组件 JS 常量数组，颜色表见头部注释） */
const PIE_COLORS = [
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

/** 饼图数据项（对应源组件 plateMetricList 单条数据展开后的结构） */
interface PieDataItem {
  name: string;
  value: number;
  unit: string;
  itemStyle?: { color: string; opacity?: number };
  label?: Record<string, any>;
  labelLine?: Record<string, any>;
  startRatio?: number;
  endRatio?: number;
}

/** 扇形选中 / 高亮状态（对应源组件 pieStatus） */
interface PieStatus {
  selected: boolean;
  hovered: boolean;
  k: number;
}

/** 扇形曲面参数方程（x/y/z 为函数，供 series-surface.parametricEquation 使用） */
interface ParametricEquation {
  u: { min: number; max: number; step: number };
  v: { min: number; max: number; step: number };
  x: (u: number, v: number) => number;
  y: (u: number, v: number) => number;
  z: (u: number, v: number) => number;
}

/** 3D 曲面系列（series-surface，echarts-gl 渲染） */
interface SurfaceSeries {
  name: string;
  type: string;
  parametric: boolean;
  wireframe: { show: boolean };
  pieData: PieDataItem;
  pieStatus: PieStatus;
  itemStyle?: Record<string, any>;
  parametricEquation?: ParametricEquation;
}

/** echarts 渲染所需颜色（从 CSS 变量读取） */
interface PieColors {
  tooltipBg: string;
  tooltipText: string;
  labelName: string;
  labelValue: string;
}

/** mock 饼图数据（通用命名，对应源组件 plateVO 中的指标列表） */
const mockPieData: PieDataItem[] = [
  { name: '元素一', value: 213, unit: '单位' },
  { name: '元素二', value: 11, unit: '单位' },
  { name: '元素三', value: 24, unit: '单位' },
  { name: '元素四', value: 152, unit: '单位' },
  { name: '元素五', value: 86.3, unit: '单位' },
  { name: '元素六', value: 128, unit: '单位' },
];

/** 顶部描述区：标题（通用文案，对应源组件 metricGroupName） */
const title = '总量统计';
/** 顶部描述区：数值（mock 数据合计，对应源组件 metricGroupValue） */
const totalCount = mockPieData.reduce((sum, item) => sum + item.value, 0);
/** 顶部描述区：单位（通用文案，对应源组件 metricGroupUnit） */
const unit = '单位';

/** 从根元素读取 CSS 颜色变量，读取失败时回退到默认色 */
function readPieColors(el: HTMLElement): PieColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    tooltipBg: read('--p3d-tooltip-bg', '#043250'),
    tooltipText: read('--p3d-tooltip-text', '#9ed2d8'),
    labelName: read('--p3d-label-name', '#9dd1d7'),
    labelValue: read('--p3d-label-value', '#00f6ff'),
  };
}

/**
 * 数据展开：为每个数据项补充调色板颜色、标签与引线样式
 * （对应源子组件 Pie3D01 的 optionDataExpand）
 */
function optionDataExpand(
  optionData: PieDataItem[],
  colors: PieColors,
): PieDataItem[] {
  return optionData.map((data, index) => ({
    itemStyle: {
      color: PIE_COLORS[index % PIE_COLORS.length],
    },
    label: {
      show: true,
      color: PIE_COLORS[index % PIE_COLORS.length],
      formatter: '{b|{b}}',
      rich: {
        b: {
          color: colors.labelName,
          fontSize: 14,
          lineHeight: 25,
          align: 'left',
        },
        c: {
          color: colors.labelValue,
          fontSize: 16,
          lineHeight: 25,
          align: 'left',
        },
        d: {
          color: colors.labelValue,
          fontSize: 12,
          lineHeight: 25,
          align: 'left',
        },
      },
    },
    labelLine: {
      lineStyle: { width: 1, color: 'rgba(255,255,255,1)' },
    },
    ...data,
  }));
}

/**
 * 绘制 3D 饼图（拷贝自源项目 @/utils/chart.js）
 * @param pieData 总数据
 * @param internalDiameterRatio 透明的空心占比
 * @param distance 视角到主体的距离
 * @param alpha 旋转角度
 * @param pieHeight 立体的高度
 * @param opacity 饼或者环的透明度
 */
function getPie3D(
  pieData: PieDataItem[],
  internalDiameterRatio: number,
  distance: number,
  alpha: number,
  pieHeight: number,
  opacity = 1,
  colors: PieColors,
): Record<string, any> {
  const series: SurfaceSeries[] = [];
  let sumValue = 0;
  let startValue = 0;
  let endValue = 0;
  let legendData: { name: string; value: string | false }[] = [];
  let legendBfb: { name: string; value: string | false }[] = [];
  const k = 1 - internalDiameterRatio;

  // 为每一个饼图数据，生成一个 series-surface 配置
  pieData.sort((a, b) => b.value - a.value);
  for (let i = 0; i < pieData.length; i++) {
    const item = pieData[i];
    sumValue += item.value;
    const seriesItem: SurfaceSeries = {
      name: typeof item.name === 'undefined' ? `series${i}` : item.name,
      type: 'surface',
      parametric: true,
      wireframe: { show: false },
      pieData: item,
      pieStatus: { selected: false, hovered: false, k },
    };
    if (typeof item.itemStyle !== 'undefined') {
      const itemStyle: Record<string, any> = {};
      itemStyle.color =
        typeof item.itemStyle.color !== 'undefined'
          ? item.itemStyle.color
          : opacity;
      itemStyle.opacity =
        typeof item.itemStyle.opacity !== 'undefined'
          ? item.itemStyle.opacity
          : opacity;
      seriesItem.itemStyle = itemStyle;
    }
    series.push(seriesItem);
  }

  // 计算每个扇形的起止比例，并生成对应的参数方程
  legendData = [];
  legendBfb = [];
  for (let i = 0; i < series.length; i++) {
    endValue = startValue + series[i].pieData.value;
    series[i].pieData.startRatio = startValue / sumValue;
    series[i].pieData.endRatio = endValue / sumValue;
    series[i].parametricEquation = getParametricEquation(
      // startRatio/endRatio 已在上方循环内赋值，用非空断言消除可空联合类型
      series[i].pieData.startRatio!,
      series[i].pieData.endRatio!,
      false,
      false,
      k,
      series[i].pieData.value,
    );
    startValue = endValue;
    const bfb = formatFloat(series[i].pieData.value / sumValue, 4);
    legendData.push({ name: series[i].name, value: bfb });
    legendBfb.push({ name: series[i].name, value: bfb });
  }

  const boxHeight = getHeight3D(series, pieHeight); // 通过 pieHeight 设定 3D 饼/环的高度
  // 准备待返回的配置项，把准备好的 legendData、series 传入
  const option: Record<string, any> = {
    legend: {
      show: false,
      data: legendData,
      orient: 'vertical',
      left: 10,
      top: 10,
      itemGap: 10,
      textStyle: { color: '#a1e2ff' },
      icon: 'circle',
      formatter: (param: string) => {
        const item = legendBfb.filter((it) => it.name === param)[0];
        const bfs = formatFloat(Number(item.value) * 100, 2) + '%';
        return `${item.name}  ${bfs}`;
      },
    },
    labelLine: {
      show: true,
      lineStyle: { color: '#fff' },
    },
    label: {
      show: true,
      position: 'outside',
      formatter: '{b} \n{c} {d}%',
    },
    tooltip: {
      backgroundColor: colors.tooltipBg,
      padding: [13, 14, 13, 11],
      textStyle: {
        fontSize: 12,
        color: colors.tooltipText,
      },
      // 内联源 BKMB104 对 tooltip.formatter 的覆盖逻辑
      formatter: (params: any) => {
        if (
          params.seriesName !== 'mouseoutSeries' &&
          params.seriesName !== 'pie2d' &&
          params.seriesName !== 'labelSeries'
        ) {
          const pieData = option.series[params.seriesIndex].pieData;
          return `${params.seriesName}：${pieData.value + pieData.unit}`;
        }
        return '';
      },
    },
    xAxis3D: { min: -1, max: 1 },
    yAxis3D: { min: -1, max: 1 },
    zAxis3D: { min: -1, max: 1 },
    grid3D: {
      show: false,
      left: 'center',
      // 俯视投影（alpha 28）会让主体视觉重心偏下，top 上移使其与容器中心、
      // labelSeries 标签层圆心（50%,50%）对齐
      top: '10%',
      width: '60%',
      height: '60%',
      boxHeight, // 圆环的高度
      viewControl: {
        alpha, // 角度
        distance, // 调整视角到主体的距离，类似调整 zoom
        rotateSensitivity: 0, // 设置为 0 无法旋转
        zoomSensitivity: 0, // 设置为 0 无法缩放
        panSensitivity: 0, // 设置为 0 无法平移
        autoRotate: false, // 自动旋转
      },
    },
    series,
  };
  return option;
}

/**
 * 生成扇形的曲面参数方程，用于 series-surface.parametricEquation
 * （拷贝自源项目 @/utils/chart.js）
 */
function getParametricEquation(
  startRatio: number,
  endRatio: number,
  isSelected: boolean,
  isHovered: boolean,
  k: number,
  h: number,
): ParametricEquation {
  // 计算
  const midRatio = (startRatio + endRatio) / 2;
  const startRadian = startRatio * Math.PI * 2;
  const endRadian = endRatio * Math.PI * 2;
  const midRadian = midRatio * Math.PI * 2;
  // 如果只有一个扇形，则不实现选中效果
  if (startRatio === 0 && endRatio === 1) {
    isSelected = false;
  }
  // 通过扇形内径/外径的值，换算出辅助参数 k（默认值 1/3）
  k = typeof k !== 'undefined' ? k : 1 / 3;
  // 计算选中效果分别在 x 轴、y 轴方向上的位移（未选中，则位移均为 0）
  const offsetX = isSelected ? Math.cos(midRadian) * 0.1 : 0;
  const offsetY = isSelected ? Math.sin(midRadian) * 0.1 : 0;
  // 计算高亮效果的放大比例（未高亮，则比例为 1）
  const hoverRate = isHovered ? 1.05 : 1;
  // 返回曲面参数方程
  return {
    u: {
      min: -Math.PI,
      max: Math.PI * 3,
      step: Math.PI / 32,
    },
    v: {
      min: 0,
      max: Math.PI * 2,
      step: Math.PI / 20,
    },
    x: (u, v) => {
      if (u < startRadian) {
        return (
          offsetX + Math.cos(startRadian) * (1 + Math.cos(v) * k) * hoverRate
        );
      }
      if (u > endRadian) {
        return (
          offsetX + Math.cos(endRadian) * (1 + Math.cos(v) * k) * hoverRate
        );
      }
      return offsetX + Math.cos(u) * (1 + Math.cos(v) * k) * hoverRate;
    },
    y: (u, v) => {
      if (u < startRadian) {
        return (
          offsetY + Math.sin(startRadian) * (1 + Math.cos(v) * k) * hoverRate
        );
      }
      if (u > endRadian) {
        return (
          offsetY + Math.sin(endRadian) * (1 + Math.cos(v) * k) * hoverRate
        );
      }
      return offsetY + Math.sin(u) * (1 + Math.cos(v) * k) * hoverRate;
    },
    z: (u, v) => {
      if (u < -Math.PI * 0.5) {
        return Math.sin(u);
      }
      if (u > Math.PI * 2.5) {
        return Math.sin(u) * h * 0.1;
      }
      return Math.sin(v) > 0 ? 1 * h * 0.1 : -1;
    },
  };
}

/**
 * 获取 3D 饼图的最高扇区的高度（拷贝自源项目 @/utils/chart.js）
 */
function getHeight3D(series: SurfaceSeries[], height: number): number {
  series.sort((a, b) => b.pieData.value - a.pieData.value);
  return (height * 25) / series[0].pieData.value;
}

/**
 * 格式化浮点数（拷贝自源项目 @/utils/chart.js）
 */
function formatFloat(num: number, n: number): string | false {
  let f = parseFloat(String(num));
  if (isNaN(f)) {
    return false;
  }
  f = Math.round(num * Math.pow(10, n)) / Math.pow(10, n); // n 幂
  let s = f.toString();
  let rs = s.indexOf('.');
  // 判定如果是整数，增加小数点再补 0
  if (rs < 0) {
    rs = s.length;
    s += '.';
  }
  while (s.length <= rs + n) {
    s += '0';
  }
  return s;
}

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

/**
 * 初始化图表（对应源子组件 Pie3D01.renderEchart）
 * grid3D viewControl：alpha 28 / distance 240 / 关闭旋转缩放平移
 */
function initChart() {
  if (!chartRef.value) return;
  const colors = readPieColors(chartRef.value);
  chartInstance = echarts.init(chartRef.value);

  const expandData = optionDataExpand(mockPieData, colors);
  const option = getPie3D(expandData, 0, 240, 28, 26, 1, colors);

  // 额外 push 透明 labelSeries（2D 标签层，承接名称/数值标签渲染，不遮挡 3D 扇形）
  option.series.push({
    name: 'labelSeries',
    backgroundColor: 'transparent',
    type: 'pie',
    label: {
      opacity: 1,
      fontSize: 13,
      lineHeight: 20,
    },
    startAngle: -20, // 起始角度，支持范围 [0, 360]
    clockwise: false, // 饼图的扇区是否是顺时针排布（对齐 3D 样式）
    radius: ['10%', '40%'],
    center: ['50%', '50%'],
    data: expandData,
    itemStyle: {
      opacity: 0, // 必须是 0，不然 2D 的图会覆盖在表面
    },
  });

  chartInstance.setOption(option as unknown as echarts.EChartsOption);
  bindEchartEvents();
}

/**
 * 绑定交互事件：click 选中（单选）、mouseover 高亮（放大）、globalout 取消高亮
 * （对应源子组件 Pie3D01.bindEchartEvents）
 */
function bindEchartEvents() {
  let selectedIndex = '';
  let hoveredIndex = '';

  // 监听点击事件，实现选中效果（单选）
  chartInstance?.on('click', (params: any) => {
    // 标签层等非扇形系列不参与选中（与 tooltip/mouseover 的守卫保持一致）
    if (
      params.seriesName === 'mouseoutSeries' ||
      params.seriesName === 'pie2d' ||
      params.seriesName === 'labelSeries'
    ) {
      return;
    }
    const option: any = chartInstance?.getOption();
    // 从 option.series 中读取重新渲染扇形所需的参数，将是否选中取反
    const isSelected = !option.series[params.seriesIndex].pieStatus.selected;
    const isHovered = option.series[params.seriesIndex].pieStatus.hovered;
    const k = option.series[params.seriesIndex].pieStatus.k;
    const startRatio = option.series[params.seriesIndex].pieData.startRatio;
    const endRatio = option.series[params.seriesIndex].pieData.endRatio;

    // 如果之前选中过其他扇形，将其取消选中（对 option 更新）
    if (selectedIndex !== '' && selectedIndex !== params.seriesIndex) {
      option.series[selectedIndex].parametricEquation = getParametricEquation(
        option.series[selectedIndex].pieData.startRatio,
        option.series[selectedIndex].pieData.endRatio,
        false,
        false,
        k,
        option.series[selectedIndex].pieData.value,
      );
      option.series[selectedIndex].pieStatus.selected = false;
    }

    // 对当前点击的扇形，执行选中/取消选中操作（对 option 更新）
    option.series[params.seriesIndex].parametricEquation = getParametricEquation(
      startRatio,
      endRatio,
      isSelected,
      isHovered,
      k,
      // 修复：源组件此处误写 option.series[selectedIndex].pieData.value，
      // 首次点击时 option.series[''] 为 undefined 会抛错，改为当前扇区数据
      option.series[params.seriesIndex].pieData.value,
    );
    option.series[params.seriesIndex].pieStatus.selected = isSelected;

    // 如果本次是选中操作，记录上次选中的扇形对应的系列号 seriesIndex
    if (isSelected) {
      selectedIndex = params.seriesIndex;
    }

    // 使用更新后的 option，渲染图表
    chartInstance?.setOption(option);
  });

  // 监听 mouseover，近似实现高亮（放大）效果
  chartInstance?.on('mouseover', (params: any) => {
    const option: any = chartInstance?.getOption();
    let isSelected: boolean;
    let isHovered: boolean;
    let startRatio: number;
    let endRatio: number;
    let k: number;

    // 如果触发 mouseover 的扇形当前已高亮，则不做操作
    if (hoveredIndex === params.seriesIndex) {
      return;
    }

    // 如果当前有高亮的扇形，取消其高亮状态（对 option 更新）
    if (hoveredIndex !== '') {
      isSelected = option.series[hoveredIndex].pieStatus.selected;
      isHovered = false;
      startRatio = option.series[hoveredIndex].pieData.startRatio;
      endRatio = option.series[hoveredIndex].pieData.endRatio;
      k = option.series[hoveredIndex].pieStatus.k;

      option.series[hoveredIndex].parametricEquation = getParametricEquation(
        startRatio,
        endRatio,
        isSelected,
        isHovered,
        k,
        option.series[hoveredIndex].pieData.value,
      );
      option.series[hoveredIndex].pieStatus.hovered = isHovered;
      hoveredIndex = '';
    }

    // 如果触发 mouseover 的扇形不是透明标签层，将其高亮（对 option 更新）
    if (
      params.seriesName !== 'mouseoutSeries' &&
      params.seriesName !== 'labelSeries'
    ) {
      isSelected = option.series[params.seriesIndex].pieStatus.selected;
      isHovered = true;
      startRatio = option.series[params.seriesIndex].pieData.startRatio;
      endRatio = option.series[params.seriesIndex].pieData.endRatio;
      k = option.series[params.seriesIndex].pieStatus.k;

      option.series[params.seriesIndex].parametricEquation = getParametricEquation(
        startRatio,
        endRatio,
        isSelected,
        isHovered,
        k,
        option.series[params.seriesIndex].pieData.value + 5,
      );
      option.series[params.seriesIndex].pieStatus.hovered = isHovered;
      hoveredIndex = params.seriesIndex;
    }

    // 使用更新后的 option，渲染图表
    chartInstance?.setOption(option);
  });

  // 修正取消高亮失败的 bug
  chartInstance?.on('globalout', () => {
    if (hoveredIndex === '') {
      return;
    }
    const option: any = chartInstance?.getOption();
    const isSelected = option.series[hoveredIndex].pieStatus.selected;
    const isHovered = false;
    const k = option.series[hoveredIndex].pieStatus.k;
    const startRatio = option.series[hoveredIndex].pieData.startRatio;
    const endRatio = option.series[hoveredIndex].pieData.endRatio;

    // 对当前点击的扇形，执行取消高亮操作（对 option 更新）
    option.series[hoveredIndex].parametricEquation = getParametricEquation(
      startRatio,
      endRatio,
      isSelected,
      isHovered,
      k,
      option.series[hoveredIndex].pieData.value,
    );
    option.series[hoveredIndex].pieStatus.hovered = isHovered;
    hoveredIndex = '';

    // 使用更新后的 option，渲染图表
    chartInstance?.setOption(option);
  });
}

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
.pie-3d {
  --p3d-title-color: #9dd1d7;
  --p3d-value-color: #efde46;
  --p3d-unit-color: #efde46;
  --p3d-tooltip-bg: #043250;
  --p3d-tooltip-text: #9ed2d8;
  --p3d-label-name: #9dd1d7;
  --p3d-label-value: #00f6ff;

  position: relative;
  width: 100%;
  overflow: hidden;

  /* 背景图装饰子元素（铺满图表区域，不拦截鼠标事件） */
  &__bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url('./assets/chart-pie-3d-base-bg.png') no-repeat center 76%;
    background-size: cover;
    pointer-events: none;
  }

  /* 顶部描述区：标题 + 数值 + 单位 */
  &__des {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    margin-top: 20px;

    &-label {
      margin-right: 20px;
      font-size: 16px;
      color: var(--p3d-title-color);
    }

    &-value {
      font-size: 30px;
      font-weight: bold;
      color: var(--p3d-value-color);
    }

    &-unit {
      font-size: 14px;
      color: var(--p3d-unit-color);
    }
  }

  /* 图表容器（3D 渲染区域） */
  &__chart {
    position: relative;
    width: 100%;
    height: 320px;
  }
}

/* 小屏笔记本：整体微缩，保证布局不塌陷 */
@media (max-width: 1280px) {
  .pie-3d {
    &__des {
      margin-top: 12px;

      &-label {
        margin-right: 14px;
        font-size: 14px;
      }

      &-value {
        font-size: 26px;
      }

      &-unit {
        font-size: 12px;
      }
    }

    &__chart {
      height: 280px;
    }
  }
}

/* 大屏显示器：整体微放，与常规屏观感一致 */
@media (min-width: 1920px) {
  .pie-3d {
    &__des {
      margin-top: 24px;

      &-label {
        margin-right: 24px;
        font-size: 18px;
      }

      &-value {
        font-size: 34px;
      }

      &-unit {
        font-size: 15px;
      }
    }

    &__chart {
      height: 360px;
    }
  }
}
</style>
