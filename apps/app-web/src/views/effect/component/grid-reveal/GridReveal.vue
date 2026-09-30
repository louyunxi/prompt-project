<!--
  组件名称：GridReveal（网格逐步分裂揭开图片）

  来源迁移：E:\桌面\rare-ui-main\components\ui\grid-reveal.tsx
           示例数据参考：E:\桌面\rare-ui-main\app\components\(docs)\gridreveal\demo.tsx

  依赖插件 / 版本：
    - motion-v ^2.5.1（React 版 motion/react 的 Vue 移植，负责 caption 的布局与透明度动画）
    - vue ^3.5.13（catalog 统一版本）
    - sass-embedded（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 .grid-reveal 上，仅覆盖变量即可换肤）：
    --grid-frame    #f5f5f5            画布底色 / 网格缝隙衬底（源码 bg-muted）
    --grid-chip-bg  rgba(0,0,0,0.45)   caption 胶囊底色
    说明：网格单元格颜色由图片像素均值动态着色（源码逻辑），此处仅收敛静底色；
    暗色主题（[data-theme='dark']）下切换 --grid-frame，见 <style> 末尾。

  迁移说明：
    1. 去除 react / cn() / Tailwind 工具类依赖：cn 与 `[corner-shape:squircle]` 等
       工具类改写为组件内 scoped SCSS，未引入任何组件目录之外的工具函数或样式。
    2. useState → ref；源码「渲染期同步重置」（src 变化时 setLoaded/setRevealed）
       改为 watch(() => props.src, …) 重置，语义等价。
    3. useEffect 主逻辑（建树 → 采样像素 → rAF 推进 split → 绘制 / 收尾）保留：
       依赖 [reduce, src, ratio] 改为 watch(..., { immediate: true, flush: 'post' })
       并在回调里用 onCleanup 注册清理（取消 rAF、断开 ResizeObserver / IntersectionObserver）。
       progress / estimatedDuration / src 在闭包内直接读 props，无需 ref 转发。
    4. 暗色判定由 `documentElement.classList.contains('dark')` 改为本项目实际使用的
       `data-theme="dark"` 属性。
    5. onRevealComplete / onError 回调 props 改为 defineEmits（reveal-complete / error）。
    6. caption 用 motion-v 的 motion.div + AnimatePresence(mode="popLayout")，逻辑与源码一致：
       shimmer 扫光在减少动态效果时降级为静态半透明文字。
    7. 图片物料：源 demo 的 /assets/landing/herobg.webp 已拷贝到本组件同级 assets/hero-bg.webp
       （kebab-case），由同目录 index.vue 以相对路径 new URL('./assets/hero-bg.webp', import.meta.url) 引用。
-->
<template>
  <div
    ref="frameRef"
    data-slot="grid-reveal"
    class="grid-reveal"
    :style="{ aspectRatio: ratio }"
  >
    <canvas
      ref="canvasRef"
      class="grid-reveal__canvas"
      :role="alt ? 'img' : undefined"
      :aria-label="alt || undefined"
      :aria-hidden="alt ? undefined : 'true'"
    ></canvas>

    <motion.div
      v-if="caption"
      layout
      class="grid-reveal__caption"
      :animate="{ opacity: finished ? 0 : 1 }"
      :transition="CAPTION_TRANSITION"
    >
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.span
          :key="caption"
          layout="position"
          class="grid-reveal__caption-text"
          :class="{ 'grid-reveal__caption-text--plain': reduced }"
          :style="reduced ? undefined : SHIMMER"
          :initial="{ opacity: 0 }"
          :animate="spanAnimate"
          :exit="{ opacity: 0 }"
          :transition="spanTransition"
        >
          {{ caption }}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { AnimatePresence, motion, useReducedMotion } from 'motion-v';

/** 动画过渡配置（结构同 motion 的 Transition） */
type Transition = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    src?: string | null;
    alt?: string;
    progress?: number;
    aspect?: number;
    caption?: string;
    estimatedDuration?: number;
  }>(),
  {
    src: null,
    alt: '',
    progress: undefined,
    aspect: 1,
    caption: undefined,
    estimatedDuration: 6000,
  },
);

const emit = defineEmits<{
  (e: 'reveal-complete'): void;
  (e: 'error'): void;
}>();

