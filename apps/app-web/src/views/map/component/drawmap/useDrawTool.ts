/**
 * 地块绘制（自包含，仅依赖 leaflet + vue 的响应式 API）
 *
 * 来源迁移（核心逻辑原样搬运，见文件内逐段注释）：
 *   - D:\sn-project\frp_miniprogram_h5\src\components\drawMap\mixins\draw.js
 *     → initDraw：形状类型 / 步骤机 / 打点 / 撤销 / 闭合 / 重绘 / 保存
 *   - D:\sn-project\frp_miniprogram_h5\src\components\drawMap\mixins\initTextLabel.js
 *     → 距离与面积标注的渲染（去掉了 DOM 包围盒重叠优化，见下）
 *   - 调用方 D:\sn-project\frp_miniprogram_h5\src\components\drawMap\index.vue
 *
 * 依赖插件 / 版本：
 *   - leaflet ^1.9.4（源项目为 1.7.1，本模块只用两版都具备的公共 API）
 *   - vue ^3.5.13（catalog 统一版本，用 ref / computed 暴露状态）
 *
 * 迁移说明：
 *   1. 去掉了源项目的外部依赖：leaflet-geometryutil、leaflet-snap、@turf/turf、vant(Toast)、
 *      vuex / vue-router、图片物料（drag-marker.png / marker.png / revoke.png 等）。
 *      几何计算内联到同目录 draw-geometry.ts；提示语改为组件内 notice，不弹全局 Toast。
 *   2. 吸附用「像素距离」自实现（源项目用 leaflet-snap 插件，默认 5px）：
 *      画笔 / 拖拽把手指向 8px 内最近的顶点时吸附过去；吸附到起点时提示「再打一点即闭合」。
 *   3. 拖拽把手（源项目 drag-marker.png + turf 计算角平分线朝向）改为不带方向的中性「移动」把手，
 *      少一次需要 turf 的计算；把手中点被拖拽时立刻转正为实点（源项目在 dragend 转正），
 *      效果一致但在拖拽过程中点在数组里的引用稳定。
 *   4. 距离标注重叠优化（源项目 optimizeSpanRendering：getBoundingClientRect + 分离轴定理，
 *      重叠的标注清空文本）未迁移：那是为大量地块同屏标注做的取舍，单块地块绘制用不到。
 *   5. 源项目的地址搜索 / 用户定位 / 区域蒙层 / 区域高清影像属于页面与 GIS 服务模块，不在绘制范围内。
 *   6. 坐标顺序：本模块内部统一 [lat, lng]（leaflet 顺序），对外输出 path 统一 [lng, lat]
 *      （与源项目 facilityLocPath 一致）。
 */
import L from 'leaflet';
import { computed, ref } from 'vue';
import {
  formatArea,
  formatDistance,
  hasSelfIntersection,
  midpoint,
  pointInRing,
  ringAreaSquareMeters,
  ringLabelPoint,
  segmentAngle,
  toSegments,
  type LatLngTuple,
} from './draw-geometry';

/** 形状类型：1 点、2 线、3 面（取值与源项目 shapeType 一致） */
export type DrawShapeType = 1 | 2 | 3;

/** 绘制步骤：1 待绘制、2 绘制中、3 已完成（可编辑） */
export type DrawStep = 1 | 2 | 3;

/**
 * 绘制点。
 * isMovePoint：跟随画笔的临时点（始终位于数组末尾，打点时转正）
 * isTempCenter：闭合后自动插入的边中点（拖拽它可新增顶点）
 */
export interface DrawPoint {
  lat: number;
  lng: number;
  isMovePoint: boolean;
  isTempCenter: boolean;
}

/** 绘制配色：Leaflet 的 SVG / divIcon 用 attribute 上色，无法直接吃 CSS 变量，由组件运行时读取后传入 */
export interface DrawColors {
  /** 定稿线条 / 顶点色（--dm-line-color） */
  line: string;
  /** 绘制中的实线与虚线色（--dm-line-move-color） */
  moveLine: string;
  /** 边界自交告警色（--dm-warning-color） */
  warning: string;
  /** 画笔吸附到起点时的提示色（--dm-snap-color） */
  snap: string;
  /** 未闭合多边形的填充色（--dm-fill-color） */
  fill: string;
}

/** 「完成绘制」输出的通用数据结构（源项目 submit 的 facilityXxx 业务字段已改为通用命名） */
export interface DrawResult {
  shapeType: DrawShapeType;
  /**
   * 顶点坐标 [[经度, 纬度], ...]（与源项目 facilityLocPath 的坐标顺序一致）。
   * 面输出闭合环：末尾会重复一次首点（可直接喂给 GeoJSON / 再传回 path 进入编辑态）。
   */
  path: Array<[number, number]>;
  /** 首个顶点 [纬度, 经度] */
  center: LatLngTuple;
  /** 顶点个数（面为去重后的个数） */
  pointCount: number;
  /** 面：面积（已按 亩 / 分 / 平方米 换算） */
  area?: number;
  /** 面：面积单位 */
  unit?: string;
  /** 线：总长度（米） */
  length?: number;
}

