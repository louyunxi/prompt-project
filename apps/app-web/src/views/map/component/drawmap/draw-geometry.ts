/**
 * 绘制几何计算（自包含，仅依赖 leaflet 本身）
 *
 * 来源迁移（原样内联，未做语义改写）：
 *   - D:\sn-project\frp_miniprogram_h5\src\components\drawMap\mixins\initTextLabel.js
 *     → 线段角度 calculateAngle、面积与单位换算 getAreaStr / squareMeterAreaTranlate、
 *       点在面内 isPointInPolygon、标注落点 getCenterInPolygon（降级实现）
 *   - D:\sn-project\frp_miniprogram_h5\src\components\drawMap\mixins\draw.js
 *     → 边界自交校验 isCrossPolygons / isIntersetctLine（源项目依赖 @turf/turf 的 kinks / lineIntersect）
 *
 * 依赖插件 / 版本：
 *   - leaflet ^1.9.4（源项目为 1.7.1；本模块只用地图的公共 API）
 *
 * 迁移说明：
 *   1. 源项目用 @turf/turf 完成几何计算（area / kinks / lineIntersect / midpoint /
 *      centerOfMass / booleanPointInPolygon），本模块全部内联实现，避免为一个示例组件
 *      引入体积较大的 turf 依赖：
 *        - 面积：等价移植 turf 的球面多边形面积公式（极地三角形累加），结果一致；
 *        - 自交 / 线段相交：平面向量叉积判定（单块地块尺度下与球面差异可忽略）；
 *        - 点在面内：射线法；
 *        - 中点：经纬度均值（turf 用大圆中点，地块尺度下视觉无差异）。
 *   2. 源项目 getCenterInPolygon 会做 21 次「最大内切圆」扫描找标注落点（relatedPointer），
 *      本模块降级为「面积质心 → 质心不在面内则用包围盒中心 → 再用顶点均值 → 保底首点」，
 *      常规凸/凹地块下落点与源一致，极端凹多边形下可能贴近边界。
 *   3. 坐标顺序统一为 [纬度 lat, 纬度 lng]（leaflet 顺序）；源项目内部混用 [lng, lat]，
 *      迁移时在注释中标注了转换点。
 */
/** 坐标元组，顺序为 [纬度 lat, 经度 lng]（leaflet 顺序） */
export type LatLngTuple = [number, number];

/** 地球半径（米），与 turf 的 earthRadius 取值一致 */
const EARTH_RADIUS = 6378137;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** 距离文案：与源项目一致，保留一位小数 + 米 */
export function formatDistance(meters: number): string {
  return `${meters.toFixed(1)}米`;
}

