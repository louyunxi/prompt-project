/**
 * 图片可替换标记探针（image-marker）
 *
 * 作用（组件级聚合版）：
 *   扫描页面主内容区（默认 .layout-content，即 views/* 渲染区）中所有
 *   "渲染了图片"的 DOM；按组件容器（[data-image-component] /
 *   [data-component-name] / .layout-content 直系子，三者优先级递减），
 *   聚合当前组件内所有可替换图片，按 src 去重，
 *   在组件容器右上角内侧挂一个唯一的「换图」按钮。
 *   点击按钮时，通过 imageEventBus 发出 change-image 事件，载荷包含：
 *     - 组件根选择器 [data-image-component-id="xxx"]
 *     - 组件展示名
 *     - entries：按 src 去重后的图片列表
 *       · 每条 entry 含 targets（一对多 DOM 目标列表）
 *         替换时整组 targets 同步生效
 *
 * 按钮挂载规则：
 *   - 组件容器 position 为 static 时临时改为 relative（清理时还原）；
 *   - 按钮绝对定位在容器右上角内侧（top/right 各 10px）；
 *   - 容器隐藏 / 组件内没有可替换图片 → 隐藏按钮。
 *
 * 持续跟踪：
 *   - MutationObserver：子树增删 + src/style/class/image 属性变化 → 重新探测；
 *   - ResizeObserver：跟踪组件容器尺寸变化 → 重新计算按钮位置；
 *   - scroll（capture，覆盖内部滚动容器）+ window resize → rAF 合并重定位；
 *   - 所有更新经 requestAnimationFrame 合流，避免高频重排。
 */
import {
  ImageEvents,
  imageEventBus,
  type ChangeImageEntry,
  type ChangeImageGroupPayload,
  type ChangeImageTarget,
} from '@/utils/event-bus';
import type { GenerateImageParams } from '@/utils/ai-image';

const STYLE_ID = '__img_replace_style__';
/** 写入业务 DOM 的唯一标记属性 */
const MARK_ID_ATTR = 'data-img-mark-id';
/** 组件容器根标记属性：声明该 DOM 是一个独立的图片可替换组件 */
const COMPONENT_ATTR = 'data-image-component';
/** 组件容器根标记 id 属性：用于跨刷新定位 */
const COMPONENT_ID_ATTR = 'data-image-component-id';
/** 业务 DOM 上挂生图参数的属性名（值为 JSON 字符串） */
const IMAGE_ATTR = 'image';
/** 按钮相对组件容器右上角的偏移（向左 / 向下各 10px） */
const MARK_OFFSET = 10;
/** 按钮类名（也用于 mutation 过滤，防止自我触发的更新回环） */
const MARK_CLASS = 'img-edit-mark';

type ImageKind = ChangeImageTarget['kind'];

interface ProbeHit {
  kind: ImageKind;
  src?: string;
}

/** 组件容器内的单张图片（带 mark-id 与 kind / src / image 元数据） */
interface ComponentImage {
  el: HTMLElement;
  selector: string;
  kind: ImageKind;
  src: string;
  image?: Partial<GenerateImageParams>;
}

/** 单个组件容器的跟踪状态：聚合的图片集合 + 挂载的按钮 */
interface TrackedComponent {
  /** 组件容器根 DOM */
  host: HTMLElement;
  /** 容器原始内联 position */
  hostPrevPosition: string;
  hostAdjusted: boolean;
  /** 容器 ID 选择器 */
  componentSelector: string;
  /** 组件展示名（优先 data-image-component，否则 data-component-name，否则直系子下标） */
  componentName: string;
  /** 容器内的所有图片（已按 selector 唯一，未去重 src） */
  images: ComponentImage[];
  /** 容器上挂载的按钮 */
  mark: HTMLButtonElement;
}

const tracked = new Map<HTMLElement, TrackedComponent>();
/** selector → 所属组件 host（用于快速反查：MutationObserver 事件能拿到 target） */
const imageToHost = new Map<HTMLElement, HTMLElement>();
let scanRoot: HTMLElement = document.body;
let mutationObserver: MutationObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let positionRaf = 0;
let reconcileRaf = 0;
let started = false;

