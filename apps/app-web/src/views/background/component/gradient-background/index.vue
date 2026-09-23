<!--
  组件名称：GradientBackground（纯展示组件 + AI 生图背景订阅）

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）
    - pinia + pinia-plugin-persistedstate（订阅 store/modules/image）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .gradient-background 上）：
    --gb-base-from        #0b1d3a                底色渐变起始（深蓝）
    --gb-base-to          #142a52                底色渐变结束（深蓝）
    --gb-accent-1        #00d4ff                强调色 1（青色光斑）
    --gb-accent-2        #4f7eff                强调色 2（蓝色光斑）
    --gb-accent-3        #b06bff                强调色 3（紫色光斑）
    --gb-title-text      #ffffff            主标题文字色
    --gb-sub-text        rgba(255,255,255,0.7)   副标题文字色
    --gb-tag-bg          rgba(255,255,255,0.08) 标签胶囊背景色
    --gb-tag-border      rgba(255,255,255,0.18) 标签胶囊描边色
    --gb-tag-text        #b5e8ff                标签胶囊文字色

  设计说明：
    1. 控制面板已从本组件移除，统一放到「生图管理」抽屉（@/components/image-generator）。
       本组件仅负责「展示」，即根据 store 中的 activeBackgroundTask 自动渲染默认渐变
       或对应任务的生成图。
    2. 当 activeBackgroundTask 状态为 success 时，渲染 result.imageUrl（优先 blobUrl
       否则退到 originalUrl），并把任务参数拼接成信息标签；否则回落到默认渐变。
    3. 切换 / 重置不需要本组件主动操作，由「生图管理」抽屉统一发指令。
    4. 图片加载失败给出友好兜底提示，由用户回抽屉重新生图。
