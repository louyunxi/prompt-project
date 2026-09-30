<!--
  组件名称：wonderful-panther-25（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Bodyhc_wonderful-panther-25.html
  作者：Bodyhc（来源 https://uiverse.io）

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
    <div class="custom-loader"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Bodyhc - Tags: loading, loader, circle loader */
.custom-loader {
  width: 50px;
  height: 50px;
  display: grid;
  border-radius: 50%;
  -webkit-mask: radial-gradient(farthest-side,#0000 40%,#000 41%);
  background: linear-gradient(0deg ,#766DF480 50%,#766DF4FF 0) center/4px 100%,
    linear-gradient(90deg,#766DF440 50%,#766DF4BF 0) center/100% 4px;
  background-repeat: no-repeat;
  animation: s3 1s infinite steps(12);
}

.custom-loader::before,
.custom-loader::after {
  content: "";
  grid-area: 1/1;
  border-radius: 50%;
  background: inherit;
  opacity: 0.915;
  transform: rotate(30deg);
}

.custom-loader::after {
  opacity: 0.83;
  transform: rotate(60deg);
}

@keyframes s3 {
  100% {
    transform: rotate(1turn)
  }
}
</style>
