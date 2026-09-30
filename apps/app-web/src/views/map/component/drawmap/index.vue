<!--
  组件名称：DrawMap（地块绘制 / 天地图卫星底图 + 点线面轮廓绘制）
  来源迁移：D:\sn-project\frp_miniprogram_h5\src\components\drawMap\index.vue（页面与交互）
            D:\sn-project\frp_miniprogram_h5\src\components\drawMap\mixins\draw.js（绘制状态机）
            D:\sn-project\frp_miniprogram_h5\src\components\drawMap\mixins\initTextLabel.js（距离 / 面积标注）
            D:\sn-project\frp_miniprogram_h5\src\utils\gis\base.ts（initMap / initTiandituLayers）
            D:\sn-project\frp_miniprogram_h5\src\utils\gis\get-tianditu-key.ts
            本组件在 ../basemap/index.vue 的基础上复制改造，底图能力与 BaseMap 一致。

  依赖插件 / 版本：
    - leaflet ^1.9.4（本项目实际安装 1.9.4；源项目为 1.7.1，本组件只用两版都有的公共 API）
    - @ant-design/icons-vue ^7.0.1（操作按钮图标，替代源项目的 png 图标）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .drawmap 上）：
    --dm-canvas-bg        #0b1a2b                 瓦片到位前的容器兜底底色
    --dm-status-bg        rgba(0, 0, 0, 0.55)      状态浮层背景
    --dm-status-text      #ffffff                  状态浮层文字
    --dm-status-error     #ff7d00                  加载失败文字
    --dm-ctrl-bg          #ffffff                 leaflet 缩放控件背景
    --dm-ctrl-text        #1f2d3d                 控件图标色
    --dm-ctrl-line        #e5eaf0                 控件分隔线 / 禁用色
    --dm-ctrl-hover-bg    #f4f6f8                 控件悬停背景
    --dm-attribution-bg   rgba(255, 255, 255, 0.8) 版权控件背景
    --dm-attribution-text #5c6b7a                 版权控件文字
    --dm-line-color       #00f6ff                 定稿轮廓 / 顶点色（leaflet SVG 属性吃不到 CSS 变量，
                                                  运行时 getComputedStyle 读取后传给绘制模块）
    --dm-line-move-color   #ffffff                绘制中的实线与虚线色（同上，运行时读取）
    --dm-warning-color    #ff0000                 边界自交告警色（同上，运行时读取）
    --dm-snap-color       #0fa87b                 画笔吸附到起点时的提示色（同上，运行时读取）
    --dm-fill-color       #000000                 未闭合多边形的填充色（同上，运行时读取）
    --dm-brush-color      #00f6ff                 画笔锚点色（页面内使用，无需运行时读取）
    --dm-crosshair-color  #ffffff                 十字准星线色
    --dm-tip-bg           rgba(0, 0, 0, 0.75)     步骤提示背景
    --dm-tip-text         #ff7d00                 步骤提示文字
    --dm-toolbar-bg       rgba(0, 0, 0, 0.55)     操作栏背景
    --dm-btn-bg           rgba(255, 255, 255, 0.92) 次要按钮背景
    --dm-btn-text         #1f2d3d                 次要按钮文字
    --dm-btn-disabled-bg  rgba(255, 255, 255, 0.4) 次要按钮禁用背景
    --dm-primary-bg       #1677ff                 主按钮 / 拖拽把手强调色
    --dm-primary-text     #ffffff                 主按钮文字
    --dm-label-text       #ffffff                 距离 / 面积标注文字
    --dm-label-shadow     rgba(0, 0, 0, 0.8)      标注文字描边阴影
    --dm-result-bg        rgba(0, 0, 0, 0.55)     绘制结果浮层背景
    --dm-result-text      #ffffff                 绘制结果文字

  迁移说明：
    1. 相对 basemap 组件的差异：在「初始化地图」之上补上了源 drawMap 的绘制能力——
       点 / 线 / 面三种形状的「十字准星取点」绘制流程（开始绘制 → 拖动地图 → 打点 → 撤销 →
       结束绘制 / 闭合 → 完成绘制），以及已闭合轮廓的顶点拖拽编辑。
       区域蒙层、区域高清影像、地址搜索、用户定位属于页面 / GIS 服务，不在本组件范围
       （蒙层见 ../areamap）。
    2. 剥离的外部依赖：@turf/turf、leaflet-snap、leaflet-geometryutil、vant(Toast)、
       vuex / vue-router 全部去掉，几何计算内联到同目录 draw-geometry.ts，
       绘制状态机内联到同目录 useDrawTool.ts，提示改为组件内 notice。
    3. 图片物料：源项目用了一批 png（marker.png / drag-marker.png / revoke.png / add-point.png /
       save-icon.png / crosshair2.png），本组件全部改为 CSS 绘制 + @ant-design/icons-vue 图标，
       因此不需要 assets 目录（也便于跟随主题换色）。
    4. 交互补充：源项目的形状类型由页面 props 决定，本组件加了「点 / 线 / 面」切换按钮（仅待绘制
       状态可切换），方便在画廊里直接对比三种绘制效果；「完成绘制」除 emit submit 外，
       还在左下角展示结果浮层（面积 / 周长 / 顶点数）。
    5. 与 basemap 相同的公共处理（详见 ../basemap/index.vue 注释）：
       ResizeObserver + invalidateSize 尺寸自适应、瓦片事件直挂 tileLayer
       （L.layerGroup 不向 map 冒泡）、状态浮层、
       不迁移源组件中从未生效的 .leaflet-tile-container img transform 死代码规则。
    6. 运行时读取配色的原因：leaflet 的多边形 / 折线用 SVG attribute 上色、divIcon 用内联样式，
       都吃不到 CSS 变量，与 chart 组件读取 echarts 配色的做法一致，在挂载时
       getComputedStyle 读取根元素上的同名变量（读取失败回退默认值）。
