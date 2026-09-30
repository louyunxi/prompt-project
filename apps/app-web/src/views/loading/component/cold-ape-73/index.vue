<!--
  组件名称：cold-ape-73（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/AHMED-MIT_cold-ape-73.html
  作者：AHMED-MIT（来源 https://uiverse.io）

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

/* From Uiverse.io by AHMED-MIT - Tags: loader */
.spinner {
  position: relative;
  width: 35.2px;
  height: 35.2px;
}

.spinner::before,
.spinner::after {
  content: '';
  width: 100%;
  height: 100%;
  display: block;
  animation: spinner-b4c8mmhg 0.5s backwards, spinner-49opz7hg 1.25s 0.5s infinite ease;
  border: 8.8px solid #000000;
  border-radius: 50%;
  box-shadow: 0 -52.8px 0 -8.8px #000000;
  position: absolute;
}

.spinner::after {
  animation-delay: 0s, 1.25s;
}

@keyframes spinner-b4c8mmhg {
  from {
    box-shadow: 0 0 0 -8.8px #000000;
  }
}

@keyframes spinner-49opz7hg {
  to {
    transform: rotate(360deg);
  }
}
</style>
