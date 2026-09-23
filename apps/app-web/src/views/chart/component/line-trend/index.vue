<!--
  组件名称：LineTrend（双折线趋势对比图）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB124.vue

  依赖插件 / 版本：
    - echarts ^5.5.1（本项目实际安装 5.6.0）
    - ant-design-vue ^4.2.6（a-select 自动按需注册）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .line-trend 上，echarts 运行时通过 getComputedStyle 读取同名变量）：
    --lt-axis-text          #6dc1cb                轴线/坐标轴文字、图例与标题色
    --lt-grid-border        #072d4a                网格边框
    --lt-split-line         rgba(109,193,203,0.2)  分割线 / 轴线颜色
    --lt-tooltip-bg         #042940                提示框背景色
    --lt-tooltip-text       #9ed2d8                提示框文字色
    --lt-line-1             0,246,255              折线 1（去年）RGB 分量
    --lt-line-2             251,192,45             折线 2（今年）RGB 分量
    --lt-select-bg          rgba(7,45,74,0.6)      品类下拉背景色
    --lt-select-border      rgba(109,193,203,0.35) 品类下拉边框色
    --lt-select-placeholder rgba(39,145,149,0.5)   品类下拉占位文字色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex mapGetters（subjectAreaIds）、plateVO 接口数据、
       nfcBasicConfig / nfcMonthPrice API，本组件已全部去除，改为组件内 mock 数据自包含渲染
       （3 个通用品类「品类一~四」，每个品类含去年 + 今年 12 个月 mock 价格）。
    2. 原依赖工具函数 dateFormat / getIntervalTime / maxDecimalPlaces 已内联进本组件（见下方实现）。
    3. 原 el-select 改用本项目 UI 库 ant-design-vue 的 a-select（show-search 过滤），
       样式（94px / 28px / padding 0 24px 0 12px / text-align center）与源保持一致。
    4. GSChart 子组件的 echarts init / resize 逻辑已内联：改用 ResizeObserver 监听容器尺寸
       （符合 app-web §9.1），不再监听 window resize；onBeforeUnmount 中 disconnect + dispose。
    5. BASE_CHART_OPTION / ALL_MONTHS 关键配置全部保留（title/grid/tooltip/legend/xAxis/yAxis/dataZoom），
       颜色统一改为运行时读取 CSS 变量，使用者可通过覆盖 --lt-* 变量完成换肤。
    6. 该组件无图片物料（源组件 select 前无图标），无需 assets 资源目录。
-->
<template>
  <div class="line-trend">
    <div class="line-trend__tools">
      <a-select
        v-model:value="cropId"
        placeholder="请选择"
        class="line-trend__select"
        show-search
        :options="cropOptions"
        option-filter-prop="label"
        @change="handleChangeCrop"
      ></a-select>
    </div>
    <div
      ref="chartRef"
      class="line-trend__chart"
      @mouseleave="tiggerLastMonthTip"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import * as echarts from 'echarts';

/** 12 个月刻度（对应源配置 ALL_MONTHS） */
const ALL_MONTHS = new Array<string>(12)
  .fill('月')
  .map((suffix, index) => `${index + 1}${suffix}`);

/** 品类下拉选项 */
interface CropOption {
  id: string;
  name: string;
}

/** mock 品类：去年 + 今年 12 个月价格（null 表示缺月） */
interface MockCrop extends CropOption {
  lastYearPrices: (number | null)[];
  currentYearPrices: (number | null)[];
}

/** 单条价格信息（对应源接口返回结构） */
interface PriceInfo {
  nfcName: string;
  priceDate: string;
  wholesalePrice: number | null;
  unit: string;
}

/** echarts 渲染所需颜色（从 CSS 变量读取） */
interface LineColors {
  axisText: string;
  gridBorder: string;
  splitLine: string;
  tooltipBg: string;
  tooltipText: string;
  line1: string;
  line2: string;
}

/**
 * mock 品类数据（通用命名，不包含业务名称）。
 * 今年数据在运行时按「当前月份」截断：未来月份视为缺月（null），与源接口只返回已有月份的行为一致。
 */
