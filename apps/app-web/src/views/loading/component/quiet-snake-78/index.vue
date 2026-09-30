<!--
  组件名称：quiet-snake-78（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/KSAplay_quiet-snake-78.html
  作者：KSAplay（来源 https://uiverse.io）

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

/* From Uiverse.io by KSAplay - Tags: loader */
.loader {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader::before,
.loader::after {
  position: absolute;
  content: "";
  height: 8em;
  width: 8em;
  border: 1em solid #0060fa;
  border-radius: 50%;
  animation: loader_79178 2s linear infinite;
}

.loader::after {
  opacity: 0;
  animation-delay: 1s;
}

@keyframes loader_79178 {
  0% {
    border: 1em solid #0060fa;
    transform: scale(0);
    opacity: 1;
  }

  100% {
    border: 0 solid #0060fa;
    transform: scale(1);
    opacity: 0;
  }
}
</style>
