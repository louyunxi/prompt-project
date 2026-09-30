<!--
  组件名称：friendly-donkey-60（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/preshpi_friendly-donkey-60.html
  作者：preshpi（来源 https://uiverse.io）

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
    <div class="spinner"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by preshpi  - Website: https://10015.io/tools/css-loader-generator - Name: 10015 - Tags: loader, spinner, css */
.spinner {
  width: 46px;
  height: 46px;
  display: grid;
  animation: spinner-plncf9 3s infinite;
}

.spinner::before,
.spinner::after {
  content: "";
  grid-area: 1/1;
  border: 9px solid;
  border-radius: 50%;
  border-color: #474bff #474bff #0000 #0000;
  mix-blend-mode: darken;
  animation: spinner-plncf9 1s infinite linear;
}

.spinner::after {
  border-color: #0000 #0000 #dbdcef #dbdcef;
  animation-direction: reverse;
}

@keyframes spinner-plncf9 {
  100% {
    transform: rotate(1turn);
  }
}
</style>
