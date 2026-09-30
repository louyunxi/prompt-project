<!--
  组件名称：AnhuiMapMarker（安徽区域轮廓光晕走线 + 监测点 Marker）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\ThreeAssetsSupervisionMobile\components\MapView.vue
           D:\external-projects\showcase-dashboard\src\utils\map\leaflet.ts
           apps/app-web/src/views/map/component/basemap/index.vue（天地图底图实现）
           apps/app-web/src/views/map/component/anhui-map/index.vue（轮廓光晕组件）

  依赖插件 / 版本：
    - leaflet ^1.9.4
    - @turf/turf ^7.3.5
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .anhui-map-marker 根元素）：
    --am-theme           #00d4ff    主题高亮色（走线、厚度层、呼吸层）
    --am-bg              #050D16    地图兜底底色 / 外蒙层颜色

  迁移说明：
    1. 在 anhui-map 组件基础上，追加参考 ThreeAssetsSupervision 渲染的监测点 Marker 与城市名称标签。
    2. 天地图底图采用与 basemap 组件一致的 Leaflet 原生 tileLayer 实现。
    3. GeoJSON 数据来自源项目 public/assets/area-data/340000.json 与 340000_full.json，
       已拷贝到本组件所属 app-web 的 public/assets/area-data/ 目录下，运行时通过 fetch 加载。
    4. 无图片物料，无需 assets 目录。
-->
<template>
  <div ref="mapRef" class="anhui-map-marker">
    <div class="anhui-map-marker__overlay"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue';
import {
  control,
  divIcon,
  geoJSON,
  layerGroup,
  map as createLeafletMap,
  marker,
  polygon,
  tileLayer,
  type Map,
  type TileLayerOptions,
} from 'leaflet';
import { featureCollection, union } from '@turf/turf';
import 'leaflet/dist/leaflet.css';

const BASE_URL = import.meta.env.BASE_URL || '/';
const AREA_BASE = `${BASE_URL.replace(/\/$/, '')}/assets/area-data`;
const PROVINCE_URL = `${AREA_BASE}/340000.json`;
const CITY_URL = `${AREA_BASE}/340000_full.json`;

const mapRef = ref<HTMLDivElement>();
let map: Map | null = null;

const THEME_COLOR = '#00d4ff';

// 安徽省 16 个地级市中心坐标（EPSG:4326），用于城市标签与随机点分布基准
const cityCenters = [
  { name: '亳州市', lng: 115.7829, lat: 33.8696 },
  { name: '阜阳市', lng: 115.8147, lat: 32.9152 },
  { name: '淮北市', lng: 116.7947, lat: 33.9719 },
  { name: '宿州市', lng: 116.9845, lat: 33.6338 },
  { name: '蚌埠市', lng: 117.3574, lat: 32.9414 },
  { name: '淮南市', lng: 117.0184, lat: 32.6357 },
  { name: '六安市', lng: 116.5077, lat: 31.7503 },
  { name: '合肥市', lng: 117.2775, lat: 31.8632 },
  { name: '滁州市', lng: 118.3162, lat: 32.3036 },
  { name: '马鞍山市', lng: 118.5079, lat: 31.6805 },
  { name: '芜湖市', lng: 118.371, lat: 31.3282 },
  { name: '铜陵市', lng: 117.8169, lat: 30.9457 },
  { name: '安庆市', lng: 117.0535, lat: 30.5255 },
  { name: '池州市', lng: 117.4893, lat: 30.6306 },
  { name: '黄山市', lng: 118.0352, lat: 29.9075 },
  { name: '宣城市', lng: 118.758, lat: 30.8169 },
];

/** 监测点颜色池 */
const markerColors = ['#00d4ff', '#ff4444', '#ffdd00'];

/** 生成全省级别监测点：基于各市中心随机偏移 */
function generateProvinceMarkers() {
  const excludeIndices = new Set([0, 8, 16, 24, 32]);
  return Array.from({ length: 45 }, (_, i) => {
    if (excludeIndices.has(i)) {
      return null;
    }
    const city = cityCenters[i % cityCenters.length];
    const lngOff = (Math.random() - 0.5) * 0.8;
    const latOff = (Math.random() - 0.5) * 0.6;
    return {
      name: `监测点-${String(i + 1).padStart(2, '0')}`,
      lng: +(city.lng + lngOff).toFixed(4),
      lat: +(city.lat + latOff).toFixed(4),
    };
  }).filter(Boolean) as { name: string; lng: number; lat: number }[];
}

