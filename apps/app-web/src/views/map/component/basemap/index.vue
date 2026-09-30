<!--
  组件名称：BaseMap（天地图卫星底图 / 地图初始化）
  来源迁移：D:\sn-project\frp_miniprogram_h5\src\components\gis\BaseMapLeaflet.vue
            D:\sn-project\frp_miniprogram_h5\src\components\drawMap\index.vue（initMapFn 的底图初始化部分）
            D:\sn-project\frp_miniprogram_h5\src\utils\gis\base.ts（initMap / initTiandituLayers）
            D:\sn-project\frp_miniprogram_h5\src\utils\gis\get-tianditu-key.ts

  依赖插件 / 版本：
    - leaflet ^1.9.4（本项目实际安装 1.9.4；源项目为 1.7.1，本组件只用两版都有的公共 API）
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .basemap 上）：
    --bm-canvas-bg        #0b1a2b                 瓦片到位前的容器兜底底色
    --bm-status-bg        rgba(0, 0, 0, 0.55)      状态浮层背景
    --bm-status-text      #ffffff                  状态浮层文字
    --bm-status-error     #ff7d00                  加载失败文字
    --bm-ctrl-bg          #ffffff                 leaflet 缩放控件背景
    --bm-ctrl-text        #1f2d3d                 控件图标色
    --bm-ctrl-line        #e5eaf0                 控件分隔线 / 禁用色
    --bm-ctrl-hover-bg    #f4f6f8                 控件悬停背景
    --bm-attribution-bg   rgba(255, 255, 255, 0.8) 版权控件背景
    --bm-attribution-text #5c6b7a                 版权控件文字

  迁移说明：
    1. 去除了源项目的外部依赖：vuex（gis/getGisServiceList、gisToken、gisServiceSource）、
       区域轮廓数据（getOutLineRings）、高清影像图层（esri-leaflet 的 TiledMapLayer）、
       绘制模块（initDraw）、用户定位（userLocationMarker）、地名搜索（poiSearch）与
       vant 组件库。本组件只保留「初始化地图」这一层：地图实例 + 天地图影像/注记双图层
       + 右下角缩放控件。
    2. 内联依赖：initMap / initTiandituLayers / getTiandituKey 拷贝进同目录
       map-init.ts；leaflet 的 dist 样式在该文件内 import，保持组件目录自包含。
    3. 配置与源组件一致：MAP_DEFAULT_OPTIONS、TILE_OPTIONS、缩放控件位置（bottomright）
       均按源项目原值；仅把源项目 `Object.assign(默认对象, 入参)` 改写成返回新对象，
       避免多次实例化时默认值被污染（见 map-init.ts 注释）。默认 center 沿用源组件
       BaseMapLeaflet 的 [30.5, 116.45]。
    4. 相较源组件新增的两点（均已在注释中标注）：
       - 容器尺寸变化改用 ResizeObserver 调 map.invalidateSize()，不用 window.resize，
         保证组件被 qiankun 搬到新容器 / 父级 grid 重排后仍能正确重算尺寸
         （遵循 app-web 子系统说明书 §9.1）。
       - 极简状态浮层：瓦片加载中 / 加载失败提示，避免底图不可用时只剩一片空白。
    5. 图片物料：只用 leaflet 自带样式（缩放控件为文字符号），无图片物料，
       本组件目录无需 assets。
