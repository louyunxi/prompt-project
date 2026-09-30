<!--
  组件名称：breezy-panther-14（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/abrahamcalsin_breezy-panther-14.html
  作者：abrahamcalsin（来源 https://uiverse.io）

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
    <div class="loaderRectangle">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by abrahamcalsin - Tags: loader */
.loaderRectangle {
 display: flex;
 justify-content: center;
 align-items: center;
 gap: 0 3px;
}

.loaderRectangle div {
 width: 10px;
 height: 16px;
 animation: .9s ease-in-out infinite;
 background: #183153;
 box-shadow: 0 0 20px rgba(18, 31, 53, 0.3);
}

.loaderRectangle div:nth-child(1) {
 animation-name: rectangleOneAnim;
 animation-delay: 1s;
}

@keyframes rectangleOneAnim {
 0% {
  height: 15px;
 }

 40% {
  height: 30px;
 }

 100% {
  height: 15px;
 }
}

.loaderRectangle div:nth-child(2) {
 animation-name: rectangleTwoAnim;
 animation-delay: 1.1s;
}

@keyframes rectangleTwoAnim {
 0% {
  height: 15px;
 }

 40% {
  height: 40px;
 }

 100% {
  height: 15px;
 }
}

.loaderRectangle div:nth-child(3) {
 animation-name: rectangleThreeAnim;
 animation-delay: 1.2s;
}

@keyframes rectangleThreeAnim {
 0% {
  height: 15px;
 }

 40% {
  height: 50px;
 }

 100% {
  height: 15px;
 }
}

.loaderRectangle div:nth-child(4) {
 animation-name: rectangleFourAnim;
 animation-delay: 1.3s;
}

@keyframes rectangleFourAnim {
 0% {
  height: 15px;
 }

 40% {
  height: 40px;
 }

 100% {
  height: 15px;
 }
}

.loaderRectangle div:nth-child(5) {
 animation-name: rectangleFiveAnim;
 animation-delay: 1.4s;
}

@keyframes rectangleFiveAnim {
 0% {
  height: 15px;
 }

 40% {
  height: 30px;
 }

 100% {
  height: 15px;
 }
}
</style>
