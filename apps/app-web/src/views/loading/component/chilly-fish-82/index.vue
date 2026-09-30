<!--
  组件名称：chilly-fish-82（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Cornerstone-04_chilly-fish-82.html
  作者：Cornerstone-04（来源 https://uiverse.io）

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

/* From Uiverse.io by Cornerstone-04 - Tags: loader */
.loader {
  width: 50px;
  height: 50px;
  position: relative;
  z-index: 1;
  transform: translateX(-50%);
}

.loader::before, 
.loader::after {
  content: '';
  position: absolute;
  width: inherit;
  height: inherit;
  border-radius: 50%;
  mix-blend-mode: multiply;
  animation: rotate92523 2s infinite cubic-bezier(0.77, 0, 0.175, 1);
}

.loader::before {
  background-color: #75e2ff;
}

.loader::after {
  background-color: #ff8496;
  animation-delay: 1s;
}

@keyframes rotate92523 {
  0%, 100% {
    left: 35px;
  }

  25% {
    transform: scale(.3);
  }

  50% {
    left: 0%;
  }

  75% {
    transform: scale(1);
  }
}
</style>
