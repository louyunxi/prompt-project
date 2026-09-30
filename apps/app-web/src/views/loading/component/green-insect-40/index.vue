<!--
  组件名称：green-insect-40（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/MbaziiraRonald_green-insect-40.html
  作者：MbaziiraRonald（来源 https://uiverse.io）

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
    <div class="loader"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by MbaziiraRonald - Tags: loader */
.loader {
  height: 50px;
  width: 50px;
  background: transparent;
  border: red 3px solid;
  border-top: transparent;
  border-radius: 50%;
  animation: animate81323 0.8s linear infinite;
}

@keyframes animate81323 {
  0% {
    border: 3px solid rgb(255, 75, 75);
    border-top: transparent;
    border-left: transparent;
    transform: rotate(0deg);
  }

  50% {
    border: 3px dashed rgb(240, 41, 240);
    border-top: transparent;
    border-left: transparent;
    transform: rotate(270deg);
  }

  100% {
    border: 3px dotted rgb(28, 228, 28);
    border-top: transparent;
    border-left: transparent;
    transform: rotate(360deg);
  }
}
</style>