const MOCK_CROP_LIST: MockCrop[] = [
  {
    id: 'crop-1',
    name: '品类一',
    lastYearPrices: [
      2.1, 2.3, 2.0, 1.8, 1.9, 2.2, 2.5, 2.8, 3.0, 2.9, 2.7, 2.6,
    ],
    currentYearPrices: [
      2.3, 2.5, 2.2, 2.0, 2.1, 2.4, 2.7, 3.1, 3.4, 3.2, 3.0, 2.9,
    ],
  },
  {
    id: 'crop-2',
    name: '品类二',
    lastYearPrices: [
      1.5, 1.6, 1.4, 1.3, 1.4, 1.6, 1.8, 2.0, 2.1, 2.0, 1.9, 1.8,
    ],
    currentYearPrices: [
      1.6, 1.8, 1.5, 1.4, 1.5, 1.7, 2.0, 2.3, 2.5, 2.4, 2.2, 2.1,
    ],
  },
  {
    id: 'crop-3',
    name: '品类三',
    // 今年 6 月（index 5）为 null，用于验证「缺月补 null」的补齐逻辑
    lastYearPrices: [
      3.2, 3.4, 3.1, 2.9, 2.8, 3.0, 3.3, 3.6, 3.8, 3.7, 3.5, 3.4,
    ],
    currentYearPrices: [
      3.5,
      3.7,
      3.3,
      3.1,
      3.0,
      null,
      3.6,
      4.0,
      4.2,
      4.1,
      3.9,
      3.8,
    ],
  },
  {
    id: 'crop-4',
    name: '品类四',
    lastYearPrices: [
      0.9, 1.0, 0.8, 0.7, 0.8, 1.0, 1.2, 1.4, 1.5, 1.4, 1.3, 1.2,
    ],
    currentYearPrices: [
      1.0, 1.2, 0.9, 0.8, 0.9, 1.1, 1.4, 1.7, 1.9, 1.8, 1.7, 1.6,
    ],
  },
];

/** 防抖：高频率触发时只保留最后一次（沿用源组件 resize 的 200ms 缓冲） */
function debounce(fn: (...args: unknown[]) => void, delay = 200) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: unknown[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, delay);
  };
}

/** 日期格式化（内联自源项目 @/common/fn 的 dateFormat，仅保留本组件用到的 y/M/d/h/m/s/q/S 规则） */
function dateFormat(date: Date | string | number, format: string): string {
  let origin: Date | string | number = date;
  if (typeof origin === 'string') {
    const mts = origin.match(/(\/Date(\d+)\/)/);
    if (mts && mts.length >= 3) {
      origin = parseInt(mts[2], 10);
    }
  }
  const dateObj = new Date(origin);
  if (!dateObj || dateObj.toUTCString() === 'Invalid Date') {
    return '';
  }

  const map: Record<string, number> = {
    M: dateObj.getMonth() + 1, // 月份
    d: dateObj.getDate(), // 日
    h: dateObj.getHours(), // 小时
    m: dateObj.getMinutes(), // 分
    s: dateObj.getSeconds(), // 秒
    q: Math.floor((dateObj.getMonth() + 3) / 3), // 季度
    S: dateObj.getMilliseconds(), // 毫秒
  };

  return format.replace(/([yMdhmsqS])+/g, (all, token: string) => {
    const value = map[token];
    if (value !== undefined) {
      if (all.length > 1) {
        const padded = `0${value}`;
        return padded.slice(padded.length - 2);
      }
      return String(value);
    }
    if (token === 'y') {
      return String(dateObj.getFullYear()).slice(4 - all.length);
    }
    return all;
  });
}

/** 开始时间到结束时间的月份区间（内联自源项目 @/common/fn 的 getIntervalTime） */
function getIntervalTime({
  startTime = new Date().getTime(),
  howMonth = 12,
  format = 'yyyy-MM-dd',
}: {
  startTime?: Date | string | number;
  howMonth?: number;
  format?: string;
} = {}): string[] {
  const startDate = new Date(startTime);
  let month = new Date(startDate.setDate(1)).getMonth();
  const monthFormat: string[] = [];
  for (let i = 0; i < howMonth; i++) {
    monthFormat.push(dateFormat(new Date(startDate).setMonth(month++), format));
  }
  return monthFormat;
}

