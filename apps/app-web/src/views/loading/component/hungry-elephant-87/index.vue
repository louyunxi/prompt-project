<!--
  组件名称：hungry-elephant-87（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/AbanoubMagdy1_hungry-elephant-87.html
  作者：AbanoubMagdy1（来源 https://uiverse.io）

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

/* From Uiverse.io by AbanoubMagdy1 - Tags: loader */
.loader {
  --dim: 5rem;
  width: var(--dim);
  height: var(--dim);
  border: 7px solid #2596be;
  border-top-color: transparent;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: spin_51 1.5s infinite linear;
}

@keyframes spin_51 {
  from {
    transform: rotate(0)
  }

  to {
    transform: rotate(360deg)
  }
}
</style>