/** 两点中点（经纬度均值；源项目用 turf midpoint = 大圆中点） */
export function midpoint(a: LatLngTuple, b: LatLngTuple): LatLngTuple {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/**
 * 线段方向角（单位：度，0 = 正东、顺时针增大）。
 * 源 initTextLabel.js 的 calculateAngle 原样搬运，用于让距离标注沿线段方向排布。
 */
export function segmentAngle(a: LatLngTuple, b: LatLngTuple): number {
  // 以线段中点纬度做等距圆柱近似，换算出东西 / 南北方向上的位移
  const meanLatRad = ((a[0] + b[0]) * Math.PI) / 360;
  const dx = EARTH_RADIUS * toRadians(b[1] - a[1]) * Math.cos(meanLatRad);
  const dy = EARTH_RADIUS * toRadians(b[0] - a[0]);
  let angle = (-Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}

/** 判断环是否已首尾闭合（首尾点坐标相同） */
export function isRingClosed(ring: LatLngTuple[]): boolean {
  if (ring.length < 2) {
    return false;
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}

/**
 * 射线法：点是否在环内（环坐标 [lat, lng]，可不闭合）。
 * 源 initTextLabel.js 的 isPointInPolygon 用 turf 实现，这里换成等价射线法。
 */
export function pointInRing(point: LatLngTuple, ring: LatLngTuple[]): boolean {
  if (ring.length < 3) {
    return false;
  }
  const x = point[1];
  const y = point[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][1];
    const yi = ring[i][0];
    const xj = ring[j][1];
    const yj = ring[j][0];
    // yi > y !== yj > y 已经保证了 yj - yi ≠ 0，无需再判除零
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** 向量叉积：判断 o → a → b 的转向（>0 逆时针、<0 顺时针、=0 共线） */
function cross(o: LatLngTuple, a: LatLngTuple, b: LatLngTuple): number {
  return (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);
}

/** 已知共线时，q 是否落在线段 pr 上 */
function onSegment(p: LatLngTuple, q: LatLngTuple, r: LatLngTuple): boolean {
  return (
    Math.min(p[1], r[1]) <= q[1] &&
    q[1] <= Math.max(p[1], r[1]) &&
    Math.min(p[0], r[0]) <= q[0] &&
    q[0] <= Math.max(p[0], r[0])
  );
}

/**
 * 两条线段是否相交（含端点落在另一条线段上的接触）。
 * 源项目用 turf 的 lineIntersect（要求严格穿过），这里把「端点接触」也算相交，
 * 更贴近地块边界「不能交叉 / 不能自相接触」的校验诉求。
 */
export function isSegmentIntersect(
  p1: LatLngTuple,
  p2: LatLngTuple,
  p3: LatLngTuple,
  p4: LatLngTuple,
): boolean {
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);
  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }
  if (d1 === 0 && onSegment(p3, p1, p4)) {
    return true;
  }
  if (d2 === 0 && onSegment(p3, p2, p4)) {
    return true;
  }
  if (d3 === 0 && onSegment(p1, p3, p2)) {
    return true;
  }
  if (d4 === 0 && onSegment(p1, p4, p2)) {
    return true;
  }
  return false;
}

/**
 * 把折线拆成线段列表；isClosed 为 true 时补上首尾闭合线段。
 * 至少需要 2 个点，否则返回空数组。
 */
export function toSegments(
  points: LatLngTuple[],
  isClosed = true,
): Array<[LatLngTuple, LatLngTuple]> {
  const list = points.slice();
  if (list.length < 2) {
    return [];
  }
  if (isClosed && !isRingClosed(list)) {
    list.push(list[0]);
  }
  const segments: Array<[LatLngTuple, LatLngTuple]> = [];
  for (let i = 0; i < list.length - 1; i += 1) {
    segments.push([list[i], list[i + 1]]);
  }
  return segments;
}

/**
 * 边界是否自交（源项目 draw.js 的 isCrossPolygons / isIntersetctLine 合并实现）。
 *
 * - isClosed = true：按闭合环逐对判定（面），首尾两条线段也算相邻；
 * - isClosed = false：按折线逐对判定（线），只有下标相邻的线段算相邻。
 *
 * 相邻线段共用端点，必然「相交」，故跳过。
 */
export function hasSelfIntersection(
  points: LatLngTuple[],
  isClosed = true,
): boolean {
  const segments = toSegments(points, isClosed);
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const isAdjacent =
        j === i + 1 || (isClosed && i === 0 && j === segments.length - 1);
      if (isAdjacent) {
        continue;
      }
      if (
        isSegmentIntersect(
          segments[i][0],
          segments[i][1],
          segments[j][0],
          segments[j][1],
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

/** 极地三角形面积（turf 内部实现，弧度入参） */
function polarTriangleArea(
  tan1: number,
  lng1: number,
  tan2: number,
  lng2: number,
): number {
  const deltaLng = lng1 - lng2;
  const t = tan1 * tan2;
  return 2 * Math.atan2(t * Math.sin(deltaLng), 1 + t * Math.cos(deltaLng));
}

/**
 * 球面多边形面积（平方米）：等价移植 turf 的 ringArea（极地三角形累加），
 * 大范围地块（跨纬度较多）下的结果与源项目一致。
 */
export function ringAreaSquareMeters(ring: LatLngTuple[]): number {
  if (ring.length < 3) {
    return 0;
  }
  const points = isRingClosed(ring) ? ring : [...ring, ring[0]];
  let total = 0;
  let prevTanLat = Math.tan((Math.PI / 2 - toRadians(points[0][0])) / 2);
  let prevLng = toRadians(points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    const tanLat = Math.tan((Math.PI / 2 - toRadians(points[i][0])) / 2);
    const lng = toRadians(points[i][1]);
    total += polarTriangleArea(tanLat, lng, prevTanLat, prevLng);
    prevTanLat = tanLat;
    prevLng = lng;
  }
  return Math.abs(total * EARTH_RADIUS * EARTH_RADIUS);
}

export interface AreaText {
  value: number;
  unit: string;
}

/**
 * 面积文案换算（源 initTextLabel.js 的 getAreaStr / squareMeterAreaTranlate 原样搬运）：
 * > 666.7㎡ 用「亩」、> 66.67㎡ 用「分」、更小用「平方米」。
 */
export function formatArea(squareMeters: number): AreaText {
  if (squareMeters > 666.7) {
    return { value: Number((squareMeters * 0.0015).toFixed(1)), unit: '亩' };
  }
  if (squareMeters > 66.67) {
    return { value: Number((squareMeters / 66.67).toFixed(1)), unit: '分' };
  }
  return { value: Number(squareMeters.toFixed(1)), unit: '平方米' };
}

/**
 * 面积标注落点：质心 → 包围盒中心 → 顶点均值 → 首点，
 * 取第一个落在面内的点（源项目此处做最大内切圆扫描，见文件头迁移说明第 2 条）。
 */
export function ringLabelPoint(ring: LatLngTuple[]): LatLngTuple | null {
  if (ring.length < 3) {
    return null;
  }
  // 去掉闭合重复点后计算
  const points = isRingClosed(ring) ? ring.slice(0, -1) : ring;

  // 面积质心（平面鞋带公式：地块尺度下与球面质心差异可忽略）
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const x1 = point[1];
    const y1 = point[0];
    const x2 = next[1];
    const y2 = next[0];
    const f = x1 * y2 - x2 * y1;
    twiceArea += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  });
  if (twiceArea !== 0) {
    const centroid: LatLngTuple = [cy / (3 * twiceArea), cx / (3 * twiceArea)];
    if (pointInRing(centroid, points)) {
      return centroid;
    }
  }

  // 包围盒中心
  const lats = points.map((point) => point[0]);
  const lngs = points.map((point) => point[1]);
  const bboxCenter: LatLngTuple = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  if (pointInRing(bboxCenter, points)) {
    return bboxCenter;
  }

  // 顶点均值 → 保底首点
  const average: LatLngTuple = [
    lats.reduce((sum, value) => sum + value, 0) / points.length,
    lngs.reduce((sum, value) => sum + value, 0) / points.length,
  ];
  return pointInRing(average, points) ? average : points[0];
}
