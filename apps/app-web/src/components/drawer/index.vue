<!--
  组件名称：AppDrawer（共享抽屉）

  用途：
    提供一个统一的 a-drawer 二次封装，供侧边栏、设置、生图管理等功能复用。
    采用 v-model:open 受控模式 + 默认插槽，便于业务方注入任意内容。

  依赖：
    - ant-design-vue ^4.2.6（a-drawer，自动按需注册）

  用法：
    <AppDrawer v-model:open="open" title="生图管理" width="640">
      <ImageGenerator />
    </AppDrawer>
-->
<template>
  <a-drawer
    v-model:open="openProxy"
    :title="title"
    :placement="placement"
    :width="width"
    :mask="mask"
    :mask-closable="maskClosable"
    :closable="closable"
    :destroy-on-close="destroyOnClose"
    :force-render="forceRender"
    :size="size"
    :class="['app-drawer', drawerClass]"
  >
    <slot />
    <!-- 可选：底部操作栏（默认 10 个 footer 插槽） -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
/**
 * AppDrawer：统一的 a-drawer 受控封装。
 *
 * Props（除 model 外透传给 a-drawer）：
 *  - open        双向绑定：抽屉开关状态
 *  - title       抽屉标题（默认显示 a-drawer 默认的「这是标题」）
 *  - placement   抽屉方向，默认 'right'
 *  - width       抽屉宽度（placement='right'|'left' 时有效，默认 480）
 *  - size        抽屉预设尺寸 'default' | 'large'，会覆盖 width
 *  - mask        是否显示遮罩，默认 true
 *  - maskClosable 点击遮罩是否关闭，默认 true
 *  - closable    是否显示关闭按钮，默认 true
 *  - destroyOnClose 关闭时是否销毁子内容（适合表单/重置状态），默认 false
 *  - forceRender 首次打开前是否预渲染内容（内容需页面加载即挂监听时用），默认 false
 *  - drawerClass 透传给 a-drawer 的额外 class
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    placement?: 'left' | 'right' | 'top' | 'bottom';
    width?: number | string;
    size?: 'default' | 'large';
    mask?: boolean;
    maskClosable?: boolean;
    closable?: boolean;
    destroyOnClose?: boolean;
    /**
     * 是否在抽屉首次打开前就预渲染内容（默认 false）。
     * 内容组件需要在页面加载即挂载全局事件监听（如生图恢复轮询后的
     * 自动保存）时设为 true。
     */
    forceRender?: boolean;
    drawerClass?: string;
  }>(),
  {
    title: '',
    placement: 'right',
    width: 480,
    size: 'default',
    mask: true,
    maskClosable: true,
    closable: true,
    destroyOnClose: false,
    forceRender: false,
    drawerClass: '',
  },
);

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'close'): void;
}>();

/** v-model:open 双向绑定代理 */
const openProxy = computed<boolean>({
  get: () => props.open,
  set: (val) => {
    emit('update:open', val);
    if (!val) emit('close');
  },
});
</script>

<style lang="scss" scoped>
/**
 * 抽屉尺寸档位（与 antd 原生 size='large' 对齐 ~736px）。
 * 这里额外给到一组可控的 class，方便业务方覆盖默认 padding。
 */
.app-drawer :deep(.ant-drawer-body) {
  padding: 16px 20px;
}
</style>