/** 最大保留的小数位数（内联自源项目 @/common/fn 的 maxDecimalPlaces，用于 tooltip 数值） */
function maxDecimalPlaces({
  value = 0,
  places = 2,
}: {
  value?: number | null;
  places?: number;
} = {}): number | null | undefined {
  if (Number.isNaN(value) || value === undefined || value === null) {
    return value;
  }
  if (!Number.isInteger(value)) {
    const strValue = String(value);
    const decimal = strValue.match(/\.(\d+)/)?.[1] ?? '';
    if (decimal.length >= places) {
      return parseFloat(
        String(Math.round(value * Math.pow(10, places)) / Math.pow(10, places)),
      );
    }
  }
  return parseFloat(String(value));
}

/** 从根元素读取 CSS 颜色变量，读取失败时回退到默认色（对应源组件色彩） */
function readLineColors(el: HTMLElement): LineColors {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    axisText: read('--lt-axis-text', '#6dc1cb'),
    gridBorder: read('--lt-grid-border', '#072d4a'),
    splitLine: read('--lt-split-line', 'rgba(109,193,203,0.2)'),
    tooltipBg: read('--lt-tooltip-bg', '#042940'),
    tooltipText: read('--lt-tooltip-text', '#9ed2d8'),
    line1: read('--lt-line-1', '0,246,255'),
    line2: read('--lt-line-2', '251,192,45'),
  };
}

/** 基础配置（对应源 BASE_CHART_OPTION，颜色由 CSS 变量注入） */
function buildBaseOption(colors: LineColors): echarts.EChartsOption {
  return {
    // 暂无数据的标题
    title: {
      show: false,
      text: '暂无数据',
      textStyle: {
        fontSize: 12,
        color: colors.axisText,
      },
      left: 'center',
      top: 'center',
    },
    // 表的网格配置
    grid: {
      show: true,
      borderColor: colors.gridBorder,
      bottom: 40,
      top: 40,
      height: '70%',
      width: '85%',
    },
    // 鼠标悬浮的样式
    tooltip: {
      show: true,
      trigger: 'axis',
      backgroundColor: colors.tooltipBg,
      padding: [13, 14, 13, 11],
      textStyle: {
        fontSize: 12,
        color: colors.tooltipText,
      },
      axisPointer: {
        lineStyle: {
          opacity: 0,
        },
      },
    },
    // 图例配置
    legend: {
      show: true,
      type: 'plain',
      textStyle: {
        color: colors.axisText,
        fontSize: 12,
      },
      icon: 'circle',
      backgroundColor: 'rgba(255, 255, 255, 0)',
      top: 3,
      left: 'center',
      itemWidth: 10,
      itemHeight: 8,
      height: 20,
    },
    // x 轴样式配置
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisLabel: {
        color: colors.axisText,
        fontSize: 12,
        align: 'center',
      },
      axisTick: {
        show: false,
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: colors.splitLine,
        },
      },
      z: 10,
    },
    // y 轴样式配置
    yAxis: {
      nameTextStyle: {
        fontSize: 12,
        color: colors.axisText,
        padding: [4, 8, 5, 35],
      },
      axisLine: {
        show: false,
        lineStyle: {
          color: '#0d394a',
        },
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
        color: colors.axisText,
        fontSize: 12,
      },
    },
    dataZoom: [{ show: false }],
  };
}

/** 依据 mock 价格数组生成价格列表（按当前月份截断今年未来月份，缺月置 null 并过滤） */
function buildMockPriceList(
  year: number,
  prices: (number | null)[],
  name: string,
): PriceInfo[] {
  const currentMonth = new Date().getMonth() + 1;
  return prices
    .map((price, index) => {
      const month = index + 1;
      // 今年「未来月份」按无数据处理
      const isFuture =
        year === new Date().getFullYear() && month > currentMonth;
      return {
        nfcName: name,
        priceDate: `${year}-${String(month).padStart(2, '0')}`,
        wholesalePrice: isFuture ? null : price,
        unit: '单位/公斤',
      };
    })
    .filter((item) => item.wholesalePrice !== null);
}

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;
/** 当前读取到的颜色变量（init 时读取，供 series 渲染使用） */
let currentLineColors: LineColors | null = null;

const cropList = ref<CropOption[]>([]);
// a-select 的 SelectValue 不含 null，未选择时用空字符串占位
const cropId = ref<string>('');
const lastMonthIndex = ref(-1);
const showTipSeriesIndex = ref(0);

/** 品类下拉 options（ant-design-vue Select 数据源） */
const cropOptions = computed(() =>
  cropList.value.map((item) => ({ value: item.id, label: item.name })),
);

