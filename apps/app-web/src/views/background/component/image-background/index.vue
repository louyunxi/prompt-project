<!--
  组件名称：imageBackground（图片背景 - CSS 背景图版）
  用途：使用 background-image 而非 <img> 标签实现的背景组件，
       默认展示 src/assets/image/bg.png。
       通过 background-size: cover + background-position: center
       保证图片按比例裁剪居中显示，不拉伸变形。
-->
<template>
  <div
    class="image-background"
    data-image-component="imageBackground"
    :style="bgStyle"
    :image="replaceImageMeta"
    role="img"
    :aria-label="alt"
  >
    <div v-if="loadFailed" class="image-background__fallback">
      背景图片加载失败
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
// ?inline 将图片内联为 base64 data URL：
// qiankun 主应用环境下，模块内 baking 的 /src/xxx 根路径会去请求主应用 origin 导致 404，
// data URL 与 origin 无关，主应用/独立运行/dev/打包均可用（也契合 IIFE 单文件自包含构建）。
import defaultBg from '@/assets/image/bg.png?inline';

/**
 * 组件 Props（Vue 3.5+ 解构后仍保持响应式，可直接在模板与 v-bind 中使用）
 * @prop src          自定义背景图片地址；为空时使用默认 bg.png
 * @prop alt          背景图片的语义化描述（无障碍）
 * @prop height       容器高度（默认 320px）
 * @prop radius       圆角（默认 8px）
 * @prop fit          背景填充策略：'cover' 裁剪居中填满；'contain' 完整显示（默认 cover）
 * @prop position     background-position（默认 center）
 * @prop repeat       background-repeat（默认 no-repeat）
 */
const {
  src,
  alt,
  height,
  radius,
  fit,
  position,
  repeat,
} = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    height?: string;
    radius?: string;
    fit?: 'cover' | 'contain';
    position?: string;
    repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  }>(),
  {
    src: '',
    alt: '背景图',
    height: '320px',
    radius: '8px',
    fit: 'cover',
    position: 'center',
    repeat: 'no-repeat',
  },
);

/** 当前背景图：外部传入 src 优先，否则用默认 bg.png */
const bgUrl = computed<string>(() => (src && src.trim() ? src : defaultBg));
/** 图片加载失败标记 */
const loadFailed = ref<boolean>(false);

/**
 * 挂在渲染 DOM（CSS 背景图容器）上的「图片可替换」元信息，值为 JSON 字符串。
 * 全局探针 utils/image-marker 命中该背景图后，点击「换图」小标签会读取
 * 本属性并作为默认生图参数带入新建任务弹框（缺失字段由弹框默认值补齐，
 * 不会被清空）。
 */
const replaceImageMeta = JSON.stringify({
  prompt: '智慧农业绿色渐变物联网背景，不要有文字，高清',
  model: 'gpt-image-2',
  size: '16:9',
  quality: 'high',
  outputFormat: 'png',
  transparent: true,
});

/**
 * 内联背景样式。
 * 注意：src/height/radius/fit/position/repeat 是 Vue 3.5 解构 props，
 * 本身就是普通值（编译期转 props.xxx），不要再加 .value。
 */
const bgStyle = computed(() => ({
  backgroundImage: `url("${bgUrl.value}")`,
  backgroundSize: fit,
  backgroundPosition: position,
  backgroundRepeat: repeat,
  height,
  borderRadius: radius,
}));

/** 探测图片可否加载；失败时显示兜底遮罩（immediate 保证首屏也探测） */
watch(
  bgUrl,
  (url) => {
    loadFailed.value = false;
    const probe = new Image();
    probe.onerror = () => {
      // eslint-disable-next-line no-console
      console.warn('[image-background] 背景图片加载失败');
      loadFailed.value = true;
    };
    probe.src = url;
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.image-background {
  position: relative;
  width: 100%;
  overflow: hidden;
  // background-image / background-position / background-repeat / background-size / height / border-radius
  // 全部通过 :style 绑定到 props，保持响应式

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