<!--
  组件名称：HookRail（钩形侧栏轨道，竖线 + 圆角拐角）

  来源迁移：E:\桌面\rare-ui-main\components\ui\hook-sidebar.tsx（Rail 部分）

  依赖插件 / 版本：
    - motion-v ^2.5.1（React 版 motion/react 的 Vue 移植，负责轨道位移动画）
    - vue ^3.5.13（catalog 统一版本）
    - sass-embedded（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量：轨道颜色由 color prop 注入（active 轨）或回退到
    继承自父级 .hook-sidebar 的 --hook-rail-dim（hover 轨），本文件不单独定义颜色。

  迁移说明：
    1. 去除 react / cn() / Tailwind 工具类依赖：改用组件内 scoped SCSS。
    2. 动画库替换为 motion-v：motion.span / motion.svg 同名保留，
       initial={false} 改为 :initial="false"；useReducedMotion() 返回 Ref，取值加 .value。
    3. dashed 虚线用内联 repeating-linear-gradient（与源码同一常量）。
    4. 本组件仅在本目录内被 HookSidebar 引用，符合自包含要求。
-->
<template>
  <motion.span
    aria-hidden="true"
    :initial="false"
    class="hook-rail"
    :style="{ color: color ?? 'var(--hook-rail-dim)' }"
    :animate="{ opacity: railOpacity }"
    :transition="fade"
  >
    <motion.span
      :initial="false"
      class="hook-rail__line"
      :style="lineStyle"
      :animate="{ top: from, height: lineHeight }"
      :transition="travel"
    />

    <motion.svg
      :initial="false"
      class="hook-rail__corner"
      width="12"
      height="7"
      viewBox="0 0 12 7"
      fill="none"
      :animate="{ top: cornerTop }"
      :transition="travel"
    >
      <path
        d="M0.5 0a6 6 0 0 0 6 6H12"
        stroke="currentColor"
        :stroke-dasharray="dashed ? '2 2' : undefined"
      />
    </motion.svg>
  </motion.span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { motion, useReducedMotion } from 'motion-v';

/** 动画过渡配置（结构同 motion 的 Transition） */
type Transition = Record<string, unknown>;

const CORNER = 6;
const DASH =
  'repeating-linear-gradient(to top, transparent 0 2px, currentColor 2px 4px)';

const props = withDefaults(
  defineProps<{
    from?: number;
    y: number | null;
    visible: boolean;
    color?: string;
    dashed?: boolean;
  }>(),
  {
    from: 0,
    color: undefined,
    dashed: true,
  },
);

const reduced = useReducedMotion();

/** 位移过渡：开启「减少动态效果」时瞬时切换 */
const travel = computed<Transition>(() =>
  reduced.value
    ? { duration: 0 }
    : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 },
);

/** 显隐过渡 */
const fade = computed<Transition>(() =>
  reduced.value ? { duration: 0 } : { duration: 0.2 },
);

const railOpacity = computed(() =>
  props.visible && props.y !== null ? 1 : 0,
);

const lineStyle = computed(() =>
  props.dashed
    ? { backgroundImage: DASH }
    : { backgroundColor: 'currentColor' },
);

/** 竖线从 from 延伸至钩子的圆角起点 */
const lineHeight = computed(() =>
  Math.max(0, (props.y ?? 0) - CORNER - props.from),
);

const cornerTop = computed(() => (props.y ?? 0) - CORNER);
</script>

<style lang="scss" scoped>
.hook-rail {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hook-rail__line {
  position: absolute;
  left: 2px;
  width: 1px;
}

.hook-rail__corner {
  position: absolute;
  left: 2px;
}
</style>
