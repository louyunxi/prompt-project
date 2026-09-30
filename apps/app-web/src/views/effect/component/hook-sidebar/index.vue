<!--
  组件名称：HookSidebar（钩形侧栏，悬停 / 选中钩子跟随）

  来源迁移：E:\桌面\rare-ui-main\components\ui\hook-sidebar.tsx
           示例数据参考：E:\桌面\rare-ui-main\app\components\(docs)\hooksidebar\demo.tsx

  依赖插件 / 版本：
    - motion-v ^2.5.1（React 版 motion/react 的 Vue 移植）
    - vue ^3.5.13（catalog 统一版本）
    - sass-embedded（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 .hook-sidebar 上，仅覆盖变量即可换肤）：
    --hook-label       #1f1f1f              顶部标题文案色
    --hook-text        #1f1f1f              选中项文案色
    --hook-text-dim    rgba(31,31,31,.5)    未选中项文案色
    --hook-text-hover  rgba(31,31,31,.8)    未选中项悬停文案色
    --hook-rail-dim    rgba(31,31,31,.3)    悬停轨颜色（active 轨由 color prop 注入）
    --hook-item-size   14px                 条目字号（三档媒体查询覆盖）
    暗色主题（[data-theme='dark']）下上述颜色整体切换，见 <style> 末尾。

  迁移说明：
    1. 去除 react / cn() / Tailwind 工具类依赖：工具类全部改写为组件内 scoped SCSS
       （.hook-sidebar 系列），cn() 的合并逻辑由 Vue :class 语义取代，
       未引入任何组件目录之外的工具函数或样式。
    2. next/link 改为普通 <a>（有 href 时）；next/navigation 的 usePathname 路由选中
       改为组件内 ref（internalValue）表示当前选中项，不再依赖路由匹配。
    3. 内部 Rail 组件拆为同目录 HookRail.vue（仍在本组件目录内，符合自包含要求）。
    4. 动画库由 motion/react 换为 Vue 移植版 motion-v：initial={false} → :initial="false"；
       useReducedMotion() 返回 Ref，取值加 .value。
    5. 侧栏改为在自身根元素内定位（列表容器 position: relative + 轨道绝对定位），
       条目中线用 ResizeObserver 测量，天然相对列表容器，适配画廊卡片尺寸。
    6. 源 demo 的 section 标题作为默认 mock 数据；shell 包装（滚动正文）不迁移。
    7. 无图片物料，无需 assets 目录。
-->
<template>
  <nav data-slot="hook-sidebar" :aria-label="label" class="hook-sidebar">
    <span
      v-if="label"
      data-slot="hook-sidebar-label"
      class="hook-sidebar__label"
    >
      {{ label }}
    </span>

    <div
      ref="listEl"
      class="hook-sidebar__list"
      @mouseleave="pointerInside = false"
    >
      <HookRail
        :from="hoverFrom"
        :y="hoverY"
        :visible="(pointerInside || focusInside) && hoverIndex !== activeIndex"
        :dashed="dashed"
      />
      <HookRail :y="activeY" :visible="activeY !== null" :color="color" :dashed="dashed" />

      <template
        v-for="(item, index) in normalized"
        :key="`${index}-${item.label}`"
      >
        <a
          v-if="item.href"
          :href="item.href"
          data-slot="hook-sidebar-item"
          :data-active="index === activeIndex"
          :aria-current="index === activeIndex ? 'page' : undefined"
          class="hook-sidebar__item"
          @mouseenter="onHover(index)"
          @focus="onFocus(index)"
          @blur="focusInside = false"
          @click="select(index)"
        >
          {{ item.label }}
        </a>
        <button
          v-else
          type="button"
          data-slot="hook-sidebar-item"
          :data-active="index === activeIndex"
          :aria-current="index === activeIndex ? 'true' : undefined"
          class="hook-sidebar__item"
          @mouseenter="onHover(index)"
          @focus="onFocus(index)"
          @blur="focusInside = false"
          @click="select(index)"
        >
          {{ item.label }}
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import HookRail from './HookRail.vue';

/** 圆角拐角的竖直预留高度 */
const CORNER = 6;

/** 侧栏条目：纯文案或带链接文案 */
export type HookSidebarItem = string | { label: string; href?: string };

const props = withDefaults(
  defineProps<{
    items?: HookSidebarItem[];
    label?: string;
    value?: number;
    defaultValue?: number;
    color?: string;
    dashed?: boolean;
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
    label: 'Contents',
    value: undefined,
    defaultValue: 0,
    color: '#FC4C01',
    dashed: true,
  },
);

const emit = defineEmits<{
  (e: 'change', index: number): void;
}>();

