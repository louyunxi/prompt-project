<!--
  组件名称：FluidOrb（流体光球）

  来源迁移：E:\桌面\rare-ui-main\components\ui\fluid-orb.tsx
           示例数据参考：E:\桌面\rare-ui-main\app\components\(docs)\fluidorb\demo.tsx

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass-embedded（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 .fluid-orb 上，仅覆盖变量即可换肤）：
    --fluid-color  #1A73F2  球体主色（由 color prop 注入，着色片元着色器 u_color）
    说明：球体高光 / 暗部由着色器在白色与 --fluid-color 之间 mix 得到，无需额外变量；
          组件无背景色，球体边缘按 distance 计算 alpha 透明渐隐。

  迁移说明：
    1. 去除 react / cn() / Tailwind 工具类依赖：cn 的合并逻辑由固定类名取代，
       工具类（relative / overflow-hidden / rounded-full / h-full / w-full）改写为组件内 scoped SCSS，
       未引入任何组件目录之外的工具函数或样式。
    2. 渲染方式保持原生 WebGL：useEffect 改为 onMounted 首次初始化 + watch([size, color]) 重建，
       清理函数（取消 rAF、删除 program/shader/buffer）挂到 onBeforeUnmount 与重建前的 teardown。
    3. useRef(canvas) 改为 Vue 模板 ref；size / color 直接读 props，无需额外 ref 同步。
    4. 保留 prefers-reduced-motion 降级：命中时只渲染 u_time = 0 的静态一帧。
    5. demo 中的 ColorSwatches / usePreviewControl 是 rare-ui 预览工具，按要求不迁移；
       color 使用默认 prop。default size 取 demo 的 200（源码 240），以适配画廊卡片。
    6. 无图片物料，无需 assets 目录。
-->
<template>
  <div
    data-slot="fluid-orb"
    class="fluid-orb"
    :style="{ width: `min(100%, ${size}px)`, aspectRatio: '1', '--fluid-color': color }"
  >
    <canvas ref="canvasRef" class="fluid-orb__canvas" aria-hidden="true" ></canvas>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    size?: number;
    color?: string;
  }>(),
  {
    size: 200,
    color: '#1A73F2',
  },
);

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.6;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = u_time * 0.22;

  vec2 drift = vec2(
    sin(t) + 0.6 * sin(t * 1.7 + 1.3),
    cos(t * 0.8) + 0.6 * cos(t * 1.3 + 2.1)
  );

  vec2 p = vec2(uv.x * 1.8, uv.y * 1.0) + drift * 0.7;

  vec2 q = vec2(fbm(p + drift), fbm(p + vec2(3.2, 1.5) - drift));
  float f = fbm(p + 1.2 * q);

  float g = clamp(1.0 - uv.y, 0.0, 1.0);
  float anchor = smoothstep(0.0, 0.3, uv.y);
  float shade = clamp(g + (f - 0.5) * 0.8 * anchor, 0.0, 1.0);

  vec3 white = vec3(0.99, 1.0, 1.0);
  vec3 light = mix(white, u_color, 0.5);
  vec3 dark = u_color;

  vec3 col = white;
  col = mix(col, light, smoothstep(0.28, 0.52, shade));
  col = mix(col, dark, smoothstep(0.58, 0.88, shade));

  float edge = smoothstep(0.5, 0.49, distance(uv, vec2(0.5)));

  gl_FragColor = vec4(col * edge, edge);
}
`;

const canvasRef = ref<HTMLCanvasElement | null>(null);

/** 当前场景的清理函数（重建 / 卸载时调用） */
let dispose: (() => void) | null = null;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) {
    return [0.1, 0.45, 0.95];
  }
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** 初始化 WebGL 场景并启动渲染循环，返回清理函数 */
function createScene(size: number, color: string): (() => void) | null {
  const canvas = canvasRef.value;
  if (!canvas) {
    return null;
  }

  const gl = canvas.getContext('webgl', { antialias: true, alpha: true });
  if (!gl) {
    return null;
  }

  const program = gl.createProgram();
  const vert = compile(gl, gl.VERTEX_SHADER, VERT);
  const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!program || !vert || !frag) {
    return null;
  }

  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');
  gl.uniform3f(gl.getUniformLocation(program, 'u_color'), ...hexToRgb(color));

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const px = Math.round(size * dpr);
  canvas.width = px;
  canvas.height = px;
  gl.viewport(0, 0, px, px);
  gl.uniform2f(uResolution, px, px);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let raf = 0;

  const render = (now: number) => {
    gl.uniform1f(uTime, reduce ? 0 : (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (!reduce) {
      raf = requestAnimationFrame(render);
    }
  };
  render(start);

  return () => {
    cancelAnimationFrame(raf);
    gl.deleteProgram(program);
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    gl.deleteBuffer(buffer);
  };
}

function start() {
  dispose?.();
  dispose = null;
  dispose = createScene(props.size, props.color);
}

onMounted(start);

// size / color 变化时重建 WebGL 场景（等价源码 useEffect 的 [size, color] 依赖）
watch(
  () => [props.size, props.color],
  () => start(),
);

onBeforeUnmount(() => {
  dispose?.();
  dispose = null;
});
</script>

<style lang="scss" scoped>
.fluid-orb {
  position: relative;
  display: block;
  overflow: hidden;
  /* 组件按 size prop 生成缓冲区，用 min() 让球体在窄卡片里等比收缩 */
  max-width: 100%;
  border-radius: 9999px;
}

.fluid-orb__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