const CELLS = 180;
const OPENING_CELLS = 4;
// 停在终点之前一点，保证整段动画永远不会比图片更早结束
const HOLD = 0.9;
// 等待期间网格最多分裂到这里，给图片到达留出余地
const WAIT_CAP = 0.72;
const LAST_SPLIT = 0.92;
// 单个单元格完成分离所需的进度区间
const MORPH = 0.055;
const SAMPLE = 128;
const COLOR_MS = 420;
const GUTTER_FROM = 0.35;
const GUTTER_TO = 0.75;
const PHOTO_FROM = 0.93;

const SHIMMER = {
  backgroundImage:
    'linear-gradient(90deg, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.98) 50%, rgba(255,255,255,0.5) 60%)',
  backgroundSize: '250% 100%',
} as const;

const CAPTION_TRANSITION: Transition = {
  opacity: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
  layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
};

type Cell = {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  g: number;
  b: number;
  tone: number;
  detail: number;
  splitAt: number;
  parent: Cell | null;
  kids: [Cell, Cell] | null;
};

type Sums = {
  n: number;
  r: number;
  g: number;
  b: number;
  l: number;
  l2: number;
};

// 写成比较式，让 NaN 自然落回 0
const clamp01 = (n: number) => (n > 0 ? (n < 1 ? n : 1) : 0);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

// 永远到不了上限，估算时间被跑超时任务仍会缓慢推进
function selfPaced(elapsed: number, duration: number) {
  const span = duration > 0 ? duration : 1;
  return HOLD * (1 - Math.exp(-elapsed / span));
}

function hash(x: number, y: number, z: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function makeCell(
  x: number,
  y: number,
  w: number,
  h: number,
  parent: Cell | null,
): Cell {
  return {
    x,
    y,
    w,
    h,
    r: 0,
    g: 0,
    b: 0,
    tone: hash(x + 3.1, y + 1.7, w * 31.7),
    detail: 0,
    splitAt: 0,
    parent,
    kids: null,
  };
}

// 每次都切分最大的单元，能让单元格保持接近正方并逐个增多
function buildTree(aspect: number) {
  const root = makeCell(0, 0, 1, 1, null);
  const leaves: Cell[] = [root];
  const branches: Cell[] = [];

  while (leaves.length < CELLS) {
    let pick = 0;
    let widest = -1;
    for (let i = 0; i < leaves.length; i++) {
      const c = leaves[i];
      // 抖动只用于打破同尺寸单元之间的平局
      const area = c.w * aspect * c.h * (1 + 0.12 * hash(c.x, c.y, 7.3));
      if (area > widest) {
        widest = area;
        pick = i;
      }
    }

    const parent = leaves.splice(pick, 1)[0];
    const wide = parent.w * aspect >= parent.h;
    const half = wide ? parent.w / 2 : parent.h / 2;
    const a = wide
      ? makeCell(parent.x, parent.y, half, parent.h, parent)
      : makeCell(parent.x, parent.y, parent.w, half, parent);
    const b = wide
      ? makeCell(parent.x + half, parent.y, half, parent.h, parent)
      : makeCell(parent.x, parent.y + half, parent.w, half, parent);

    parent.kids = [a, b];
    branches.push(parent);
    leaves.push(a, b);
  }

  const opening = OPENING_CELLS - 1;
  const rest = Math.max(1, branches.length - opening);
  // 开场的切分点排到 0 之前，让这些单元第一帧就已经分离
  branches.forEach((cell, i) => {
    cell.splitAt =
      i < opening ? -MORPH : (LAST_SPLIT * (i - opening + 1)) / rest;
  });

  return { root, branches };
}

// 统计每个单元的平均色，以及决定切分顺序的亮度方差
function measureTree(root: Cell, pixels: Uint8ClampedArray, size: number) {
  const gather = (cell: Cell): Sums => {
    let s: Sums;

    if (cell.kids) {
      const a = gather(cell.kids[0]);
      const b = gather(cell.kids[1]);
      s = {
        n: a.n + b.n,
        r: a.r + b.r,
        g: a.g + b.g,
        b: a.b + b.b,
        l: a.l + b.l,
        l2: a.l2 + b.l2,
      };
    } else {
      s = { n: 0, r: 0, g: 0, b: 0, l: 0, l2: 0 };
      const x0 = Math.round(cell.x * size);
      const y0 = Math.round(cell.y * size);
      const x1 = Math.max(x0 + 1, Math.round((cell.x + cell.w) * size));
      const y1 = Math.max(y0 + 1, Math.round((cell.y + cell.h) * size));

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * size + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const l = 0.299 * r + 0.587 * g + 0.114 * b;
          s.n++;
          s.r += r;
          s.g += g;
          s.b += b;
          s.l += l;
          s.l2 += l * l;
        }
      }
    }

    const n = s.n || 1;
    cell.r = s.r / n;
    cell.g = s.g / n;
    cell.b = s.b / n;
    cell.detail = Math.max(0, s.l2 / n - (s.l / n) * (s.l / n));
    return s;
  };

  gather(root);
}

