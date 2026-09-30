<!--
  组件名称：AreaMap（区域轮廓与区域以外蒙层 / 地图初始化）
  来源迁移：D:\sn-project\frp_miniprogram_h5\src\components\drawMap\index.vue（initMapFn 的 createMaskLayer 部分）
            D:\sn-project\frp_miniprogram_h5\src\utils\leafletGis\createLayer.js（createMaskLayer）
            D:\sn-project\frp_miniprogram_h5\src\utils\gis\base.ts（initMap / initTiandituLayers）
            D:\sn-project\frp_miniprogram_h5\src\utils\gis\get-tianditu-key.ts
            本组件在 ../basemap/index.vue 的基础上复制改造，基础能力与 BaseMap 一致。

  依赖插件 / 版本：
    - leaflet ^1.9.4（本项目实际安装 1.9.4；源项目为 1.7.1，本组件只用两版都有的公共 API）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .areamap 上）：
    --am-canvas-bg        #0b1a2b                 瓦片到位前的容器兜底底色
    --am-status-bg        rgba(0, 0, 0, 0.55)      状态浮层背景
    --am-status-text      #ffffff                  状态浮层文字
    --am-status-error     #ff7d00                  加载失败文字
    --am-ctrl-bg          #ffffff                 leaflet 缩放控件背景
    --am-ctrl-text        #1f2d3d                 控件图标色
    --am-ctrl-line        #e5eaf0                 控件分隔线 / 禁用色
    --am-ctrl-hover-bg    #f4f6f8                 控件悬停背景
    --am-attribution-bg   rgba(255, 255, 255, 0.8) 版权控件背景
    --am-attribution-text #5c6b7a                 版权控件文字
    --am-outline-color    #00f6ff                 区域轮廓线颜色（leaflet SVG 属性不支持 CSS 变量，
                                                  运行时 getComputedStyle 读取后传给 L.polygon）
    --am-mask-fill        #000000                 「区域以外」蒙层填充色（同上，运行时读取）
    --am-mask-fill-opacity 0.4                    「区域以外」蒙层填充透明度（同上，运行时读取）

  迁移说明：
    1. 相对 basemap 组件的差异：在「初始化地图」之上补齐了源 drawMap/index.vue
       initMapFn 里的 createMaskLayer —— 一个 L.polygon 带两个环实现「轮廓 + 蒙层」：
       外环 = 世界矩形（压暗整张地图），内环 = 区域轮廓（作为洞挖空，露出卫星影像），
       洞的边界即高亮轮廓线；并沿用源逻辑 map.fitBounds 把视图适配到区域范围。
    2. rings 数据源：源项目从 vuex 取（gis/getOutLineRings 接口数据），本组件按规范
       改为内置 mock 示例区域（mask-layer.ts 的 MOCK_REGION_RINGS，不含业务命名），
       同时暴露 rings prop，可传入自定义区域（坐标顺序 [lng, lat]，与源项目一致）。
    3. 内联依赖：createMaskLayer 拷贝进同目录 mask-layer.ts（原地 reverse 改写入参、
       option 整包透传当样式等写法已按注释调整，几何与视觉行为一致）；
       initMap / initTiandituLayers / getTiandituKey 与 basemap 的 map-init.ts 相同
       （按 §8.1 自包含原则各持一份拷贝，改动需两处同步）。
    4. 与 basemap 相同的公共处理（详见 ../basemap/index.vue 注释）：
       ResizeObserver + invalidateSize 尺寸自适应、瓦片事件直挂 tileLayer
       （L.layerGroup 不向 map 冒泡）、状态浮层、
       不迁移源组件中从未生效的 .leaflet-tile-container img transform 死代码规则。
    5. 图片物料：只用 leaflet 自带样式，无图片物料，本组件目录无需 assets。