-->
<template>
  <div ref="rootRef" class="drawmap">
    <div ref="mapRef" class="drawmap__canvas"></div>

    <!-- 十字准星：绘制中停在地图中心，即画笔的落点 -->
    <div
      v-show="showCrosshair"
      class="drawmap__crosshair"
      :class="{ 'is-snapped': isSnapped }"
    ></div>

    <div class="drawmap__top">
      <!-- 形状切换：仅待绘制状态可切换 -->
      <div v-if="step === 1" class="drawmap__shapes">
        <button
          v-for="item in SHAPES"
          :key="item.value"
          type="button"
          class="drawmap__shape"
          :class="{ 'is-active': shapeType === item.value }"
          @click="tool.setShapeType(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
      <div v-if="drawTip" class="drawmap__tip">{{ drawTip }}</div>
      <div v-if="notice" class="drawmap__notice">{{ notice }}</div>
    </div>

    <!-- 底部操作栏：按步骤切换按钮组（源项目 footer 的三种状态） -->
    <div class="drawmap__toolbar">
      <template v-if="step === 1">
        <button
          type="button"
          class="drawmap__btn drawmap__btn--primary"
          @click="tool.startDraw()"
        >
          <EditOutlined />开始绘制
        </button>
      </template>

      <template v-else-if="step === 2">
        <button
          type="button"
          class="drawmap__btn"
          :disabled="!stepRecorder.length"
          @click="tool.revoke()"
        >
          <UndoOutlined />撤销
        </button>
        <button
          type="button"
          class="drawmap__btn drawmap__btn--primary"
          @click="tool.addPoint()"
        >
          <AimOutlined />打点
        </button>
        <button
          v-if="shapeType !== 1"
          type="button"
          class="drawmap__btn"
          :disabled="!canClosure"
          @click="tool.closePolygon()"
        >
          <CheckOutlined />结束绘制
        </button>
      </template>

      <template v-else>
        <button
          type="button"
          class="drawmap__btn"
          @click="stepRecorder.length ? tool.revoke() : tool.restart()"
        >
          <RedoOutlined v-if="!stepRecorder.length" />
          <UndoOutlined v-else />
          {{ stepRecorder.length ? '撤销' : '重新绘制' }}
        </button>
        <button
          type="button"
          class="drawmap__btn drawmap__btn--primary"
          @click="handleSubmit"
        >
          <SaveOutlined />完成绘制
        </button>
      </template>
    </div>

    <!-- 完成绘制后的结果（源项目 emit submit 给父页面，这里就地展示便于查看） -->
    <div v-if="resultText" class="drawmap__result">{{ resultText }}</div>

    <div
      v-if="status !== 'ready'"
      class="drawmap__status"
      :class="`drawmap__status--${status}`"
    >
      <span class="drawmap__status-text">
        <span v-if="status === 'loading'" class="drawmap__spinner"></span>
        {{ statusText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { Map as LeafletMap, MapOptions } from 'leaflet';
import {
  AimOutlined,
  CheckOutlined,
  EditOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons-vue';
import { initMap, initTiandituLayers, initZoomControl } from './map-init';
import {
  useDrawTool,
  type DrawResult,
  type DrawShapeType,
} from './useDrawTool';

/** 底图状态：首块瓦片到位前盖一层浮层 */
type DrawMapStatus = 'loading' | 'ready' | 'error';

/** 形状切换项：1 点 / 2 线 / 3 面（取值与绘制模块一致） */
const SHAPES: Array<{ value: DrawShapeType; label: string }> = [
  { value: 3, label: '面' },
  { value: 2, label: '线' },
  { value: 1, label: '点' },
];

const props = withDefaults(
  defineProps<{
    /** 初始中心点 [纬度, 经度]（leaflet 的 [lat, lng] 顺序） */
    center?: [number, number];
    /** 初始缩放级别：默认放到街区级，便于直接绘制地块 */
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    /** 是否挂载右下角缩放控件 */
    showZoomControl?: boolean;
    /** 初始形状类型：1 点 / 2 线 / 3 面，缺省「面」（地块绘制的主场景） */
    shape?: DrawShapeType;
    /**
     * 已有轮廓（编辑态）：坐标顺序 [经度, 纬度]，面的闭合环可以带 / 不带末尾重复首点
     * （载入时会补齐），可直接把 submit 抛出的 path 传回来做二次编辑
     */
    path?: Array<[number, number]>;
    /** 其余原样透传给 L.map 的配置 */
    mapOption?: MapOptions;
  }>(),
  {
    center: () => [30.5, 116.45] as [number, number],
    zoom: 14,
    minZoom: 3,
    maxZoom: 19,
    showZoomControl: true,
    shape: 3,
    path: undefined,
    mapOption: () => ({}),
  },
);

const emit = defineEmits<{
  /** 地图实例创建并挂好底图与绘制图层后抛出 */
  loaded: [map: LeafletMap];
  /** 点击「完成绘制」并校验通过后抛出（字段见 DrawResult） */
  submit: [result: DrawResult];
}>();

const rootRef = ref<HTMLElement | null>(null);
const mapRef = ref<HTMLElement | null>(null);
const map = shallowRef<LeafletMap | null>(null);
const status = ref<DrawMapStatus>('loading');

/** 绘制状态机（状态都是 ref / computed，模板直接绑定） */
const tool = useDrawTool();
const {
  shapeType,
  step,
  isSnapped,
  drawTip,
  canClosure,
  showCrosshair,
  notice,
} = tool;
const { stepRecorder, result } = tool;

/** 首块瓦片到位后就不再回退成 loading / error（后续单块失败不打断展示） */
let hasTileLoaded = false;
/** 连续失败计数：偶发丢一块不算失败，累计到阈值才提示 */
let tileErrorCount = 0;
/** invalidateSize 防抖句柄 */
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let resizeObserver: ResizeObserver | null = null;

const statusText = computed(() =>
  status.value === 'error'
    ? '底图加载失败，请检查网络或天地图 key'
    : '底图加载中…',
);

/** 结果浮层文案：面看面积、线看周长、点看坐标 */
const resultText = computed(() => {
  const data = result.value;
  if (!data) {
    return '';
  }
  if (data.shapeType === 1) {
    const [lng, lat] = data.path[0];
    return `坐标 ${lng.toFixed(4)}, ${lat.toFixed(4)}`;
  }
  if (data.shapeType === 3) {
    return `面积 ${data.area}${data.unit} · 顶点 ${data.pointCount} 个`;
  }
  return `周长 ${data.length}米 · 顶点 ${data.pointCount} 个`;
});

function handleTileLoad() {
  if (hasTileLoaded) {
    return;
  }
  hasTileLoaded = true;
  status.value = 'ready';
}

function handleTileError() {
  if (hasTileLoaded) {
    return;
  }
  tileErrorCount += 1;
  if (tileErrorCount >= 4) {
    status.value = 'error';
  }
}

/**
 * 读取绘制配色（CSS 变量）：leaflet 的 SVG / divIcon 用 attribute 上色、无法直接用
 * CSS 变量，与 chart 组件读取 echarts 配色的做法一致，运行时 getComputedStyle
 * 读取组件根元素上的同名变量，读取失败回退默认值。
 */
function readDrawColors() {
  if (!rootRef.value) {
    return null;
  }
  const styles = getComputedStyle(rootRef.value);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    line: read('--dm-line-color', '#00f6ff'),
    moveLine: read('--dm-line-move-color', '#ffffff'),
    warning: read('--dm-warning-color', '#ff0000'),
    snap: read('--dm-snap-color', '#0fa87b'),
    fill: read('--dm-fill-color', '#000000'),
  };
}

/**
 * 尺寸自适应（防抖）：ResizeObserver 监听地图容器尺寸变化后调用 invalidateSize。
 * 覆盖窗口缩放、DOM 被 appendChild 到新容器（父节点变化触发 reflow）、
 * 父容器 grid 重排三种场景；组件销毁时 disconnect 释放观察器。
 */
function handleResize() {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  resizeTimer = setTimeout(() => {
    resizeTimer = null;
    map.value?.invalidateSize();
  }, 200);
}

/** 完成绘制：校验通过后把数据交给父级（源项目 submitData） */
function handleSubmit() {
  const data = tool.submit();
  if (data) {
    emit('submit', data);
  }
}

/** 建图：实例 + 天地图影像/注记双图层 + 缩放控件 + 地块绘制能力 */
function createMap() {
  if (!mapRef.value) {
    return;
  }

  const instance = initMap(mapRef.value, {
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
    center: props.center,
    zoom: props.zoom,
    ...props.mapOption,
  });
  const tileGroup = initTiandituLayers(instance);
  // 注意：L.layerGroup 不会把子图层事件冒泡到 map（只有 featureGroup 会），
  // 所以瓦片加载事件必须直接挂到每个 tileLayer 上，挂在 map 上永远收不到。
  tileGroup.getLayers().forEach((layer) => {
    layer.on('tileload', handleTileLoad);
    layer.on('tileerror', handleTileError);
  });
  if (props.showZoomControl) {
    initZoomControl(instance);
  }

  // 绘制能力：十字锚点、顶点 / 标注图层、地图拖动与缩放事件都在这里接管
  tool.mount(instance, {
    type: props.shape,
    path: props.path,
    colors: readDrawColors() ?? undefined,
  });

  map.value = instance;
  emit('loaded', instance);
}

onMounted(() => {
  createMap();
  if (mapRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mapRef.value);
  }
});

onBeforeUnmount(() => {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }
  resizeObserver?.disconnect();
  resizeObserver = null;
  // 先解绑绘制模块的地图事件与图层，再销毁地图实例
  tool.destroy();
  map.value?.remove();
  map.value = null;
});

