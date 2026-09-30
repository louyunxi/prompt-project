<!--
  组件名称：silent-quail-21（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/AqFox_silent-quail-21.html
  作者：AqFox（来源 https://uiverse.io）

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

/* From Uiverse.io by AqFox - Tags: loader */
.spinner {
 width: 6px;
 height: 6px;
 animation: spinner-xp626r 1.1s infinite;
 border-radius: 50%;
 box-shadow: 24px 0 0 6px #004dff, -24px 0 0 6px #004dff;
}

@keyframes spinner-xp626r {
 to {
  transform: rotate(360deg);
 }
}
</style>