/* ------------------------------------------------------------------ */
/*                              样式注入                                */
/* ------------------------------------------------------------------ */

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.${MARK_CLASS} {
  position: absolute;
  top: ${MARK_OFFSET}px;
  right: ${MARK_OFFSET}px;
  margin: 0;
  padding: 1px 8px;
  border: 1px solid #fff;
  border-radius: 3px;
  background: linear-gradient(180deg, #ffffff, #afceff);
  color: #1e7a87;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 6px rgba(1, 115, 125, 0.35);
  transform: rotate(-8deg);
  z-index: 20;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.${MARK_CLASS}::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  width: 5px;
  height: 8px;
  margin-left: -3px;
  margin-top: -3px;
  border-radius: 50%;
  background: linear-gradient(177deg, #dae8ff, #0067ff);
  box-shadow: 0 1px 2px rgba(1, 115, 125, 0.55);
}
.${MARK_CLASS}:hover {
  filter: brightness(1.05);
  color: #004f5b;
}
`;
  document.head.appendChild(style);
}

/* ------------------------------------------------------------------ */
/*                              探测逻辑                                */
/* ------------------------------------------------------------------ */

/** 从 CSS background-image 值中提取第一个 url(...) 的地址 */
function extractBackgroundUrl(value: string): string {
  if (!value || value === 'none') return '';
  const matched = /url\(\s*(['"]?)([^'")]+)\1\s*\)/i.exec(value);
  return matched?.[2] ?? '';
}

/**
 * 判定一个元素是否"渲染了图片"。
 * 1. <img> 且有 src；
 * 2. 自身 background-image 含 url(...)；
 * 3. ::before / ::after 有 content 且 background-image 含 url(...)。
 */
function probe(el: HTMLElement): ProbeHit | null {
  if (el instanceof HTMLImageElement) {
    const src = el.currentSrc || el.src;
    if (src) return { kind: 'img', src };
  }

  const ownBg = extractBackgroundUrl(getComputedStyle(el).backgroundImage);
  if (ownBg) return { kind: 'background', src: ownBg };

  const pseudos = ['::before', '::after'] as const;
  for (let i = 0; i < pseudos.length; i += 1) {
    const pseudo = pseudos[i];
    const style = getComputedStyle(el, pseudo);
    const hasContent =
      !!style.content && style.content !== 'none' && style.content !== 'normal';
    if (hasContent) {
      const url = extractBackgroundUrl(style.backgroundImage);
      if (url) {
        return {
          kind: pseudo === '::before' ? 'pseudo-before' : 'pseudo-after',
          src: url,
        };
      }
    }
  }
  return null;
}

/** 读取并解析元素 image 属性上的 JSON 生图参数；非法 / 缺失返回 undefined */
function readImageMeta(
  el: HTMLElement,
): Partial<GenerateImageParams> | undefined {
  const raw = el.getAttribute(IMAGE_ATTR);
  if (!raw) return undefined;
  try {
    const obj: unknown = JSON.parse(raw);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return obj as Partial<GenerateImageParams>;
    }
  } catch {
    // JSON 非法时忽略，走默认参数
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/*                          组件容器解析                                */
/* ------------------------------------------------------------------ */

/**
 * 从一个图片元素向上找组件容器根：
 *   1. 显式声明：[data-image-component] 属性（最优先，便于子节点自定义边界）；
 *   2. gallery 等声明：[data-component-name] 属性（兼容现有 gallery__cell）；
 *   3. fallback：当前元素的最近直系 .layout-content 子节点（不显式声明的组件自动归到
 *      所在主内容区单元格里）。
 *
 * 注意：组件容器自身若没有 [data-image-component] / [data-component-name]，
 * 但其子节点是 <img> / 背景图容器，我们回退到「最近直系子」让根元素承担容器角色。
 */
function resolveComponentHost(el: HTMLElement): HTMLElement {
  // 1. 显式 opt-in
  const explicit = el.closest<HTMLElement>(`[${COMPONENT_ATTR}]`);
  if (explicit) return explicit;

  // 2. 兼容 gallery cell（已有 data-component-name 标记）
  const named = el.closest<HTMLElement>('[data-component-name]');
  if (named) return named;

  // 3. fallback：最近 .layout-content 直系子
  const root = scanRoot;
  let cur: HTMLElement | null = el;
  while (cur && cur.parentElement) {
    if (cur.parentElement === root) return cur;
    cur = cur.parentElement;
  }
  return el;
}

/** 为组件容器分配唯一 id（用于事件载荷 + 跨刷新定位），返回选择器字符串 */
function ensureComponentId(host: HTMLElement): string {
  let id = host.getAttribute(COMPONENT_ID_ATTR);
  if (!id) {
    id = `cmp-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    host.setAttribute(COMPONENT_ID_ATTR, id);
  }
  return `[${COMPONENT_ID_ATTR}="${id}"]`;
}

