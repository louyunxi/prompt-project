<!--
  组件名称：MatrixOrb（点阵光球，含三态切换器）

  来源迁移：E:\桌面\rare-ui-main\components\ui\matrix-orb.tsx
           示例数据参考：E:\桌面\rare-ui-main\app\components\(docs)\matrixorb\demo.tsx

  依赖插件 / 版本：
    - motion-v ^2.5.1（React 版 motion/react 的 Vue 移植，负责切换器滑块 layout 动画）
    - vue ^3.5.13（catalog 统一版本）
    - sass-embedded（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 .matrix-orb 上，仅覆盖变量即可换肤）：
    --orb-color        #F75001  点阵主色（由 color prop 注入，canvas fillStyle）
    --orb-label        —       状态文案色（默认取前景色 70% 透明度）
    --orb-panel-bg     #ffffff  切换器面板底色（源码 bg-muted）
    --orb-panel-border #e5e5e5  切换器面板描边（源码 border-apple）
    --orb-pill-bg      #fafafa  选中项滑块底色（源码 bg-background）
    --orb-pill-shadow  —       滑块投影
    --orb-text         #171717  选中项文案色
    --orb-text-dim     #a3a3a3  未选中项文案色
    暗色主题（[data-theme='dark']）下上述颜色整体切换，见 <style> 末尾。

  迁移说明：
    1. 去除 react / cn() / Tailwind 工具类依赖，工具类全部改写为组件内 scoped SCSS；
       未引入任何组件目录之外的工具函数或样式。
    2. useSyncExternalStore 订阅 devicePixelRatio → Vue 改为 ref + window resize 监听，
       在 onBeforeUnmount 中移除监听（源码用作 canvas 缓冲区重建依据）。
    3. useEffect 主循环（rAF 绘制 + 每态权重混合 + 弹簧缩放）保留：
       以 watch([size, color, dots, dpr]) 重建，state / level 通过 props 在闭包内实时读取，
       与源码「state 不进依赖、循环只重定向不重启」的语义一致。
       prefers-reduced-motion 命中时不做循环，仅按当前态重绘静态帧。
    4. 导出类型 MatrixOrbState（'idle' | 'listening' | 'thinking'）保留。
    5. 三态切换器由 demo 内联进组件：去掉 @squircle-js/react 的圆角容器与 motion 的
       GripVertical 拖拽（预览工具行为），改为普通按钮 + 组件内样式；选中滑块仍用
       motion-v 的 layout 动画，并遵循 useReducedMotion 降级为瞬时。
       state 支持受控（传 state）/ 非受控（内部 ref），切换时 emit update:state。
    6. size 取 demo 的 200（源码 240）以适配画廊卡片；labels 未传时用内置英文文案。
    7. 无图片物料，无需 assets 目录。
-->
<template>
  <div
    data-slot="matrix-orb"
    :data-state="current"
    class="matrix-orb"
    :style="{ '--orb-color': color }"
  >
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="matrix-orb__canvas"
      :style="{ width: `${size}px`, height: `${size}px` }"
    ></canvas>

    <span role="status" aria-live="polite" class="matrix-orb__label">
      {{ labelText }}
    </span>

    <!-- 三态切换器：来自 demo，拖拽外壳已去除，保留 idle / listening / thinking 切换 -->
    <div class="matrix-orb__switcher" role="group" aria-label="Orb state">
      <button
        v-for="option in STATES"
        :key="option"
        type="button"
        class="matrix-orb__option"
        :aria-pressed="current === option"
        @click="select(option)"
      >
        <motion.span
          v-if="current === option"
          layout
          class="matrix-orb__pill"
          :transition="slide"
        />
        <span
          class="matrix-orb__option-text"
          :class="{ 'matrix-orb__option-text--active': current === option }"
        >
          {{ option }}
        </span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
/** 光球三态 */
export type MatrixOrbState = 'idle' | 'listening' | 'thinking';
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { motion, useReducedMotion } from 'motion-v';

const TAU = Math.PI * 2;
const STATES: MatrixOrbState[] = ['idle', 'listening', 'thinking'];

const LABELS: Record<MatrixOrbState, string> = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
};

const SCALE: Record<MatrixOrbState, number> = {
  idle: 0.88,
  listening: 1,
  thinking: 0.92,
};

const STIFFNESS = 180;
const DAMPING = 26;
const ATTACK = 0.22;
const RELEASE = 0.08;
const BLEND = 0.16;

const ORBITERS = [
  { radius: 0.62, speed: 2.2, phase: 0, spread: 0.42 },
  { radius: 0.4, speed: -1.7, phase: 2.1, spread: 0.36 },
  { radius: 0.8, speed: 1.15, phase: 4, spread: 0.34 },
];

