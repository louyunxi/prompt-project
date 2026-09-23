<!--
  组件名称：imgBackground（图片背景 - img 标签版）
  用途：一个简单的图片背景组件，默认展示 src/assets/image/bg.png，
       暴露 src 属性供外部覆盖，支持自定义高度与圆角。
       使用 <img> + object-fit: cover 实现，不拉伸。
-->
<template>
  <div class="img-background">
    <img
      :src="bgSrc"
      :alt="alt"
      :image="replaceImageMeta"
      class="img-background__img"
      @error="onImgError"
    />
    <div v-if="loadFailed" class="img-background__fallback">
      背景图片加载失败
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
// ?inline 将图片内联为 base64 data URL：
// qiankun 主应用环境下，模块内 baking 的 /src/xxx 根路径会去请求主应用 origin 导致 404，
// data URL 与 origin 无关，主应用/独立运行/dev/打包均可用（也契合 IIFE 单文件自包含构建）。
import defaultBg from '@/assets/image/bg.png?inline';

/**
 * 组件 Props（Vue 3.5+ 解构后仍保持响应式，可直接在模板与 v-bind 中使用）
 * @prop src     自定义背景图片地址；为空时使用默认 bg.png
 * @prop alt     图片 alt 文案
 * @prop height  容器高度（默认 320px）
 * @prop radius  圆角（默认 8px）
 */
const { src, alt, height, radius } = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    height?: string;
    radius?: string;
  }>(),
  {
    src: '',
    alt: '背景图',
    height: '320px',
    radius: '8px',
  },
);

/** 当前背景图：外部传入 src 优先，否则用默认 bg.png */
const bgSrc = computed<string>(() => (src && src.trim() ? src : defaultBg));
/** 图片加载失败标记 */
const loadFailed = ref<boolean>(false);

/**
 * 挂在渲染 DOM（<img>）上的「图片可替换」元信息，值为 JSON 字符串。
 * 全局探针 utils/image-marker 命中该图片后，点击「换图」小标签会读取
 * 本属性并作为默认生图参数带入新建任务弹框（缺失字段由弹框默认值补齐，
 * 不会被清空）。
 */
const replaceImageMeta = JSON.stringify({
  prompt: '科技物联网蓝色数据可视化大屏背景，不要有文字，高清',
  model: 'gpt-image-2',
  size: '16:9',
  quality: 'high',
  outputFormat: 'png',
  transparent: false,
});

function onImgError() {
  // eslint-disable-next-line no-console
  console.warn('[img-background] 背景图片加载失败');
  loadFailed.value = true;
}
</script>

<style lang="scss" scoped>
.img-background {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: v-bind(radius);

  &__img {
    display: block;
    width: 100%;
    height: v-bind(height);
    object-fit: cover;
  }

  &__fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
    background: rgba(11, 29, 58, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
}
</style>