-->
<template>
  <div class="basemap">
    <div ref="mapRef" class="basemap__canvas"></div>

    <div
      v-if="status !== 'ready'"
      class="basemap__status"
      :class="`basemap__status--${status}`"
    >
      <span class="basemap__status-text">
        <span v-if="status === 'loading'" class="basemap__spinner"></span>
        {{ statusText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { Map as LeafletMap, MapOptions } from 'leaflet';
import { initMap, initTiandituLayers, initZoomControl } from './map-init';

/** 底图状态：首块瓦片到位前盖一层浮层 */
type BaseMapStatus = 'loading' | 'ready' | 'error';

const props = withDefaults(
  defineProps<{
    /** 初始中心点 [纬度, 经度]（leaflet 的 [lat, lng] 顺序） */
    center?: [number, number];
    /** 初始缩放级别 */
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    /** 是否挂载右下角缩放控件 */
    showZoomControl?: boolean;
    /** 其余原样透传给 L.map 的配置 */
    mapOption?: MapOptions;
  }>(),
  {
    center: () => [30.5, 116.45] as [number, number],
    zoom: 4,
    minZoom: 3,
    maxZoom: 18,
    showZoomControl: true,
    mapOption: () => ({}),
  },
);

const emit = defineEmits<{
  /** 地图实例创建并挂好底图后抛出 */
  loaded: [map: LeafletMap];
}>();

const mapRef = ref<HTMLElement | null>(null);
const map = shallowRef<LeafletMap | null>(null);
const status = ref<BaseMapStatus>('loading');

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

/** 建图：实例 + 天地图影像/注记双图层 + 缩放控件 */
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
.basemap {
  --bm-canvas-bg: #0b1a2b;
  --bm-status-bg: rgba(0, 0, 0, 0.55);
  --bm-status-text: #ffffff;
  --bm-status-error: #ff7d00;
  --bm-ctrl-bg: #ffffff;
  --bm-ctrl-text: #1f2d3d;
  --bm-ctrl-line: #e5eaf0;
  --bm-ctrl-hover-bg: #f4f6f8;
  --bm-attribution-bg: rgba(255, 255, 255, 0.8);
  --bm-attribution-text: #5c6b7a;

  position: relative;
  width: 100%;
  height: 100%;
  // 父容器无确定高度时兜底（如画廊 auto 高度盒子）
  min-width: 240px;
  min-height: 180px;
  overflow: hidden;
  background: var(--bm-canvas-bg);

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
    background: var(--bm-ctrl-bg);
    color: var(--bm-ctrl-text);
    border-bottom: 1px solid var(--bm-ctrl-line);
    transition: background-color 0.2s;

    &:hover {
      background: var(--bm-ctrl-hover-bg);
      color: var(--bm-ctrl-text);
    }

    &.leaflet-disabled {
      background: var(--bm-ctrl-bg);
      color: var(--bm-ctrl-line);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  /* ---------- 版权控件 ---------- */
  :deep(.leaflet-control-attribution) {
    padding: 0 6px;
    background: var(--bm-attribution-bg);
    color: var(--bm-attribution-text);
    font-size: 11px;
    line-height: 18px;

    a {
      color: var(--bm-attribution-text);
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
    &--loading .basemap__status-text {
      background: var(--bm-status-bg);
      color: var(--bm-status-text);
    }

    /* 失败：整块压暗，避免只看到一片空白底图 */
    &--error {
      background: var(--bm-status-bg);
    }

    &--error .basemap__status-text {
      border-radius: 6px;
      color: var(--bm-status-error);
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
    animation: basemap-spin 0.8s linear infinite;
  }
}

@keyframes basemap-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 暗色主题：只换控件与浮层的“外壳色”，卫星影像本身不受主题影响。
   注意必须写成 :global(html[data-theme='dark'] .basemap)，
   写成 :global([data-theme='dark']) .basemap 会被 scoped 编译丢掉尾部类名。 */
:global(html[data-theme='dark'] .basemap) {
  --bm-ctrl-bg: #1a1d24;
  --bm-ctrl-text: #e6e8eb;
  --bm-ctrl-line: #2a2f38;
  --bm-ctrl-hover-bg: #23272f;
  --bm-attribution-bg: rgba(26, 29, 36, 0.8);
  --bm-attribution-text: #a8b0bb;
}

/* 三档屏幕（≤1280 / 1281–1919 / ≥1920）下控件与浮层文案尺寸微调 */
@media (max-width: 1280px) {
  .basemap {
    min-height: 160px;

    :deep(.leaflet-bar a) {
      width: 26px;
      height: 26px;
      line-height: 26px;
      font-size: 17px;
    }

    .basemap__status-text {
      padding: 5px 12px;
      font-size: 11px;
    }
  }
}

@media (min-width: 1920px) {
  .basemap {
    min-height: 200px;

    :deep(.leaflet-bar a) {
      width: 34px;
      height: 34px;
      line-height: 34px;
      font-size: 23px;
    }

    .basemap__status-text {
      padding: 7px 16px;
      font-size: 13px;
    }
  }
}
</style>
