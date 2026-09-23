/**
 * 图片可替换标记探针（image-marker）
 *
 * 作用：
 *   扫描页面主内容区（默认 .layout-content，即 views/* 渲染区）中所有
 *   "渲染了图片"的 DOM，在各自组件根容器内生成一个「换图」便签标签。
 *   点击标签会通过 imageEventBus 发出 change-image 事件，载荷携带：
 *     - 元素全局唯一选择器 [data-img-mark-id="xxx"]
 *     - 图片来源类型（img / 背景图 / 伪元素背景图）
 *     - 当前图片地址
 *     - DOM 上 image 属性（JSON 字符串）解析出的生图参数片段
 *
 * 标签挂载规则：
 *   - 标签 append 到目标元素的"组件根容器"内：
 *     背景图 / 伪元素容器自身可容纳子元素 → 挂到自身；
 *     <img> 是置换元素不能包含子元素 → 挂到其父容器（组件根容器）；
 *   - 容器 position 为 static 时临时改为 relative（清理时还原）；
 *   - 标签绝对定位在图片显示区域右上角内侧、向左偏移 10px；
 *   - z-index 仅组件内部层级（20），不再使用 body 全局浮层，
 *     不会遮挡抽屉 / 弹窗等高层级 UI。
 *
 * 持续跟踪：
 *   - MutationObserver：子树增删 + src/style/class/image 属性变化 → 重新探测；
 *   - ResizeObserver：跟踪目标元素 + 容器尺寸变化 → 重新定位；
 *   - scroll（capture，覆盖内部滚动容器）+ window resize → rAF 合并重定位；
 *   - 所有更新经 requestAnimationFrame 合流，避免高频重排。
 */
import { ImageEvents, imageEventBus } from '@/utils/event-bus';
import type { ChangeImagePayload } from '@/utils/event-bus';
import type { GenerateImageParams } from '@/utils/ai-image';

const STYLE_ID = '__img_replace_style__';
/** 写入业务 DOM 的唯一标记属性 */
const MARK_ID_ATTR = 'data-img-mark-id';
/** 业务 DOM 上挂生图参数的属性名（值为 JSON 字符串） */
const IMAGE_ATTR = 'image';
/** 标签相对图片显示区域右上角的偏移（向左 / 向下各 10px） */
const MARK_OFFSET = 10;
/** 标签类名（也用于 mutation 过滤，防止自我触发的更新回环） */
const MARK_CLASS = 'img-edit-mark';

type ImageKind = ChangeImagePayload['kind'];

interface ProbeHit {
  kind: ImageKind;
  src?: string;
}

interface TrackedMark {
  el: HTMLElement;
  /** 标签挂载的根容器（同时是定位上下文） */
  host: HTMLElement;
  mark: HTMLButtonElement;
  /** host 原始内联 position；改写时记录，清理时还原 */
  hostPrevPosition: string;
  hostAdjusted: boolean;
  kind: ImageKind;
  src?: string;
}

const tracked = new Map<HTMLElement, TrackedMark>();
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
/*                              标签管理                                */
/* ------------------------------------------------------------------ */

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

/**
 * 确定标签挂载的根容器：
 * 背景图 / 伪元素容器自身可容纳子元素 → 挂到自身；
 * <img> 是置换元素不能包含子元素 → 挂到其父容器（组件根容器）。
 */
function resolveHost(el: HTMLElement): HTMLElement {
  if (el instanceof HTMLImageElement) return el.parentElement ?? el;
  return el;
}

