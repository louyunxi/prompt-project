<!--
  组件名称：GsLoading01（大屏加载动画）

  来源迁移：
    - 源文件：D:\sn-project\frp_gov_web\src\components\GovScreen\GsLoading\src\GsLoading01.vue
    - 说明：源组件样式位于 themes/default/gs-loading.less（全局 $bem 机制），
      迁移时移除 $bem 依赖改为字符串类名，将 less 中 8 个圆球定位与
      ball-spin-fade-loader 动画内联进本组件，props 保留 loading / offset / color。

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .gs-loading-01 上）：
    --gl-bg     #04284a   组件深色背景（保证深色球体可见）
    --gl-dot    #011f18   圆球颜色（源默认色）

  迁移说明：
    1. 源组件为浮层定位（absolute 居中 + z-index 99999），迁移为独立展示容器
       （relative + flex 居中 + 固定高度），适配 Gallery 卡片。
    2. offset prop 保留：控制圆球组相对中心偏移，与源行为一致。
    3. 无图片物料，全部由 CSS 绘制。
-->
<template>
  <div class="gs-loading-01">
    <div class="gs-loading-01__stage" v-if="props.loading">
      <div
        class="gs-loading-01__inner"
        :style="{ left: `${offset[0]}px`, top: `${offset[1]}px` }"
      >
        <div
          v-for="i in 8"
          :key="i"
          class="gs-loading-01__dot"
          :style="{ backgroundColor: color }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** 是否展示加载动画 */
    loading?: boolean;
    /** 圆球组相对中心偏移 [x, y] */
    offset?: number[];
    /** 圆球颜色 */
    color?: string;
  }>(),
  {
    loading: true,
    offset: () => [0, 0],
    color: '#011f18',
  },
);
</script>

<style scoped lang="scss">
.gs-loading-01 {
  --gl-dot: #011f18;

  position: relative;
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;

  &__stage {
    position: relative;
    width: 20px;
    height: 20px;
  }

  &__inner {
    position: absolute;
    top: 0;
    left: 0;
  }

  &__dot {
    width: 15px;
    height: 15px;
    border-radius: 100%;
    margin: 2px;
    animation: gl-ball-spin-fade 1s infinite linear;
    animation-fill-mode: both;
    position: absolute;
  }

  // 8 个圆球围绕中心旋转排列（与源 gs-loading.less 定位一致）
  &__dot:nth-child(1) {
    top: 25px;
    left: 0;
    animation-delay: 0s;
  }

  &__dot:nth-child(2) {
    top: 17.04545px;
    left: 17.04545px;
    animation-delay: 0.12s;
  }

  &__dot:nth-child(3) {
    top: 0;
    left: 25px;
    animation-delay: 0.24s;
  }

  &__dot:nth-child(4) {
    top: -17.04545px;
    left: 17.04545px;
    animation-delay: 0.36s;
  }

  &__dot:nth-child(5) {
    top: -25px;
    left: 0;
    animation-delay: 0.48s;
  }

  &__dot:nth-child(6) {
    top: -17.04545px;
    left: -17.04545px;
    animation-delay: 0.6s;
  }

  &__dot:nth-child(7) {
    top: 0;
    left: -25px;
    animation-delay: 0.72s;
  }

  &__dot:nth-child(8) {
    top: 17.04545px;
    left: -17.04545px;
    animation-delay: 0.84s;
  }

  @keyframes gl-ball-spin-fade {
    50% {
      opacity: 0.3;
      transform: scale(0.4);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
}

/** 用户开启系统级 reduced-motion 时关闭动画 */
@media (prefers-reduced-motion: reduce) {
  .gs-loading-01__dot {
    animation: none;
    opacity: 1;
  }
}
</style>
