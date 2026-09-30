<!--
  组件名称：tasty-puma-74（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/NlghtM4re_tasty-puma-74.html
  作者：NlghtM4re（来源 https://uiverse.io）

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
      <div class="loader-inner"> 
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
        <div class="loader-block"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* From Uiverse.io by NlghtM4re - Tags: progress, progress bar, loader, glow, bars, animated */
.loader {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 80px;
  aspect-ratio: 1 / 1;
  position: relative;
}

.loader:before {
  content: "";
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 50%;
}

.loader-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
}

.loader-block {
  display: inline-block;
  width: 10%;
  height: 12.5%;
  margin: 2.5%;
  background-color: rgb(53, 143, 246);
  box-shadow: 0 0 30px rgb(53, 143, 246);
  animation: loader 5s infinite;
}

.loader-block:nth-child(1) {
  animation-delay: 0.2s;
}

.loader-block:nth-child(2) {
  animation-delay: 0.4s;
}

.loader-block:nth-child(3) {
  animation-delay: 0.6s;
}

.loader-block:nth-child(4) {
  animation-delay: 0.8s;
}

.loader-block:nth-child(5) {
  animation-delay: 1s;
}

.loader-block:nth-child(6) {
  animation-delay: 1.2s;
}

.loader-block:nth-child(7) {
  animation-delay: 1.4s;
}

.loader-block:nth-child(8) {
  animation-delay: 1.6s;
}

.loader-block:nth-child(9) {
  animation-delay: 1.8s;
}

.loader-block:nth-child(10) {
  animation-delay: 2s;
}

.loader-block:nth-child(11) {
  animation-delay: 2.2s;
}

.loader-block:nth-child(12) {
  animation-delay: 2.4s;
}

.loader-block:nth-child(13) {
  animation-delay: 2.6s;
}

.loader-block:nth-child(14) {
  animation-delay: 2.8s;
}

.loader-block:nth-child(15) {
  animation-delay: 3s;
}

.loader-block:nth-child(16) {
  animation-delay: 3.2s;
}

.loader-block:nth-child(17) {
  animation-delay: 3.4s;
}

.loader-block:nth-child(18) {
  animation-delay: 3.6s;
}

.loader-block:nth-child(19) {
  animation-delay: 3.8s;
}

.loader-block:nth-child(20) {
  animation-delay: 4s;
}

.loader-block:nth-child(21) {
  animation-delay: 4.2s;
}

.loader-block:nth-child(22) {
  animation-delay: 4.4s;
}

.loader-block:nth-child(23) {
  animation-delay: 4.6s;
}

.loader-block:nth-child(24) {
  animation-delay: 4.8s;
}

@keyframes loader {
  0% {
    transform: scale(1);
    box-shadow: 0 0 40px rgb(53, 143, 246);
  }

  13% {
    transform: scale(1, 4);
    box-shadow: 0 0 60px rgb(53, 143, 246);
  }

  26% {
    transform: scale(1);
    box-shadow: 0 0 40px rgb(53, 143, 246);
  }
}
</style>