// 复用同一批时间点，只改顺序，节奏完全不变
function orderByDetail(branches: Cell[], openedBefore: number) {
  const pending = branches.filter((c) => c.splitAt > openedBefore);
  if (pending.length < 2) {
    return;
  }

  const slots = pending.map((c) => c.splitAt).sort((a, b) => a - b);
  const queue = pending.filter(
    (c) => !c.parent || c.parent.splitAt <= openedBefore,
  );

  let next = 0;
  while (queue.length && next < slots.length) {
    let pick = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].detail > queue[pick].detail) {
        pick = i;
      }
    }
    const cell = queue.splice(pick, 1)[0];
    cell.splitAt = slots[next++];
    for (const kid of cell.kids ?? []) {
      if (kid.kids) {
        queue.push(kid);
      }
    }
  }
}

function coverRect(iw: number, ih: number, w: number, h: number) {
  const s = Math.max(w / iw, h / ih);
  return { dx: (w - iw * s) / 2, dy: (h - ih * s) / 2, dw: iw * s, dh: ih * s };
}

type Scene = {
  ctx: CanvasRenderingContext2D;
  root: Cell;
  width: number;
  height: number;
  scale: number;
  dark: boolean;
  clock: number;
  split: number;
  fade: number;
  hasColors: boolean;
  image: HTMLImageElement | null;
};

function greyOf(tone: number, dark: boolean, clock: number) {
  return (
    (dark ? 30 : 228) + tone * 13 + Math.sin(clock * 1.5 + tone * 6.28) * 3
  );
}

type Patch = {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  g: number;
  b: number;
  tone: number;
};

function drawScene(s: Scene) {
  const { ctx, root, width, height, split } = s;
  // 无法读取像素时网格保持灰度，但照片仍会在下方淡入
  const tint = s.hasColors ? s.fade : 0;
  const shade = (grey: number, target: number) =>
    Math.round(mix(grey, target, tint));
  const base = greyOf(root.tone, s.dark, s.clock);

  // 缝隙是靠这个衬底色凹陷进去，而不是直接切穿到组件背后
  ctx.fillStyle = `rgb(${Math.round(shade(base, root.r) * 0.92)},${Math.round(
    shade(base, root.g) * 0.92,
  )},${Math.round(shade(base, root.b) * 0.92)})`;
  ctx.fillRect(0, 0, width, height);

  const soft = 1 - smoothstep(GUTTER_FROM, GUTTER_TO, split);
  const gutter = s.scale * soft;
  const rounded = soft > 0.01 && typeof ctx.roundRect === 'function';

  const paint = (p: Patch) => {
    // 取整到整像素，相邻单元格才能严丝合缝
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const w = Math.round(p.x + p.w) - x;
    const h = Math.round(p.y + p.h) - y;

    const onLeft = x <= 0;
    const onTop = y <= 0;
    const onRight = x + w >= width;
    const onBottom = y + h >= height;

    // 只有内部边留缝，外轮廓始终是画框本身
    const left = onLeft ? 0 : gutter;
    const top = onTop ? 0 : gutter;
    const innerW = w - left - (onRight ? 0 : gutter);
    const innerH = h - top - (onBottom ? 0 : gutter);
    if (innerW <= 0 || innerH <= 0) {
      return;
    }

    const grey = greyOf(p.tone, s.dark, s.clock);
    ctx.fillStyle = `rgb(${shade(grey, p.r)},${shade(grey, p.g)},${shade(
      grey,
      p.b,
    )})`;

    if (rounded) {
      const radius = Math.min(innerW, innerH) * 0.12 * soft;
      ctx.beginPath();
      ctx.roundRect(x + left, y + top, innerW, innerH, [
        !onLeft && !onTop ? radius : 0,
        !onRight && !onTop ? radius : 0,
        !onRight && !onBottom ? radius : 0,
        !onLeft && !onBottom ? radius : 0,
      ]);
      ctx.fill();
    } else {
      ctx.fillRect(x + left, y + top, innerW, innerH);
    }
  };

  const walk = (cell: Cell, p: Patch) => {
    if (!cell.kids || split < cell.splitAt) {
      paint(p);
      return;
    }
    // 子单元从父单元的矩形出发，再分离到各自的位置
    const t = easeOut(clamp01((split - cell.splitAt) / MORPH));
    for (const kid of cell.kids) {
      walk(kid, {
        x: mix(p.x, kid.x * width, t),
        y: mix(p.y, kid.y * height, t),
        w: mix(p.w, kid.w * width, t),
        h: mix(p.h, kid.h * height, t),
        r: mix(p.r, kid.r, t),
        g: mix(p.g, kid.g, t),
        b: mix(p.b, kid.b, t),
        tone: mix(p.tone, kid.tone, t),
      });
    }
  };

  walk(root, {
    x: 0,
    y: 0,
    w: width,
    h: height,
    r: root.r,
    g: root.g,
    b: root.b,
    tone: root.tone,
  });

  if (!s.image) {
    return;
  }
  const photo = s.hasColors
    ? smoothstep(PHOTO_FROM, 1, split) * s.fade
    : s.fade;
  if (photo <= 0.002) {
    return;
  }

  const fit = coverRect(
    s.image.naturalWidth,
    s.image.naturalHeight,
    width,
    height,
  );
  ctx.globalAlpha = photo;
  ctx.drawImage(s.image, fit.dx, fit.dy, fit.dw, fit.dh);
  ctx.globalAlpha = 1;
}

