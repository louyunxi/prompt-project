/**
 * 区域蒙层（自包含，仅依赖 leaflet 本身）
 *
 * 来源迁移（原样内联，未做语义改写）：
 *   - D:\sn-project\frp_miniprogram_h5\src\utils\leafletGis\createLayer.js
 *     → createMaskLayer
 *   - 调用方参考 D:\sn-project\frp_miniprogram_h5\src\components\drawMap\index.vue
 *     的 initMapFn：`createMaskLayer(map, { rings: store.getters['gis/getOutLineRings'] })`
 *
 * 依赖插件 / 版本：
 *   - leaflet ^1.9.4（源项目为 1.7.1，本模块只用两版都具备的公共 API）
 *
 * 迁移说明：
 *   1. 源函数用 `rings.map(item => item.map(i => i.reverse()))` **原地 reverse**
 *      改写调用方数据；本模块改为 map 出新数组，不修改入参。
 *   2. 源函数把整个 option 对象透传给 L.polygon 当样式（rings 等非样式键也被塞进去）；
 *      本模块拆成 rings（几何）与显式样式参数，行为更明确。
 *   3. 源函数的位置布尔参 isMount / isCenter 改为 options 对象字段，语义不变。
 *   4. 源函数 rings 为空时直接 return（什么都不画）；本模块返回 null 便于调用方感知。
 */
import L from 'leaflet';

/**
 * 区域轮廓 rings。
 * 坐标顺序为 [经度 lng, 纬度 lat]（与源项目 drawData 的 path 字符串 [[lng, lat]] 一致）；
 * Leaflet 需要 [lat, lng]，createMaskLayer 内部会转换。
 */
export type RegionRing = Array<[number, number]>;

export interface MaskLayerOptions {
  /** 区域轮廓 rings，坐标顺序 [lng, lat] */
  rings: RegionRing;
  /** 「区域以外」蒙层填充色 */
  fillColor?: string;
  /** 「区域以外」蒙层填充透明度 */
  fillOpacity?: number;
  /** 区域轮廓线颜色 */
  outlineColor?: string;
  /** 区域轮廓线宽度 */
  outlineWeight?: number;
  /** 是否把蒙层挂到地图上 */
  isMount?: boolean;
  /** 是否把视图适配到区域范围（源函数 isCenter） */
  isCenter?: boolean;
}

/**
 * 世界矩形外环（[lat, lng] 顺序，源项目原值：lat 直接取了 ±180 的极值）。
 * 作为多边形外环、区域轮廓作为洞（hole），即可只压暗「区域以外」的部分。
 */
const WORLD_RING: Array<[number, number]> = [
  [180, -180],
  [-180, -180],
  [-180, 180],
  [180, 180],
];

/**
 * 绘制「区域轮廓 + 区域以外蒙层」。
 *
 * 实现方式与源项目一致：一个 L.polygon 带两个环 ——
 *   外环 = 世界矩形（fillColor 压暗整张地图）
 *   内环 = 区域轮廓（作为洞挖空，露出底下卫星影像）
 * 轮廓线同时描在外环与洞的边界上，洞的边界即区域轮廓线。
 *
 * @param map 地图实例
 * @param options rings 与样式，见 MaskLayerOptions
 * @returns 蒙层图层；rings 为空时返回 null（与源函数「直接 return」对齐）
 */
export function createMaskLayer(
  map: L.Map,
  options: MaskLayerOptions,
): L.Polygon | null {
  const {
    rings,
    fillColor = '#000000',
    fillOpacity = 0.4,
    outlineColor = '#00f6ff',
    outlineWeight = 3,
    isMount = true,
    isCenter = true,
  } = options;

  // 转成 Leaflet 的 [lat, lng]（不改动调用方数据）
  const regionRing = rings.map(([lng, lat]) => [lat, lng] as [number, number]);
  if (!regionRing.length) {
    return null;
  }

  // 视图先适配到区域范围（源函数在挂载蒙层之前做）
  if (isCenter) {
    map.fitBounds(L.polygon(regionRing).getBounds());
  }

  const maskLayer = L.polygon([WORLD_RING, regionRing], {
    color: outlineColor,
    weight: outlineWeight,
    opacity: 1,
    fillColor,
    fillOpacity,
  });
  if (isMount) {
    maskLayer.addTo(map);
  }
  return maskLayer;
}

/**
 * 示例区域 rings（mock 数据，坐标顺序 [lng, lat]）。
 * 源项目的 rings 来自 vuex（gis/getOutLineRings 接口数据），迁移时按规范
 * 换成不含业务语义的通用示例区域：环绕默认中心 [30.5, 116.45] 的一圈多边形。
 */
export const MOCK_REGION_RINGS: RegionRing = [
  [115.8, 30.9],
  [116.4, 31.05],
  [117.0, 30.8],
  [117.2, 30.2],
  [116.7, 29.85],
  [116.0, 29.95],
  [115.65, 30.35],
];
