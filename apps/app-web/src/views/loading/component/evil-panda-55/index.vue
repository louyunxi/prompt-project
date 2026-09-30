<!--
  组件名称：evil-panda-55（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/ClawHack1_evil-panda-55.html
  作者：ClawHack1（来源 https://uiverse.io）

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
      <div class="loader__circle"></div>
      <div class="loader__circle"></div>
      <div class="loader__circle"></div>
      <div class="loader__circle"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by ClawHack1 - Tags: loader */
.loader {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.loader__circle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin: 0 4px;
  animation: loader_901 1s ease-in-out infinite;
}

.loader__circle:nth-of-type(1) {
  background-color: #007aff;
  animation-delay: 0;
}

.loader__circle:nth-of-type(2) {
  background-color: #ff2d55;
  animation-delay: 0.25s;
}

.loader__circle:nth-of-type(3) {
  background-color: #34c759;
  animation-delay: 0.5s;
}

.loader__circle:nth-of-type(4) {
  background-color: #ff9500;
  animation-delay: 0.75s;
}

@keyframes loader_901 {
  0% {
    transform: scale(1);
  }

  20% {
    transform: scale(1.2);
  }

  40% {
    transform: scale(1);
  }
}
</style>
