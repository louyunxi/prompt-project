<!--
  组件名称：NumberRain（数字雨 / 矩阵代码雨）

  来源迁移：
    - 源文件：D:\sn-project\frp_gov_web\src\components\effect\number-rain.vue
    - 说明：源组件为 SCSS + DOM <p> 列实现，存在固定字号 + DOM 元素溢出 + 横向
      滚动条隐患。本次重写为 Canvas 实现：canvas = 容器 100% × 100%，零 DOM
      子元素、无滚动条，字号 / 列宽 / 列数 / 行距均通过 JS 实时根据容器宽度计算。

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .number-rain 上，canvas 通过
            getComputedStyle 运行时读取，使用者可覆盖）：
    --nr-bg          #03121d               组件底色（拖尾渐隐填充色）
    --nr-text        #00ebf5               数字雨文字色（荧光青）
    --nr-glow        #ffffff               文字辉光色（shadowBlur）
    --nr-fade-alpha  0.15                  拖尾渐隐强度（每帧覆盖透明度，值越大字符消失越快、画面越暗）

  尺寸变量（响应式）：
    --nr-height    clamp(200px, 22cqi, 480px)  容器高度（cqi 跟随宽度等比缩放）

  实现要点：
    1. Canvas 物理像素尺寸 = 容器 CSS 尺寸 × devicePixelRatio，绘制前 ctx.scale 还原。
    2. 字号 = clamp(12, width * 0.06, 28) px，与容器宽度等比缩放。
    3. 列宽 = ctx.measureText('0').width 精确测量（避免等宽字体 0.6em 比例误差）。
    4. 列数 = floor(width / columnWidth)，填满容器不溢出。
    5. 每帧：半透明底色覆盖形成拖尾 + fillText 随机 0/1 字符 + 行内随机重置。
    6. ResizeObserver 监听容器尺寸变化，重建 canvas 与 drops 数组。
    7. prefers-reduced-motion: reduce 时不启动 RAF，仅绘制静态首帧。
-->
<template>
  <div ref="containerRef" class="number-rain">
    <canvas ref="canvasRef" class="number-rain__canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/** Canvas 元素引用 */
const canvasRef = ref<HTMLCanvasElement>();
/** 容器元素引用（用于 ResizeObserver 与尺寸读取） */
const containerRef = ref<HTMLElement>();

/** 设备像素比（高清屏渲染需要） */
const dpr = window.devicePixelRatio || 1;

/** Canvas 2D 上下文（避免每帧重复 getContext） */
let ctx: CanvasRenderingContext2D | null = null;

/** 动态尺寸：根据容器宽度实时计算 */
const fontSize = ref(14);
const columnWidth = ref(8);
/** 列数 = floor(容器宽度 / 字符宽度)，填满容器不溢出 */
const columnCount = ref(0);

/** 每列当前下落位置（单位：行；y = dropY * fontSize） */
const drops: number[] = [];

/** 帧动画 id */
let rafId = 0;
/** 容器尺寸观察器 */
let resizeObserver: ResizeObserver | null = null;
/** 帧计数器（用于按 --nr-speed-ms 节流推进 drops） */
let frameCounter = 0;

/** 用户系统级 reduced-motion 时关闭动画 */
const motionReduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 随机字符集合 */
const CHARSET = '01';

/** 运行时颜色（从 CSS 变量读取，resize 时刷新） */
let textColor = '#00ebf5';
let glowColor = '#ffffff';
let bgColor = '#03121d';
/** 拖尾渐隐透明度（每帧覆盖强度；越大 → 字符消失越快、画面越暗） */
let fadeAlpha = 0.6;

/** 从容器元素读取 CSS 变量 */
function readCssVar(name: string, fallback: string): string {
  if (!containerRef.value) return fallback;
  const v = getComputedStyle(containerRef.value).getPropertyValue(name).trim();
  return v || fallback;
}