/** 加载品类列表（对应源 getCropListController，改为 mock） */
function loadCropList() {
  cropList.value = MOCK_CROP_LIST.map((item) => ({
    id: item.id,
    name: item.name,
  }));
  cropId.value = cropList.value[0]?.id ?? '';
}

/** 加载品类价格并渲染双折线（对应源 getCropPriceListController，改为 mock） */
async function getCropPriceListController() {
  if (!chartInstance || !currentLineColors) return;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDateFormatList = getIntervalTime({
    startTime: `${currentYear}-01-01`,
    howMonth: currentMonth,
    format: 'yyyy-MM',
  });
  const currentYearMonthList = getIntervalTime({
    startTime: `${currentYear}-01-01`,
    format: 'yyyy-MM',
  });
  const prevDateFormatList = getIntervalTime({
    startTime: `${currentYear - 1}-01-01`,
    format: 'yyyy-MM',
  });
  const groupDateFormatGroupList = [prevDateFormatList, currentDateFormatList];

  // mock 两个年份的价格列表（去年在前，今年在后，与源 series 顺序一致）
  const currentCrop =
    MOCK_CROP_LIST.find((item) => item.id === cropId.value) ??
    MOCK_CROP_LIST[0];
  const resList: PriceInfo[][] = [
    buildMockPriceList(
      currentYear - 1,
      currentCrop.lastYearPrices,
      currentCrop.name,
    ),
    buildMockPriceList(
      currentYear,
      currentCrop.currentYearPrices,
      currentCrop.name,
    ),
  ];

  lastMonthIndex.value = -1;
  showTipSeriesIndex.value = 0;
  if (resList[1].length) {
    const nowYearLastMonthData = resList[1][resList[1].length - 1];
    lastMonthIndex.value = currentYearMonthList.findIndex(
      (month) => month === nowYearLastMonthData.priceDate,
    );
    showTipSeriesIndex.value = 1;
  } else if (resList[0].length) {
    const nowYearLastMonthData = resList[0][resList[0].length - 1];
    lastMonthIndex.value = prevDateFormatList.findIndex(
      (month) => month === nowYearLastMonthData.priceDate,
    );
  }

  const [currentTotal, prevTotal] = resList.map((priceList) =>
    priceList.reduce(
      (acc, priceInfo) => acc + (priceInfo.wholesalePrice ?? 0),
      0,
    ),
  );
  // 是否有数据
  const ownDataFlag = !(currentTotal === 0 && prevTotal === 0);

  // 补齐缺失月份（缺月补 null，与源补齐逻辑一致）
  const resDataList: PriceInfo[][] = [];
  groupDateFormatGroupList.forEach((dateList, index) => {
    const dataList = resList[index];
    if (!dataList || dataList.length === 0) {
      resDataList.push([]);
    } else if (dataList.length === dateList.length) {
      resDataList.push(dataList);
    } else {
      const filled: PriceInfo[] = [];
      let dataIndex = 0;
      dateList.forEach((date) => {
        const dateTime = dateFormat(
          new Date(date).setHours(0, 0, 0),
          'yyyy-MM',
        );
        if (dataList[dataIndex]?.priceDate === dateTime) {
          filled.push(dataList[dataIndex]);
          dataIndex++;
        } else {
          filled.push({
            nfcName: dataList[0].nfcName,
            wholesalePrice: null,
            priceDate: dateTime,
            unit: dataList[0].unit || '',
          });
        }
      });
      resDataList.push(filled);
    }
  });

  let yAxisUnit = '单位/公斤';
  const firstNonEmpty = resList.find((item) => item.length > 0);
  if (firstNonEmpty) {
    yAxisUnit = firstNonEmpty[0]?.unit || '单位/公斤';
  }

  const seriesColors = [currentLineColors.line1, currentLineColors.line2];
  chartInstance.setOption({
    tooltip: {
      show: ownDataFlag,
      formatter: (params: any) => {
        const lines = params.map((item: any) =>
          item.value !== null
            ? `${item.seriesName}：${maxDecimalPlaces({
                value: item.value,
              })}${yAxisUnit}`
            : '',
        );
        return `${params[0].axisValue}<br/>${lines.join('<br />')}`;
      },
    },
    xAxis: {
      show: ownDataFlag,
    },
    yAxis: {
      show: ownDataFlag,
      name: `(${yAxisUnit})`,
    },
    title: {
      show: !ownDataFlag,
    },
    series: groupDateFormatGroupList.map((dateList, index) => {
      return {
        type: 'line',
        smooth: true, // 是否平滑
        name: dateFormat(dateList[0], 'yyyy年'),
        data: resDataList[index].map((priceInfo) => ({
          name: priceInfo.nfcName,
          value: priceInfo.wholesalePrice,
        })),
        color: `rgba(${seriesColors[index]},1)`,
        lineStyle: {
          color: `rgba(${seriesColors[index]},1)`,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            global: false, // 缺省为 false
            colorStops: [
              {
                offset: 0,
                color: `rgba(${seriesColors[index]},0.5)`,
              },
              {
                offset: 1,
                color: `rgba(${seriesColors[index]},0)`,
              },
            ],
          },
        },
      };
    }),
  });
  // 触发显示今年最近一个月的 tooltip
  tiggerLastMonthTip();
}