export interface DrawToolOptions {
  /** 初始形状类型（缺省「面」——地块绘制的主场景） */
  type?: DrawShapeType;
  /** 已有轮廓（编辑态）：坐标顺序 [lng, lat] */
  path?: Array<[number, number]>;
  /** 线条配色，缺省用内置默认值 */
  colors?: Partial<DrawColors>;
}

const DEFAULT_COLORS: DrawColors = {
  line: '#00f6ff',
  moveLine: '#ffffff',
  warning: '#ff0000',
  snap: '#0fa87b',
  fill: '#000000',
};

/** 默认形状：面（地块绘制） */
const DEFAULT_SHAPE_TYPE: DrawShapeType = 3;

/** 打点时两点最小间距（米）：源项目同值，防止原地叠加打点 */
const MIN_POINT_DISTANCE = 1;

/** 吸附半径（像素）：源项目用 leaflet-snap 默认 5px，这里放宽到 8px 便于触控 */
const SNAP_PIXEL = 8;

/** 标注最小显示缩放级别：源项目 zoom < 12 不渲染距离 / 面积标注 */
const LABEL_MIN_ZOOM = 12;

/** 拖动渲染节流间隔（源项目 30fps） */
const RENDER_INTERVAL = 1000 / 30;

/** 标注渲染节流间隔（源项目 100ms） */
const LABEL_INTERVAL = 100;

/** 顶点尺寸（px）：实点 / 边中点 */
const VERTEX_SIZE = 16;
const TEMP_VERTEX_SIZE = 12;

/** 距离标注与线段之间的法线偏移（px） */
const LABEL_OFFSET = 14;

/** 步骤提示（源项目 draw.js 的 tooltips，第三句按本组件的编辑能力补了「拖动中点」） */
const TOOLTIPS = [
  '点击「开始绘制」取中心点作为画笔，拖动地图可修改画笔位置',
  '拖动地图把画笔移到目标位置，点击「打点」逐点绘制轮廓，点击「结束绘制」完成轮廓',
  '已完成绘制：点击边界点可拖拽调整轮廓，拖动边中点可新增顶点',
];

/** 尾部节流：与源项目 utils.throttle 行为一致（末次调用保证执行） */
function throttle<A extends unknown[]>(
  func: (...args: A) => void,
  delay: number,
) {
  let lastTime = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: A;
  return (...args: A) => {
    lastArgs = args;
    const elapsed = Date.now() - lastTime;
    if (elapsed >= delay) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      func(...lastArgs);
      lastTime = Date.now();
      return;
    }
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        func(...lastArgs);
        lastTime = Date.now();
      }, delay - elapsed);
    }
  };
}

const toTuple = (point: DrawPoint): LatLngTuple => [point.lat, point.lng];

/**
 * 地块绘制状态机（用法：`const tool = useDrawTool()`，组件在 map 就绪后调 tool.mount(map)）。
 * 所有状态都是 ref / computed，可直接在模板里绑定。
 */
