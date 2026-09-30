<!--
  组件名称：serious-mule-65（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/AHMED-MIT_serious-mule-65.html
  作者：AHMED-MIT（来源 https://uiverse.io）

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
    <div class="spinner"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by AHMED-MIT - Tags: loader, about me, accept call */
.spinner {
  --d: 24.6px;
  width: 4.5px;
  height: 4.5px;
  border-radius: 50%;
  color: #474bff;
  box-shadow: calc(1*var(--d))      calc(0*var(--d))     0 0,
          calc(0.707*var(--d))  calc(0.707*var(--d)) 0 1.1px,
          calc(0*var(--d))      calc(1*var(--d))     0 2.2px,
          calc(-0.707*var(--d)) calc(0.707*var(--d)) 0 3.4px,
          calc(-1*var(--d))     calc(0*var(--d))     0 4.5px,
          calc(-0.707*var(--d)) calc(-0.707*var(--d))0 5.6px,
          calc(0*var(--d))      calc(-1*var(--d))    0 6.7px;
  animation: spinner-a90wxe 1s infinite steps(8);
}

@keyframes spinner-a90wxe {
  100% {
    transform: rotate(1turn);
  }
}
</style>
