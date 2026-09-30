<!--
  组件名称：popular-cobra-49（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/PriyanshuGupta28_popular-cobra-49.html
  作者：PriyanshuGupta28（来源 https://uiverse.io）

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

/* From Uiverse.io by PriyanshuGupta28 - Tags: loader, 3d loader */
.spinner {
  width: 56px;
  height: 56px;
  display: grid;
  border-radius: 50%;
  -webkit-mask: radial-gradient(farthest-side,#0000 40%,#6121d1 41%);
  background: linear-gradient(0deg ,rgba(97,33,209,0.5) 50%,rgba(97,33,209,1) 0) center/4.5px 100%,
        linear-gradient(90deg,rgba(97,33,209,0.25) 50%,rgba(97,33,209,0.75) 0) center/100% 4.5px;
  background-repeat: no-repeat;
  animation: spinner-d3o0rx 1s infinite steps(12);
}

.spinner::before,
.spinner::after {
  content: "";
  grid-area: 1/1;
  border-radius: 50%;
  background: inherit;
  opacity: 0.915;
  transform: rotate(30deg);
}

.spinner::after {
  opacity: 0.83;
  transform: rotate(60deg);
}

@keyframes spinner-d3o0rx {
  100% {
    transform: rotate(1turn);
  }
}
</style>
