<!--
  组件名称：GridRevealDemo（网格揭开效果 · 生成中 → 揭开演示）

  来源迁移：E:\桌面\rare-ui-main\app\components\(docs)\gridreveal\demo.tsx
           核心组件：同目录 GridReveal.vue（来自 components/ui/grid-reveal.tsx）

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass-embedded（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 .grid-reveal-demo 上，仅覆盖变量即可换肤）：
    --grd-btn-bg    #F4F4F9  生成按钮底色
    --grd-btn-text  #4A4959  生成按钮文案色
    暗色主题（[data-theme='dark']）下上述颜色整体切换，见 <style> 末尾。

  迁移说明：
    1. 去除 react / Tailwind 工具类依赖，按钮的 grid 叠层、圆角、缩放反馈等工具类
       全部改写为组件内 scoped SCSS；未引入任何组件目录之外的工具函数或样式。
    2. useState 计数器 run 改为 ref；useEffect([run]) 的两个 setTimeout（warm / setSrc）
       改为 onMounted 调度 + 组件内 schedule()，并在 onBeforeUnmount 清理定时器。
    3. 保留 demo 完整交互：初始自动生成 → caption 三阶段文案（Starting to generate /
       Creating image / Adding detail）→ 揭开完成后按钮回到可点，可再次 Generate。
       caption 文案与 aria-label 已通用化，不含业务名。
    4. 图片物料：源 demo 的 /assets/landing/herobg.webp 已拷贝到同目录
       assets/hero-bg.webp，用 new URL('./assets/hero-bg.webp', import.meta.url) 引用
       （相对组件目录，不使用 @/assets 别名），Vite 会在构建期解析为最终 URL。
-->
<template>
  <div class="grid-reveal-demo">
    <div class="grid-reveal-demo__frame">
      <GridReveal
        :key="run"
        :src="src"
        alt="A sky of soft clouds at sunset"
        :caption="caption"
        :estimated-duration="GENERATE_MS"
        @reveal-complete="busy = false"
      />
    </div>

    <button
      type="button"
      class="grid-reveal-demo__button"
      :aria-disabled="busy"
      :aria-label="busy ? 'Generating' : 'Generate'"
      @click="generate"
    >
      <span
        aria-hidden="true"
        class="grid-reveal-demo__button-label"
        :class="{ 'grid-reveal-demo__button-label--hidden': busy }"
      >
        Generate
      </span>
      <span
        aria-hidden="true"
        class="grid-reveal-demo__button-label"
        :class="{ 'grid-reveal-demo__button-label--hidden': !busy }"
      >
        Generating
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import GridReveal from './GridReveal.vue';

const IMAGE = new URL('./assets/hero-bg.webp', import.meta.url).href;
const GENERATE_MS = 3600;
const SETTLE_MS = 900;

const run = ref(0);
const src = ref<string | null>(null);
const warm = ref(false);
const busy = ref(true);

let timers: number[] = [];

function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id));
  timers = [];
}

/** 启动一轮生成：先出「创建中」文案，再落图片 */
function schedule() {
  clearTimers();
  timers.push(window.setTimeout(() => (warm.value = true), SETTLE_MS));
  timers.push(window.setTimeout(() => (src.value = IMAGE), GENERATE_MS));
}

function generate() {
  if (busy.value) {
    return;
  }
  src.value = null;
  warm.value = false;
  busy.value = true;
  run.value += 1;
  schedule();
}

const caption = computed(() =>
  src.value
    ? 'Adding detail'
    : warm.value
      ? 'Creating image'
      : 'Starting to generate',
);

onMounted(schedule);
onBeforeUnmount(clearTimers);
</script>

<style lang="scss" scoped>
.grid-reveal-demo {
  --grd-btn-bg: #f4f4f9;
  --grd-btn-text: #4a4959;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100%;
  max-width: 260px;
  max-height: 100%;
}

.grid-reveal-demo__frame {
  width: 100%;
}

.grid-reveal-demo__button {
  display: grid;
  padding: 8px 16px;
  border: 0;
  border-radius: 9999px;
  background: var(--grd-btn-bg);
  color: var(--grd-btn-text);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  transition: transform 150ms;

  &:active {
    transform: scale(0.95);
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;

    &:active {
      transform: scale(1);
    }
  }
}

/* 两个文案叠在同一格内，切换时只做透明度过渡 */
.grid-reveal-demo__button-label {
  grid-row-start: 1;
  grid-column-start: 1;
  transition: opacity 200ms;
}

.grid-reveal-demo__button-label--hidden {
  opacity: 0;
}

@media (max-width: 1280px) {
  .grid-reveal-demo {
    gap: 14px;
  }
}

@media (min-width: 1920px) {
  .grid-reveal-demo {
    gap: 24px;
    max-width: 300px;
  }
}

/*
 * 暗色主题：整体切换颜色变量。
 * 选择器必须整条写进 :global()，否则 Vue scoped 编译会丢弃尾部类名。
 */
:global(html[data-theme='dark'] .grid-reveal-demo) {
  --grd-btn-bg: #262626;
  --grd-btn-text: #b4b3bf;
}

@media (prefers-reduced-motion: reduce) {
  .grid-reveal-demo__button,
  .grid-reveal-demo__button-label {
    transition: none;
  }
}
</style>