/** 重置 canvas 与配置（容器尺寸变化时调用） */
function resize() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  const rect = container.getBoundingClientRect();
  const cssWidth = Math.max(1, Math.floor(rect.width));
  const cssHeight = Math.max(1, Math.floor(rect.height));

  // 字号：容器宽度的 6%，clamp 12-28px（canvas 渲染，过大影响性能与视觉密度）
  fontSize.value = Math.max(14, Math.min(8, cssWidth * 0.2));

  // 颜色变量（仅在 resize 时读取，避免每帧调 getComputedStyle）
  textColor = readCssVar('--nr-text', textColor);
  glowColor = readCssVar('--nr-glow', glowColor);
  bgColor = readCssVar('--nr-bg', bgColor);
  // 拖尾渐隐强度（解析失败回退 0.15）
  const parsed = parseFloat(readCssVar('--nr-fade-alpha', '0.15'));
  fadeAlpha = Number.isFinite(parsed) ? parsed : 0.15;
  // 设置 canvas 物理像素尺寸（DPR 缩放 → 高清屏不糊）
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.font = `${fontSize.value}px 'Consolas', 'Monaco', 'Courier New', monospace, sans-serif`;

  // 精确测量等宽字符宽度，避免 0.6 经验比例误差
  columnWidth.value = ctx.measureText('0').width;

  // 列数：floor 填满容器不溢出
  columnCount.value = Math.floor(cssWidth / columnWidth.value);

  // 重置 drops 数组（每列初始 y 随机 → 错峰下落）
  drops.length = 0;
  for (let i = 0; i < columnCount.value; i++) {
    drops[i] = Math.random() * (cssHeight / fontSize.value);
  }

  // 立即绘制一帧（避免首次空白闪烁 + reduced-motion 时定格为画面）
  drawFrame(cssWidth, cssHeight);
}

/** 绘制单帧 */
function drawFrame(width: number, height: number) {
  if (!ctx) return;
  // 半透明底色覆盖 → 形成拖尾渐隐效果（globalAlpha 跟随 --nr-fade-alpha）
  ctx.globalAlpha = fadeAlpha;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  ctx.font = `${fontSize.value}px 'Consolas', 'Monaco', 'Courier New', monospace, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'top';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 4;

  for (let i = 0; i < drops.length; i++) {
    const ch = CHARSET[Math.floor(Math.random() * CHARSET.length)];
    const x = i * columnWidth.value;
    const y = drops[i] * fontSize.value;

    ctx.fillText(ch, x, y);

    // 到达底部后随机重置回顶部（0.975 概率阈值模拟自然下落的随机断流）
    if (y > height && Math.random() > 0.98) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

let i = 0;
/** 动画主循环（requestAnimationFrame） */
function loop() {
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;
  i++;
  if (i === 2) {
    drawFrame(canvas.width / dpr, canvas.height / dpr);
    i = 0;
  }
  rafId = requestAnimationFrame(loop);
}

onMounted(() => {
  resize();
  if (!motionReduced) {
    rafId = requestAnimationFrame(loop);
  }
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  resizeObserver?.disconnect();
  resizeObserver = null;
  ctx = null;
});
</script>

<style scoped lang="scss">
.number-rain {
  // 启用容器查询，让 cqi 单位跟随本组件宽度变化
  container-type: inline-size;

  --nr-bg: #03121d;
  --nr-text: #00ebf5;
  --nr-glow: #000000;
  --nr-fade-alpha: 0.05;
  --nr-height: 100%;

  position: relative;
  width: 100%;
  height: var(--nr-height);
  overflow: hidden;
  border-radius: 8px;
  background: var(--nr-bg);
}

.number-rain__canvas {
  display: block;
  // canvas 物理像素尺寸由 JS 按 DPR 设置，CSS 尺寸始终 100% 跟随容器
  width: 100%;
  height: 100%;
}
</style>