const listEl = ref<HTMLElement | null>(null);

/** 各条目中线相对列表容器的 y 坐标 */
const centers = ref<number[]>([]);

const internalValue = ref(props.defaultValue);
const activeIndex = computed(() => props.value ?? internalValue.value);

const hoverIndex = ref<number | null>(null);
const pointerInside = ref(false);
const focusInside = ref(false);

let observer: ResizeObserver | null = null;

/** 条目归一化：模板里无需再判类型 */
const normalized = computed(() =>
  props.items.map((item) =>
    typeof item === 'string'
      ? { label: item, href: undefined as string | undefined }
      : { label: item.label, href: item.href },
  ),
);

/** 列表容器直接子级中的可交互条目（排除两条轨道的 span） */
function rows(): HTMLElement[] {
  const list = listEl.value;
  if (!list) {return [];}
  return Array.from(list.children).filter(
    (el): el is HTMLElement => el.tagName === 'BUTTON' || el.tagName === 'A',
  );
}

function measure() {
  centers.value = rows().map((el) => el.offsetTop + el.offsetHeight / 2);
}

onMounted(() => {
  const list = listEl.value;
  if (!list) {return;}
  observer = new ResizeObserver(measure);
  observer.observe(list);
  nextTick(measure);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});

const activeY = computed(() =>
  activeIndex.value < 0 ? null : (centers.value[activeIndex.value] ?? null),
);

const hoverY = computed(() =>
  hoverIndex.value === null ? null : (centers.value[hoverIndex.value] ?? null),
);

/**
 * 悬停轨的起点：悬停项位于选中项上方时，选中轨已覆盖该区间，
 * 悬停轨只需从圆角处起画。
 */
const hoverFrom = computed(() => {
  const active = activeY.value;
  const hover = hoverY.value;
  if (active !== null && hover !== null && hover <= active) {
    return Math.max(0, hover - CORNER);
  }
  return active ?? 0;
});

function onHover(index: number) {
  hoverIndex.value = index;
  pointerInside.value = true;
}

function onFocus(index: number) {
  hoverIndex.value = index;
  focusInside.value = true;
}

function select(index: number) {
  if (props.value === undefined) {
    internalValue.value = index;
  }
  emit('change', index);
}
</script>

<style lang="scss" scoped>
.hook-sidebar {
  /* 颜色变量：暗色主题在文件末尾整体覆盖 */
  --hook-label: #1f1f1f;
  --hook-text: #1f1f1f;
  --hook-text-dim: rgba(31, 31, 31, 0.5);
  --hook-text-hover: rgba(31, 31, 31, 0.8);
  --hook-rail-dim: rgba(31, 31, 31, 0.3);
  --hook-item-size: 14px;

  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
}

.hook-sidebar__label {
  padding: 0 8px 12px 2px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: var(--hook-label);
}

.hook-sidebar__list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hook-sidebar__item {
  padding: 6px 8px 6px 20px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  font-family: inherit;
  font-size: var(--hook-item-size);
  line-height: 20px;
  color: var(--hook-text-dim);
  cursor: pointer;
  outline: none;
  text-decoration: none;
  transition: color 200ms;
}

.hook-sidebar__item:hover {
  color: var(--hook-text-hover);
}

/* 放在 :hover 之后，保证选中项悬停时仍保持高亮 */
.hook-sidebar__item[data-active='true'] {
  color: var(--hook-text);
}

.hook-sidebar__item:focus-visible {
  outline: 2px solid var(--hook-text);
  outline-offset: 2px;
}

/* 三档响应式：≤1280 / 1281–1919 / ≥1920 观感一致 */
@media (max-width: 1280px) {
  .hook-sidebar {
    --hook-item-size: 14px;
  }
}

@media (min-width: 1281px) and (max-width: 1919px) {
  .hook-sidebar {
    --hook-item-size: 15px;
  }
}

@media (min-width: 1920px) {
  .hook-sidebar {
    --hook-item-size: 16px;
  }
}

/*
 * 暗色主题：整体切换颜色变量。
 * 选择器必须整条写进 :global()——写成 `:global([data-theme='dark']) .hook-sidebar`
 * 时 Vue 的 scoped 编译会丢弃尾部类名，变量落到 <html> 上被组件自身定义覆盖。
 */
:global(html[data-theme='dark'] .hook-sidebar) {
  --hook-label: #f5f5f5;
  --hook-text: #f5f5f5;
  --hook-text-dim: rgba(245, 245, 245, 0.5);
  --hook-text-hover: rgba(245, 245, 245, 0.8);
  --hook-rail-dim: rgba(245, 245, 245, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .hook-sidebar__item {
    transition: none;
  }
}
</style>
