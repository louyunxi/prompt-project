<!--
  组件名称：LocalPathGuardModal（生图前强制选择本地保存路径）

  行为：
    用户点击「生图」且 store.isLocalSaveReady === false 时弹出。
    提示用户必须先设置本地保存路径，并提供：
      - 「我知道了」：关弹窗 + 触发 confirm 事件（由父组件打开文件夹选择器）
      - 「取消」：关弹窗，本次生图请求被丢弃
-->
<template>
  <a-modal
    v-model:open="openRef"
    title="需要先设置本地保存路径"
    :ok-text="'我知道了'"
    cancel-text="取消"
    :mask-closable="false"
    :keyboard="false"
    width="420px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-alert
      type="warning"
      show-icon
      message="为防止生成图丢失，生图前必须先设置本地保存路径"
      style="margin-bottom: 12px"
    />
    <p class="local-path-guard__desc">
      点击「我知道了」后将弹出系统文件夹选择器，选择一个本地文件夹作为
      生图结果的自动保存位置。路径会持久化保存，文件夹句柄在浏览器刷新后
      需要重新选择一次（浏览器安全限制）。
    </p>
    <p
      v-if="!supported"
      class="local-path-guard__desc local-path-guard__desc--warn"
    >
      当前浏览器不支持系统文件夹选择（需要 Chrome / Edge / Safari
      15.4+），请升级浏览器后再使用本地保存功能。
    </p>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { isLocalSaveSupported } from '@/utils/image-save';

/* ---------- props / emits ---------- */
const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'confirm'): void;
}>();

/* ---------- 双向绑定 ---------- */
const openRef = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val),
});

/* ---------- 浏览器支持检测 ---------- */
const supported = isLocalSaveSupported();

/* ---------- 事件 ---------- */
function handleOk() {
  emit('update:open', false);
  emit('confirm');
}

function handleCancel() {
  emit('update:open', false);
}
</script>

<style lang="scss" scoped>
.local-path-guard__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ink-color-2);

  &--warn {
    margin-top: 12px;
    color: #d4380d;
  }
}
</style>