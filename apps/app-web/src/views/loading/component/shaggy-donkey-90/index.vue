<!--
  组件名称：shaggy-donkey-90（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/SmookyDev_shaggy-donkey-90.html
  作者：SmookyDev（来源 https://uiverse.io）

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
    <div class="center_div">
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by SmookyDev  - Tags: flashy, loader, smooth, gradients, wave, css effect, loading animation */
.center_div {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 5px;
}

.wave {
  width: 1.8rem;
  height: 150px;
  background-color: #ff6b6b;
  margin: 0 4px;
  border-radius: 0.4rem;
  animation: wave 1.5s linear infinite;
  transform-origin: center;
}

@keyframes wave {
  0% {
    transform: scale(0);
    filter: hue-rotate(90deg) blur(100px);
  }
  25% {
    transform: scale(0);
    filter: hue-rotate(120deg) blur(50px);
  }
  50% {
    transform: scale(1);
    filter: hue-rotate(180deg) blur(25px);
  }
  25% {
    transform: scale(0);
    filter: hue-rotate(360deg) blur(2px);
  }
  100% {
    transform: scale(0);
    filter: hue-rotate(0deg) blur(0);
  }
}

.wave:nth-child(2) {
  animation-delay: 0.1s;
}

.wave:nth-child(3) {
  animation-delay: 0.2s;
}

.wave:nth-child(4) {
  animation-delay: 0.3s;
}

.wave:nth-child(5) {
  animation-delay: 0.4s;
}

.wave:nth-child(6) {
  animation-delay: 0.5s;
}

.wave:nth-child(7) {
  animation-delay: 0.6s;
}

.wave:nth-child(8) {
  animation-delay: 0.7s;
}

.wave:nth-child(9) {
  animation-delay: 0.8s;
}

.wave:nth-child(10) {
  animation-delay: 0.9s;
}
</style>
