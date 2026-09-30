/**
 * 底图初始化（自包含，仅依赖 leaflet 本身）
 *
 * 来源迁移（原样内联，未做语义改写）：
 *   - D:\sn-project\frp_miniprogram_h5\src\utils\gis\base.ts
 *     → initMap / initTiandituLayers
 *   - D:\sn-project\frp_miniprogram_h5\src\utils\gis\get-tianditu-key.ts
 *     → getTiandituKey（分时段天地图 key）
 *
 * 依赖插件 / 版本：
 *   - leaflet ^1.9.4（源项目为 1.7.1，本模块只用两版都具备的公共 API）
 *
 * 迁移说明：
 *   1. 源项目 initMap 用 `Object.assign(optionDefault, option)` 直接改写模块级默认对象，
 *      多次调用会污染后续实例的默认值；本模块改为 `{ ...defaults, ...option }` 返回新对象，
 *      行为对单次调用完全一致。
 *   2. 源项目的区域高清影像（createTileLayer / esri-leaflet）、区域蒙层（createMaskLayer）
 *      属于 GIS 服务模块，不在「底图初始化」范围内，未迁移。
 *   3. 天地图 key 为源项目内置的分时段 key，此处原样保留。
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/** 天地图 WMTS 影像底图地址模板（{s} 为子域名、{z}/{x}/{y} 为瓦片坐标） */
export const TIANDITU_IMAGE_URL =
  'https://t{s}.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=';

/** 天地图 WMTS 影像注记地址模板 */
export const TIANDITU_ANNOTATION_URL =
  'https://t{s}.tianditu.gov.cn/DataServer?T=cia_w&X={x}&Y={y}&L={z}&tk=';

/** 分时段天地图 key（源项目 get-tianditu-key.ts 原样搬运） */
const HOUR_MAP_KEY: Record<string, string> = {
  '1-5': 'caa1ad8297b754f86bdb07e13c2d6fd3',
  '6-9': '344534191265f81d09084768c6524808',
  '10-12': 'c979fabbf4feed1749ce6538f1996518',
  '13-14': '7284f074f6b566b4cc6219f1840037eb',
  '15-16': '22997d8558ecb4d33204be1107936a56',
  '17-18': 'e2447c0eb57a0125b8705bbd32f2fed1',
  '19-20': '649e0510b48a0866c17a7199605e2ce7',
  '21-24': '9ff824329d0ff40667c98b2bcf00333e',
};

/** 备用 key：上述时段一个都没匹配上时兜底 */
const TEMP_TOKEN = '0e04da8a36740addc847c32697636518';

/** 取当前时段对应的天地图 key */
export function getTiandituKey(): string {
  const hour = new Date().getHours() + 1;
  const matched = Object.keys(HOUR_MAP_KEY).find((item) => {
    const [start, end] = item.split('-');
    return hour >= Number(start) && hour <= Number(end);
  });
  return (matched && HOUR_MAP_KEY[matched]) || TEMP_TOKEN;
}

/** 地图默认配置（源项目 base.ts 的 optionDefault） */
const MAP_DEFAULT_OPTIONS: L.MapOptions = {
  minZoom: 3,
  maxZoom: 18,
  center: [38, 103.89],
  zoom: 4,
  zoomDelta: 1,
  zoomSnap: 1,
  dragging: true,
  touchZoom: true,
  bounceAtZoomLimits: false,
  zoomControl: false,
  attributionControl: false,
  crs: L.CRS.EPSG3857,
};

/** 瓦片图层默认配置（源项目 base.ts 的 tileOptions） */
const TILE_OPTIONS: L.TileLayerOptions = {
  subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
  maxZoom: 21,
  maxNativeZoom: 18,
  tileSize: 256,
  keepBuffer: 2,
  updateWhenZooming: false,
  crossOrigin: true,
};

/**
 * 创建地图实例（此时还没有任何图层）。
 * @param el 地图容器元素
 * @param option 覆盖默认配置的 MapOptions
 */
export function initMap(el: HTMLElement, option: L.MapOptions = {}): L.Map {
  return L.map(el, { ...MAP_DEFAULT_OPTIONS, ...option });
}

/**
 * 挂载天地图卫星底图：影像底图 + 影像注记两组瓦片，包在同一个 LayerGroup 里。
 * @param map 地图实例
 * @param key 天地图 key，缺省按当前时段自动取
 */
export function initTiandituLayers(
  map: L.Map,
  key = getTiandituKey(),
): L.LayerGroup {
  const layerGroup = L.layerGroup([
    L.tileLayer(`${TIANDITU_IMAGE_URL}${key}`, TILE_OPTIONS),
    L.tileLayer(`${TIANDITU_ANNOTATION_URL}${key}`, {
      ...TILE_OPTIONS,
      zIndex: 1,
    }),
  ]);
  layerGroup.addTo(map);
  return layerGroup;
}

/**
 * 挂载缩放控件（源项目 drawMap/index.vue 的 initMapFn 中显式追加，默认右下角）。
 * @param map 地图实例
 * @param position 控件位置
 */
export function initZoomControl(
  map: L.Map,
  position: L.ControlPosition = 'bottomright',
): L.Control.Zoom {
  const zoomControl = L.control.zoom({ position });
  zoomControl.addTo(map);
  return zoomControl;
}