-->
<template>
  <div class="gradient-background">
    <!-- 默认渐变背景：当没有激活的 AI 背景任务时显示 -->
    <template v-if="!bgImageUrl">
      <div class="gradient-background__layer gradient-background__layer--base"></div>
      <div class="gradient-background__layer gradient-background__layer--diag"></div>
      <div
        class="gradient-background__layer gradient-background__layer--blob gradient-background__layer--blob-1"
      ></div>
      <div
        class="gradient-background__layer gradient-background__layer--blob gradient-background__layer--blob-2"
      ></div>
      <div
        class="gradient-background__layer gradient-background__layer--blob gradient-background__layer--blob-3"
      ></div>
      <div class="gradient-background__grid"></div>
    </template>

    <!-- AI 生图作为背景：来自 store 中的 activeBackgroundTask -->
    <template v-else>
      <img
        class="gradient-background__ai-image"
        :src="bgImageUrl"
        alt="AI generated background"
        @load="onImageLoad"
        @error="onImageError"
      />
      <div class="gradient-background__ai-scrim"></div>
      <!-- 图片加载失败兜底 -->
      <div v-if="imageLoadFailed" class="gradient-background__ai-error">
        图片加载失败，请到右上角「生图管理」重新生成
      </div>
    </template>

    <!-- 内容区：始终展示 -->
    <div class="gradient-background__content">
      <div class="gradient-background__title">{{ titleText }}</div>
      <div class="gradient-background__sub">
        {{ subText }}
      </div>

      <!-- 默认渐变时显示原有标签胶囊 -->
      <div v-if="!bgImageUrl" class="gradient-background__tags">
        <span
          v-for="tag in mockTags"
          :key="tag"
          class="gradient-background__tag"
        >
          {{ tag }}
        </span>
      </div>

      <!-- AI 生图时显示任务信息标签 -->
      <div v-else class="gradient-background__tags">
        <span class="gradient-background__tag">
          AI 生图 {{ lastCostText }}
        </span>
        <span class="gradient-background__tag">{{ aiModelText }}</span>
        <span class="gradient-background__tag">{{ aiSizeText }}</span>
        <span class="gradient-background__tag">{{ aiFormatText }}</span>
        <span class="gradient-background__tag">{{ aiTransparentText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useImageStore } from '@/store/modules/image';
import { IMAGE_MODEL_OPTIONS } from '@/utils/ai-image';

/** 顶部标签胶囊（默认渐变模式） */
const mockTags: string[] = ['线性渐变', '径向渐变', '对角叠加', '浮动光斑'];

const imageStore = useImageStore();

/** 图片加载失败标记（仅本地 UI 用，不写回 store） */
const imageLoadFailed = ref<boolean>(false);

/** 当前激活的背景任务（来自 store，只在 status === 'success' 时非空） */
const activeTask = computed(() => imageStore.activeBackgroundTask);

/** 当前生效的图片 URL：优先 blobUrl（避免第三方 CDN 倒序转码） */
const bgImageUrl = computed(() => {
  const t = activeTask.value;
  if (!t?.result) return '';
  return t.result.blobUrl || t.result.imageUrl || '';
});

/** 用时格式化（mm:ss） */
function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** 最终用时（生成完成后展示） */
const lastCostText = computed(() => {
  const t = activeTask.value;
  if (!t?.result) return '';
  return `用时 ${formatDuration(t.result.elapsedMs)}`;
});

/** 模型名（取当前任务的 model，回退到默认值） */
const aiModelText = computed(() => {
  const t = activeTask.value;
  if (!t) return '';
  const meta = IMAGE_MODEL_OPTIONS.find((m) => m.value === t.params.model);
  return meta?.label ?? t.params.model ?? '';
});

/** 尺寸（含 upscale） */
const aiSizeText = computed(() => {
  const t = activeTask.value;
  if (!t) return '';
  const size = t.params.size ?? '';
  const up = t.params.upscale ? ` · ${t.params.upscale}` : '';
  return `${size}${up}`;
});

/** 输出格式 + 画质 */
const aiFormatText = computed(() => {
  const t = activeTask.value;
  if (!t) return '';
  const fmt = (t.params.outputFormat ?? 'png').toUpperCase();
  const q = t.params.quality ?? 'auto';
  return `${fmt} · ${q}`;
});

/** 是否透明 */
const aiTransparentText = computed(() => {
  const t = activeTask.value;
  if (!t) return '';
  return t.params.transparent ? '透明' : '不透明';
});

/** 标题 / 副标题根据是否有 AI 背景切换 */
const titleText = computed(() =>
  activeTask.value ? 'AI 生图背景' : '渐变背景',
);
const subText = computed(() =>
  activeTask.value
    ? `AI Generated Background · ${aiModelText.value}`
    : 'Gradient Background · 多层渐变与浮动光斑叠加',
);

function onImageLoad() {
  imageLoadFailed.value = false;
}

function onImageError() {
  imageLoadFailed.value = true;
  // eslint-disable-next-line no-console
  console.warn('[GradientBackground] AI 图片加载失败');
}
</script>

<style lang="scss" scoped>
.gradient-background {
  // 颜色变量集中定义，使用者只需覆盖以下变量即可换肤
  --gb-base-from: #0b1d3a;
  --gb-base-to: #142a52;
  --gb-accent-1: #00d4ff;
  --gb-accent-2: #4f7eff;
  --gb-accent-3: #b06bff;
  --gb-title-text: #ffffff;
  --gb-sub-text: rgba(255, 255, 255, 0.7);
  --gb-tag-bg: rgba(255, 255, 255, 0.08);
  --gb-tag-border: rgba(255, 255, 255, 0.18);
  --gb-tag-text: #b5e8ff;

  position: relative;
  width: 100%;
  height: 320px;
  overflow: hidden;
  border-radius: 8px;
  isolation: isolate;
  background: linear-gradient(
    180deg,
    var(--gb-base-from) 0%,
    var(--gb-base-to) 100%
  );

  &__layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  // 对角线叠加：在视觉上增强方向感
  &__layer--diag {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.04) 0%,
      rgba(255, 255, 255, 0) 60%
    );
  }

  // 浮动光斑（径向渐变 + 模糊），三层不同位置 / 不同色
  &__layer--blob {
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.55;
    animation: gb-float 12s ease-in-out infinite;

    &--blob-1 {
      top: -10%;
      left: -10%;
      width: 320px;
      height: 320px;
      background: radial-gradient(
        circle,
        var(--gb-accent-1) 0%,
        rgba(0, 212, 255, 0) 70%
      );
    }

    &--blob-2 {
      bottom: -15%;
      right: -10%;
      width: 360px;
      height: 360px;
      background: radial-gradient(
        circle,
        var(--gb-accent-2) 0%,
        rgba(79, 126, 255, 0) 70%
      );
      animation-delay: -4s;
    }

    &--blob-3 {
      top: 30%;
      left: 40%;
      width: 240px;
      height: 240px;
      background: radial-gradient(
        circle,
        var(--gb-accent-3) 0%,
        rgba(176, 107, 255, 0) 70%
      );
      animation-delay: -8s;
    }
  }

  // 极淡的网格纹理，增加「科技感」肌理
  &__grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: linear-gradient(
        rgba(255, 255, 255, 0.04) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(circle at center, #000 0%, transparent 75%);
    -webkit-mask-image: radial-gradient(circle at center, #000 0%, transparent 75%);
  }

  // AI 生图作为背景：保持比例 + 暗色蒙版保证文字可读
  &__ai-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  &__ai-scrim {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.15) 0%,
      rgba(0, 0, 0, 0.45) 100%
    );
    z-index: 0;
  }

  &__ai-error {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: var(--gb-tag-text);
    background: rgba(11, 29, 58, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
    box-sizing: border-box;
    text-align: center;
  }

  &__title {
    font-size: 28px;
    font-weight: 700;
    color: var(--gb-title-text);
    letter-spacing: 4px;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  }

  &__sub {
    margin-top: 10px;
    font-size: 13px;
    color: var(--gb-sub-text);
    letter-spacing: 1px;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 18px;
  }

  &__tag {
    padding: 4px 12px;
    font-size: 12px;
    color: var(--gb-tag-text);
    background: var(--gb-tag-bg);
    border: 1px solid var(--gb-tag-border);
    border-radius: 999px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
}

/** 浮动光斑动画：通过 translate 缓慢漂移 */
@keyframes gb-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(20px, -16px, 0) scale(1.05);
  }
}

/** 用户开启系统级 reduced-motion 时关闭浮动动画 */
@media (prefers-reduced-motion: reduce) {
  .gradient-background__layer--blob {
    animation: none;
  }
}
</style>