// 不取绝对值：绝对值的折角会在每个波谷读成一次生硬的停顿
function envelope(t: number) {
  const slow = 0.5 + 0.5 * Math.sin(t * 0.62 + 0.4);
  const fast = 0.5 + 0.5 * Math.sin(t * 1.9 + 1.1);
  return 0.22 + 0.78 * (0.45 + 0.55 * slow) * fast;
}

function intensityOf(
  state: MatrixOrbState,
  d: number,
  nx: number,
  ny: number,
  t: number,
  amplitude: number,
) {
  if (state === 'listening') {
    const ripple = 0.5 + 0.5 * Math.sin(d * 4.2 - t * 3);
    return 0.32 + amplitude * (0.34 + 0.38 * ripple);
  }

  if (state === 'thinking') {
    let heat = 0;
    for (const o of ORBITERS) {
      const a = t * o.speed + o.phase;
      const dx = nx - Math.cos(a) * o.radius;
      const dy = ny - Math.sin(a) * o.radius;
      heat += Math.exp(-(dx * dx + dy * dy) / (o.spread * o.spread));
    }
    return 0.26 + 0.8 * Math.min(1, heat);
  }

  return 0.62 + 0.12 * Math.sin(t * 1.05 - d * 2.4);
}

const props = withDefaults(
  defineProps<{
    state?: MatrixOrbState;
    level?: number;
    size?: number;
    color?: string;
    dots?: number;
    labels?: Partial<Record<MatrixOrbState, string>>;
  }>(),
  {
    state: undefined,
    level: undefined,
    size: 200,
    color: '#F75001',
    dots: 11,
    labels: undefined,
  },
);

const emit = defineEmits<{
  (e: 'update:state', value: MatrixOrbState): void;
}>();

const reduced = useReducedMotion();

const slide = computed<Record<string, unknown>>(() =>
  reduced.value
    ? { duration: 0 }
    : { type: 'spring', stiffness: 420, damping: 34 },
);

const canvasRef = ref<HTMLCanvasElement | null>(null);

const ownState = ref<MatrixOrbState>('idle');
const current = computed(() => props.state ?? ownState.value);

const labelText = computed(
  () => props.labels?.[current.value] ?? LABELS[current.value],
);

function select(option: MatrixOrbState) {
  ownState.value = option;
  emit('update:state', option);
}

/* ============================================================
 * devicePixelRatio：源码用 useSyncExternalStore 订阅 resize，
 * 这里改为 ref + resize 监听（缓冲区按当前 dpr 重建）
 * ========================================================== */

const dpr = ref(1);

function readDpr() {
  dpr.value = Math.min(window.devicePixelRatio || 1, 4);
}

onMounted(() => {
  readDpr();
  window.addEventListener('resize', readDpr);
});

/** 当前场景的循环取消函数 */
let cancelLoop: (() => void) | null = null;
/** 低动态模式下的静态重绘函数（state / level 变化时调用） */
let redraw: (() => void) | null = null;

