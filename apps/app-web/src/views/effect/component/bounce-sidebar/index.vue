<!--
  组件名称：BounceSidebar（弹跳侧栏，圆点沿弧线弹跳）

  来源迁移：E:\桌面\rare-ui-main\components\ui\bounce-sidebar.tsx
           示例数据参考：E:\桌面\rare-ui-main\app\components\(docs)\bouncesidebar\demo.tsx

  依赖插件 / 版本：
    - motion-v ^2.5.1（React 版 motion/react 的 Vue 移植，负责圆点定位动画）
    - vue ^3.5.13（catalog 统一版本）
    - sass-embedded（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 .bounce-sidebar 上，仅覆盖变量即可换肤）：
    --bounce-text       #1f1f1f              选中项文案色
    --bounce-text-dim   rgba(31,31,31,.5)    未选中项文案色
    --bounce-item-size  14px                 条目字号（三档媒体查询覆盖）
    --bounce-dot-color  #FC4C01              圆点颜色（由 dotColor prop 注入，非变量）
    --bounce-heading    由 dotColor prop 注入  分组标题色
    暗色主题（[data-theme='dark']）下上述颜色整体切换，见 <style> 末尾。

  迁移说明：
    1. 去除 react / cn() / Tailwind 工具类依赖：工具类全部改写为组件内 scoped SCSS
       （.bounce-sidebar 系列），cn() 的合并逻辑由 Vue :class 语义取代，
       未引入任何组件目录之外的工具函数或样式。
    2. next/link 及其 motion.create(Link) 包装改为普通 <a>（有 href 时）或
       <button>（无 href 时），保持无障碍属性。
    3. 动画库由 motion/react 换为 Vue 移植版 motion-v：useAnimate 用法一一对应；
       弧线弹跳按 motion arc() 的同一套二次贝塞尔控制点公式内联实现（见 travel()），
       沿弧线采样为 x / y 关键帧交给 animate 播放。
    4. 侧边栏改为在自身根元素内定位（根 position: relative + 圆点绝对定位），
       不再依赖整屏布局，可在画廊卡片里正常显示；圆点 y 取自 <li> 的 offsetTop，
       天然是相对根元素的偏移。
    5. 源 demo 的 section 标题作为默认 mock 数据；shell 包装（滚动正文）不迁移。
    6. 无图片物料，无需 assets 目录。
-->
<template>
  <ul ref="rootEl" data-slot="bounce-sidebar" class="bounce-sidebar">
    <span
      ref="dotEl"
      aria-hidden="true"
      data-slot="bounce-sidebar-dot"
      class="bounce-sidebar__dot"
      :style="dotStyle"
    ></span>

    <template
      v-for="(item, index) in normalized"
      :key="`${index}-${item.label}`"
    >
      <li
        v-if="item.heading"
        role="presentation"
        data-slot="bounce-sidebar-heading"
        class="bounce-sidebar__heading"
        :style="{ color: dotColor }"
      >
        {{ item.label }}
      </li>

      <li v-else>
        <a
          v-if="item.href"
          :href="item.href"
          data-slot="bounce-sidebar-item"
          :data-active="index === activeIndex"
          class="bounce-sidebar__item"
          @click="select(index)"
        >
          {{ item.label }}
        </a>
        <button
          v-else
          type="button"
          data-slot="bounce-sidebar-item"
          :data-active="index === activeIndex"
          class="bounce-sidebar__item"
          @click="select(index)"
        >
          {{ item.label }}
        </button>
      </li>
    </template>
  </ul>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAnimate, useReducedMotion } from 'motion-v';

/** 侧栏条目：纯文案、带链接文案、分组标题三种形态 */
export type BounceSidebarItem =
  | string
  | { label: string; href?: string }
  | { label: string; heading: true };

const props = withDefaults(
  defineProps<{
    items?: BounceSidebarItem[];
    value?: number;
    defaultValue?: number;
    dotColor?: string;
  }>(),
  {
    /** 示例数据（通用文案，不含业务名称） */
    items: () => [
      'Introduction',
      'History',
      'Overview',
      'Architecture',
      'References',
    ],
    value: undefined,
    defaultValue: 0,
    dotColor: '#FC4C01',
  },
);

const emit = defineEmits<{
  (e: 'change', index: number): void;
}>();

const [, animate] = useAnimate();
const reduced = useReducedMotion();

const rootEl = ref<HTMLElement | null>(null);
const dotEl = ref<HTMLSpanElement | null>(null);

const internalValue = ref(props.defaultValue);
const activeIndex = computed(() => props.value ?? internalValue.value);

const dotSize = ref(6);
const ready = ref(false);
const prevY = ref<number | null>(null);

/** 条目归一化：模板里无需再判类型 */
const normalized = computed(() =>
  props.items.map((item) => {
    if (typeof item === 'string') {
      return { label: item, href: undefined as string | undefined, heading: false };
    }
    if ('heading' in item) {
      return { label: item.label, href: undefined as string | undefined, heading: true };
    }
    return { label: item.label, href: item.href, heading: false };
  }),
);

const dotStyle = computed(() => ({
  width: `${dotSize.value}px`,
  height: `${dotSize.value}px`,
  backgroundColor: props.dotColor,
  opacity: ready.value ? 1 : 0,
}));

