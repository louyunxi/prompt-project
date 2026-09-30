<!--
  组件名称：BallLoading（通用加载：8 个圆球旋转渐隐）

  来源迁移：
    - 源文件：D:\sn-project\frp_gov_web\src\components\common\loading.vue
    - 说明：源组件含 custom / element 两种加载样式（element 依赖 Element UI 指令
      v-loading），迁移时移除 element 分支，仅保留 custom（ball-spin-fade-loader），
      8 个 div 改为 v-for 渲染，动画保留源 keyframes 与逐球延迟。

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .ball-loading 上）：
    --bl-bg     #04284a   组件深色背景
    --bl-dot    #e0f4ff   圆球颜色（源 #ddd 偏亮化，保证深色背景可见）

  迁移说明：
    1. 移除 element-ui 分支，type/theme prop 一并移除，组件始终展示 custom 样式。
    2. 8 个圆球定位与延迟与源 scoped 样式一致（top/left 圆周排列，delay 0~0.84s
       每球递增 0.12s）。
    3. 无图片物料，全部由 CSS 绘制。
-->
<template>
  <div class="ball-loading">
    <div class="ball-loading__inner">
      <div v-for="i in 8" :key="i" class="ball-loading__dot"></div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.ball-loading {
  --bl-dot: #e0f4ff;

  position: relative;
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;

  &__inner {
    position: relative;
  }

  &__dot {
    background-color: var(--bl-dot);
    width: 15px;
    height: 15px;
    border-radius: 100%;
    margin: 2px;
    animation: bl-ball-spin-fade 1s infinite linear;
    animation-fill-mode: both;
    position: absolute;
  }

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

  @keyframes bl-ball-spin-fade {
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
  .ball-loading__dot {
    animation: none;
    opacity: 1;
  }
}
</style>
