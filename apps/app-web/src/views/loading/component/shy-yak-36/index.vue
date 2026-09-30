<!--
  组件名称：shy-yak-36（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/tilakjain123_shy-yak-36.html
  作者：tilakjain123（来源 https://uiverse.io）

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
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by tilakjain123 - Tags: loader */
.loader {
  position: relative;
  width: 64px;
  height: 64px;
}

.loader div {
  position: absolute;
  border: 4px solid #454ade;
  border-radius: 50%;
  animation: loader8435 1s ease-out infinite;
}

.loader div:nth-child(2) {
  animation-delay: -0.5s;
}

@keyframes loader8435 {
  0% {
    top: 32px;
    left: 32px;
    width: 0;
    height: 0;
    opacity: 1;
  }

  100% {
    top: 0;
    left: 0;
    width: 64px;
    height: 64px;
    opacity: 0;
  }
}
</style>
