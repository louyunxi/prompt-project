<!--
  组件名称：GooeyNav（黏性形变导航）

  来源迁移：E:\桌面\rare-ui-main\components\ui\gooey-nav.tsx
           示例数据参考：E:\桌面\rare-ui-main\app\components\(docs)\gooeynav\demo.tsx
                        + 同目录 icons.tsx（图标已内联，未新增图标库依赖）

  依赖插件 / 版本：
    - motion-v ^2.5.1（React 版 motion/react 的 Vue 移植，负责弹簧与 SVG 形变）
    - vue ^3.5.13（catalog 统一版本）
    - sass-embedded（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 .gooey-nav 上，仅覆盖变量即可换肤）：
    --gooey-bar           #f4f4f9  分片底色（也是脖子渐变 currentColor 的基准）
    --gooey-muted         #868593  未激活标签文字色
    --gooey-active        #FC4C01  激活分片底色，由 activeColor prop 注入
    --gooey-active-label  #ffffff  激活标签文字色，由 activeLabelColor prop 注入
    暗色主题（[data-theme='dark']）下 --gooey-bar / --gooey-muted 切换，见 <style> 末尾。

  迁移说明：
    1. 去除 react / next/link / usePathname / cn() / Tailwind 工具类依赖：
       - 路由联动（usePathname 选中当前项）改为组件内 ref 维护当前下标；
       - 标签改为普通 <a>（有 href 时）或 <button>，选中状态用 aria-current 表达；
       - 工具类全部改写为组件内 scoped SCSS（.gooey-nav / .gooey-seg 系列）。
    2. icons.tsx 的 4 个图标内联为模板内 SVG，无新增图标库依赖。
    3. 动画迁移：分片用 useSpring 驱动 marginLeft，useTransform 把 marginLeft 映射为脖子
       路径 d（见同目录 GooeySegment.vue）；useReducedMotion 为真时 jump() 跳变、过渡归零。
    4. 容器适配：组件渲染在画廊卡片中，用 ResizeObserver 量取自身宽度，窄于 260px 时
       降级到 xs、窄于 380px 时降级到 sm（对应 demo 移动端 items/size 的降级分支），
       保证一行不塌陷；卡片宽度足够时使用 size prop 指定的档位。
    5. mock 数据：默认 items 取自 demo 的四个导航项与图标，文案通用化（无业务名 / 品牌名）。
    6. 无图片物料，无需 assets 目录。
-->
<template>
  <nav
    ref="hostRef"
    data-slot="gooey-nav"
    class="gooey-nav"
    aria-label="Main navigation"
  >
    <ul class="gooey-nav__list">
      <GooeySegment
        v-for="(item, i) in navItems"
        :key="`${i}-${item.label}`"
        :gap="gapOf(i)"
        :span="span"
        :has-seam="i > 0"
        :left-fill="fillOf(i - 1)"
        :right-fill="fillOf(i)"
        :reduced="reduced"
        :radii="radiiOf(i)"
        :active="i === active"
        :active-color="activeColor"
      >
        <component
          :is="item.href ? 'a' : 'button'"
          data-slot="gooey-nav-item"
          class="gooey-nav__label"
          :class="[
            `gooey-nav__label--${activeSize}`,
            i === active
              ? 'gooey-nav__label--fade-in'
              : 'gooey-nav__label--fade-out',
          ]"
          :href="item.href"
          :type="item.href ? undefined : 'button'"
          :data-active="i === active"
          :aria-current="
            i === active ? (item.href ? 'page' : 'true') : undefined
          "
          :style="i === active ? { color: activeLabelColor } : undefined"
          @click="select(i)"
        >
          <svg
            v-if="item.icon === 'home'"
            viewBox="0 0 32 32"
            stroke-width="2.67"
            fill="none"
            stroke="currentColor"
            stroke-miterlimit="10"
          >
            <polyline points="2 13 16 2 30 13" stroke-linecap="square" />
            <polyline points="13 29 13 20 19 20 19 29" />
            <path
              d="m5,16v10c0,1.657,1.343,3,3,3h16c1.657,0,3-1.343,3-3v-10"
              stroke-linecap="square"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'book'"
            viewBox="0 0 24 24"
            stroke-width="2"
            fill="none"
            stroke="currentColor"
            stroke-miterlimit="10"
          >
            <line x1="12" y1="6" x2="12" y2="21" />
            <path
              d="m17.5,3c-3,0-5.5,1.3-5.5,3,0-1.7-2.5-3-5.5-3S1,4.3,1,6v15c0-1.7,2.5-3,5.5-3s5.5,1.3,5.5,3c0-1.7,2.5-3,5.5-3s5.5,1.3,5.5,3V6c0-1.7-2.5-3-5.5-3Z"
              stroke-linecap="square"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'briefcase'"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke-linecap="square"
            fill="none"
            stroke="currentColor"
            stroke-miterlimit="10"
          >
            <path d="M8 6V2H16V6" />
            <path
              d="M10 13H4C2.89543 13 2 12.1046 2 11V6H22V11C22 12.1046 21.1046 13 20 13H14"
            />
            <path d="M2 17V21H22V17" />
            <path
              d="M14 12H10V15C10 16.1046 10.8954 17 12 17C13.1046 17 14 16.1046 14 15V12Z"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'info'"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke-linecap="square"
            fill="none"
            stroke="currentColor"
            stroke-miterlimit="10"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m12,17v-5.5c0-.276-.224-.5-.5-.5h-1.5" />
            <circle cx="12" cy="7.25" r="1.25" fill="currentColor" stroke-width="0" />
          </svg>

          {{ item.label }}
        </component>
      </GooeySegment>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useReducedMotion } from 'motion-v';
