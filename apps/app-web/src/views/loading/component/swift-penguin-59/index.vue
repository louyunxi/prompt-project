<!--
  组件名称：swift-penguin-59（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/vikramsinghnegi_swift-penguin-59.html
  作者：vikramsinghnegi（来源 https://uiverse.io）

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
    <div class="center-body">
      <div class="loader-spanne-20">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by vikramsinghnegi  - Tags: loading, loader, .loading-component, css */
.loader-spanne-20 {
  position: relative;
  width: 100px;
  height: 30px;
  padding: 0;
}
.loader-spanne-20 > span {
  position: absolute;
  right: 0;
  width: 3px;
  height: 30px;
  background-color: rgb(116, 204, 197);
  display: block;
  border-radius: 3px;
  transform-origin: 50% 100%;
  animation: move 2.8s linear infinite;
}
.loader-spanne-20 > span:nth-child(1) {
  animation-delay: -0.4s;
}
.loader-spanne-20 > span:nth-child(2) {
  animation-delay: -0.8s;
}
.loader-spanne-20 > span:nth-child(3) {
  animation-delay: -1.2s;
}
.loader-spanne-20 > span:nth-child(4) {
  animation-delay: -1.6s;
}
.loader-spanne-20 > span:nth-child(5) {
  animation-delay: -2s;
}
.loader-spanne-20 > span:nth-child(6) {
  animation-delay: -2.4s;
}
.loader-spanne-20 > span:nth-child(7) {
  animation-delay: -2.8s;
}
@keyframes move {
  0% {
    opacity: 0;
    transform: translateX(0px) rotate(0deg);
  }
  20% {
    opacity: 1;
  }
  40% {
    transform: translateX(-40px) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: translateX(-50px) rotate(22deg);
  }
  85% {
    opacity: 1;
    transform: translateX(-85px) rotate(60deg);
  }
  100% {
    opacity: 0;
    transform: translateX(-100px) rotate(65deg);
  }
}
</style>