function createMark(el: HTMLElement, hit: ProbeHit): TrackedMark {
  const selector = ensureMarkId(el);
  const host = resolveHost(el);

  // 保证容器可作为定位上下文：static 时临时改 relative，清理时还原
  const hostPrevPosition = host.style.position;
  const hostAdjusted = getComputedStyle(host).position === 'static';
  if (hostAdjusted) host.style.position = 'relative';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = MARK_CLASS;
  btn.textContent = '换图';
  btn.title = '基于该图片新建 AI 生图任务';
  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const payload: ChangeImagePayload = {
      selector,
      kind: hit.kind,
      src: hit.src,
      image: readImageMeta(el),
    };
    imageEventBus.emit(ImageEvents.CHANGE_IMAGE, payload);
  });

  host.appendChild(btn);
  resizeObserver?.observe(el);
  resizeObserver?.observe(host);
  return {
    el,
    host,
    mark: btn,
    hostPrevPosition,
    hostAdjusted,
    kind: hit.kind,
    src: hit.src,
  };
}

function destroyMark(item: TrackedMark): void {
  resizeObserver?.unobserve(item.el);
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

function removeTracked(el: HTMLElement): void {
  const item = tracked.get(el);
  if (!item) return;
  destroyMark(item);
  tracked.delete(el);
}

/** 探测并跟踪单个元素（已跟踪 / 标签自身直接跳过） */
function probeAndTrack(el: HTMLElement): void {
  if (tracked.has(el)) return;
  if (el.classList.contains(MARK_CLASS)) return;
  const hit = probe(el);
  if (hit) tracked.set(el, createMark(el, hit));
}

/** 扫描一个子树（元素自身 + 全部后代） */
function scanSubtree(root: HTMLElement): void {
  probeAndTrack(root);
  root.querySelectorAll<HTMLElement>('*').forEach(probeAndTrack);
}

/**
 * MutationObserver 增量处理，避免每次 class 变化都对整页跑
 * getComputedStyle（那是昂贵操作）：
 *   - 新增节点 → 只扫新子树；
 *   - 移除节点 → 只清理该子树内已跟踪元素；
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
        removeTracked(el);
        el.querySelectorAll<HTMLElement>('*').forEach((child) =>
          removeTracked(child),
        );
      });
    } else if (
      record.type === 'attributes' &&
      record.target instanceof HTMLElement
    ) {
      const el = record.target;
      // 标签自身的定位样式变化不是业务变化，跳过以免更新回环
      if (el.classList.contains(MARK_CLASS)) return;
      const hit = probe(el);
      const existing = tracked.get(el);
      if (hit) {
        if (existing) {
          existing.kind = hit.kind;
          existing.src = hit.src;
        } else {
          tracked.set(el, createMark(el, hit));
        }
      } else {
        removeTracked(el);
      }
    }
  });
  schedulePositionUpdate();
}

function scheduleReconcile(): void {
  if (reconcileRaf) return;
  reconcileRaf = requestAnimationFrame(() => {
    reconcileRaf = 0;
    // rAF 合流：取本帧内全部变更记录统一处理
    const records = pendingRecords;
    pendingRecords = [];
    if (records.length) handleMutations(records);
  });
}

/** observer 回调只收集记录，真正处理放到 rAF 合流 */
let pendingRecords: MutationRecord[] = [];
function onMutation(records: MutationRecord[]): void {
  pendingRecords.push(...records);
  scheduleReconcile();
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
    const { el, host, mark } = item;

    // 目标元素隐藏 / 脱离文档 → 隐藏标签
    if (!el.isConnected || !host.isConnected || !isElementVisible(el)) {
      mark.style.display = 'none';
      return;
    }

    const hostRect = host.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    // 贴图片显示区域右上角内侧，向左偏移 MARK_OFFSET；避免小于最小偏移
    const top = Math.max(
      MARK_OFFSET,
      Math.round(rect.top - hostRect.top) + MARK_OFFSET,
    );
    const right = Math.max(
      MARK_OFFSET,
      Math.round(hostRect.right - rect.right) + MARK_OFFSET,
    );

    const topPx = `${top}px`;
    const rightPx = `${right}px`;
    mark.style.display = '';
    // 值无变化时跳过写入，避免触发 MutationObserver 造成更新回环
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
 * 启动图片替换标记探针。
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

  tracked.forEach((item) => destroyMark(item));
  tracked.clear();
  pendingRecords = [];

  document.getElementById(STYLE_ID)?.remove();
}
