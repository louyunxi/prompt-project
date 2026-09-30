<!--
  组件名称：white-robin-100（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/andrew-demchenk0_white-robin-100.html
  作者：andrew-demchenk0（来源 https://uiverse.io）

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
    <div class="loader">
      <div style="--i:1" class="loader_item"></div>
      <div style="--i:2" class="loader_item"></div>
      <div style="--i:3" class="loader_item"></div>
      <div style="--i:4" class="loader_item"></div>
      <div style="--i:5" class="loader_item"></div> 
      <div style="--i:6" class="loader_item"></div>
      <div style="--i:7" class="loader_item"></div>
      <div style="--i:8" class="loader_item"></div>
      <div style="--i:9" class="loader_item"></div>
      <div style="--i:10" class="loader_item"></div>
      <div style="--i:11" class="loader_item"></div>
      <div style="--i:12" class="loader_item"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by andrew-demchenk0 - Tags: loader */
.loader {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}

.loader .loader_item {
  transform-origin: 40px 40px;
  animation: spinner 1.2s linear infinite;
}

.loader .loader_item:after {
  content: " ";
  display: block;
  position: absolute;
  top: 3px;
  left: 37px;
  width: 6px;
  height: 18px;
  border-radius: 20%;
  /* try any color u want (yellow, red, lightskyblue ect...) */
  background: green;
}

.loader .loader_item:nth-child(1) {
  transform: rotate(0deg);
  animation-delay: -1.1s;
}

.loader .loader_item:nth-child(2) {
  transform: rotate(30deg);
  animation-delay: -1s;
}

.loader .loader_item:nth-child(3) {
  transform: rotate(60deg);
  animation-delay: -0.9s;
}

.loader .loader_item:nth-child(4) {
  transform: rotate(90deg);
  animation-delay: -0.8s;
}

.loader .loader_item:nth-child(5) {
  transform: rotate(120deg);
  animation-delay: -0.7s;
}

.loader .loader_item:nth-child(6) {
  transform: rotate(150deg);
  animation-delay: -0.6s;
}

.loader .loader_item:nth-child(7) {
  transform: rotate(180deg);
  animation-delay: -0.5s;
}

.loader .loader_item:nth-child(8) {
  transform: rotate(210deg);
  animation-delay: -0.4s;
}

.loader .loader_item:nth-child(9) {
  transform: rotate(240deg);
  animation-delay: -0.3s;
}

.loader .loader_item:nth-child(10) {
  transform: rotate(270deg);
  animation-delay: -0.2s;
}

.loader .loader_item:nth-child(11) {
  transform: rotate(300deg);
  animation-delay: -0.1s;
}

.loader .loader_item:nth-child(12) {
  transform: rotate(330deg);
  animation-delay: 0s;
}

@keyframes spinner {
  0% {
    opacity: 1;
    filter: hue-rotate(0deg);
  }

  100% {
    opacity: 0;
    filter: hue-rotate(360deg);
  }
}
</style>