function readAverages(
  el: HTMLImageElement,
  root: Cell,
  branches: Cell[],
  at: number,
) {
  const buffer = document.createElement('canvas');
  buffer.width = SAMPLE;
  buffer.height = SAMPLE;
  const ctx = buffer.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return false;
  }

  const fit = coverRect(el.naturalWidth, el.naturalHeight, SAMPLE, SAMPLE);
  ctx.drawImage(el, fit.dx, fit.dy, fit.dw, fit.dh);

  try {
    measureTree(root, ctx.getImageData(0, 0, SAMPLE, SAMPLE).data, SAMPLE);
    orderByDetail(branches, at);
    return true;
  } catch {
    return false;
  }
}

const reduced = useReducedMotion();
const ratio = computed(() =>
  Number.isFinite(props.aspect) && props.aspect > 0 ? props.aspect : 1,
);

const frameRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const loaded = ref(false);
const revealed = ref(false);

// src 改变即回到未加载 / 未揭开，等价源码渲染期的 setLoaded(false) / setRevealed(false)
watch(
  () => props.src,
  () => {
    loaded.value = false;
    revealed.value = false;
  },
);

watch(
  [() => props.src, ratio, reduced],
  (_values, _old, onCleanup) => {
    const canvas = canvasRef.value;
    const frame = frameRef.value;
    if (!canvas || !frame) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const { root, branches } = buildTree(ratio.value);

    const scene: Scene = {
      ctx,
      root,
      width: 0,
      height: 0,
      scale: 1,
      dark: false,
      clock: 0,
      split: 0,
      fade: 0,
      hasColors: false,
      image: null,
    };

    let loadedAt = -1;
    let cancelled = false;

    const render = (split: number, now: number) => {
      scene.dark =
        document.documentElement.getAttribute('data-theme') === 'dark';
      scene.split = split;
      scene.fade = loadedAt < 0 ? 0 : smoothstep(0, COLOR_MS, now - loadedAt);
      drawScene(scene);
    };

    const repaint = () => {
      if (!reduced.value) {
        render(scene.split, performance.now());
        return;
      }
      // 减少动态效果下没有循环，直接跳到最终帧
      const settled = loadedAt < 0 ? performance.now() : loadedAt + COLOR_MS;
      render(scene.image ? 1 : WAIT_CAP, settled);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = frame.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      scene.scale = dpr;
      if (w === scene.width && h === scene.height) {
        return;
      }
      scene.width = w;
      scene.height = h;
      canvas.width = w;
      canvas.height = h;
      // 改尺寸会清空画布，必须重绘一次
      repaint();
    };

    resize();
    // jsdom 与旧浏览器没有这些 API，降级而不是抛错
    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    observer?.observe(frame);

    const load = (url: string, withCors: boolean) => {
      const el = new Image();
      if (withCors) {
        el.crossOrigin = 'anonymous';
      }
      el.decoding = 'async';
      el.onload = () => {
        if (cancelled) {
          return;
        }
        if (!el.naturalWidth || !el.naturalHeight) {
          emit('error');
          return;
        }
        scene.image = el;
        loadedAt = performance.now();
        scene.hasColors = readAverages(el, root, branches, scene.split);
        loaded.value = true;
        if (reduced.value) {
          repaint();
        }
      };
      // 不带 CORS 头的主机会拒绝请求，退回普通加载
      el.onerror = () => {
        if (cancelled) {
          return;
        }
        if (withCors) {
          load(url, false);
        } else {
          emit('error');
        }
      };
      el.src = url;
    };

    if (props.src) {
      load(props.src, true);
    }

    if (reduced.value) {
      repaint();
      onCleanup(() => {
        cancelled = true;
        observer?.disconnect();
      });
      return;
    }

    let frameId = 0;
    let last = 0;
    let elapsed = 0;
    let eased = 0;
    let split = 0;
    let fired = false;
    let stopped = false;
    let visible = true;

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);
      if (!last) {
        last = now;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      scene.clock = elapsed;

      const ready = scene.image !== null;
      const paced = props.progress === undefined;
      let target: number;

      // 图片到位才是整段动画的终点，而不是进度数字
      if (ready) {
        target = 1;
      } else if (paced) {
        target = selfPaced(elapsed * 1000, props.estimatedDuration);
      } else {
        target = Math.min(clamp01(props.progress as number), HOLD);
      }

      eased += (target - eased) * (1 - Math.exp(-dt * 5.5));
      const wanted = Math.min(eased, ready ? 1 : WAIT_CAP);
      split += (wanted - split) * (1 - Math.exp(-dt * 4));
      render(split, now);

      if (!fired && ready && eased > 0.995 && now - loadedAt > COLOR_MS) {
        fired = true;
        revealed.value = true;
        emit('reveal-complete');
      }

      // 之后画面不再变化，停止空转
      if (fired && split > 0.9995) {
        render(1, now);
        stopped = true;
        cancelAnimationFrame(frameId);
      }
    };

    const start = () => {
      if (stopped) {
        return;
      }
      last = 0;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(tick);
    };

    // 没人看的帧不值得渲染
    const visibility =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting === visible) {
                return;
              }
              visible = entry.isIntersecting;
              if (visible) {
                start();
              } else {
                cancelAnimationFrame(frameId);
              }
            },
            { rootMargin: '150px' },
          )
        : null;
    visibility?.observe(frame);

    start();

    onCleanup(() => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      observer?.disconnect();
      visibility?.disconnect();
    });
  },
  { immediate: true, flush: 'post' },
);