/** 根元素直接子级中的 <li>（圆点 <span> 除外），顺序即索引 */
function rows(): HTMLLIElement[] {
  const root = rootEl.value;
  if (!root) {return [];}
  return Array.from(root.querySelectorAll<HTMLLIElement>(':scope > li'));
}

/** 圆点落到某条目中线时需要的 translateY（按 dpr 取整避免半像素模糊） */
function targetY(el: HTMLLIElement, size: number): number {
  const dpr = window.devicePixelRatio || 1;
  return (
    Math.round((el.offsetTop + el.offsetHeight / 2 - size / 2) * dpr) / dpr
  );
}

/** 首次落位：等字体就绪后再校准一次，避免行高变化导致偏移 */
function snap() {
  const el = rows()[activeIndex.value];
  const dot = dotEl.value;
  if (!el || !dot) {return;}
  const dpr = window.devicePixelRatio || 1;
  const size = Math.round(6 * dpr) / dpr;
  dotSize.value = size;
  const toY = targetY(el, size);
  animate(dot, { x: 0, y: toY }, { duration: 0 });
  prevY.value = toY;
  ready.value = true;
}

onMounted(() => {
  snap();
  requestAnimationFrame(snap);
  document.fonts?.ready.then(snap);
});

/**
 * 沿弧线弹跳：控制点公式与 motion arc() 一致 —— 竖直位移时控制点水平偏移
 * -strength * distance，沿弧线按 easeOut 采样为 x / y 关键帧。
 */
function travel(
  dot: HTMLSpanElement,
  fromY: number,
  toY: number,
  delta: number,
) {
  if (reduced.value) {
    animate(dot, { x: 0, y: toY }, { duration: 0 });
    return;
  }

  const distance = Math.abs(delta);
  const strength = Math.min(0.8, 14 / distance);
  const controlX = -strength * distance;
  const controlY = fromY + (toY - fromY) * 0.5;

  const steps = 16;
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const p = easeOut(i / steps);
    const inv = 1 - p;
    xs.push(2 * inv * p * controlX);
    ys.push(inv * inv * fromY + 2 * inv * p * controlY + p * p * toY);
  }

  animate(dot, { x: xs, y: ys }, { duration: 0.25, ease: 'linear' });
}

// 选中项变化时让圆点弹过去；首次落位交给 snap()
watch(activeIndex, (next) => {
  const el = rows()[next];
  const dot = dotEl.value;
  if (!el || !dot) {return;}

  const toY = targetY(el, dotSize.value);
  if (prevY.value === null) {
    animate(dot, { x: 0, y: toY }, { duration: 0 });
    prevY.value = toY;
    return;
  }

  const fromY = prevY.value;
  const delta = toY - fromY;
  prevY.value = toY;
  if (delta === 0) {return;}

  travel(dot, fromY, toY, delta);
});

function select(index: number) {
  if (props.value === undefined) {
    internalValue.value = index;
  }
  emit('change', index);
}
</script>

<style lang="scss" scoped>
.bounce-sidebar {
  /* 颜色变量：暗色主题在文件末尾整体覆盖 */
  --bounce-text: #1f1f1f;
  --bounce-text-dim: rgba(31, 31, 31, 0.5);
  --bounce-item-size: 14px;

  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 4px 0 4px 24px;
  list-style: none;
}

.bounce-sidebar__dot {
  position: absolute;
  top: 0;
  left: 8px;
  border-radius: 9999px;
  pointer-events: none;
  transition: opacity 150ms;
}

.bounce-sidebar__heading {
  padding: 28px 4px 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.bounce-sidebar__heading:first-child {
  padding-top: 0;
}

.bounce-sidebar__item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  font-family: inherit;
  font-size: var(--bounce-item-size);
  line-height: 20px;
  color: var(--bounce-text-dim);
  cursor: pointer;
  outline: none;
  text-decoration: none;
  transition: color 200ms;
}

.bounce-sidebar__item[data-active='true'] {
  color: var(--bounce-text);
}

.bounce-sidebar__item:focus-visible {
  outline: 2px solid var(--bounce-text);
  outline-offset: 2px;
}

/* 三档响应式：≤1280 / 1281–1919 / ≥1920 观感一致 */
@media (max-width: 1280px) {
  .bounce-sidebar {
    --bounce-item-size: 14px;
  }
}

@media (min-width: 1281px) and (max-width: 1919px) {
  .bounce-sidebar {
    --bounce-item-size: 15px;
  }
}

@media (min-width: 1920px) {
  .bounce-sidebar {
    --bounce-item-size: 16px;
  }
}

/*
 * 暗色主题：整体切换颜色变量。
 * 选择器必须整条写进 :global()——写成 `:global([data-theme='dark']) .bounce-sidebar`
 * 时 Vue 的 scoped 编译会丢弃尾部类名，变量落到 <html> 上被组件自身定义覆盖。
 */
:global(html[data-theme='dark'] .bounce-sidebar) {
  --bounce-text: #f5f5f5;
  --bounce-text-dim: rgba(245, 245, 245, 0.5);
}

@media (prefers-reduced-motion: reduce) {
  .bounce-sidebar__dot {
    transition: none;
  }
}
</style>
