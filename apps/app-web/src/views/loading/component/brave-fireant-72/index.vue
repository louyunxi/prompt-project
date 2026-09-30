<!--
  组件名称：brave-fireant-72（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/forgingdestiny_brave-fireant-72.html
  作者：forgingdestiny（来源 https://uiverse.io）

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
      <div class="circle" tabindex="0"></div>
      <div class="circle" tabindex="0"></div>
      <div class="circle" tabindex="0"></div>
      <div class="circle" tabindex="0"></div>
      <div class="circle" tabindex="0"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by forgingdestiny - Tags: simple, minimalist, loader, wave, css effect */
/* Container for the loader */
.loader {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10em;
}

/* Circle elements */
.circle {
  width: 1em;
  height: 1em;
  margin: 0 0.25em;
  border-radius: 50%;
  background-color: #a8d5e2;
  animation: wave 1.5s infinite ease-in-out;
  transition: background-color 0.3s ease;
}

/* Animation */
@keyframes wave {
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-1em);
  }
}

/* Delay for each circle */
.circle:nth-child(1) {
  animation-delay: 0s;
}

.circle:nth-child(2) {
  animation-delay: 0.2s;
}

.circle:nth-child(3) {
  animation-delay: 0.4s;
}

.circle:nth-child(4) {
  animation-delay: 0.6s;
}

.circle:nth-child(5) {
  animation-delay: 0.8s;
}
</style>