// 减少动态效果下图片加载完成即视为揭开
watch([reduced, loaded], () => {
  if (reduced.value && loaded.value) {
    emit('reveal-complete');
  }
});

const finished = computed(() => (reduced.value ? loaded.value : revealed.value));

const spanAnimate = computed(() => {
  if (reduced.value || finished.value) {
    return { opacity: 1 };
  }
  return { opacity: 1, backgroundPosition: ['105% 0%', '-5% 0%'] };
});

const spanTransition = computed<Transition>(() =>
  reduced.value
    ? { duration: 0 }
    : {
        duration: 0.28,
        ease: [0.4, 0, 0.2, 1],
        backgroundPosition: {
          duration: 1.6,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: [0.45, 0, 0.55, 1],
        },
      },
);
</script>

<style lang="scss" scoped>
.grid-reveal {
  --grid-frame: #f5f5f5;
  --grid-chip-bg: rgba(0, 0, 0, 0.45);

  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 20px;
  background: var(--grid-frame);
}

.grid-reveal__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.grid-reveal__caption {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  overflow: hidden;
  border-radius: 9999px;
  background: var(--grid-chip-bg);
  backdrop-filter: blur(12px);
  pointer-events: none;
}

.grid-reveal__caption-text {
  display: block;
  font-size: 11px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.75);
}

/* 非降级：文字以渐变扫光的形式呈现（背景裁切进字形） */
.grid-reveal__caption-text:not(.grid-reveal__caption-text--plain) {
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

/* 容器适配：窄卡片里胶囊贴着底边收窄 */
@media (max-width: 1280px) {
  .grid-reveal__caption {
    left: 8px;
    bottom: 8px;
    padding: 0 8px;
  }
}

@media (min-width: 1920px) {
  .grid-reveal__caption {
    left: 16px;
    bottom: 16px;
    padding: 0 12px;
  }
}

/* 暗色主题：仅切换静底色（网格颜色来自图片像素） */
:global(html[data-theme='dark'] .grid-reveal) {
  --grid-frame: #262626;
}

@media (prefers-reduced-motion: reduce) {
  .grid-reveal__caption-text {
    color: rgba(255, 255, 255, 0.75);
  }
}
</style>
