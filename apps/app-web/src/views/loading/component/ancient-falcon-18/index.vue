<!--
  组件名称：ancient-falcon-18（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/dylanharriscameron_ancient-falcon-18.html
  作者：dylanharriscameron（来源 https://uiverse.io）

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
    <div class="loaderBar"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by dylanharriscameron - Tags: loading, loader, infinite */
.loaderBar {
  width: calc(160px / 0.707);
  height: 10px;
  background: #F9F9F9;
  border-radius: 10px;
  border: 1px solid #006DFE;
  position: relative;
  overflow: hidden;
}

.loaderBar::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 5px;
  background: repeating-linear-gradient(45deg, #0031F2 0 30px, #006DFE 0 40px) right/200% 100%;
  animation: fillProgress 6s ease-in-out infinite, lightEffect 1s infinite linear;
  animation-fill-mode: forwards;
}

@keyframes fillProgress {
  0% {
    width: 0;
  }

  33% {
    width: 33.333%;
  }

  66% {
    width: 66.67%;
  }

  100% {
    width: 100%;
  }
}

@keyframes lightEffect {
  0%, 20%, 40%, 60%, 80%, 100% {
    background: repeating-linear-gradient(45deg, #0031F2 0 30px, #006DFE 0 40px) right/200% 100%;
  }

  10%, 30%, 50%, 70%, 90% {
    background: repeating-linear-gradient(45deg, #0031F2 0 30px, #006DFE 0 40px, rgba(255, 255, 255, 0.3) 0 40px) right/200% 100%;
  }
}
</style>
