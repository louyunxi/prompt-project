<!--
  组件名称：cuddly-turtle-6（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/AqFox_cuddly-turtle-6.html
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
 width: 56px;
 height: 56px;
 display: grid;
 color: #004dff;
 background: radial-gradient(farthest-side, currentColor calc(100% - 7px),#0000 calc(100% - 6px) 0);
 -webkit-mask: radial-gradient(farthest-side,#0000 calc(100% - 15px),#000 calc(100% - 13px));
 border-radius: 50%;
 animation: spinner-sm4bhi 2s infinite linear;
}

.spinner::before,
.spinner::after {
 content: "";
 grid-area: 1/1;
 background: linear-gradient(currentColor 0 0) center,
          linear-gradient(currentColor 0 0) center;
 background-size: 100% 11px,11px 100%;
 background-repeat: no-repeat;
}

.spinner::after {
 transform: rotate(45deg);
}

@keyframes spinner-sm4bhi {
 100% {
  transform: rotate(1turn);
 }
}
</style>