/** 供父级拿到地图实例继续扩展（叠加图层等） */
function getMap() {
  return map.value;
}

defineExpose({ getMap });
</script>

<style lang="scss" scoped>
.drawmap {
  --dm-canvas-bg: #0b1a2b;
  --dm-status-bg: rgba(0, 0, 0, 0.55);
  --dm-status-text: #ffffff;
  --dm-status-error: #ff7d00;
  --dm-ctrl-bg: #ffffff;
  --dm-ctrl-text: #1f2d3d;
  --dm-ctrl-line: #e5eaf0;
  --dm-ctrl-hover-bg: #f4f6f8;
  --dm-attribution-bg: rgba(255, 255, 255, 0.8);
  --dm-attribution-text: #5c6b7a;
  --dm-line-color: #00f6ff;
  --dm-line-move-color: #ffffff;
  --dm-warning-color: #ff0000;
  --dm-snap-color: #0fa87b;
  --dm-fill-color: #000000;
  --dm-brush-color: #00f6ff;
  --dm-crosshair-color: #ffffff;
  --dm-tip-bg: rgba(0, 0, 0, 0.75);
  --dm-tip-text: #ff7d00;
  --dm-toolbar-bg: rgba(0, 0, 0, 0.55);
  --dm-btn-bg: rgba(255, 255, 255, 0.92);
  --dm-btn-text: #1f2d3d;
  --dm-btn-disabled-bg: rgba(255, 255, 255, 0.4);
  --dm-primary-bg: #1677ff;
  --dm-primary-text: #ffffff;
  --dm-label-text: #ffffff;
  --dm-label-shadow: rgba(0, 0, 0, 0.8);
  --dm-result-bg: rgba(0, 0, 0, 0.55);
  --dm-result-text: #ffffff;

  position: relative;
  width: 100%;
  height: 100%;
  // 父容器无确定高度时兜底（如画廊 auto 高度盒子）
  min-width: 240px;
  min-height: 180px;
  overflow: hidden;
  background: var(--dm-canvas-bg);

  &__canvas {
    width: 100%;
    height: 100%;
  }

  /* ---------- leaflet 容器（与 basemap 一致） ---------- */
  :deep(.leaflet-container) {
    width: 100%;
    height: 100%;
    background-color: transparent !important;
    outline: 0 !important;
    font-family: inherit;
    font-size: 12px;
    // 拖拽地图时不要选中文本（绘制过程需要频繁拖动）
    -webkit-user-select: none;
    user-select: none;
  }

  /* 注意：源组件里还有一段 .leaflet-tile-container img 的
     image-rendering / backface-visibility / transform: translateZ(0) !important 规则，
     但它写在 scoped 样式里、编译后带 [data-v-xxx]，而瓦片 <img> 是 Leaflet
     运行时动态创建的、不带该属性 —— 在源项目里从未生效（死代码）。
     这里若用 :deep() 迁移会把它激活，transform !important 会覆盖 Leaflet
     写在每块瓦片上的内联 translate3d 定位，导致所有切片叠在同一位置，
     因此整段不迁移。 */

  /* ---------- 缩放控件（右下角，与源组件一致） ---------- */
  :deep(.leaflet-control-zoom) {
    margin-right: 10px;
    margin-bottom: 40px;
    border: none;
  }

  :deep(.leaflet-bar) {
    border: none;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
  }

  :deep(.leaflet-bar a) {
    width: 26px;
    height: 26px;
    line-height: 26px;
    font-size: 18px;
    background: var(--dm-ctrl-bg);
    color: var(--dm-ctrl-text);
    border-bottom: 1px solid var(--dm-ctrl-line);
    transition: background-color 0.2s;

    &:hover {
      background: var(--dm-ctrl-hover-bg);
      color: var(--dm-ctrl-text);
    }

    &.leaflet-disabled {
      background: var(--dm-ctrl-bg);
      color: var(--dm-ctrl-line);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  /* ---------- 版权控件 ---------- */
  :deep(.leaflet-control-attribution) {
    padding: 0 6px;
    background: var(--dm-attribution-bg);
    color: var(--dm-attribution-text);
    font-size: 11px;
    line-height: 18px;

    a {
      color: var(--dm-attribution-text);
    }
  }

  /* ---------- 十字准星（画笔落点提示，源项目 add-point-cross） ---------- */
  &__crosshair {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 600;
    width: 22px;
    height: 22px;
    transform: translate(-50%, -50%);
    color: var(--dm-crosshair-color);
    pointer-events: none;

    /* 横竖两根线 + 中间留空，中间空位对准画笔锚点 */
    &::before,
    &::after {
      content: '';
      position: absolute;
      background: currentColor;
      box-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
    }

    &::before {
      top: 50%;
      left: 0;
      width: 100%;
      height: 1px;
      margin-top: -0.5px;
    }

    &::after {
      top: 0;
      left: 50%;
      width: 1px;
      height: 100%;
      margin-left: -0.5px;
    }

    /* 吸附到起点：准星变绿，提示再打一点即闭合（源项目 isTempClosure 用绿色） */
    &.is-snapped {
      color: var(--dm-snap-color);
      transform: translate(-50%, -50%) scale(1.25);
    }
  }

  /* ---------- 顶部：形状切换 + 步骤提示 + 交互提示 ---------- */
  &__top {
    position: absolute;
    top: 10px;
    left: 50%;
    z-index: 700;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: calc(100% - 20px);
    transform: translateX(-50%);
    pointer-events: none;
  }

  &__shapes {
    display: flex;
    gap: 2px;
    padding: 2px;
    border-radius: 999px;
    background: var(--dm-toolbar-bg);
    pointer-events: auto;
  }

  &__shape {
    min-width: 34px;
    height: 22px;
    padding: 0 8px;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--dm-btn-bg);
    font-size: 12px;
    line-height: 22px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &.is-active {
      background: var(--dm-primary-bg);
      color: var(--dm-primary-text);
    }
  }

  &__tip,
  &__notice {
    max-width: 100%;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    line-height: 16px;
    text-align: center;
  }

  &__tip {
    background: var(--dm-tip-bg);
    color: var(--dm-tip-text);
  }

  /* 交互提示（两点过近 / 边界交叉 / 点数不足 / 完成后的 JSON 信息），替代源项目的 vant Toast */
  &__notice {
    background: var(--dm-warning-color);
    color: var(--dm-status-text);
    white-space: normal;
    word-break: break-all;
  }

  /* ---------- 底部操作栏（源项目 footer 三种步骤状态） ---------- */
  &__toolbar {
    position: absolute;
    bottom: 10px;
    left: 50%;
    z-index: 700;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px;
    border-radius: 999px;
    background: var(--dm-toolbar-bg);
    transform: translateX(-50%);
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 10px;
    border: none;
    border-radius: 999px;
    background: var(--dm-btn-bg);
    color: var(--dm-btn-text);
    font-size: 12px;
    line-height: 26px;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, opacity 0.2s;

    :deep(.anticon) {
      font-size: 12px;
    }

    &.drawmap__btn--primary {
      background: var(--dm-primary-bg);
      color: var(--dm-primary-text);
      font-weight: 500;
    }

    &:disabled {
      background: var(--dm-btn-disabled-bg);
      color: var(--dm-btn-text);
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  /* ---------- 绘制结果浮层 ---------- */
  &__result {
    position: absolute;
    bottom: 10px;
    left: 10px;
    z-index: 700;
    padding: 4px 10px;
    border-radius: 6px;
    background: var(--dm-result-bg);
    color: var(--dm-result-text);
    font-size: 11px;
    line-height: 16px;
    pointer-events: none;
  }

  /* ---------- 状态浮层 ---------- */
  &__status {
    position: absolute;
    inset: 0;
    z-index: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    /* 加载中：只留居中胶囊，不遮挡正在渲染的瓦片 */
    &--loading .drawmap__status-text {
      background: var(--dm-status-bg);
      color: var(--dm-status-text);
    }

    /* 失败：整块压暗，避免只看到一片空白底图 */
    &--error {
      background: var(--dm-status-bg);
    }

    &--error .drawmap__status-text {
      border-radius: 6px;
      color: var(--dm-status-error);
    }
  }

  &__status-text {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    line-height: 18px;
    white-space: nowrap;
  }

  &__spinner {
    width: 12px;
    height: 12px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    opacity: 0.75;
    animation: drawmap-spin 0.8s linear infinite;
  }

  /* ---------- 绘制图层（leaflet 运行时创建的 DOM，样式需 :deep 触达） ---------- */

  /* 画笔锚点：十字准星下方的实际落点 */
  :deep(.dm-brush) {
    background: none;
    border: none;
  }

  :deep(.dm-brush__dot) {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--dm-brush-color);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
  }

  /* 顶点：实点（外白内彩）/ 边中点（更小更淡） */
  :deep(.dm-vertex) {
    background: none;
    border: none;
  }

  :deep(.dm-vertex__dot) {
    display: block;
    width: 100%;
    height: 100%;
    border: 2px solid var(--dm-status-text);
    border-radius: 50%;
    background: var(--dm-icon-color);
    box-sizing: border-box;
  }

  :deep(.dm-vertex--temp .dm-vertex__dot) {
    border-width: 1px;
    opacity: 0.8;
  }

  /* 距离 / 面积标注 */
  :deep(.dm-label) {
    background: none;
    border: none;
  }

  :deep(.dm-label__text) {
    position: absolute;
    top: 0;
    left: 0;
    display: inline-block;
    // 居中到标注锚点；距离标注会在行内再覆盖成 translate + rotate（旋转仍绕文字中心）
    transform: translate(-50%, -50%);
    color: var(--dm-label-text);
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    white-space: nowrap;
    text-align: center;
    transform-origin: center center;
    // 四向描边，保证压在卫星影像上也看得清（源项目 text-shadow 同思路）
    text-shadow: 0 2px 1px var(--dm-label-shadow),
      2px 0 1px var(--dm-label-shadow), 0 -2px 1px var(--dm-label-shadow),
      -2px 0 1px var(--dm-label-shadow);
  }

  :deep(.dm-label--area .dm-label__text) {
    font-size: 13px;
    font-weight: 700;
  }
}

@keyframes drawmap-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 暗色主题：只换控件与操作栏的「外壳色」，卫星影像与绘制线条不受主题影响
   （线条配色明暗主题一致，故无需重读 CSS 变量重建图层）。
   注意必须写成 :global(html[data-theme='dark'] .drawmap)，
   写成 :global([data-theme='dark']) .drawmap 会被 scoped 编译丢掉尾部类名。 */
:global(html[data-theme='dark'] .drawmap) {
  --dm-ctrl-bg: #1a1d24;
  --dm-ctrl-text: #e6e8eb;
  --dm-ctrl-line: #2a2f38;
  --dm-ctrl-hover-bg: #23272f;
  --dm-attribution-bg: rgba(26, 29, 36, 0.8);
  --dm-attribution-text: #a8b0bb;
  --dm-btn-bg: rgba(255, 255, 255, 0.14);
  --dm-btn-text: #e6e8eb;
  --dm-btn-disabled-bg: rgba(255, 255, 255, 0.06);
}

/* 三档屏幕（≤1280 / 1281–1919 / ≥1920）下控件与操作栏尺寸微调 */
@media (max-width: 1280px) {
  .drawmap {
    min-height: 160px;

    :deep(.leaflet-bar a) {
      width: 24px;
      height: 24px;
      line-height: 24px;
      font-size: 16px;
    }

    .drawmap__btn {
      height: 24px;
      padding: 0 8px;
      font-size: 11px;
      line-height: 24px;
    }

    .drawmap__tip,
    .drawmap__notice {
      font-size: 10px;
    }
  }
}

@media (min-width: 1920px) {
  .drawmap {
    min-height: 200px;

    :deep(.leaflet-bar a) {
      width: 30px;
      height: 30px;
      line-height: 30px;
      font-size: 20px;
    }

    .drawmap__btn {
      height: 30px;
      padding: 0 14px;
      font-size: 13px;
      line-height: 30px;
    }

    .drawmap__tip,
    .drawmap__notice {
      font-size: 12px;
    }

    :deep(.dm-label__text) {
      font-size: 13px;
    }
  }
}
</style>
