<!--
  组件名称：swift-bulldog-26（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Charly-T_swift-bulldog-26.html
  作者：Charly-T（来源 https://uiverse.io）

  依赖插件 / 版本：
    - 无（纯 CSS 动画）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0

  颜色变量：保持源文件原色，未提取 CSS 变量。

  迁移说明：
    1. 将源 HTML 片段（template + style）拆为 Vue SFC 的 template + style。
    2. body / html / :root 选择器替换为 .loading-component，避免污染宿主页面。
    3. CSS 通过 Vue scoped 自动添加 data 属性实现隔离。
-->

<template>
  <div class="loading-component">
    <svg class="loader" viewBox="0 0 100 100">
        <circle class="moon moon-back"></circle>
        <circle class="planet"></circle>
        <circle class="moon moon-front"></circle>
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Charly-T - Tags: loader */
.loader {
  --moon-r: 0.7em;
  --planet-r: 1.75em;
  --planet-stroke-width: 4;
  --center: 50;
  --moon-max: 80;
  --moon-min: 20;
  --animation-duration: 4000ms;
  --planet-stroke: black;
  --planet-fill: white;
  --moon-fill: #fecb00;
  width: 7em;
}

.planet {
  cx: var(--center);
  cy: var(--center);
  r: var(--planet-r);
  fill: var(--planet-fill);
  stroke: var(--planet-stroke);
  stroke-width: var(--planet-stroke-width);
}

.moon {
  fill: var(--moon-fill);
  r: var(--moon-r);
}

.moon-front {
  animation: orbit0234 var(--animation-duration) ease-in-out infinite,
    orbit-front var(--animation-duration) linear infinite;
}

.moon-back {
  animation: orbit0234 var(--animation-duration) ease-in-out infinite;
}

@keyframes orbit0234 {
  0% {
    cx: var(--moon-max);
    cy: var(--moon-min);
  }

  50% {
    cx: var(--moon-min);
    cy: var(--moon-max);
  }

  100% {
    cx: var(--moon-max);
    cy: var(--moon-min);
  }
}

@keyframes orbit-front {
  0% {
    opacity: 0;
  }

  49% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }
}
</style>