/** 渲染监测点 Marker */
function renderMarkers(mapInstance: Map, list: { name: string; lng: number; lat: number }[]) {
  list.forEach((item) => {
    const color = markerColors[Math.floor(Math.random() * markerColors.length)];
    const icon = divIcon({
      html: `<div class="assets-hit-area"><div class="assets-dot" style="background:${color};box-shadow:0 0 10px ${color}"></div></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      className: 'assets-icon',
    });
    const mk = marker([item.lat, item.lng], { icon }).addTo(mapInstance);
    mk.bindTooltip(
      `<div class="assets-tooltip">
        <div class="assets-marker__dot" style="background:${color};box-shadow:0 0 12px ${color}"></div>
        <div class="assets-marker__info">
          <span class="assets-marker__name">${item.name}</span>
        </div>
      </div>`,
      { sticky: true, direction: 'top', offset: [0, -8], className: 'assets-tooltip-wrapper' },
    );
  });
}

/** 渲染城市名称标签 */
function renderCityLabels(mapInstance: Map) {
  cityCenters.forEach((city) => {
    const icon = divIcon({
      html: `<div class="city-label-marker">${city.name}</div>`,
      iconSize: [50, 20],
      iconAnchor: [25, 10],
      className: 'city-label-icon',
    });
    marker([city.lat, city.lng], { icon, interactive: false }).addTo(mapInstance);
  });
}

/** 天地图 token（与源项目一致，按小时段轮询） */
const timeSlotMapToken: Record<string, string> = {
  '1-5': 'caa1ad8297b754f86bdb07e13c2d6fd3',
  '6-9': '344534191265f81d09084768c6524808',
  '10-12': 'c979fabbf4feed1749ce6538f1996518',
  '13-14': '7284f074f6b566b4cc6219f1840037eb',
  '15-16': '22997d8558ecb4d33204be1107936a56',
  '17-18': 'e2447c0eb57a0125b8705bbd32f2fed1',
  '19-20': '649e0510b48a0866c17a7199605e2ce7',
  '21-24': '9ff824329d0ff40667c98b2bcf00333e',
};
const tempToken = '0e04da8a36740addc847c32697636518';

function getTdtToken(): string {
  const hour = new Date().getHours() + 1;
  const result = Object.keys(timeSlotMapToken).filter((item) => {
    const range = item.split('-');
    return hour >= Number.parseInt(range[0]) && hour <= Number.parseInt(range[1]);
  });
  return result.length ? timeSlotMapToken[result[0]] : tempToken;
}

async function fetchGeoJSON(url: string): Promise<any> {
  const res = await fetch(url);
  return res.json();
}

const TIANDITU_IMAGE_URL =
  'https://t{s}.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=';
const TIANDITU_ANNOTATION_URL =
  'https://t{s}.tianditu.gov.cn/DataServer?T=cia_w&X={x}&Y={y}&L={z}&tk=';

const TILE_OPTIONS: TileLayerOptions = {
  subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
  maxZoom: 21,
  maxNativeZoom: 18,
  tileSize: 256,
  keepBuffer: 2,
  updateWhenZooming: false,
  crossOrigin: true,
};

function createTiandituImgLayer() {
  const key = getTdtToken();
  return layerGroup([
    tileLayer(`${TIANDITU_IMAGE_URL}${key}`, TILE_OPTIONS),
    tileLayer(`${TIANDITU_ANNOTATION_URL}${key}`, {
      ...TILE_OPTIONS,
      zIndex: 1,
    }),
  ]);
}

function createMap(el: string | HTMLElement) {
  const instance = createLeafletMap(el, {
    minZoom: 4,
    maxZoom: 17,
    center: [32.0, 117.5],
    zoom: 7,
    zoomDelta: 1,
    zoomSnap: 0.1,
    dragging: true,
    bounceAtZoomLimits: false,
    zoomControl: false,
    attributionControl: false,
    touchZoom: true,
  });
  control.zoom({ position: 'bottomright' }).addTo(instance);
  return instance;
}

function createMaskLayer(mapInstance: Map, option: any) {
  const rings = option.rings || [[[]]];
  const isFourDimensional = Array.isArray(rings[0][0][0]);

  const reverseRings: any = rings.map((ring: any) =>
    ring.map((point: any) =>
      isFourDimensional
        ? point.map((lnglat: any) => [lnglat[1], lnglat[0]])
        : [point[1], point[0]],
    ),
  );
  const maskRings: any = [
    [
      [180, -180],
      [-180, -180],
      [-180, 180],
      [180, 180],
    ],
    ...((isFourDimensional ? reverseRings.flat(1) : reverseRings) as any),
  ];
  const maskLayer = polygon(maskRings, {
    className: 'mask-layer',
    color: '#00F6FF',
    weight: 1.8,
    opacity: 1,
    fillColor: '#000000',
    fillOpacity: 0.7,
    pmIgnore: true,
    ...option,
  });
  maskLayer.addTo(mapInstance);
  return maskLayer;
}

async function createGridAreaLayer(
  mapInstance: Map,
  fitBoundsOptions?: any,
  latLngBounds?: any,
  themeColor = '#00d4aa',
) {
  const areaNextData = await fetchGeoJSON(CITY_URL);
  const hsl = hexToHsl(themeColor);
  const fillColor = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l * 0.6}%)`;
  const borderColor = getSimilarBrightnessColor(themeColor, 0);

  const anhuiAreaNextLayer = geoJSON(areaNextData.features, {
    style() {
      return {
        weight: 2.3,
        fillColor,
        fillOpacity: 0.25,
        color: borderColor,
      };
    },
  });
  const anhuiBounds = anhuiAreaNextLayer.getBounds();
  anhuiAreaNextLayer.addTo(mapInstance);
  mapInstance.fitBounds(latLngBounds || anhuiBounds, {
    maxZoom: 20,
    ...(fitBoundsOptions || {}),
  });
  return anhuiAreaNextLayer;
}

async function createThicknessOutlineLayer(
  mapInstance: Map,
  options: {
    themeColor?: string;
    layerCount?: number;
    offsetStep?: number;
    opacityStart?: number;
    opacityEnd?: number;
    weightStart?: number;
    weightEnd?: number;
  } = {},
) {
  const {
    themeColor = '#00d4aa',
    layerCount = 12,
    offsetStep = 0.005,
    opacityStart = 0.5,
    opacityEnd = 0.05,
    weightStart = 0.8,
    weightEnd = 2,
  } = options;

  const areaNextData = await fetchGeoJSON(CITY_URL);
  const features = areaNextData.features.filter((f: any) => f.geometry);

  let unionedFeature: any = null;
  for (const feat of features) {
    if (!unionedFeature) {
      unionedFeature = feat;
    } else {
      const result = union(featureCollection([unionedFeature, feat]));
      if (result) {
        unionedFeature = result;
      }
    }
  }

  if (!unionedFeature) {
    return null;
  }

  mapInstance.createPane('thicknessOutlinePane');
  const pane = mapInstance.getPane('thicknessOutlinePane');
  if (pane) {
    pane.style.zIndex = '450';
  }

  const layers: any[] = [];
  const baseColor = hexToRgb(themeColor);

  for (let i = 0; i < layerCount; i++) {
    const ratio = i / (layerCount - 1);
    const offsetX = -(i + 1) * offsetStep;
    const offsetY = -(i + 1) * offsetStep;

    const brightness = 1 - (1 - ratio) * 0.4;
    const r = Math.round(Math.min(255, baseColor.r * brightness));
    const g = Math.round(Math.min(255, baseColor.g * brightness));
    const b = Math.round(Math.min(255, baseColor.b * brightness));
    const opacity = opacityStart + (opacityEnd - opacityStart) * ratio;
    const weight = weightStart + (weightEnd - weightStart) * ratio;
    const gradientColor = `rgb(${r}, ${g}, ${b})`;

    const offsetGeometry = offsetGeoJSON(unionedFeature, offsetX, offsetY);

    if (offsetGeometry) {
      const layer = geoJSON(offsetGeometry, {
        pane: 'thicknessOutlinePane',
        style: () => ({
          weight,
          color: gradientColor,
          fill: false,
          opacity,
          lineCap: 'round' as const,
          lineJoin: 'round' as const,
        }),
      });
      layer.addTo(mapInstance);
      layers.push(layer);
    }
  }

  createRunningLineLayer(mapInstance, unionedFeature, themeColor);
  return layers;
}

function createRunningLineLayer(mapInstance: Map, feature: any, themeColor: string) {
  if (!feature) {
    return;
  }

  mapInstance.createPane('runningLinePane');
  const runPane = mapInstance.getPane('runningLinePane');
  if (runPane) {
    runPane.style.zIndex = '470';
  }

  const brightColor = getSimilarBrightnessColor(themeColor, 0);

  const lineStyleId = 'running-line-style';
  if (!document.getElementById(lineStyleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = lineStyleId;
    styleEl.textContent = `
      @keyframes dashFlow {
        to {
          stroke-dashoffset: -80;
        }
      }
      .running-line-path {
        stroke-dasharray: 40 40;
        animation: dashFlow 3s linear infinite;
        filter: drop-shadow(0 0 4px currentColor) drop-shadow(0 0 8px currentColor);
      }
    `;
    document.head.appendChild(styleEl);
  }

  const layer = geoJSON(feature, {
    pane: 'runningLinePane',
    style: () => ({
      weight: 3,
      color: brightColor,
      fill: false,
      opacity: 1,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    }),
  });

  layer.addTo(mapInstance);

  setTimeout(() => {
    const pathEls = runPane?.querySelectorAll('path');
    pathEls?.forEach((path) => {
      path.classList.add('running-line-path');
    });
  }, 100);

  createBackgroundOutlineLayer(mapInstance, feature, themeColor);
  createBreathingOutlineLayer(mapInstance, feature, themeColor);
  return layer;
}

function createBackgroundOutlineLayer(mapInstance: Map, feature: any, themeColor: string) {
  if (!feature) {
    return;
  }

  mapInstance.createPane('backgroundPane');
  const bgPane = mapInstance.getPane('backgroundPane');
  if (bgPane) {
    bgPane.style.zIndex = '456';
  }

  const assistColor = getSimilarBrightnessColor(themeColor, -25);

  const layer = geoJSON(feature, {
    pane: 'backgroundPane',
    style: () => ({
      weight: 4,
      color: assistColor,
      fill: false,
      opacity: 1,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    }),
  });

  layer.addTo(mapInstance);
  return layer;
}

function createBreathingOutlineLayer(mapInstance: Map, feature: any, themeColor: string) {
  if (!feature) {
    return;
  }

  mapInstance.createPane('breathingPane');
  const breathPane = mapInstance.getPane('breathingPane');
  if (breathPane) {
    breathPane.style.zIndex = '455';
  }

  const baseColor = hexToRgb(themeColor);
  const brightR = Math.min(255, baseColor.r + 80);
  const brightG = Math.min(255, baseColor.g + 80);
  const brightB = Math.min(255, baseColor.b + 80);
  const brightColor = `rgb(${brightR}, ${brightG}, ${brightB})`;

  const breathStyleId = 'breathing-line-style';
  if (!document.getElementById(breathStyleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = breathStyleId;
    styleEl.textContent = `
      @keyframes breathingPulse {
        0%, 100% {
          opacity: 0.2;
          filter: drop-shadow(0 0 3px ${brightColor}) drop-shadow(0 0 6px ${brightColor});
        }
        50% {
          opacity: 0.8;
          filter: drop-shadow(0 0 6px ${brightColor}) drop-shadow(0 0 9px ${brightColor}) drop-shadow(0 0 18px ${brightColor});
        }
      }
      .breathing-line-path {
        animation: breathingPulse 4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styleEl);
  }

  const layer = geoJSON(feature, {
    pane: 'breathingPane',
    style: () => ({
      weight: 2,
      color: brightColor,
      fill: false,
      opacity: 0.6,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    }),
  });

  layer.addTo(mapInstance);

  setTimeout(() => {
    const pathEls = breathPane?.querySelectorAll('path');
    pathEls?.forEach((path) => {
      path.classList.add('breathing-line-path');
    });
  }, 100);

  return layer;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 212, b: 170 };
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  if (sNorm === 0) {
    const v = Math.round(lNorm * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) {
      tt += 1;
    }
    if (tt > 1) {
      tt -= 1;
    }
    if (tt < 1 / 6) {
      return p + (q - p) * 6 * tt;
    }
    if (tt < 1 / 2) {
      return q;
    }
    if (tt < 2 / 3) {
      return p + (q - p) * (2 / 3 - tt) * 6;
    }
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;
  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

function getSimilarBrightnessColor(hex: string, hueShift = 20): string {
  const hsl = hexToHsl(hex);
  const newH = (hsl.h + hueShift + 360) % 360;
  const newS = Math.max(0, hsl.s * 0.8);
  const rgb = hslToRgb(newH, newS, hsl.l);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function offsetGeoJSON(feature: any, offsetX: number, offsetY: number): any {
  if (!feature || !feature.geometry) {
    return null;
  }

  const geometry = feature.geometry;
  const result = { ...feature, geometry: { ...geometry } };

  if (geometry.type === 'Polygon') {
    result.geometry.coordinates = geometry.coordinates.map((ring: number[][]) =>
      ring.map((coord: number[]) => [coord[0] + offsetX, coord[1] + offsetY]),
    );
  } else if (geometry.type === 'MultiPolygon') {
    result.geometry.coordinates = geometry.coordinates.map((polygon: number[][][]) =>
      polygon.map((ring: number[][]) =>
        ring.map((coord: number[]) => [coord[0] + offsetX, coord[1] + offsetY]),
      ),
    );
  } else if (geometry.type === 'MultiLineString') {
    result.geometry.coordinates = geometry.coordinates.map((line: number[][]) =>
      line.map((coord: number[]) => [coord[0] + offsetX, coord[1] + offsetY]),
    );
  } else if (geometry.type === 'LineString') {
    result.geometry.coordinates = geometry.coordinates.map((coord: number[]) => [
      coord[0] + offsetX,
      coord[1] + offsetY,
    ]);
  }

  return result;
}

async function initMap() {
  await nextTick();
  if (!mapRef.value) {
    return;
  }

  map = createMap(mapRef.value);
  createTiandituImgLayer().addTo(map);

  const areaData = await fetchGeoJSON(PROVINCE_URL);

  await createGridAreaLayer(map, { paddingTopLeft: [5, 5], paddingBottomRight: [5, 5] }, undefined, THEME_COLOR);

  createThicknessOutlineLayer(map, {
    themeColor: THEME_COLOR,
    layerCount: 3,
    offsetStep: 0.03,
    opacityStart: 0.6,
    opacityEnd: 0.1,
    weightStart: 2.5,
    weightEnd: 1,
  });

  createMaskLayer(map, {
    color: 'transparent',
    fillOpacity: 0.45,
    fillColor: '#050D16',
    rings: areaData.features[0].geometry?.coordinates,
  });

  renderMarkers(map, generateProvinceMarkers());
  renderCityLabels(map);
}

onMounted(() => {
  initMap();
});

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style lang="scss" scoped>
.anhui-map-marker {
  --am-theme: #00d4ff;
  --am-bg: #050D16;

  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: var(--am-bg);
  border-radius: inherit;

  :deep(.leaflet-container) {
    background: var(--am-bg);
  }

  &__overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }
}

/* 监测点图标：去除 Leaflet 默认背景边框 */
:deep(.assets-icon) {
  background: none !important;
  border: none !important;
}

/* 点击热区：24x24，内部居中放置脉冲点 */
:deep(.assets-hit-area) {
  width: 24px !important;
  height: 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
}

/* 脉冲圆点：呼吸动画，颜色由 Marker 动态注入 */
:deep(.assets-dot) {
  width: 10px !important;
  height: 10px !important;
  border-radius: 50% !important;
  animation: assets-marker-pulse 2s ease-in-out infinite !important;
}

@keyframes assets-marker-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.6;
  }
}

/* 城市标签：白字描边，不参与交互 */
:deep(.city-label-icon) {
  background: none !important;
  border: none !important;
}

:deep(.city-label-marker) {
  color: #fff !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9) !important;
  white-space: nowrap !important;
  text-align: center !important;
  pointer-events: none !important;
}

/* Tooltip 弹窗：深色圆角卡片，左侧带色点 */
:deep(.leaflet-tooltip.assets-tooltip-wrapper) {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
}

:deep(.leaflet-tooltip.assets-tooltip-wrapper:before) {
  display: none !important;
}

:deep(.assets-tooltip) {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 4px 10px !important;
  background: rgba(8, 16, 28, 0.9) !important;
  border-radius: 16px !important;
  white-space: nowrap !important;
  font-size: 14px !important;
}

:deep(.assets-marker__dot) {
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  flex-shrink: 0 !important;
}

:deep(.assets-marker__info) {
  display: flex !important;
  flex-direction: column !important;
  gap: 0 !important;
  line-height: 1.2 !important;
}

:deep(.assets-marker__name) {
  color: #fff !important;
  font-weight: 500 !important;
}
</style>
