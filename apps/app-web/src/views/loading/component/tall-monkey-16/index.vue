<!--
  组件名称：tall-monkey-16（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Nawsome_tall-monkey-16.html
  作者：Nawsome（来源 https://uiverse.io）

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
    <div class="loading">
      <svg xmlns="http://www.w3.org/2000/svg" width="124" height="124" viewBox="0 0 124 124">
        <circle class="circle-loading" cx="62" cy="62" r="59" fill="none" stroke="hsl(271, 76%, 74%)" stroke-width="6px"></circle>
        <circle class="circle" cx="62" cy="62" r="59" fill="none" stroke="hsl(271, 76%, 53%)" stroke-width="6px" stroke-linecap="round"></circle>
        <polyline class="check" points="73.56 48.63 57.88 72.69 49.38 62" fill="none" stroke="hsl(271, 76%, 53%)" stroke-width="6px" stroke-linecap="round"></polyline>
      </svg>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Nawsome - Tags: loader */
.loading {
  width: 124px;
  height: 124px;
}

.loading svg {
  display: block;
  width: 100%;
  height: 100%;
}

.circle {
  transform: rotate(-90deg);
  transform-origin: center;
  stroke-dasharray: 380;
  stroke-dashoffset: 380;
  animation: circle_4 2s ease-in-out forwards;
}

.check {
  stroke-dasharray: 45;
  stroke-dashoffset: 45;
  animation: check_4 0.2s 2s ease-in-out forwards;
}

@keyframes circle_4 {
  0% {
    stroke-dashoffset: 380;
  }

  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes check_4 {
  0% {
    stroke-dashoffset: 45;
  }

  100% {
    stroke-dashoffset: 90;
  }
}
</style>
