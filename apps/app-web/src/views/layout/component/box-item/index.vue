<!--
  组件名称：BoxItem（大屏 HUD 卡片容器）
  来源迁移：D:\external-projects\showcase-dashboard\src\views\ThreeAssetsSupervision\index.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .box-item 根元素）：
    --bi-primary        #00d4ff               主题色 / 角标 / 流光
    --bi-bg             rgba(8, 20, 42, 0.4)  卡片底色
    --bi-border         rgba(0, 212, 255, 0.25) 边框色
    --bi-border-hover   rgba(0, 212, 255, 0.45) hover 边框色
    --bi-glow           rgba(0, 212, 255, 0.15) 外发光
    --bi-glow-hover     rgba(0, 212, 255, 0.25) hover 外发光

  迁移说明：
    1. 从源文件提取 `.box-item` 与 `%module-card-blue` 的 HUD 卡片样式，
       去除地图、数据、Leaflet 等外部依赖，改为纯展示容器。
    2. 颜色统一提炼为 CSS 自定义属性，支持通过 themeColor prop 一键换主题色。
    3. 保留左侧 / 右侧滑入动画与阶梯延迟，可通过 direction / index 控制。
    4. 无图片物料，无需 assets 目录。
-->
<template>
  <div
    class="box-item"
    :class="{
      'box-item--none': direction === 'none',
      'box-item--left': direction === 'left',
      'box-item--right': direction === 'right',
    }"
    :style="themeStyle"
  >
    <div class="box-item__corner box-item__corner--top"></div>
    <div class="box-item__corner box-item__corner--bottom"></div>
    <div class="box-item__top-line"></div>
    <div class="box-item__bottom-line"></div>
    <div class="box-item__data-flow"></div>
    <div class="box-item__content">
      <slot>
        <div class="box-item__demo">
          <div class="box-item__demo-title">HUD 卡片容器</div>
          <div class="box-item__demo-sub">Box Item Container</div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 滑入方向：left 从左侧滑入，right 从右侧滑入 */
    direction?: 'left' | 'right' | 'none';
    /** 同级下标，用于计算动画延迟 */
    index?: number;
    /** 主题色，会覆盖角标 / 边框 / 流光等颜色 */
    themeColor?: string;
  }>(),
  {
    direction: 'left',
    index: 0,
    themeColor: '#00d4ff',
  },
);

const themeStyle = computed(() => ({
  '--bi-primary': props.themeColor,
  '--bi-border': withAlpha(props.themeColor, 0.25),
  '--bi-border-hover': withAlpha(props.themeColor, 0.45),
  '--bi-glow': withAlpha(props.themeColor, 0.15),
  '--bi-glow-hover': withAlpha(props.themeColor, 0.25),
  animationDelay: `${0.1 + props.index * 0.1}s`,
}));

function withAlpha(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim();
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : raw;
  const num = Number.parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(num)) {
    return `rgba(0, 212, 255, ${alpha})`;
  }
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
</script>

<style lang="scss" scoped>
.box-item {
  --bi-primary: #00d4ff;
  --bi-bg: rgba(8, 20, 42, 0.4);
  --bi-border: rgba(0, 212, 255, 0.25);
  --bi-border-hover: rgba(0, 212, 255, 0.45);
  --bi-glow: rgba(0, 212, 255, 0.15);
  --bi-glow-hover: rgba(0, 212, 255, 0.25);

  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 16px;
  background-color: var(--bi-bg);
  background-size: 200% 200%;
  animation: bi-gradient-shift 8s ease infinite;
  backdrop-filter: blur(6px) saturate(1.5);
  -webkit-backdrop-filter: blur(6px) saturate(1.5);
  border: 1px solid var(--bi-border);
  box-shadow: 0 0 20px var(--bi-glow), 0 0 40px rgba(0, 212, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 30px rgba(0, 212, 255, 0.02);
  overflow: hidden;
  opacity: 0;

  &--none {
    opacity: 1;
    animation: bi-gradient-shift 8s ease infinite;
  }

  &--left {
    animation: bi-gradient-shift 8s ease infinite,
      bi-slide-in-left 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  &--right {
    animation: bi-gradient-shift 8s ease infinite,
      bi-slide-in-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  &:hover {
    border-color: var(--bi-border-hover);
    box-shadow: 0 0 20px var(--bi-glow-hover), 0 0 40px rgba(0, 212, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 0 20px rgba(0, 212, 255, 0.05);
  }

  &__corner {
    position: absolute;
    width: 60px;
    height: 60px;
    pointer-events: none;
    z-index: 1;

    &--top {
      top: 0;
      left: 0;
      border-top: 2px solid var(--bi-primary);
      border-left: 2px solid var(--bi-primary);
      border-top-left-radius: 16px;
    }

    &--bottom {
      bottom: 0;
      right: 0;
      border-bottom: 2px solid var(--bi-primary);
      border-right: 2px solid var(--bi-primary);
      border-bottom-right-radius: 16px;
    }
  }

  &__top-line {
    position: absolute;
    top: 0;
    left: 80px;
    right: 80px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--bi-primary),
      transparent
    );
    opacity: 0.5;
    pointer-events: none;
  }

  &__bottom-line {
    position: absolute;
    bottom: 0;
    left: 80px;
    right: 80px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--bi-primary),
      transparent
    );
    opacity: 0.5;
    pointer-events: none;
  }

  &__data-flow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--bi-primary),
      transparent
    );
    animation: bi-data-flow 3s linear infinite;
    opacity: 0.4;
    pointer-events: none;
  }

  &__content {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    padding: 16px;
  }

  &__demo {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #fff;
    text-align: center;
  }

  &__demo-title {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 2px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  }

  &__demo-sub {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 1px;
  }
}

@keyframes bi-gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes bi-data-flow {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes bi-slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-100%);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
}

@keyframes bi-slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100%);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .box-item,
  .box-item--none,
  .box-item--left,
  .box-item--right {
    opacity: 1;
    animation: bi-gradient-shift 8s ease infinite;
  }
}
</style>
