<!--
  组件名称：CompCard（组件画廊卡片容器）

  职责：分类页（chart / map / effect / widget / background / loading / typography）
  卡片的公共外壳，统一「舞台 + 底部信息行（chip / 名称 / 预览 / 复制路径）」结构。
  **尺寸与底色由各页面自己决定**：页面在自己的 `<style scoped>` 里给卡片类名
  （通过 class 透传到根元素），并按需覆盖下面的 CSS 变量。

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（a-button 自动按需注册）
    - @ant-design/icons-vue ^7（CaretRightOutlined，图标需显式 import）

  用法：
    <CompCard
      class="chart-page__card"
      :label="item.meta?.label || item.name"
      :tag="item.meta?.tag"
      :tag-color="TAG_COLORS[item.meta?.tag ?? '']"
      :src-path="item.srcPath"
      @preview="openPreview(item.name)"
      @copy="copyPath(item.srcPath)"
    >
      <component :is="item.component" />
    </CompCard>

  CSS 变量（页面在自己的卡片类名里设置）：
    --comp-card-bg                卡片底色，默认 var(--card-bg)
    --comp-card-padding           卡片内边距，默认 0
    --comp-card-radius            圆角，默认 8px
    --comp-card-shadow            投影，默认 0 2px 8px -2px rgba(120, 120, 120, 0.25)
    --comp-card-stage-bg          舞台底色，默认 transparent
    --comp-card-stage-min-height  舞台最小高度，默认 0
    --comp-card-meta-gap          信息行与舞台的间距，默认 8px
    --comp-card-meta-padding      信息行内边距，默认 0 12px 10px
    --comp-card-name-color        名称文字色，默认 var(--ink-color-3)
    --comp-card-chip-bg           chip 底色，默认 var(--primary-color)；传 tagColor 时以 tagColor 优先
-->
<template>
  <div class="comp-card">
    <div class="comp-card__stage" :class="`comp-card__stage--${stageLayout}`">
      <slot></slot>
    </div>

    <div class="comp-card__meta">
      <span v-if="tag" class="comp-card__chip" :style="chipStyle">
        {{ tag }}
      </span>
      <span class="comp-card__name" :title="nameTitle || label">
        {{ label }}
      </span>
      <a-button
        class="comp-card__preview"
        size="small"
        type="link"
        title="在弹框中预览该组件"
        @click="emit('preview')"
      >
        <template #icon><CaretRightOutlined /></template>
        预览
      </a-button>
      <a-button
        class="comp-card__copy"
        size="small"
        type="link"
        :title="srcPath"
        @click="emit('copy')"
      >
        复制路径
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CaretRightOutlined } from '@ant-design/icons-vue';

const props = withDefaults(
  defineProps<{
    /** 卡片名称（信息行中部），通常是组件中文标题 */
    label: string;
    /** 名称的 tooltip 文案；缺省用 label */
    nameTitle?: string;
    /** 左侧 chip 文案（组件标签 / 分类名）；不传则不渲染 chip */
    tag?: string;
    /** chip 底色；缺省用 CSS 变量 --comp-card-chip-bg（默认主色） */
    tagColor?: string;
    /** 组件源码路径，作为「复制路径」按钮的 tooltip */
    srcPath?: string;
    /** 舞台内子项布局：center 居中留白（默认）；stretch 铺满整块舞台（如地图） */
    stageLayout?: 'center' | 'stretch';
  }>(),
  {
    nameTitle: '',
    tag: '',
    tagColor: '',
    srcPath: '',
    stageLayout: 'center',
  },
);

const emit = defineEmits<{
  /** 点击「预览」 */
  preview: [];
  /** 点击「复制路径」 */
  copy: [];
}>();

const chipStyle = computed(() =>
  props.tagColor ? { background: props.tagColor } : undefined,
);
</script>

<style lang="scss" scoped>
.comp-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: var(--comp-card-bg, var(--card-bg));
  border-radius: var(--comp-card-radius, 8px);
  padding: var(--comp-card-padding, 0);
  box-shadow: var(--comp-card-shadow, 0 2px 8px -2px rgba(120, 120, 120, 0.25));
  box-sizing: border-box;

  /**
   * 舞台吃掉卡片剩余高度，组件随之自适应；圆角由卡片 overflow 裁切。
   * :deep 抹平组件自身的 min-height / 固定 height —— 视口变矮时舞台跟着缩短，
   * 组件等比渲染而不是溢出被裁切，卡片才能始终填满一屏。
   */
  &__stage {
    flex: 1;
    min-height: var(--comp-card-stage-min-height, 0);
    display: flex;
    overflow: hidden;
    background: var(--comp-card-stage-bg, transparent);

    &--center {
      align-items: center;
      justify-content: center;

      :deep(> *) {
        min-height: 0;
        max-height: 100%;
      }
    }

    /** 铺满模式：子项撑满整块舞台（不留空隙、不出滚动条） */
    &--stretch {
      min-width: 0;

      :deep(> *) {
        flex: 1;
        min-height: 0;
        min-width: 0;
      }
    }
  }

  &__meta {
    flex: none;
    margin-top: var(--comp-card-meta-gap, 8px);
    padding: var(--comp-card-meta-padding, 0 12px 10px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 24px;
  }

  &__chip {
    flex-shrink: 0;
    font-size: 11px;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 4px;
    color: #fff;
    background: var(--comp-card-chip-bg, var(--primary-color));
    white-space: nowrap;
  }

  &__name {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: var(--comp-card-name-color, var(--ink-color-3));
    text-align: left;
    word-break: break-all;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__preview,
  &__copy {
    flex-shrink: 0;
    padding: 0 4px;
    font-size: 12px;
  }
}
</style>
