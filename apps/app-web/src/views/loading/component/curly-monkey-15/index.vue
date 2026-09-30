<!--
  组件名称：curly-monkey-15（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/JaydipPrajapati1910_curly-monkey-15.html
  作者：JaydipPrajapati1910（来源 https://uiverse.io）

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

/* From Uiverse.io by JaydipPrajapati1910 - Tags: animation, loader, infinite */
.loader {
  width: calc(160px / 0.707);
  height: 28px;
  background: repeating-linear-gradient(-45deg, #766DF4 0 30px,#0000 0 40px) left/200% 100%;
  animation: i3 2s infinite linear;
  border-radius: 10px;
  border: 1px solid #766DF4;
}

@keyframes i3 {
  100% {
    background-position: right
  }
}
</style>
