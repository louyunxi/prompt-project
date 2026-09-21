<!--
  组件名称：Donut（双环环形图）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB128.vue

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .donut 上，echarts 运行时读取同名变量）：
    --dn-tooltip-bg     #043250                        提示框背景色
    --dn-tooltip-text   #9ed2d8                        提示框文字色
    --dn-center-title   #9dd1d7                        中心标题文字色
    --dn-center-num     #efde46                        中心数值文字色
    --dn-center-unit    #efde46                        中心单位文字色
    --dn-list-text      #9dd1d7                        右侧列表文字色
    --dn-tab-default    rgba(0,246,255,0.5)            标签默认文字色
    --dn-tab-active     #00f6ff                        标签激活文字色
    --dn-tab-line       #00f5ff                        标签激活下划线色
    --dn-slice-1        #d37600                        第 1 个扇区颜色
    --dn-slice-2        #d5858a                        第 2 个扇区颜色
    --dn-slice-3        #e8001f                        第 3 个扇区颜色
    --dn-slice-4        #969600                        第 4 个扇区颜色
    --dn-slice-5        #6697ff                        第 5 个扇区颜色
    --dn-slice-6        #fac907                        第 6 个扇区颜色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、$echarts 全局注入、vue-awesome-swiper（swiper 标签页）、
       plateVO 接口数据，本组件已全部去除，改为 mock 数据 + 组件内自包含渲染，
       swiper 标签页改用原生点击标签实现。
    2. 原依赖函数 debounce 已拷贝进本组件（见下方定义）。
    3. 图表配置（双环 pie / tooltip / 中心文字 / 右侧列表）与源组件保持一致；
       中心文字与右侧单位截断、& 单位拆分等业务逻辑已随通用 mock 数据一并简化。
    4. 该图表无图片物料，无需 assets 资源目录。
-->
<template>
  <div class="donut">
    <div class="donut__tabs">
      <div
        v-for="(group, index) in mockMetricGroupList"
        :key="group.metricGroupName"
        :class="['donut__tab', { active: activeIndex === index }]"
        @click="handleTabClick(index)"
      >
        {{ group.metricGroupName }}
      </div>
    </div>

    <div class="donut__body">
      <div class="donut__chart-wrap">
        <div ref="chartRef" class="donut__chart"></div>
        <div class="donut__center">
          <div v-if="chartsCenterText.metricName" class="donut__center-title">
            {{ chartsCenterText.metricName.slice(0, 6) }}
          </div>
          <div v-if="chartsCenterText.metricValue" class="donut__center-num">
            {{ chartsCenterText.metricValue }}
          </div>
          <div v-if="chartsCenterText.metricUnit" class="donut__center-unit">
            {{ chartsCenterText.metricUnit.slice(0, 6) }}
          </div>
        </div>
      </div>

      <div class="donut__list">
        <div
          v-for="(item, index) in chartsList"
          :key="item.metricName"
          class="donut__item"
        >
          <span
            class="donut__dot"
            :style="{ backgroundColor: sliceColors[index] }"
          ></span>
          <span class="donut__item-tit">{{ item.metricName }}：</span>
          <span class="donut__item-num">{{ item.metricValue }}</span>
          <span class="donut__item-unit">{{ item.metricUnit }}</span>
        </div>
      </div>
    </div>
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
  plateMetricList: MetricItem[];
}