/** 切换品类（对应源 handleChangeCrop，先清空 series 再重新加载） */
async function handleChangeCrop() {
  chartInstance?.setOption({
    series: [
      {
        type: 'line',
        data: [],
      },
      {
        type: 'line',
        data: [],
      },
    ],
  });
  await getCropPriceListController();
  await nextTick();
}

/** 高亮显示最近一个有数据月份的 tooltip（对应源 tiggerLastMonthTip） */
function tiggerLastMonthTip() {
  if (!(lastMonthIndex.value >= 0)) return;
  chartInstance?.dispatchAction({
    type: 'showTip',
    seriesIndex: showTipSeriesIndex.value,
    dataIndex: lastMonthIndex.value,
  });
}

/** 初始化图表（内联 GSChart 的 init 逻辑） */
function initChart() {
  if (!chartRef.value) return;
  currentLineColors = readLineColors(chartRef.value);
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(buildBaseOption(currentLineColors));
  chartInstance.setOption({
    xAxis: {
      data: ALL_MONTHS,
    },
    yAxis: {
      name: '(单位/公斤)',
      axisTick: {
        show: false,
      },
    },
  });
  loadCropList();
  void getCropPriceListController();
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
  currentLineColors = null;
});
</script>

<style lang="scss" scoped>
.line-trend {
  --lt-axis-text: #6dc1cb;
  --lt-grid-border: #072d4a;
  --lt-split-line: rgba(109, 193, 203, 0.2);
  --lt-tooltip-bg: #042940;
  --lt-tooltip-text: #9ed2d8;
  --lt-line-1: 0, 246, 255;
  --lt-line-2: 251, 192, 45;
  --lt-select-bg: rgba(7, 45, 74, 0.6);
  --lt-select-border: rgba(109, 193, 203, 0.35);
  --lt-select-placeholder: rgba(39, 145, 149, 0.5);

  position: relative;
  width: 100%;

  &__tools {
    position: absolute;
    z-index: 10;
    top: 1px;
    right: 18px;
  }

  &__select {
    width: 94px;
    height: 28px;

    :deep(.ant-select-selector) {
      width: 100%;
      height: 28px !important;
      padding: 0 24px 0 12px;
      background-color: var(--lt-select-bg);
      border: 1px solid var(--lt-select-border);
      border-radius: 4px;
    }

    :deep(.ant-select-selection-item),
    :deep(.ant-select-selection-placeholder) {
      line-height: 26px !important;
      text-align: center;
      text-overflow: ellipsis;
    }

    :deep(.ant-select-selection-item) {
      color: var(--lt-axis-text);
    }

    :deep(.ant-select-selection-placeholder) {
      color: var(--lt-select-placeholder);
    }

    :deep(.ant-select-arrow) {
      color: var(--lt-axis-text);
    }
  }

  &__chart {
    width: 100%;
    height: 320px;
  }
}

// 三档响应式：保证品类下拉与图表不错位
@media (max-width: 1280px) {
  .line-trend {
    &__tools {
      top: 0;
      right: 8px;
    }

    &__chart {
      height: 300px;
    }
  }
}

@media (min-width: 1281px) and (max-width: 1919px) {
  .line-trend {
    &__tools {
      top: 1px;
      right: 14px;
    }
  }
}

@media (min-width: 1920px) {
  .line-trend {
    &__tools {
      top: 1px;
      right: 18px;
    }
  }
}
</style>
