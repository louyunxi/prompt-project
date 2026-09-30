<!--
  组件名称：ProximityDash（近距感应短横线，proximity-sidebar 的单条）

  来源迁移：E:\桌面\rare-ui-main\components\ui\proximity-sidebar.tsx（Dash 部分）
           示例数据参考：E:\桌面\rare-ui-main\app\components\(docs)\proximitysidebar\demo.tsx

  依赖插件 / 版本：
    - motion-v ^2.5.1（React 版 motion/react 的 Vue 移植，负责运动值与弹簧）
    - vue ^3.5.13（catalog 统一版本）
    - sass-embedded（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 .prox-sidebar 上，仅覆盖变量即可换肤）：
    --prox-bar-strong  #171717                主要分区（title / subtitle）短横线色
    --prox-bar-muted   rgba(115,115,115,.4)   次级分区（section / body）短横线色
    --prox-focus       #a3a3a3                键盘焦点环色
    暗色主题（[data-theme='dark']）下上述颜色整体切换，见 index.vue 的 <style> 末尾。

  迁移说明：
    1. 去除 react / Tailwind 工具类（group / flex / h-px / w-[110px] / bg-foreground
       / ring-*）依赖，全部改写为组件内 scoped SCSS；无组件目录之外的引用。
    2. 运动值改由父级（index.vue）经 prop 传入（Vue 中无法在 v-for 内调用组合式函数），
       useTransform + useSpring 与 React 版一一对应：
       - 指针距离 → 目标缩放：React 用三档 range 映射，此处用等价的线性插值 + clamp；
       - scaleX 仍以固定基准宽（MAX_DASH_WIDTH）计算，元素宽度由 CSS 固定。
    3. 新增 useReducedMotion 降级：开启「减少动态效果」时跳过弹簧，直接跟随目标缩放。
    4. 短横线基准长度按比例缩小（源 110px → 84px），否则在约 240px 宽的画廊卡片内
       会横向溢出、靠近效果不可见。
    5. 无图片物料，无需 assets 目录。
-->
<template>
  <button
    ref="dashRef"
    type="button"
    class="prox-dash"
    :class="[`prox-dash--${side}`, `prox-dash--${kind}`]"
    :data-dash="sectionId"
    :aria-current="active ? 'location' : undefined"
    :aria-label="`Go to ${label}`"
    :title="label"
    @click="emit('select')"
  >
    <motion.span class="prox-dash__bar" :style="barStyle" />
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MotionValue } from 'motion-v';
import { motion, useReducedMotion, useSpring, useTransform } from 'motion-v';

/** 内容层级（决定短横线基准长度与颜色） */
export type SectionKind = 'title' | 'subtitle' | 'section' | 'body';
/** 侧边栏朝向（决定短横线从哪一侧展开） */
export type Side = 'left' | 'right';

const props = withDefaults(
  defineProps<{
    mouseY: MotionValue<number>;
    sectionId: string;
    label: string;
    active?: boolean;
    kind?: SectionKind;
    side?: Side;
  }>(),
  {
    active: false,
    kind: 'body',
    side: 'left',
  },
);

const emit = defineEmits<{ (e: 'select'): void }>();

/** 指针感应半径（px） */
const RADIUS = 40;
/** 短横线基准宽度，scaleX 以此为分母（与 .prox-dash 宽度保持一致） */
const MAX_DASH_WIDTH = 84;

/** 各层级的基准长度 base 与靠近时的增量 bump（已按卡片尺寸等比缩小） */
const DASH_PRESETS: Record<SectionKind, { base: number; bump: number }> = {
  title: { base: 30, bump: 54 },
  subtitle: { base: 27, bump: 48 },
  section: { base: 22, bump: 40 },
  body: { base: 18, bump: 34 },
};

const SPRING = { stiffness: 320, damping: 34, mass: 0.7 };

const dashRef = ref<HTMLButtonElement | null>(null);
const reduced = useReducedMotion();

const preset = computed(() => DASH_PRESETS[props.kind]);

// 指针与短横线中心的垂直距离；未悬停时父级把 mouseY 设为 Infinity，
// 距离被 clamp 到 RADIUS，短横线回到基准长度
const distance = useTransform(props.mouseY, (y) => {
  const rect = dashRef.value?.getBoundingClientRect();
  if (!rect) {
    return RADIUS;
  }
  return y - (rect.top + rect.height / 2);
});

// 距离 0 → base + bump，距离 ≥ RADIUS → base（等价于源组件的三档 range 映射）
const targetScaleX = useTransform(distance, (value) => {
  const { base, bump } = preset.value;
  const ratio = Math.min(Math.abs(value) / RADIUS, 1);
  return (base + bump * (1 - ratio)) / MAX_DASH_WIDTH;
});

const springX = useSpring(targetScaleX, SPRING);

/** 减少动态效果时不做弹簧过渡，直接跟随目标值 */
const scaleX = computed(() => (reduced.value ? targetScaleX : springX));

const barStyle = computed(() => ({
  scaleX: scaleX.value,
  transformOrigin: props.side === 'left' ? 'left center' : 'right center',
  width: `${MAX_DASH_WIDTH}px`,
  height: '1px',
}));
</script>

<style lang="scss" scoped>
.prox-dash {
  display: flex;
  align-items: center;
  width: 84px;
  height: 1px;
  padding: 0;
  border: 0;
  background: transparent;
  outline: none;
  cursor: pointer;
}

.prox-dash--right {
  justify-content: flex-end;
}

.prox-dash__bar {
  display: block;
  background: var(--prox-bar-muted, rgba(115, 115, 115, 0.4));
  transition: background-color 150ms ease-out;
}

.prox-dash--title .prox-dash__bar,
.prox-dash--subtitle .prox-dash__bar {
  background: var(--prox-bar-strong, #171717);
}

.prox-dash:focus-visible .prox-dash__bar {
  outline: 2px solid var(--prox-focus, #a3a3a3);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .prox-dash__bar {
    transition: none;
  }
}
</style>