import GooeySegment from './GooeySegment.vue';
import type { Radii } from './GooeySegment.vue';

/** 尺寸档位 */
export type GooeyNavSize = 'xs' | 'sm' | 'md' | 'lg';
/** 内置图标名（图标 SVG 内联在本组件模板中） */
export type GooeyIconName = 'home' | 'book' | 'briefcase' | 'info';

export type GooeyNavItem =
  | string
  | { label: string; href?: string; icon?: GooeyIconName };

type NavItem = { label: string; href?: string; icon?: GooeyIconName };

/** 各档位的圆角半径与分片间距（与 SCSS 中的标签内边距矩阵配套） */
const SIZES: Record<GooeyNavSize, { radius: number; separation: number }> = {
  xs: { radius: 8, separation: 14 },
  sm: { radius: 10, separation: 16 },
  md: { radius: 12, separation: 20 },
  lg: { radius: 14, separation: 24 },
};

/** 容器查询阈值：卡片窄于此宽度时降档，避免一行放不下 */
const NARROW_WIDTH = 260;
const COMPACT_WIDTH = 380;

const props = withDefaults(
  defineProps<{
    items?: GooeyNavItem[];
    value?: number;
    defaultValue?: number;
    size?: GooeyNavSize;
    activeColor?: string;
    activeLabelColor?: string;
    separation?: number;
    radius?: number;
  }>(),
  {
    items: () => [
      { label: 'Home', icon: 'home' },
      { label: 'Changelog', icon: 'book' },
      { label: 'Career', icon: 'briefcase' },
      { label: 'About', icon: 'info' },
    ],
    value: undefined,
    defaultValue: 0,
    size: 'md',
    activeColor: '#FC4C01',
    activeLabelColor: '#ffffff',
    separation: undefined,
    radius: undefined,
  },
);

const emit = defineEmits<{ (e: 'change', index: number): void }>();

const hostRef = ref<HTMLElement | null>(null);
const hostWidth = ref(0);
const reduced = useReducedMotion();

const uncontrolled = ref(props.defaultValue);
const active = computed(() => props.value ?? uncontrolled.value);

const navItems = computed<NavItem[]>(() =>
  props.items.map((item) => (typeof item === 'string' ? { label: item } : item)),
);

/** 组件自身宽度决定实际档位；未测量到宽度（如 SSR / 首帧）时用 size prop */
const activeSize = computed<GooeyNavSize>(() => {
  const width = hostWidth.value;
  if (width > 0 && width < NARROW_WIDTH) {
    return 'xs';
  }
  if (width > 0 && width < COMPACT_WIDTH) {
    return 'sm';
  }
  return props.size;
});