/** mock 指标分组数据（对应源组件 plateMetricGroupList.splice(0, 3)） */
const mockMetricGroupList: MetricGroup[] = [
  {
    metricGroupName: '元素组一',
    plateMetricList: [
      { metricName: '元素一', metricValue: 3860, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 1200, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 980, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 760, metricUnit: '单位' },
      { metricName: '元素五', metricValue: 540, metricUnit: '单位' },
      { metricName: '元素六', metricValue: 320, metricUnit: '单位' },
      { metricName: '元素七', metricValue: 210, metricUnit: '单位' },
    ],
  },
  {
    metricGroupName: '元素组二',
    plateMetricList: [
      { metricName: '元素一', metricValue: 2750, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 1480, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 830, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 690, metricUnit: '单位' },
      { metricName: '元素五', metricValue: 410, metricUnit: '单位' },
      { metricName: '元素六', metricValue: 280, metricUnit: '单位' },
      { metricName: '元素七', metricValue: 160, metricUnit: '单位' },
    ],
  },
  {
    metricGroupName: '元素组三',
    plateMetricList: [
      { metricName: '元素一', metricValue: 5120, metricUnit: '单位' },
      { metricName: '元素二', metricValue: 960, metricUnit: '单位' },
      { metricName: '元素三', metricValue: 750, metricUnit: '单位' },
      { metricName: '元素四', metricValue: 620, metricUnit: '单位' },
      { metricName: '元素五', metricValue: 480, metricUnit: '单位' },
      { metricName: '元素六', metricValue: 350, metricUnit: '单位' },
      { metricName: '元素七', metricValue: 190, metricUnit: '单位' },
    ],
  },
];

/** echarts 渲染所需颜色（从 CSS 变量读取） */
interface DonutColors {
  tooltipBg: string;
  tooltipText: string;
  centerTitle: string;
  centerNum: string;
  centerUnit: string;
  listText: string;
  tabDefault: string;
  tabActive: string;
  tabLine: string;
  sliceColors: string[];
}

/** 从根元素读取 CSS 颜色变量，读取失败时回退到默认色 */
function readDonutColors(el: HTMLElement): DonutColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    tooltipBg: read('--dn-tooltip-bg', '#043250'),
    tooltipText: read('--dn-tooltip-text', '#9ed2d8'),
    centerTitle: read('--dn-center-title', '#9dd1d7'),
    centerNum: read('--dn-center-num', '#efde46'),
    centerUnit: read('--dn-center-unit', '#efde46'),
    listText: read('--dn-list-text', '#9dd1d7'),
    tabDefault: read('--dn-tab-default', 'rgba(0, 246, 255, 0.5)'),
    tabActive: read('--dn-tab-active', '#00f6ff'),
    tabLine: read('--dn-tab-line', '#00f5ff'),
    sliceColors: [
      read('--dn-slice-1', '#d37600'),
      read('--dn-slice-2', '#d5858a'),
      read('--dn-slice-3', '#e8001f'),
      read('--dn-slice-4', '#969600'),
      read('--dn-slice-5', '#6697ff'),
      read('--dn-slice-6', '#fac907'),
    ],
  };
}