export function useDrawTool() {
  const shapeType = ref<DrawShapeType>(DEFAULT_SHAPE_TYPE);
  const step = ref<DrawStep>(1);
  const isClosure = ref(false);
  const isWarning = ref(false);
  const isSnapped = ref(false);
  const drawPoints = ref<DrawPoint[]>([]);
  const stepRecorder = ref<Array<[DrawPoint[], boolean]>>([]);
  const notice = ref('');
  const result = ref<DrawResult | null>(null);

  let map: L.Map | null = null;
  let colors: DrawColors = { ...DEFAULT_COLORS };
  let brush: L.LatLng | null = null;
  let initialPath: Array<[number, number]> | null = null;
  let noticeTimer: ReturnType<typeof setTimeout> | null = null;
  /** 是否正在拖拽把手：拖拽中不重建边中点，避免点在数组里的引用错位 */
  let isDraggingHandle = false;

  let brushMarker: L.Marker | null = null;
  let vertexLayer: L.LayerGroup | null = null;
  let solidLine: L.Polyline | null = null;
  let moveLine: L.Polyline | null = null;
  let polygonLayer: L.Polygon | null = null;
  let labelLayer: L.FeatureGroup | null = null;

  /* ============================================================
   * 派生状态
   * ========================================================== */

  const drawTip = computed(() => {
    // 点模式：放置前给专属提示，放置后不再提示绘制步骤
    if (shapeType.value === 1 && step.value === 2) {
      return '拖动地图把十字准星移到目标位置，点击「打点」放置坐标点';
    }
    if (shapeType.value === 1 && step.value !== 1) {
      return '';
    }
    return TOOLTIPS[step.value - 1];
  });

  /** 是否够点数收尾：线 2 个、面 3 个（源项目 canClosure） */
  const canClosure = computed(
    () => realPoints().length >= (shapeType.value === 2 ? 2 : 3),
  );

  /** 十字准星显隐（源项目 showaddCrossBtn） */
  const showCrosshair = computed(() => !isClosure.value && step.value === 2);

  /** 当前有效顶点数 */
  const vertexCount = computed(() => realPoints().length);

  /* ============================================================
   * 内部工具
   * ========================================================== */

  /** 已定稿的实点（排除画笔临时点与边中点） */
  function realPoints(): DrawPoint[] {
    return drawPoints.value.filter(
      (point) => !point.isMovePoint && !point.isTempCenter,
    );
  }

  /** 当前跟随画笔的临时点 */
  function movePoint(): DrawPoint | null {
    return drawPoints.value.find((point) => point.isMovePoint) ?? null;
  }

  /** 最后一个已定稿的点 */
  function lastRealPoint(): DrawPoint | null {
    const list = realPoints();
    return list.length ? list[list.length - 1] : null;
  }

  /**
   * 闭合后在相邻实点之间插入边中点（源项目 updateTempAddPoints）。
   * 差异：源项目用 splice 原地插入 / 过滤，这里生成新数组，且**实点复用原对象引用**——
   * 拖拽靠对象引用定位被拖的点，重建后引用仍然有效。
   */
  function withMidpoints(points: DrawPoint[]): DrawPoint[] {
    const real = points.filter(
      (point) => !point.isMovePoint && !point.isTempCenter,
    );
    if (real.length < 2) {
      return real;
    }
    const list: DrawPoint[] = [];
    real.forEach((point, index) => {
      list.push(point);
      const next = real[index + 1];
      if (!next) {
        return;
      }
      const [lat, lng] = midpoint(toTuple(point), toTuple(next));
      list.push({ lat, lng, isMovePoint: false, isTempCenter: true });
    });
    return list;
  }

  /** 组件内提示（替代源项目的 vant Toast，不弹全局提示） */
  function showNotice(text: string, duration = 2000) {
    notice.value = text;
    if (noticeTimer) {
      clearTimeout(noticeTimer);
    }
    noticeTimer = setTimeout(() => {
      notice.value = '';
      noticeTimer = null;
    }, duration);
  }

  /** 步骤快照：撤销的基石（源项目 addStepRecorderLog） */
  function pushRecorder() {
    stepRecorder.value.push([
      realPoints().map((point) => ({ ...point })),
      isClosure.value,
    ]);
  }

  /** 找 8px 内最近的顶点（吸附用），exclude 用于拖拽时排除自身 */
  function findSnapTarget(
    latlng: L.LatLng,
    exclude: DrawPoint | null,
  ): DrawPoint | null {
    const instance = map;
    if (!instance) {
      return null;
    }
    const anchor = instance.latLngToContainerPoint(latlng);
    let best: DrawPoint | null = null;
    let bestDistance = SNAP_PIXEL;
    for (const point of drawPoints.value) {
      if (point.isMovePoint || point === exclude) {
        continue;
      }
      const distance = anchor.distanceTo(
        instance.latLngToContainerPoint([point.lat, point.lng]),
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        best = point;
      }
    }
    return best;
  }

  /**
   * 画笔位置吸附：绘制中把画笔吸附到最近的顶点上。
   * 只有吸附到「起点」时才返回 snapToStart = true，用于闭合提示（源项目用
   * 首点坐标相等判断；这里用像素吸附，语义一致）。
   */
  function snapBrush(center: L.LatLng): {
    latlng: L.LatLng;
    snapToStart: boolean;
  } {
    if (step.value !== 2 || isClosure.value || !drawPoints.value.length) {
      return { latlng: center, snapToStart: false };
    }
    const target = findSnapTarget(center, null);
    if (!target) {
      return { latlng: center, snapToStart: false };
    }
    const real = realPoints();
    const snapToStart = real.length > 0 && target === real[0];
    return { latlng: L.latLng(target.lat, target.lng), snapToStart };
  }

  /* ============================================================
   * 标记 / 图层构造
   * ========================================================== */

  /** 十字锚点标记（画笔的实际落点，源项目 addSightsMarker） */
  function createBrushMarker(instance: L.Map): L.Marker {
    return L.marker(instance.getCenter(), {
      zIndexOffset: 2000,
      interactive: false,
      icon: L.divIcon({
        className: 'dm-brush',
        iconSize: [8, 8],
        iconAnchor: [4, 4],
        html: '<span class="dm-brush__dot"></span>',
      }),
    });
  }

  /** 顶点标记：实点（含边中点），闭合后直接拖拽编辑 */
  function renderVertices() {
    const instance = map;
    if (!instance) {
      return;
    }
    if (vertexLayer) {
      instance.removeLayer(vertexLayer);
    }
    vertexLayer = L.layerGroup([]).addTo(instance);
    const color = isWarning.value ? colors.warning : colors.line;
    for (const point of drawPoints.value) {
      if (point.isMovePoint) {
        continue;
      }
      const isTemp = point.isTempCenter;
      const size = isTemp ? TEMP_VERTEX_SIZE : VERTEX_SIZE;
      const marker = L.marker([point.lat, point.lng], {
        draggable: isClosure.value,
        icon: L.divIcon({
          className: isTemp ? 'dm-vertex dm-vertex--temp' : 'dm-vertex',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          html: `<span class="dm-vertex__dot" style="--dm-icon-color:${color}"></span>`,
        }),
      });
      if (isClosure.value) {
        marker.on('dragstart', () => {
          isDraggingHandle = true;
          if (point.isTempCenter) {
            point.isTempCenter = false;
          }
        });
        marker.on('drag', (event: L.LeafletEvent) => {
          const target = event.target as L.Marker;
          const snapTarget = findSnapTarget(target.getLatLng(), point);
          updateDrag(
            point,
            snapTarget
              ? L.latLng(snapTarget.lat, snapTarget.lng)
              : target.getLatLng(),
          );
        });
        marker.on('dragend', () => {
          isDraggingHandle = false;
          pushRecorder();
          renderImmediate();
        });
      }
      vertexLayer.addLayer(marker);
    }
  }

  /** 拖拽改点：面的首尾是同一个顶点，需要同步（源项目 updateDragPolygon） */
  function updateDrag(point: DrawPoint, latlng: L.LatLng) {
    const real = realPoints();
    const first = real[0];
    const last = real[real.length - 1];
    const isRingVertex =
      shapeType.value === 3 &&
      real.length > 2 &&
      (point === first || point === last);
    if (isRingVertex) {
      first.lat = latlng.lat;
      first.lng = latlng.lng;
      last.lat = latlng.lat;
      last.lng = latlng.lng;
    } else {
      point.lat = latlng.lat;
      point.lng = latlng.lng;
    }
    renderImmediate();
  }

  /* ============================================================
   * 渲染
   * ========================================================== */

  /** 多边形样式（源项目 getPolygonStyle：闭合后描边 + 淡填充，绘制中只填充） */
  function polygonStyle(): L.PolylineOptions {
    if (isClosure.value) {
      const color = isWarning.value ? colors.warning : colors.line;
      return {
        color,
        weight: 2,
        opacity: 1,
        fillColor: color,
        fillOpacity: 0.2,
      };
    }
    return {
      color: 'transparent',
      weight: 0,
      opacity: 0,
      fillColor: isWarning.value
        ? colors.warning
        : isSnapped.value
        ? colors.snap
        : colors.fill,
      fillOpacity: 0.2,
    };
  }

  /** 距离标注落点：沿线段法线在屏幕空间偏移 ±14px，取落在面外的那一侧（源项目同思路） */
  function labelAnchor(latlng: L.LatLng, angle: number): L.LatLng {
    const instance = map;
    if (!instance) {
      return latlng;
    }
    const rad = (angle * Math.PI) / 180;
    const anchor = instance.latLngToContainerPoint(latlng);
    // 屏幕坐标系：角度 0 = 正东 = +x，顺时针 90 = 正南 = +y
    const nx = -Math.sin(rad) * LABEL_OFFSET;
    const ny = Math.cos(rad) * LABEL_OFFSET;
    const outside = instance.containerPointToLatLng([
      anchor.x + nx,
      anchor.y + ny,
    ]);
    const inside = instance.containerPointToLatLng([
      anchor.x - nx,
      anchor.y - ny,
    ]);
    return pointInRing([outside.lat, outside.lng], realPoints().map(toTuple))
      ? inside
      : outside;
  }

  /** 距离 / 面积标注（源项目 renderAreaAndDistance） */
  function renderLabelLayers() {
    const instance = map;
    if (!instance || !labelLayer) {
      return;
    }
    labelLayer.clearLayers();
    // 缩放级别太小的时候标注会糊在一起，源项目在 zoom < 12 直接不渲染
    if (instance.getZoom() < LABEL_MIN_ZOOM) {
      return;
    }
    const tuples = realPoints().map(toTuple);
    if (tuples.length < 2) {
      return;
    }

    // 每条边一个距离标注；面闭合后首尾点重复，按闭合环取线段（含最后一条闭合边）
    const segments = toSegments(
      tuples,
      isClosure.value && shapeType.value === 3,
    );
    for (const [start, end] of segments) {
      const distance = instance.distance(start, end);
      if (distance <= 0) {
        continue;
      }
      const [lat, lng] = midpoint(start, end);
      let angle = segmentAngle(start, end);
      // 文字倒着不好读：朝左时翻转 180°（源项目同处理）
      if (angle > 90 && angle < 270) {
        angle += 180;
      }
      labelLayer.addLayer(
        L.marker(labelAnchor(L.latLng(lat, lng), angle), {
          zIndexOffset: 100,
          interactive: false,
          icon: L.divIcon({
            className: 'dm-label dm-label--line',
            iconSize: [0, 0],
            html: `<span class="dm-label__text" style="transform: translate(-50%, -50%) rotate(${angle}deg)">${formatDistance(
              distance,
            )}</span>`,
          }),
        }),
      );
    }

    // 面闭合后补一个面积标注（源项目 isClose 判断一致）
    if (shapeType.value !== 3 || !isClosure.value || tuples.length < 4) {
      return;
    }
    const anchor = ringLabelPoint(tuples);
    if (!anchor) {
      return;
    }
    const area = formatArea(ringAreaSquareMeters(tuples));
    labelLayer.addLayer(
      L.marker(anchor, {
        zIndexOffset: 200,
        interactive: false,
        icon: L.divIcon({
          className: 'dm-label dm-label--area',
          iconSize: [0, 0],
          html: `<span class="dm-label__text">${area.value}${area.unit}</span>`,
        }),
      }),
    );
  }

  const renderLabels = throttle(renderLabelLayers, LABEL_INTERVAL);

  /** 全量重绘（源项目 renderDrawGeometrys） */
  function renderImmediate() {
    const instance = map;
    if (!instance) {
      return;
    }
    const real = realPoints();

    // 1) 边界自交校验：与源项目一致，只对多边形判定
    isWarning.value =
      shapeType.value === 3 && real.length > 3
        ? hasSelfIntersection(real.map(toTuple), true)
        : false;

    // 2) 闭合后补边中点；拖拽中不重建，避免被拖的点引用错位
    if (isClosure.value && !isDraggingHandle) {
      drawPoints.value = withMidpoints(drawPoints.value);
    }

    // 3) 实线：线模式全程绘制；面模式在闭合前用实线勾边（闭合后交给多边形描边）
    if (solidLine) {
      instance.removeLayer(solidLine);
      solidLine = null;
    }
    const solidPoints = drawPoints.value.filter((point) => !point.isMovePoint);
    const needSolidLine =
      solidPoints.length >= 2 &&
      (shapeType.value === 2 || (shapeType.value === 3 && !isClosure.value));
    if (needSolidLine) {
      solidLine = L.polyline(solidPoints.map(toTuple), {
        color: isWarning.value ? colors.warning : colors.moveLine,
        weight: 2,
        opacity: 0.8,
      });
      instance.addLayer(solidLine);
    }

    // 4) 虚线：最后一个实点 → 画笔（源项目 moveMapHaner 的绘制中动线）
    if (moveLine) {
      instance.removeLayer(moveLine);
      moveLine = null;
    }
    const lastReal = lastRealPoint();
    const moving = movePoint();
    if (!isClosure.value && step.value === 2 && lastReal && moving) {
      moveLine = L.polyline([toTuple(lastReal), toTuple(moving)], {
        color: isWarning.value ? colors.warning : colors.moveLine,
        weight: 2,
        opacity: 0.8,
        dashArray: '5, 8',
      });
      instance.addLayer(moveLine);
    }

    // 5) 顶点（含边中点）：拖拽过程中不重绘，避免打断正在拖拽的 marker
    if (!isDraggingHandle) {
      renderVertices();
    }

    // 6) 多边形：绘制中带上画笔点做实时预览，闭合后即最终轮廓
    if (polygonLayer) {
      instance.removeLayer(polygonLayer);
      polygonLayer = null;
    }
    if (shapeType.value === 3 && drawPoints.value.length > 2) {
      polygonLayer = L.polygon(drawPoints.value.map(toTuple), polygonStyle());
      instance.addLayer(polygonLayer);
    }

    // 7) 距离 / 面积标注
    renderLabels();
  }

  const renderThrottled = throttle(renderImmediate, RENDER_INTERVAL);

  /* ============================================================
   * 地图事件
   * ========================================================== */

  /** 地图拖动 / 缩放 → 画笔跟随地图中心移动（源项目 moveMapHaner） */
  function handleMapMove() {
    const instance = map;
    if (!instance || !brushMarker) {
      return;
    }
    const snapped = snapBrush(instance.getCenter());
    brush = snapped.latlng;
    // 吸附到起点时才变绿，提示「再打一点即闭合」（源项目 isTempClosure 语义）
    isSnapped.value = snapped.snapToStart;
    brushMarker.setLatLng(brush);

    if (step.value !== 2) {
      return;
    }
    const moving = movePoint();
    const isTooClose =
      moving &&
      Math.abs(moving.lat - brush.lat) < 0.00001 &&
      Math.abs(moving.lng - brush.lng) < 0.00001;
    // 极短距离内不更新：防止抖动，也避免误判边界交叉（源项目同判断）
    // 但吸附到起点时允许更新，因为画笔是跳过去的
    if (isTooClose && !snapped.snapToStart) {
      return;
    }
    if (moving) {
      moving.lat = brush.lat;
      moving.lng = brush.lng;
    } else {
      drawPoints.value.push({
        lat: brush.lat,
        lng: brush.lng,
        isMovePoint: true,
        isTempCenter: false,
      });
    }
    renderThrottled();
  }

  /** 缩放结束后重绘：标注与顶点尺寸都依赖缩放级别（源项目 zoomend 处理） */
  function handleZoomEnd() {
    renderImmediate();
  }

  /* ============================================================
   * 对外动作
   * ========================================================== */

  /** 清空当前绘制（图层 + 数据 + 步骤记录） */
  function clearGeometry() {
    const instance = map;
    if (instance) {
      if (solidLine) {
        instance.removeLayer(solidLine);
      }
      if (moveLine) {
        instance.removeLayer(moveLine);
      }
      if (polygonLayer) {
        instance.removeLayer(polygonLayer);
      }
      if (vertexLayer) {
        instance.removeLayer(vertexLayer);
      }
    }
    solidLine = null;
    moveLine = null;
    polygonLayer = null;
    vertexLayer = null;
    drawPoints.value = [];
    stepRecorder.value = [];
    isClosure.value = false;
    isWarning.value = false;
    isSnapped.value = false;
    result.value = null;
  }

  /** 挂载到地图实例（源项目 readyDraw） */
  function mount(instance: L.Map, options: DrawToolOptions = {}) {
    map = instance;
    colors = { ...DEFAULT_COLORS, ...(options.colors ?? {}) };
    initialPath = options.path ?? null;
    shapeType.value = options.type ?? DEFAULT_SHAPE_TYPE;

    labelLayer = L.featureGroup().addTo(instance);
    brushMarker = createBrushMarker(instance).addTo(instance);
    // 绘制过程中用十字准星指示落点，不显示画笔锚点
    brushMarker.setOpacity(0);

    instance.on('move', handleMapMove);
    instance.on('zoomend', handleZoomEnd);

    if (initialPath && initialPath.length) {
      loadPath(initialPath);
    }
  }

  /** 载入已有轮廓（编辑态） */
  function loadPath(path: Array<[number, number]>) {
    const instance = map;
    if (!instance) {
      return;
    }
    if (shapeType.value === 1) {
      const [lng, lat] = path[0];
      brush = L.latLng(lat, lng);
      drawPoints.value = [
        { lat, lng, isMovePoint: false, isTempCenter: false },
      ];
      isClosure.value = true;
      step.value = 3;
      pushRecorder();
      renderImmediate();
      instance.setView(brush, Math.max(instance.getZoom(), 16));
      return;
    }
    const points = path.map(([lng, lat]) => ({
      lat,
      lng,
      isMovePoint: false,
      isTempCenter: false,
    }));
    // 面：补齐首尾重复点，保证「首尾是同一个顶点」的前提成立（拖拽时两个点要同步）
    const first = points[0];
    const last = points[points.length - 1];
    if (
      shapeType.value === 3 &&
      first &&
      last &&
      (first.lat !== last.lat || first.lng !== last.lng)
    ) {
      points.push({ ...first });
    }
    drawPoints.value = points;
    isClosure.value = true;
    step.value = 3;
    pushRecorder();
    if (brushMarker) {
      brushMarker.setOpacity(0);
    }
    renderImmediate();
    const layer = polygonLayer ?? solidLine;
    if (layer) {
      instance.fitBounds(layer.getBounds());
    }
  }

  /** 开始绘制（源项目 startDraw） */
  function startDraw() {
    const instance = map;
    if (!instance) {
      return;
    }
    clearGeometry();
    step.value = 2;
    if (!brush) {
      brush = instance.getCenter();
    }
    if (brushMarker) {
      brushMarker.setLatLng(brush).setOpacity(0);
    }
    // 点模式：显示十字准星，等点击「打点」后再生成圆形落点
    if (shapeType.value === 1) {
      drawPoints.value.push({
        lat: brush.lat,
        lng: brush.lng,
        isMovePoint: true,
        isTempCenter: false,
      });
      renderImmediate();
      return;
    }
    drawPoints.value.push({
      lat: brush.lat,
      lng: brush.lng,
      isMovePoint: true,
      isTempCenter: false,
    });
    renderImmediate();
  }

  /**
   * 打点（源项目 addPoint）：把末尾的画笔临时点转正为定稿顶点。
   * 第一个点不需要已有定稿点，直接把画笔临时点转正即可（源项目同逻辑）。
   */
  function addPoint() {
    const instance = map;
    if (!instance || !brush || step.value !== 2 || isClosure.value) {
      return;
    }
    // 画笔吸附到起点且已有足够顶点数：直接闭合（源项目用首点坐标相等判断）
    if (isSnapped.value && realPoints().length >= 3) {
      closePolygon();
      return;
    }
    // 点模式：放置单点即完成
    if (shapeType.value === 1) {
      const moving = movePoint();
      if (moving) {
        moving.lat = brush.lat;
        moving.lng = brush.lng;
        moving.isMovePoint = false;
      } else {
        drawPoints.value.push({
          lat: brush.lat,
          lng: brush.lng,
          isMovePoint: false,
          isTempCenter: false,
        });
      }
      isClosure.value = true;
      step.value = 3;
      pushRecorder();
      renderImmediate();
      return;
    }
    const real = realPoints();
    // 与上一定稿点的最小间距校验（源项目：仅在已有上一点时才校验，防止原地打点）
    const last = lastRealPoint();
    if (
      last &&
      instance.distance(toTuple(last), [brush.lat, brush.lng]) <
        MIN_POINT_DISTANCE
    ) {
      showNotice('两点间距需要大于一米');
      return;
    }
    // 边界自交校验（新增点后是否形成交叉）
    const candidate: LatLngTuple[] = [
      ...real.map(toTuple),
      [brush.lat, brush.lng],
    ];
    if (shapeType.value === 2 && hasSelfIntersection(candidate, false)) {
      showNotice('请注意边界线不能交叉');
      return;
    }
    if (shapeType.value === 3 && candidate.length > 3) {
      const ring: LatLngTuple[] = [...candidate, candidate[0]];
      if (hasSelfIntersection(ring, true)) {
        showNotice('请注意边界线不能交叉');
        return;
      }
    }
    // 定稿：把末尾的画笔临时点转正（源项目同逻辑）
    const moving = movePoint();
    if (moving) {
      moving.lat = brush.lat;
      moving.lng = brush.lng;
      moving.isMovePoint = false;
    } else {
      // 防御：画笔临时点不存在时直接追加一个定稿点
      drawPoints.value.push({
        lat: brush.lat,
        lng: brush.lng,
        isMovePoint: false,
        isTempCenter: false,
      });
    }
    // 追加新的画笔临时点，保证画笔继续跟随地图移动
    drawPoints.value.push({
      lat: brush.lat,
      lng: brush.lng,
      isMovePoint: true,
      isTempCenter: false,
    });
    pushRecorder();
    renderImmediate();
  }

  /** 结束绘制 / 闭合（源项目 closure） */
  function closePolygon() {
    const instance = map;
    if (!instance || isClosure.value) {
      return;
    }
    const real = realPoints();
    const minPoints = shapeType.value === 2 ? 2 : 3;
    if (real.length < minPoints) {
      showNotice(
        shapeType.value === 2
          ? '至少打两个点才能结束绘制'
          : '至少打三个点后才能结束绘制',
      );
      return;
    }
    // 面：首尾点保持一致，形成闭合环（源项目同处理）
    if (shapeType.value === 3) {
      const first = real[0];
      const last = real[real.length - 1];
      if (first.lat !== last.lat || first.lng !== last.lng) {
        drawPoints.value.push({
          lat: first.lat,
          lng: first.lng,
          isMovePoint: false,
          isTempCenter: false,
        });
      }
    }
    // 丢掉还没定稿的画笔点（源项目 closure 里的 pop）
    drawPoints.value = drawPoints.value.filter((point) => !point.isMovePoint);
    isClosure.value = true;
    isSnapped.value = false;
    step.value = 3;
    if (brushMarker) {
      brushMarker.setOpacity(0);
    }
    pushRecorder();
    renderImmediate();

    // 视图自适应到轮廓范围（源项目 focusToCenter）
    const layer = polygonLayer ?? solidLine;
    if (layer) {
      instance.flyToBounds(layer.getBounds().pad(0.25), { duration: 0.5 });
    }
  }

  /** 撤销（源项目 revoke：闭合本身也占一步，撤销时要连它一起退掉） */
  function revoke() {
    const recorder = stepRecorder.value;
    if (!recorder.length) {
      showNotice('已清空所有点，请重新打点');
      return;
    }
    const last = recorder[recorder.length - 1];
    const prev = recorder[recorder.length - 2];
    const isClosureStep = Boolean(prev) && last[1] !== prev[1];
    recorder.pop();
    if (isClosureStep) {
      recorder.pop();
    }
    const target = recorder[recorder.length - 1];
    if (target) {
      drawPoints.value = target[0].map((point) => ({ ...point }));
      isClosure.value = target[1];
    } else if (initialPath && initialPath.length) {
      // 编辑态撤到空：还原初始轮廓（源项目 revoke 的 isEdit 分支）
      drawPoints.value = [];
      isClosure.value = false;
      loadPath(initialPath);
      return;
    } else {
      drawPoints.value = [];
      isClosure.value = false;
    }
    step.value = isClosure.value ? 3 : 2;
    if (!isClosure.value) {
      const current = movePoint();
      if (current) {
        current.lat = brush ? brush.lat : current.lat;
        current.lng = brush ? brush.lng : current.lng;
      } else {
        drawPoints.value.push({
          lat: brush ? brush.lat : 0,
          lng: brush ? brush.lng : 0,
          isMovePoint: true,
          isTempCenter: false,
        });
      }
    }
    if (brushMarker) {
      brushMarker.setOpacity(0);
    }
    renderImmediate();
  }

  /** 重新绘制：形状模式下清空重画；点模式下把落点交回地图中心（源项目 reDraw / reAddPoint） */
  function restart() {
    const instance = map;
    if (!instance) {
      return;
    }
    if (shapeType.value === 1) {
      clearGeometry();
      brush = instance.getCenter();
      step.value = 2;
      if (brushMarker) {
        brushMarker.setLatLng(brush).setOpacity(0);
      }
      drawPoints.value.push({
        lat: brush.lat,
        lng: brush.lng,
        isMovePoint: true,
        isTempCenter: false,
      });
      renderImmediate();
      return;
    }
    startDraw();
  }

  /** 切换形状（示例画廊的交互；绘制中不允许切换） */
  function setShapeType(type: DrawShapeType) {
    if (type === shapeType.value || step.value === 2) {
      return;
    }
    clearGeometry();
    shapeType.value = type;
    step.value = 1;
  }

  /** 完成绘制：校验并输出数据（源项目 save + submitData） */
  function submit(): DrawResult | null {
    const instance = map;
    if (!instance) {
      return null;
    }
    if (shapeType.value === 1) {
      const real = realPoints();
      if (real.length < 1) {
        showNotice('请先放置坐标点');
        return null;
      }
      const { lat, lng } = real[0];
      const data: DrawResult = {
        shapeType: 1,
        path: [[lng, lat]],
        center: [lat, lng],
        pointCount: 1,
      };
      result.value = data;
      step.value = 1;
      if (brushMarker) {
        brushMarker.setOpacity(0);
      }
      showNotice(JSON.stringify(data), 5000);
      return data;
    }

    const real = realPoints();
    const minPoints = shapeType.value === 2 ? 2 : 3;
    if (real.length < minPoints) {
      showNotice(shapeType.value === 2 ? '至少绘制两个点' : '至少绘制三个点');
      return null;
    }
    const tuples = real.map(toTuple);
    if (hasSelfIntersection(tuples, shapeType.value === 3)) {
      showNotice('请注意边界线不能交叉，请修改后再试');
      return null;
    }
    // 面：输出闭合环（首尾点重复，与源项目 facilityLocPath 一致），顶点数按去重后计
    const isRing = shapeType.value === 3;
    const path = tuples.map(
      (tuple) => [tuple[1], tuple[0]] as [number, number],
    );
    const data: DrawResult = {
      shapeType: shapeType.value,
      path,
      center: tuples[0],
      pointCount: isRing ? path.length - 1 : path.length,
    };
    if (isRing) {
      const area = formatArea(ringAreaSquareMeters(tuples));
      data.area = area.value;
      data.unit = area.unit;
    } else {
      let length = 0;
      for (let i = 0; i < tuples.length - 1; i += 1) {
        length += instance.distance(tuples[i], tuples[i + 1]);
      }
      data.length = Number(length.toFixed(1));
    }
    result.value = data;
    // 提交后回到「待绘制」：保留图形便于对照，再点「开始绘制」会清空重来
    step.value = 1;
    if (brushMarker) {
      brushMarker.setOpacity(0);
    }
    showNotice(JSON.stringify(data), 5000);
    return data;
  }

  /** 销毁：解绑事件、移除图层（组件在 map.remove() 之前调用） */
  function destroy() {
    const instance = map;
    if (instance) {
      instance.off('move', handleMapMove);
      instance.off('zoomend', handleZoomEnd);
      clearGeometry();
      if (labelLayer) {
        instance.removeLayer(labelLayer);
        labelLayer = null;
      }
      if (brushMarker) {
        instance.removeLayer(brushMarker);
        brushMarker = null;
      }
    }
    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    map = null;
  }

  return {
    // 状态
    shapeType,
    step,
    isClosure,
    isWarning,
    isSnapped,
    drawTip,
    canClosure,
    showCrosshair,
    vertexCount,
    stepRecorder,
    notice,
    result,
    // 生命周期
    mount,
    destroy,
    // 动作
    startDraw,
    addPoint,
    closePolygon,
    revoke,
    restart,
    setShapeType,
    submit,
  };
}