function run() {
  cancelLoop?.();
  cancelLoop = null;
  redraw = null;

  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) {
    return;
  }

  const size = props.size;
  const color = props.color;
  const grid = Math.max(3, Math.round(props.dots));
  const ratio = dpr.value;

  // 用 buffer / size 而非 dpr 缩放，取整后变换依然精确
  const buffer = Math.round(size * ratio);
  canvas.width = canvas.height = buffer;
  ctx.scale(buffer / size, buffer / size);
  ctx.fillStyle = color;

  const half = (grid - 1) / 2;
  const spacing = (size * 0.74) / (grid - 1);
  const maxRadius = spacing * 0.6;
  const center = size / 2;

  const weights: Record<MatrixOrbState, number> = {
    idle: 0,
    listening: 0,
    thinking: 0,
  };
  weights[current.value] = 1;

  // level 非有限值会让平滑器永远卡住，先兜底
  const levelAt = (t: number) => {
    const v = props.level;
    return v === undefined || !Number.isFinite(v)
      ? envelope(t)
      : Math.min(1, Math.max(0, v));
  };

  const draw = (t: number, amplitude: number, scale: number) => {
    ctx.clearRect(0, 0, size, size);

    for (let iy = 0; iy < grid; iy++) {
      for (let ix = 0; ix < grid; ix++) {
        const nx = (ix - half) / half;
        const ny = (iy - half) / half;
        const d = Math.hypot(nx, ny);
        // 取 1.12 而非方形对角 1.41，外轮廓才是圆的
        if (d > 1.12) {
          continue;
        }

        let blended = 0;
        for (const s of STATES) {
          if (weights[s] < 0.001) {
            continue;
          }
          blended += weights[s] * intensityOf(s, d, nx, ny, t, amplitude);
        }

        const intensity = Math.min(1, Math.max(0, blended));
        const radius = maxRadius * Math.exp(-d * d * 1.7) * intensity * scale;
        // 半径不足半个设备像素时只会渲染成雾，直接跳过
        if (radius * ratio < 0.5) {
          continue;
        }

        ctx.beginPath();
        ctx.arc(
          center + (ix - half) * spacing * scale,
          center + (iy - half) * spacing * scale,
          radius,
          0,
          TAU,
        );
        ctx.fill();
      }
    }
  };

  const reduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) {
    redraw = () => {
      const state = current.value;
      for (const s of STATES) {
        weights[s] = s === state ? 1 : 0;
      }
      draw(0, levelAt(0), SCALE[state]);
    };
    redraw();
    return;
  }

  let t = 0;
  let amplitude = 0;
  let scale = SCALE[current.value];
  let velocity = 0;
  let last = performance.now();
  let raf = 0;

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;

    const state = current.value;
    const target = levelAt(t);
    const rate = target > amplitude ? ATTACK : RELEASE;
    amplitude += (target - amplitude) * (1 - Math.pow(1 - rate, dt * 60));

    // 各态独立权重，切换被打断时从屏幕上的状态平滑混合
    const step = 1 - Math.pow(1 - BLEND, dt * 60);
    for (const s of STATES) {
      weights[s] += ((s === state ? 1 : 0) - weights[s]) * step;
    }

    velocity +=
      (-STIFFNESS * (scale - SCALE[state]) - DAMPING * velocity) * dt;
    scale += velocity * dt;

    draw(t, amplitude, scale);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  cancelLoop = () => cancelAnimationFrame(raf);
}

// state 有意不进依赖：循环只重定向目标态，从不重启
watch(
  [
    () => props.size,
    () => props.color,
    () => props.dots,
    dpr,
  ],
  () => run(),
  { immediate: true, flush: 'post' },
);

// 低动态模式下 state / level 变化时重绘静态帧
watch([current, () => props.level], () => redraw?.());

onBeforeUnmount(() => {
  window.removeEventListener('resize', readDpr);
  cancelLoop?.();
  cancelLoop = null;
  redraw = null;
});
</script>

<style lang="scss" scoped>
.matrix-orb {
  --orb-label: rgba(23, 23, 23, 0.7);
  --orb-panel-bg: #ffffff;
  --orb-panel-border: #e5e5e5;
  --orb-pill-bg: #fafafa;
  --orb-pill-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  --orb-text: #171717;
  --orb-text-dim: rgba(23, 23, 23, 0.5);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 100%;
}

.matrix-orb__canvas {
  display: block;
  max-width: 100%;
}

.matrix-orb__label {
  font-size: 13px;
  line-height: 18px;
  color: var(--orb-label);
}

/* 切换器：面板 + 选中滑块 */
.matrix-orb__switcher {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--orb-panel-border);
  border-radius: 16px;
  background: var(--orb-panel-bg);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(6px);
}

.matrix-orb__option {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  outline: none;

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(23, 23, 23, 0.3);
  }
}

.matrix-orb__pill {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: var(--orb-pill-bg);
  box-shadow: var(--orb-pill-shadow);
}

.matrix-orb__option-text {
  position: relative;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  text-transform: capitalize;
  color: var(--orb-text-dim);
  transition: color 200ms;
}

.matrix-orb__option-text--active {
  color: var(--orb-text);
}

/* 容器适配：窄卡片下切换器按钮收紧，避免溢出 */
@media (max-width: 1280px) {
  .matrix-orb__option {
    padding: 0 10px;
  }
}

@media (min-width: 1920px) {
  .matrix-orb {
    gap: 16px;
  }

  .matrix-orb__option {
    padding: 0 18px;
  }
}

/*
 * 暗色主题：整体切换颜色变量。
 * 选择器必须整条写进 :global()——写成 `:global([data-theme='dark']) .matrix-orb`
 * 会被 Vue scoped 编译丢弃尾部类名，变量落到 <html> 上后被组件自身定义覆盖。
 */
:global(html[data-theme='dark'] .matrix-orb) {
  --orb-label: rgba(245, 245, 245, 0.7);
  --orb-panel-bg: #262626;
  --orb-panel-border: #3f3f3f;
  --orb-pill-bg: #171717;
  --orb-pill-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  --orb-text: #f5f5f5;
  --orb-text-dim: rgba(245, 245, 245, 0.5);
}

@media (prefers-reduced-motion: reduce) {
  .matrix-orb__option-text {
    transition: none;
  }
}
</style>