const span = computed(
  () => props.separation ?? SIZES[activeSize.value].separation,
);
const corner = computed(() => props.radius ?? SIZES[activeSize.value].radius);

/** 该缝隙两侧圆角是否张开（首尾两端始终张开） */
function isOpen(seam: number): boolean {
  return (
    seam === 0 ||
    seam === navItems.value.length ||
    seam - 1 === active.value ||
    seam === active.value
  );
}

/** 相邻分片都非激活时重叠 1px，避免露出发丝缝 */
function gapOf(index: number): number {
  if (index === 0) {
    return 0;
  }
  return isOpen(index) ? span.value : -1;
}

function fillOf(index: number): string {
  return index === active.value ? props.activeColor : 'currentColor';
}

function radiiOf(index: number): Radii {
  return {
    borderTopLeftRadius: isOpen(index) ? corner.value : 0,
    borderBottomLeftRadius: isOpen(index) ? corner.value : 0,
    borderTopRightRadius: isOpen(index + 1) ? corner.value : 0,
    borderBottomRightRadius: isOpen(index + 1) ? corner.value : 0,
  };
}

function select(index: number) {
  if (props.value === undefined) {
    uncontrolled.value = index;
  }
  emit('change', index);
}

let observer: ResizeObserver | null = null;

function measure() {
  hostWidth.value = hostRef.value?.clientWidth ?? 0;
}

onMounted(() => {
  measure();
  if (typeof ResizeObserver === 'undefined' || !hostRef.value) {
    return;
  }
  observer = new ResizeObserver(measure);
  observer.observe(hostRef.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<style lang="scss" scoped>
.gooey-nav {
  /* 颜色变量：暗色主题在文件末尾整体覆盖 */
  --gooey-bar: #f4f4f9;
  --gooey-muted: #868593;
  --gooey-active: #fc4c01;
  --gooey-active-label: #ffffff;
  /* 响应式缩放系数：由媒体查询覆盖 */
  --gooey-scale: 1;

  display: inline-block;
  max-width: 100%;
  transform: scale(var(--gooey-scale));
  transform-origin: center;
}

.gooey-nav__list {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.gooey-nav__label {
  display: flex;
  align-items: center;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-weight: 500;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  color: var(--gooey-muted);
  outline: none;

  svg {
    flex-shrink: 0;
  }

  &:focus-visible {
    outline: 2px solid var(--gooey-active);
    outline-offset: 2px;
  }
}

.gooey-nav__label--fade-in {
  transition: color 400ms;
}

.gooey-nav__label--fade-out {
  transition: color 0s;
}

/* 档位 → 标签内边距 / 字号 / 图标尺寸矩阵 */
.gooey-nav__label--xs {
  gap: 4px;
  padding: 6px 8px;
  font-size: 11px;
  line-height: 16px;

  svg {
    width: 11px;
    height: 11px;
  }
}

.gooey-nav__label--sm {
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  line-height: 16px;

  svg {
    width: 12px;
    height: 12px;
  }
}

.gooey-nav__label--md {
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  line-height: 20px;

  svg {
    width: 14px;
    height: 14px;
  }
}

.gooey-nav__label--lg {
  gap: 10px;
  padding: 12px 24px;
  font-size: 16px;
  line-height: 24px;

  svg {
    width: 16px;
    height: 16px;
  }
}

/*
 * 暗色主题：整体切换颜色变量。
 * 选择器必须整条写进 :global()，否则 scoped 编译会丢弃尾部的 .gooey-nav。
 */
:global(html[data-theme='dark'] .gooey-nav) {
  --gooey-bar: #262626;
  --gooey-muted: #a1a1aa;
}

/* 响应式三档：窄屏略收、超宽略放，观感保持一致 */
@media (max-width: 1280px) {
  .gooey-nav {
    --gooey-scale: 0.96;
  }
}

@media (min-width: 1920px) {
  .gooey-nav {
    --gooey-scale: 1.06;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gooey-nav__label,
  .gooey-nav__label--fade-in {
    transition: none;
  }
}
</style>
