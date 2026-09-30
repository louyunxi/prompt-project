<!--
  组件名称：GooeySegment（黏性导航分片，gooey-nav 的单个分片）

  来源迁移：E:\桌面\rare-ui-main\components\ui\gooey-nav.tsx（Segment 部分）
           示例数据参考：E:\桌面\rare-ui-main\app\components\(docs)\gooeynav\demo.tsx

  依赖插件 / 版本：
    - motion-v ^2.5.1（React 版 motion/react 的 Vue 移植，负责弹簧与 SVG 形变）
    - vue ^3.5.13（catalog 统一版本）
    - sass-embedded（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 index.vue 的 .gooey-nav 上，仅覆盖变量即可换肤）：
    --gooey-bar   #f4f4f9   分片底色，同时作为脖子渐变的 currentColor 基准
    --gooey-active / --gooey-active-label  由 index.vue 的 props 以行内变量注入
    暗色主题（[data-theme='dark']）下 --gooey-bar 切换，见 index.vue。

  迁移说明：
    1. 去除 react / next/link / cn() / Tailwind 工具类依赖：样式改写为组件内 scoped SCSS，
       分片内容由默认插槽传入（标签本体属于父组件作用域，见 index.vue）。
    2. 动画由 motion/react 换为 motion-v：useSpring(gap) 驱动 marginLeft，useTransform
       把 marginLeft 映射为脖子路径 d；浏览器「减少动态效果」时用 jump() 直接跳变。
    3. 分片间隙 gap 来自父级：相邻分片都非激活时取 -1（重叠 1px，避免露出发丝缝），
       否则取 span（张开一个 separation 的缝）。
    4. 无图片物料，无需 assets 目录。
-->
<template>
  <motion.li
    data-slot="gooey-nav-segment"
    class="gooey-seg"
    :class="active ? 'gooey-seg--fade-in' : 'gooey-seg--fade-out'"
    :style="segmentStyle"
    :initial="false"
    :animate="radii"
    :transition="motionTransition"
  >
    <!-- 脖子：两段凹曲线在缝隙里互相拉丝，只有 gap 大于 0 时才可能画出 -->
    <svg
      v-if="hasSeam"
      class="gooey-seg__seam"
      aria-hidden="true"
      :width="span"
      :viewBox="`0 0 ${span} ${NECK_H}`"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" x2="1">
          <stop offset="0" :stop-color="leftFill" />
          <stop offset="1" :stop-color="rightFill" />
        </linearGradient>
      </defs>
      <motion.path :d="neckD" :fill="`url(#${gradientId})`" />
    </svg>

    <slot ></slot>
  </motion.li>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { motion, useSpring, useTransform } from 'motion-v';

/** 动画过渡配置（结构同 motion 的 Transition） */
type Transition = Record<string, unknown>;

/** 分片圆角（激活项两侧张开时保留圆角，闭合时归零） */
export type Radii = {
  borderTopLeftRadius: number;
  borderBottomLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomRightRadius: number;
};

/** 弹簧：阻尼足够高，避免任何回弹 */
const SPRING = { type: 'spring', stiffness: 200, damping: 28, mass: 1 } as const;
const INSTANT: Transition = { duration: 0 };

/** 缝隙张开到 span 的这个比例时，脖子正好收细到 0 */
const NECK_BREAK = 0.22;
/** 脖子路径的名义 viewBox 高度，SVG 会拉伸到分片实际高度 */
const NECK_H = 100;

let segmentSeq = 0;

const props = withDefaults(
  defineProps<{
    gap: number;
    span: number;
    radii: Radii;
    activeColor: string;
    hasSeam?: boolean;
    leftFill?: string;
    rightFill?: string;
    reduced?: boolean;
    active?: boolean;
  }>(),
  {
    hasSeam: false,
    leftFill: 'currentColor',
    rightFill: 'currentColor',
    reduced: false,
    active: false,
  },
);

const gradientId = `gooey-neck-${++segmentSeq}`;

const marginLeft = useSpring(props.gap, SPRING);

watch(
  () => props.gap,
  (gap) => {
    if (props.reduced) {
      marginLeft.jump(gap);
    } else {
      marginLeft.set(gap);
    }
  },
);

const neckD = useTransform(marginLeft, (gap) => neckPath(gap, props.span));

const motionTransition = computed<Transition>(() =>
  props.reduced ? INSTANT : { ...SPRING },
);

/** 激活分片用行内底色渐变到强调色，其余沿用 --gooey-bar */
const segmentStyle = computed(() => ({
  marginLeft,
  backgroundColor: props.active ? props.activeColor : undefined,
}));

/** 两条向中间收拢的凹曲线，画在分片让出的缝隙里 */
function neckPath(gap: number, span: number): string {
  if (!Number.isFinite(gap) || !Number.isFinite(span) || gap <= 0 || span <= 0) {
    return '';
  }

  const waist = NECK_H * (1 - gap / (span * NECK_BREAK));
  if (waist <= 0) {
    return '';
  }

  const start = span - gap;
  const mid = start + gap / 2;
  return `M${start} 0 Q${mid} ${NECK_H - waist} ${span} 0 L${span} ${NECK_H} Q${mid} ${waist} ${start} ${NECK_H} Z`;
}
</script>

<style lang="scss" scoped>
.gooey-seg {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--gooey-bar, #f4f4f9);
  list-style: none;
}

.gooey-seg--fade-in {
  transition: background-color 400ms;
}

.gooey-seg--fade-out {
  transition: background-color 0s;
}

.gooey-seg__seam {
  position: absolute;
  top: 0;
  right: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  /* 渐变里的 currentColor 取分片底色 */
  color: var(--gooey-bar, #f4f4f9);
}

@media (prefers-reduced-motion: reduce) {
  .gooey-seg,
  .gooey-seg--fade-in {
    transition: none;
  }
}
</style>
