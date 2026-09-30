<!--
  组件名称：yellow-dragon-0（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/satyamchaudharydev_yellow-dragon-0.html
  作者：satyamchaudharydev（来源 https://uiverse.io）

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
    <div class="spinner">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by satyamchaudharydev - Tags: loader */
.spinner {
 --gap: 5px;
 --clr: #d62d20;
 --height: 23px;
 width: 100px;
 height: 100px;
 display: flex;
 align-items: center;
 justify-content: center;
 gap: var(--gap);
}

.spinner span {
 background: var(--clr);
 width: 6px;
 height: var(--height);
 animation: grow 1s ease-in-out infinite;
}

.spinner span:nth-child(2) {
 animation: grow 1s ease-in-out 0.15s infinite;
}

.spinner span:nth-child(3) {
 animation: grow 1s ease-in-out 0.3s infinite;
}

.spinner span:nth-child(4) {
 animation: grow 1s ease-in-out 0.475s infinite;
}

@keyframes grow {
 0%,100% {
  transform: scaleY(1);
 }

 50% {
  transform: scaleY(1.8);
 }
}
</style>