/** 基础配置（对应源组件 pieOption） */
function buildPieOption(colors: DonutColors): echarts.EChartsOption {
  return {
    tooltip: {
      show: true,
      trigger: 'item',
      padding: [13, 14, 13, 11],
      backgroundColor: colors.tooltipBg,
      textStyle: { fontSize: 12, color: colors.tooltipText },
      formatter: (a: any) => {
        const parts = [a.data.name, ': ', a.data.initialValue, a.data.unit];
        let str = parts
          .filter((item: any) => item !== null && item !== undefined)
          .join('');
        if (str.length > 20) {
          str = str.replace(/(.{20})/g, '$1<br/>');
        }
        return str;
      },
      position: (point: any) => point,
    },
    color: colors.sliceColors,
    textStyle: { color: colors.listText, fontSize: 14, fontWeight: 400 },
    series: [
      {
        name: '',
        type: 'pie',
        center: ['50%', '50%'],
        radius: ['75%', '85%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: true, length: 20, length2: 10 },
        selectedMode: 'multiple',
        selectedOffset: 2,
        data: [],
      },
      {
        type: 'pie',
        center: ['50%', '50%'],
        radius: ['66%', '68%'],
        animation: true,
        labelLine: { show: false },
        emphasis: { scale: false },
        z: 3,
        tooltip: { show: false },
        label: { show: false },
        selectedMode: 'multiple',
        selectedOffset: 4,
        data: [],
      },
    ],
  };
}

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

const activeIndex = ref(0);
const sliceColors = ref<string[]>([]);
const chartsCenterText = ref<{
  metricName: string;
  metricValue: number;
  metricUnit: string;
}>({ metricName: '', metricValue: 0, metricUnit: '' });
const chartsList = ref<MetricItem[]>([]);

/** 初始化图表 */
function initChart() {
  if (!chartRef.value) return;
  const colors = readDonutColors(chartRef.value);
  sliceColors.value = colors.sliceColors;
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(buildPieOption(colors));
  refreshChart();
}

/** 用 mock 指标分组数据刷新图表（对应源组件 initData + setEchart） */
function refreshChart() {
  const group = mockMetricGroupList[activeIndex.value];

  let list: MetricItem[] = [];
  if (group && group.plateMetricList.length) {
    chartsCenterText.value = {
      metricName: group.plateMetricList[0].metricName,
      metricValue: group.plateMetricList[0].metricValue,
      metricUnit: group.plateMetricList[0].metricUnit,
    };
    list = group.plateMetricList.slice(1, 7);
  } else {
    chartsCenterText.value = { metricName: '', metricValue: 0, metricUnit: '' };
    list = [];
  }
  chartsList.value = list;

  const seriesData = list.map((info) => ({
    name: info.metricName,
    value: Number(info.metricValue) || 0,
    initialValue: String(info.metricValue),
    unit: info.metricUnit || '',
    selected: false,
  }));

  chartInstance?.setOption({
    series: [{ data: seriesData }, { data: seriesData }],
  });
}

/** 切换标签（对应源组件 handleClick） */
function handleTabClick(index: number) {
  activeIndex.value = index;
  refreshChart();
}

/** 尺寸自适应（防抖） */
const handleResize = debounce(() => {
  chartInstance?.resize();
}, 200);

onMounted(() => {
  nextTick(initChart);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style lang="scss" scoped>
.donut {
  --dn-tooltip-bg: #043250;
  --dn-tooltip-text: #9ed2d8;
  --dn-center-title: #9dd1d7;
  --dn-center-num: #efde46;
  --dn-center-unit: #efde46;
  --dn-list-text: #9dd1d7;
  --dn-tab-default: rgba(0, 246, 255, 0.5);
  --dn-tab-active: #00f6ff;
  --dn-tab-line: #00f5ff;
  --dn-slice-1: #d37600;
  --dn-slice-2: #d5858a;
  --dn-slice-3: #e8001f;
  --dn-slice-4: #969600;
  --dn-slice-5: #6697ff;
  --dn-slice-6: #fac907;

  width: 100%;

  &__tabs {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 16px;
  }

  &__tab {
    position: relative;
    padding-bottom: 8px;
    color: var(--dn-tab-default);
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: color 0.3s linear;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 0;
      height: 3px;
      width: 0;
      transform: translateX(-50%);
      background-color: var(--dn-tab-line);
      border-radius: 3px;
      transition: width 0.3s linear;
    }

    &.active {
      color: var(--dn-tab-active);

      &::after {
        width: 32%;
        min-width: 30px;
      }
    }
  }

  &__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  &__chart-wrap {
    position: relative;
    width: 300px;
    height: 300px;
    flex-shrink: 0;
  }

  &__chart {
    width: 100%;
    height: 100%;
  }

  &__center {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    width: 60%;
    height: 60%;
    pointer-events: none;
  }

  &__center-title {
    color: var(--dn-center-title);
    font-size: 16px;
    padding-bottom: 14px;
  }

  &__center-num {
    color: var(--dn-center-num);
    font-size: 30px;
    font-weight: bold;
    padding-bottom: 8px;
  }

  &__center-unit {
    color: var(--dn-center-unit);
    font-size: 14px;
  }

  &__list {
    flex: 1;
    min-width: 0;
  }

  &__item {
    position: relative;
    color: var(--dn-list-text);
    font-size: 14px;
    line-height: 18px;
    word-break: break-all;
    padding-left: 14px;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__dot {
    position: absolute;
    left: 0;
    top: 6px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &__item-num {
    font-weight: bold;
  }
}
</style>
