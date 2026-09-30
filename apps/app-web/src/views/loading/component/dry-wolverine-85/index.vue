<!--
  组件名称：dry-wolverine-85（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/AHMED-MIT_dry-wolverine-85.html
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
    <div class="spinner">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by AHMED-MIT - Tags: loader, accept, account */
.spinner {
  position: relative;
  width: 33.6px;
  height: 33.6px;
  perspective: 67.2px;
}

.spinner div {
  width: 100%;
  height: 100%;
  background: #474bff;
  position: absolute;
  left: 50%;
  transform-origin: left;
  animation: spinner-16s03x 2s infinite;
}

.spinner div:nth-child(1) {
  animation-delay: 0.15s;
}

.spinner div:nth-child(2) {
  animation-delay: 0.3s;
}

.spinner div:nth-child(3) {
  animation-delay: 0.45s;
}

.spinner div:nth-child(4) {
  animation-delay: 0.6s;
}

.spinner div:nth-child(5) {
  animation-delay: 0.75s;
}

@keyframes spinner-16s03x {
  0% {
    transform: rotateY(0deg);
  }

  50%, 80% {
    transform: rotateY(-180deg);
  }

  90%, 100% {
    opacity: 0;
    transform: rotateY(-180deg);
  }
}
</style>
