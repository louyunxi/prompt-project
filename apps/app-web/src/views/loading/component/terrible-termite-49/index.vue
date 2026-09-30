<!--
  组件名称：terrible-termite-49（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Cornerstone-04_terrible-termite-49.html
  作者：Cornerstone-04（来源 https://uiverse.io）

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

    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Cornerstone-04 - Tags: loader */
.loader {
  display: inline-block;
  width: 190px;
  height: 10px;
  border-radius: 40px;
  background-color: rgba(255, 255, 255, 1);
  position: relative;
  overflow: hidden;
}

.loader span {
  font: 700 22px monospace;
  text-transform: uppercase;
  margin: auto;
  color: #fff;
  letter-spacing: 5px;
}

.loader::before {
  content: "";
  position: absolute;
  top: 0;
  left: -50px;
  width: 150%;
  height: 100%;
  background-image: linear-gradient(332deg, #6bff7f, #32ff3c);
  border-radius: inherit;
  transform: scaleX(0);
  transform-origin: left;
  animation: load5123 1s infinite;
}

@keyframes load5123 {
  50% {
    transform: scaleX(1);
  }

  100% {
    transform: scaleX(0);
    transform-origin: right;
  }
}
</style>