-->
<template>
  <div ref="rootRef" class="areamap">
    <div ref="mapRef" class="areamap__canvas"></div>

    <div
      v-if="status !== 'ready'"
      class="areamap__status"
      :class="`areamap__status--${status}`"
    >
      <span class="areamap__status-text">
        <span v-if="status === 'loading'" class="areamap__spinner"></span>
        {{ statusText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { Map as LeafletMap, MapOptions } from 'leaflet';
import { initMap, initTiandituLayers, initZoomControl } from './map-init';
import {
  createMaskLayer,
  MOCK_REGION_RINGS,
  type RegionRing,
} from './mask-layer';

/** 底图状态：首块瓦片到位前盖一层浮层 */
type AreaMapStatus = 'loading' | 'ready' | 'error';

const props = withDefaults(
  defineProps<{
    /** 初始中心点 [纬度, 经度]（leaflet 的 [lat, lng] 顺序）；有 rings 时会被 fitBounds 覆盖 */
    center?: [number, number];
    /** 初始缩放级别 */
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    /** 是否挂载右下角缩放控件 */
    showZoomControl?: boolean;
    /**
     * 区域轮廓 rings，坐标顺序 [lng, lat]（与源项目一致）。
     * 缺省用内置的示例区域（mock 数据）
     */
    rings?: RegionRing;
    /** 其余原样透传给 L.map 的配置 */
    mapOption?: MapOptions;
  }>(),
  {
    center: () => [30.5, 116.45] as [number, number],
    zoom: 4,
    minZoom: 3,
    maxZoom: 18,
    showZoomControl: true,
    rings: undefined,
    mapOption: () => ({}),
  },
);

const emit = defineEmits<{
  /** 地图实例创建并挂好底图与蒙层后抛出 */
  loaded: [map: LeafletMap];
}>();

const rootRef = ref<HTMLElement | null>(null);
const mapRef = ref<HTMLElement | null>(null);
const map = shallowRef<LeafletMap | null>(null);
const status = ref<AreaMapStatus>('loading');

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
 * 读取蒙层配色（CSS 变量）：Leaflet 的 SVG path 用 attribute 上色、无法直接用
 * CSS 变量，与 chart 组件读取 echarts 配色的做法一致，运行时 getComputedStyle
 * 读取组件根元素上的同名变量，读取失败回退默认值。
 */
function readMaskColors() {
  if (!rootRef.value) {
    return null;
  }
  const styles = getComputedStyle(rootRef.value);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    outlineColor: read('--am-outline-color', '#00f6ff'),
    fillColor: read('--am-mask-fill', '#000000'),
    fillOpacity: Number(read('--am-mask-fill-opacity', '0.4')) || 0.4,
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

/** 建图：实例 + 天地图影像/注记双图层 + 缩放控件 + 区域轮廓/蒙层 */
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

  // 区域轮廓 + 区域以外蒙层（源 initMapFn 的 createMaskLayer 部分）。
  // 注意 createMaskLayer 内部会 fitBounds 到区域范围，需在底图挂载后调用。
  const maskColors = readMaskColors();
  createMaskLayer(instance, {
    rings: props.rings ?? MOCK_REGION_RINGS,
    ...(maskColors ?? {}),
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
  map.value?.remove();
  map.value = null;
});

/** 供父级拿到地图实例继续扩展（叠加图层、绘制等） */
function getMap() {
  return map.value;
}

defineExpose({ getMap });
</script>

<style lang="scss" scoped>
.areamap {
  --am-canvas-bg: #0b1a2b;
  --am-status-bg: rgba(0, 0, 0, 0.55);
  --am-status-text: #ffffff;
  --am-status-error: #ff7d00;
  --am-ctrl-bg: #ffffff;
  --am-ctrl-text: #1f2d3d;
  --am-ctrl-line: #e5eaf0;
  --am-ctrl-hover-bg: #f4f6f8;
  --am-attribution-bg: rgba(255, 255, 255, 0.8);
  --am-attribution-text: #5c6b7a;
  --am-outline-color: #00f6ff;
  --am-mask-fill: #000000;
  --am-mask-fill-opacity: 0.4;

  position: relative;
  width: 100%;
  height: 100%;
  // 父容器无确定高度时兜底（如画廊 auto 高度盒子）
  min-width: 240px;
  min-height: 180px;
  overflow: hidden;
  background: var(--am-canvas-bg);

  &__canvas {
    width: 100%;
    height: 100%;
  }

  /* ---------- leaflet 容器（源组件 BaseMapLeaflet 的样式） ---------- */
  :deep(.leaflet-container) {
    width: 100%;
    height: 100%;
    background-color: transparent !important;
    outline: 0 !important;
    font-family: inherit;
    font-size: 12px;
  }

  /* 注意：源组件里还有一段 .leaflet-tile-container img 的
     image-rendering / backface-visibility / transform: translateZ(0) !important 规则，
     但它写在 scoped 样式里、编译后带 [data-v-xxx]，而瓦片 <img> 是 Leaflet
     运行时动态创建的、不带该属性 —— 在源项目里从未生效（死代码）。
     这里若用 :deep() 迁移会把它激活，transform !important 会覆盖 Leaflet
     写在每块瓦片上的内联 translate3d 定位，导致所有切片叠在同一位置，
     因此整段不迁移。 */

  /* ---------- 缩放控件（默认右下角，与源组件一致） ---------- */
  :deep(.leaflet-control-zoom) {
    margin-right: 10px;
    margin-bottom: 10px;
    border: none;
  }

  :deep(.leaflet-bar) {
    border: none;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
  }

  :deep(.leaflet-bar a) {
    width: 30px;
    height: 30px;
    line-height: 30px;
    font-size: 20px;
    background: var(--am-ctrl-bg);
    color: var(--am-ctrl-text);
    border-bottom: 1px solid var(--am-ctrl-line);
    transition: background-color 0.2s;

    &:hover {
      background: var(--am-ctrl-hover-bg);
      color: var(--am-ctrl-text);
    }

    &.leaflet-disabled {
      background: var(--am-ctrl-bg);
      color: var(--am-ctrl-line);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  /* ---------- 版权控件 ---------- */
  :deep(.leaflet-control-attribution) {
    padding: 0 6px;
    background: var(--am-attribution-bg);
    color: var(--am-attribution-text);
    font-size: 11px;
    line-height: 18px;

    a {
      color: var(--am-attribution-text);
    }
  }

  /* ---------- 状态浮层 ---------- */
  &__status {
    position: absolute;
    inset: 0;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    /* 加载中：只留居中胶囊，不遮挡正在渲染的瓦片 */
    &--loading .areamap__status-text {
      background: var(--am-status-bg);
      color: var(--am-status-text);
    }

    /* 失败：整块压暗，避免只看到一片空白底图 */
    &--error {
      background: var(--am-status-bg);
    }

    &--error .areamap__status-text {
      border-radius: 6px;
      color: var(--am-status-error);
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
    animation: areamap-spin 0.8s linear infinite;
  }
}

@keyframes areamap-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 暗色主题：只换控件与浮层的“外壳色”，卫星影像与蒙层本身不受主题影响。
   注意必须写成 :global(html[data-theme='dark'] .areamap)，
   写成 :global([data-theme='dark']) .areamap 会被 scoped 编译丢掉尾部类名。 */
:global(html[data-theme='dark'] .areamap) {
  --am-ctrl-bg: #1a1d24;
  --am-ctrl-text: #e6e8eb;
  --am-ctrl-line: #2a2f38;
  --am-ctrl-hover-bg: #23272f;
  --am-attribution-bg: rgba(26, 29, 36, 0.8);
  --am-attribution-text: #a8b0bb;
}

/* 三档屏幕（≤1280 / 1281–1919 / ≥1920）下控件与浮层文案尺寸微调 */
@media (max-width: 1280px) {
  .areamap {
    min-height: 160px;

    :deep(.leaflet-bar a) {
      width: 26px;
      height: 26px;
      line-height: 26px;
      font-size: 17px;
    }

    .areamap__status-text {
      padding: 5px 12px;
      font-size: 11px;
    }
  }
}

@media (min-width: 1920px) {
  .areamap {
    min-height: 200px;

    :deep(.leaflet-bar a) {
      width: 34px;
      height: 34px;
      line-height: 34px;
      font-size: 23px;
    }

    .areamap__status-text {
      padding: 7px 16px;
      font-size: 13px;
    }
  }
}
</style>
