/**
 * 图片替换应用器（image-apply）
 *
 * 作用：
 *   把「换图」生图任务保存到本地后生成的图片地址（blob: object URL），
 *   按 change-image 记录的 selector + kind 应用回原 DOM：
 *     - img：直接写 <img src>；
 *     - background：写元素内联 background-image；
 *     - pseudo-before / pseudo-after：注入样式表规则
 *       selector::before/::after { background-image: url(...) !important }
 *       （伪元素无法写内联样式，只能走样式表）。
 *
 * 一对多支持（组件级换图）：
 *   - 组件容器内同一 src 可能被多个 DOM 复用，ChangeImageEntry.targets
 *     聚合了全部目标；
 *   - applyImageReplaceMany(targets, url) 把同一张结果图同步灌到
 *     全部目标 DOM（img / background / pseudo 都正确处理）；
 *   - 各 target 仍以 selector+kind 为 key 独立记录在 applied Map，
 *     便于刷新重放 / 部分目标单独更新。
 *
 * 持续重放：
 *   - 已应用的替换保存在模块级 Map（key = selector + kind）；
 *   - MutationObserver 监听内容区：Vue 重渲染把 <img src> 重置、
 *     节点被销毁重建时，自动在下一帧重新应用；
 *   - 伪元素走样式表规则，节点重建也天然生效；
 *   - 刷新页面后 object URL 全部失效，由 layout 调用
 *     reapplyImageReplacements，用从本地目录重新读出的 URL 再灌一次。
 *
 * 安全：
 *   URL 来自 URL.createObjectURL（blob:https://...），不含引号 / 括号，
 *   注入样式表前仍统一转义双引号。
 */
import type { ChangeImageTarget } from '@/utils/event-bus';

const STYLE_ID = '__img_replace_apply_style__';

export interface ImageReplaceItem extends ChangeImageTarget {
  /** 本地图片的可回显地址（blob: object URL） */
  url: string;
}

/** 已应用替换：key = selector + kind */
const applied = new Map<string, ImageReplaceItem>();

let observer: MutationObserver | null = null;
let reapplyRaf = 0;
let styleEl: HTMLStyleElement | null = null;

function keyOf(target: ChangeImageTarget): string {
  return `${target.selector}__${target.kind}`;
}

function getRoot(): HTMLElement {
  return (
    (document.querySelector('.layout-content') as HTMLElement | null) ??
    document.body
  );
}

/** 拼 CSS url(...)，统一转义双引号 */
function cssUrl(url: string): string {
  return `url("${url.replace(/"/g, '%22')}")`;
}

/** 比较两个 background-image 声明是否指向同一 URL（忽略引号差异） */
function isSameUrlDecl(a: string, b: string): boolean {
  return a.replace(/['"]/g, '') === b.replace(/['"]/g, '');
}

function ensureStyleEl(): HTMLStyleElement {
  if (!styleEl || !styleEl.isConnected) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  return styleEl;
}

/** 依据 applied 重建伪元素背景样式表 */
function rebuildPseudoSheet(): void {
  const lines: string[] = [];
  applied.forEach(({ selector, kind, url }) => {
    if (kind === 'pseudo-before' || kind === 'pseudo-after') {
      const pseudo = kind === 'pseudo-before' ? '::before' : '::after';
      lines.push(
        `${selector}${pseudo} { background-image: ${cssUrl(url)} !important; }`,
      );
    }
  });
  ensureStyleEl().textContent = lines.join('\n');
}

/** 把单条替换应用到当前 DOM（找不到元素时跳过，等 observer 重放） */
function applyOne(item: ImageReplaceItem): void {
  const el = document.querySelector(item.selector);
  if (!(el instanceof HTMLElement) || !el.isConnected) {return;}

  if (item.kind === 'img') {
    if (el instanceof HTMLImageElement) {
      // 值相同不重复写，避免触发 MutationObserver 回环
      if (el.getAttribute('src') !== item.url) {
        el.setAttribute('src', item.url);
      }
    }
    return;
  }

  if (item.kind === 'background') {
    const decl = cssUrl(item.url);
    if (!isSameUrlDecl(el.style.backgroundImage, decl)) {
      el.style.backgroundImage = decl;
    }
  }

  // pseudo-* 由样式表统一处理
}

/** 全量重放一次（DOM 重建 / 刷新恢复后调用） */
function reapplyAll(): void {
  applied.forEach((item) => applyOne(item));
}

function scheduleReapply(): void {
  if (reapplyRaf) {return;}
  reapplyRaf = requestAnimationFrame(() => {
    reapplyRaf = 0;
    reapplyAll();
  });
}

/**
 * 启动 DOM 变更观察：
 * 业务页面常由 Vue 驱动，重渲染可能重置 <img src> / 内联背景图样式，
 * 甚至重建节点；观察到变更后 rAF 合流重放。
 */
function ensureObserver(): void {
  if (observer || typeof document === 'undefined') {return;}
  observer = new MutationObserver(() => scheduleReapply());
  observer.observe(getRoot(), {
    childList: true,
    subtree: true,
    // src：Vue 重置图片地址；style：背景图被重置
    attributes: true,
    attributeFilter: ['src', 'style'],
  });
}

/**
 * 应用单条图片替换（生图保存成功后立即调用）。
 * 同一 selector + kind 以最后一次为准。
 */
export function applyImageReplace(
  target: ChangeImageTarget,
  url: string,
): void {
  if (typeof document === 'undefined' || !url) {return;}
  const item: ImageReplaceItem = { ...target, url };
  applied.set(keyOf(target), item);
  applyOne(item);
  rebuildPseudoSheet();
  ensureObserver();
}

/**
 * 一对多替换（组件级换图）：同一张结果图同步应用到多个 DOM 目标。
 * - targets 中每个元素各自独立记录在 applied Map，便于刷新重放；
 * - 全部目标缺失时等价于无操作；
 * - 任一目标 selector+kind 重复调用时以最后一次为准（与单目标一致）。
 */
export function applyImageReplaceMany(
  targets: ChangeImageTarget[],
  url: string,
): void {
  if (typeof document === 'undefined' || !url) {return;}
  const list = Array.isArray(targets) ? targets.filter((t) => !!t?.selector) : [];
  if (!list.length) {return;}
  list.forEach((target) => {
    const item: ImageReplaceItem = { ...target, url };
    applied.set(keyOf(target), item);
    applyOne(item);
  });
  // 伪元素样式表只需最后构建一次（含全部 entries）
  rebuildPseudoSheet();
  ensureObserver();
}

/**
 * 全量灌入替换记录并立即重放（页面刷新、本地 object URL 恢复后调用）。
 * 会以传入列表为准重置内存中的替换表。
 */
export function reapplyImageReplacements(items: ImageReplaceItem[]): void {
  if (typeof document === 'undefined') {return;}
  applied.clear();
  items.forEach((item) => {
    if (item.selector && item.url) {
      applied.set(keyOf(item), item);
    }
  });
  reapplyAll();
  rebuildPseudoSheet();
  ensureObserver();
}
