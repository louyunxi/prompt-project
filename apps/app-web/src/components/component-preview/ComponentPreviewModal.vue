<!--
  组件名称：ComponentPreviewModal（组件预览弹框）

  用途：
    公共弹框组件。把侧边栏「组件预览」页中的多容器预览区（PreviewStage）搬进弹框，
    供各分类页（chart / widget / effect / background / loading / typography）的组件卡片复用：
    卡片上点「预览」即在当前页放大查看该组件在 8 种常见容器尺寸下的渲染效果，无需跳转。

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（a-modal，自动按需注册）
    - ./PreviewStage.vue（多容器预览区，依赖其 category / componentName 契约）

  尺寸：
    宽 80vw（a-modal 的 width），内容区高 80vh（见样式内 .component-preview-modal 覆盖）；
    预览区超高时在弹框内部滚动，不撑破宿主页面。

  颜色变量：无（仅复用全局主题变量，弹框配色交给 antd 与主题 CSS 变量）

  用法：
    <ComponentPreviewModal
      v-model:open="previewOpen"
      category="chart"
      :component-name="previewName"
      :title="previewTitle"
    />
-->
<template>
  <a-modal
    v-model:open="openProxy"
    :title="modalTitle"
    width="80vw"
    :footer="null"
    :destroy-on-close="destroyOnClose"
    centered
    wrap-class-name="component-preview-modal"
  >
    <PreviewStage :category="category" :component-name="componentName" />
  </a-modal>
</template>

<script setup lang="ts">
/**
 * ComponentPreviewModal：组件预览弹框（多容器）。
 *
 * Props：
 *  - open          双向绑定（v-model:open）：弹框开关
 *  - category      views 下的一级分类目录名，如 'chart'
 *  - componentName component 下的组件目录名，如 'gradient-bar'
 *  - title         弹框标题，缺省回退为 componentName
 *  - destroyOnClose 关闭时销毁预览内容，默认 true
 *
 * 默认 destroyOnClose 为 true：预览区会同时挂载 8 份组件实例（echarts 等有重量级
 * 副作用），每次打开都重新挂载可保证实例在正确的容器尺寸下初始化、关闭即释放。
 */
import { computed } from 'vue';
import PreviewStage from './PreviewStage.vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    /** 一级文件夹名（views 下分类目录） */
    category: string;
    /** 二级文件夹名（component 下的组件目录） */
    componentName?: string;
    /** 弹框标题，缺省回退为 componentName */
    title?: string;
    /** 关闭时销毁预览内容（默认 true，保证每次打开都按当前尺寸重新初始化） */
    destroyOnClose?: boolean;
  }>(),
  {
    componentName: '',
    title: '',
    destroyOnClose: true,
  },
);

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
}>();

/** v-model:open 双向绑定代理 */
const openProxy = computed<boolean>({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const modalTitle = computed(
  () => props.title || props.componentName || '组件预览',
);
</script>

<style lang="scss" scoped>
/**
 * a-modal 通过 teleport 挂到 body 下、不在本组件子树内，scoped 样式够不到，
 * 因此尺寸覆盖统一走 :global（选择器带 wrapClassName 前缀，避免影响其它弹框）。
 */
:global(.component-preview-modal .ant-modal-content) {
  height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
}

:global(.component-preview-modal .ant-modal-header) {
  flex: none;
}

:global(.component-preview-modal .ant-modal-body) {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

/**
 * PreviewStage 自身为整页预览留了 520px 最小高度，这里抹平；
 * 撑满弹框内容区由它自己的 flex: 1 + 内容区 flex 布局完成，超出部分内部滚动。
 * 选择器写到三层类名，确保压过 PreviewStage 内的 scoped 规则。
 */
:global(.component-preview-modal .ant-modal-body .preview-stage) {
  min-height: 0;
}
</style>