/** 组件展示名：opt-in 属性 → gallery 命名 → 直系子下标 */
function deriveComponentName(host: HTMLElement): string {
  return (
    host.getAttribute(COMPONENT_ATTR) ??
    host.getAttribute('data-component-name') ??
    `组件 ${indexOfDirectChild(scanRoot, host) + 1}`
  );
}

/** 直接子节点的下标（仅用于 fallback 命名） */
function indexOfDirectChild(parent: HTMLElement, child: HTMLElement): number {
  let i = 0;
  for (const node of Array.from(parent.children)) {
    if (node === child) return i;
    i += 1;
  }
  return 0;
}

/** 确保元素有唯一标记 id，返回可全局唯一定位的属性选择器 */
function ensureMarkId(el: HTMLElement): string {
  let id = el.getAttribute(MARK_ID_ATTR);
  if (!id) {
    id = `imk-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    el.setAttribute(MARK_ID_ATTR, id);
  }
  return `[${MARK_ID_ATTR}="${id}"]`;
}

/* ------------------------------------------------------------------ */
/*                         组件级聚合 + 按钮                            */
/* ------------------------------------------------------------------ */

/**
 * 把组件容器内的所有图片按 src 去重，构造 ChangeImageEntry[]。
 * - 同 src 多个 DOM → 合并到同一 entry.targets；
 * - 同一 entry 内 kind 取首命中为代表；
 * - 默认 image 合并：所有 target 中首个非空 image。
 */
function buildEntries(images: ComponentImage[]): ChangeImageEntry[] {
  const map = new Map<string, ChangeImageEntry>();
  images.forEach((img) => {
    const key = img.src;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        id: `e-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 6)}-${map.size}`,
        src: img.src,
        kind: img.kind,
        targets: [],
        image: img.image,
      };
      map.set(key, entry);
    }
    entry.targets.push({ selector: img.selector, kind: img.kind });
    // 缺省的 image 用首个非空补齐
    if (!entry.image && img.image) entry.image = img.image;
  });
  return Array.from(map.values());
}

function createComponentMark(
  host: HTMLElement,
  images: ComponentImage[],
): TrackedComponent {
  const componentSelector = ensureComponentId(host);
  const componentName = deriveComponentName(host);

  // 保证容器可作为定位上下文：static 时临时改 relative，清理时还原
  const hostPrevPosition = host.style.position;
  const hostAdjusted = getComputedStyle(host).position === 'static';
  if (hostAdjusted) host.style.position = 'relative';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = MARK_CLASS;
  btn.textContent = '换图';
  btn.title = '基于该组件的图片新建 AI 生图任务';
  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!images.length) return;
    const payload: ChangeImageGroupPayload = {
      componentSelector,
      componentName,
      entries: buildEntries(images),
    };
    imageEventBus.emit(ImageEvents.CHANGE_IMAGE, payload);
  });

  host.appendChild(btn);
  resizeObserver?.observe(host);
  return {
    host,
    hostPrevPosition,
    hostAdjusted,
    componentSelector,
    componentName,
    images,
    mark: btn,
  };
}

function destroyComponentMark(item: TrackedComponent): void {
  resizeObserver?.unobserve(item.host);
  item.mark.remove();
  if (item.hostAdjusted) {
    if (item.hostPrevPosition) {
      item.host.style.position = item.hostPrevPosition;
    } else {
      item.host.style.removeProperty('position');
    }
  }
}

/* ------------------------------------------------------------------ */
/*                              增量跟踪                                */
/* ------------------------------------------------------------------ */

/**
 * 把元素对应的图片加入其组件容器（自动 ensureMarkId + selector 写入）。
 * - 新组件 host → 创建 TrackedComponent 并挂按钮；
 * - 已存在 host 但缺该图片 → 追加进 images 并刷新按钮点击逻辑；
 * - 已存在 host 且该图片已记录 → no-op。
 */
function probeAndAttach(el: HTMLElement): void {
  // 跳过按钮自身 / 已跟踪的 selector
  if (el.classList.contains(MARK_CLASS)) return;
  if (el.dataset.imageMarkRegistered === '1') return;

  const hit = probe(el);
  if (!hit?.src) return;

  const host = resolveComponentHost(el);
  if (!host || !host.isConnected) return;

  // 同一元素不能在两个 host 间重复跟踪
  if (imageToHost.has(el)) return;

  const selector = ensureMarkId(el);
  el.dataset.imageMarkRegistered = '1';
  imageToHost.set(el, host);

  const image: ComponentImage = {
    el,
    selector,
    kind: hit.kind,
    src: hit.src,
    image: readImageMeta(el),
  };

  let item = tracked.get(host);
  if (!item) {
    item = createComponentMark(host, [image]);
    tracked.set(host, item);
    schedulePositionUpdate();
  } else {
    // 增量：把新图片加入并替换按钮（保证最新点击事件拿到全集）
    item.images.push(image);
    tracked.set(host, { ...item });
    rebuildButton(item);
  }
}

function rebuildButton(item: TrackedComponent): void {
  // 重建按钮的事件闭包，确保点击时拿到最新的 images 列表
  const oldBtn = item.mark;
  const host = item.host;
  const newBtn = oldBtn.cloneNode(false) as HTMLButtonElement;
  newBtn.type = 'button';
  newBtn.className = MARK_CLASS;
  newBtn.textContent = '换图';
  newBtn.title = '基于该组件的图片新建 AI 生图任务';
  const images = item.images;
  const componentSelector = item.componentSelector;
  const componentName = item.componentName;
  newBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!images.length) return;
    const payload: ChangeImageGroupPayload = {
      componentSelector,
      componentName,
      entries: buildEntries(images),
    };
    imageEventBus.emit(ImageEvents.CHANGE_IMAGE, payload);
  });
  host.replaceChild(newBtn, oldBtn);
  item.mark = newBtn;
}

function detachImage(el: HTMLElement): void {
  const host = imageToHost.get(el);
  if (!host) return;
  imageToHost.delete(el);
  const item = tracked.get(host);
  if (!item) return;
  const next = {
    ...item,
    images: item.images.filter((img) => img.el !== el),
  };
  if (!next.images.length) {
    destroyComponentMark(next);
    tracked.delete(host);
  } else {
    tracked.set(host, next);
    rebuildButton(next);
  }
  schedulePositionUpdate();
}

/** 扫描一个子树（元素自身 + 全部后代） */
function scanSubtree(root: HTMLElement): void {
  probeAndAttach(root);
  root.querySelectorAll<HTMLElement>('*').forEach(probeAndAttach);
}

let pendingRecords: MutationRecord[] = [];
function onMutation(records: MutationRecord[]): void {
  pendingRecords.push(...records);
  scheduleReconcile();
}

function scheduleReconcile(): void {
  if (reconcileRaf) return;
  reconcileRaf = requestAnimationFrame(() => {
    reconcileRaf = 0;
    const records = pendingRecords;
    pendingRecords = [];
    if (records.length) handleMutations(records);
  });
}

/**
 * MutationObserver 增量处理，避免每次 class 变化都对整页跑
 * getComputedStyle（那是昂贵操作）：
 *   - 新增节点 → 只扫新子树；
 *   - 移除节点 → 清理已跟踪的图片 / host；
 *   - 属性变化（src/style/class/image）→ 只重新探测 target。
 */
function handleMutations(records: MutationRecord[]): void {
  if (!started) return;
  records.forEach((record) => {
    if (record.type === 'childList') {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          scanSubtree(node as HTMLElement);
        }
      });
      record.removedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as HTMLElement;
        detachImage(el);
        el.querySelectorAll<HTMLElement>('*').forEach((child) =>
          detachImage(child),
        );
      });
    } else if (
      record.type === 'attributes' &&
      record.target instanceof HTMLElement
    ) {
      const el = record.target;
      // 按钮自身的定位样式变化不是业务变化，跳过以免更新回环
      if (el.classList.contains(MARK_CLASS)) return;
      // 若是图片元素（src / image 属性 / style 变化可能改了 background）
      const isTrackedImage = imageToHost.has(el);
      if (isTrackedImage) {
        const hit = probe(el);
        const host = imageToHost.get(el);
        const item = host ? tracked.get(host) : undefined;
        const old = item?.images.find((img) => img.el === el);
        if (!hit?.src) {
          // 图片身份消失：摘掉
          detachImage(el);
          return;
        }
        if (old) {
          old.kind = hit.kind;
          old.src = hit.src;
          old.image = readImageMeta(el);
          // 重新挂 mark-id 不需要（已存在），只需刷新按钮闭包
          if (item) rebuildButton(item);
        }
        return;
      }
      // 非已跟踪元素，但可能刚变成图片（例如 src 由空变非空）
      const hit = probe(el);
      if (hit) probeAndAttach(el);
    }
  });
  schedulePositionUpdate();
}

/* ------------------------------------------------------------------ */
/*                              位置更新                                */
/* ------------------------------------------------------------------ */

function isElementVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.visibility === 'collapse'
  ) {
    return false;
  }
  if (Number(style.opacity) === 0) return false;
  return true;
}

function updatePositions(): void {
  if (!started) return;

  tracked.forEach((item) => {
    const { host, mark } = item;
    // 容器隐藏 / 脱离文档 → 隐藏按钮
    if (!host.isConnected || !isElementVisible(host)) {
      mark.style.display = 'none';
      return;
    }
    // 容器内已无可替换图片（极端竞态）→ 隐藏按钮
    if (!item.images.length) {
      mark.style.display = 'none';
      return;
    }

    // 固定贴右上角内侧，避免与最小偏移冲突
    const topPx = `${MARK_OFFSET}px`;
    const rightPx = `${MARK_OFFSET}px`;
    mark.style.display = '';
    if (mark.style.top !== topPx) mark.style.top = topPx;
    if (mark.style.right !== rightPx) mark.style.right = rightPx;
  });
}

function schedulePositionUpdate(): void {
  if (positionRaf) return;
  positionRaf = requestAnimationFrame(() => {
    positionRaf = 0;
    updatePositions();
  });
}

/** capture 阶段监听滚动，覆盖页面内部所有滚动容器 */
function handleScroll(): void {
  schedulePositionUpdate();
}

/* ------------------------------------------------------------------ */
/*                              启动 / 停止                             */
/* ------------------------------------------------------------------ */

/**
 * 启动图片替换标记探针（组件级聚合版）。
 * @param rootSelector 扫描根选择器（默认主内容区 .layout-content，
 *                     即 views/* 的渲染区域；找不到时回退 body）
 * @returns 停止函数：断开所有观察器、移除标签并还原容器样式
 */
export function startImageMarker(rootSelector = '.layout-content'): () => void {
  if (started || typeof document === 'undefined') {
    return () => stopImageMarker();
  }
  started = true;

  scanRoot =
    (document.querySelector(rootSelector) as HTMLElement | null) ??
    document.body;

  injectStyle();

  resizeObserver = new ResizeObserver(() => schedulePositionUpdate());
  resizeObserver.observe(scanRoot);

  mutationObserver = new MutationObserver(onMutation);
  mutationObserver.observe(scanRoot, {
    childList: true,
    subtree: true,
    attributes: true,
    // src：图片地址变化；style/class：背景图 / 显隐变化；
    // image：业务方更新生图参数 JSON
    attributeFilter: ['src', 'style', 'class', IMAGE_ATTR],
  });

  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', schedulePositionUpdate);

  // 首屏已渲染的 DOM 立即全量扫一次（后续仅做增量）
  scanSubtree(scanRoot);
  updatePositions();

  return () => stopImageMarker();
}

/** 停止探针并清理全部 DOM / 监听，还原被改写的容器样式 */
export function stopImageMarker(): void {
  if (!started) return;
  started = false;

  mutationObserver?.disconnect();
  mutationObserver = null;
  resizeObserver?.disconnect();
  resizeObserver = null;

  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', schedulePositionUpdate);

  if (positionRaf) {
    cancelAnimationFrame(positionRaf);
    positionRaf = 0;
  }
  if (reconcileRaf) {
    cancelAnimationFrame(reconcileRaf);
    reconcileRaf = 0;
  }

  tracked.forEach((item) => destroyComponentMark(item));
  tracked.clear();
  imageToHost.clear();
  pendingRecords = [];

  document.getElementById(STYLE_ID)?.remove();
}