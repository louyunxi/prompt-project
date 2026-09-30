<!--
  组件名称：popular-crab-99（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/NlghtM4re_popular-crab-99.html
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

/* From Uiverse.io by NlghtM4re - Tags: loader, cube, shadow, glow, colorful */
.loader {
  height: 120px;
  width: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.loader div {
  height: 30px;
  width: 30px;
  position: absolute;
  animation: move 4s infinite;
}

.loader div:nth-child(1) {
  background-color: rgb(158, 136, 246);
  box-shadow: rgb(158, 136, 246) 0px 7px 29px 0px;
  transform: translate(-30px,-30px);
  animation-delay: -1s;
}

.loader div:nth-child(2) {
  background-color: rgb(97, 183, 253);
  box-shadow: rgb(97, 183, 253) 0px 7px 29px 0px;
  transform: translate(30px,-30px);
  animation-delay: -2s;
}

.loader div:nth-child(3) {
  background-color: rgb(95, 249, 175);
  box-shadow: rgb(95, 249, 175) 0px 7px 29px 0px;
  transform: translate(30px,30px);
  animation-delay: -3s;
}

.loader div:nth-child(4) {
  background-color: rgb(243, 171, 89);
  box-shadow: rgb(243, 171, 89) 0px 7px 29px 0px;
  transform: translate(-30px,30px);
  animation-delay: -4s;
}

@keyframes move {
  0% {
    transform: translate(-30px, -30px);
  }

  25% {
    transform: translate(30px, -30px);
  }

  50% {
    transform: translate(30px, 30px);
  }

  75% {
    transform: translate(-30px, 30px);
  }

  100% {
    transform: translate(-30px, -30px);
  }
}
</style>
