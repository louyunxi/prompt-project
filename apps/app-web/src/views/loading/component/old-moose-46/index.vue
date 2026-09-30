<!--
  组件名称：old-moose-46（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/ahmed150up_old-moose-46.html
  作者：ahmed150up（来源 https://uiverse.io）

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
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by ahmed150up - Tags: loader */
.loader {
  display: flex;
  justify-content: center;
}

.bar {
  width: 7px;
  height: 18px;
  margin: 0 9px;
  border-radius: 10px;
  animation: loading_5192 1s ease-in-out infinite;
  background-color: aqua;
}

.bar:nth-child(1) {
  animation-delay: 0.01s;
}

.bar:nth-child(2) {
  animation-delay: 0.09s;
}

.bar:nth-child(3) {
  animation-delay: 0.19s;
}

.bar:nth-child(4) {
  animation-delay: 0.29s;
}

@keyframes loading_5192 {
  0% {
    transform: scale(1);
  }

  20% {
    transform: scale(1, 2.5);
  }

  40% {
    transform: scale(1);
  }
}
</style>
