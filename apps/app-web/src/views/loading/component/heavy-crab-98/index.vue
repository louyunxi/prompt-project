<!--
  组件名称：heavy-crab-98（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/JaydipPrajapati1910_heavy-crab-98.html
  作者：JaydipPrajapati1910（来源 https://uiverse.io）

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

/* From Uiverse.io by JaydipPrajapati1910 - Tags: loader, circle, gold, golden effect  */
.loader {
  height: 30px;
  display: inline-block;
}

.loader > div {
  width: 10px;
  height: 10px;
  border-radius: 100%;
  box-shadow: 0 0 10px orange;
  background: #FFECBA;
  float: left;
  margin: 5px;
  transform: scale(2);
}

.loader > div:nth-child(1) {
  animation: anm-BL-53-move1 1s infinite linear;
}

.loader > div:nth-child(2) {
  animation: anm-BL-53-move2 1s infinite linear;
  animation-delay: 0.2s;
}

.loader > div:nth-child(3) {
  animation: anm-BL-53-move3 1s infinite linear;
  animation-delay: 0.3s;
}

.loader > div:nth-child(4) {
  animation: anm-BL-53-move4 1s infinite linear;
  animation-delay: 0.4s;
}

.loader > div:nth-child(5) {
  animation: anm-BL-53-move5 1s infinite linear;
  animation-delay: 0.5s;
}

@keyframes anm-BL-53-move1 {
  50% {
    background: #FFBB00;
    transform: scale(1);
  }
}

@keyframes anm-BL-53-move2 {
  50% {
    background: #FFBB00;
    transform: scale(1);
  }
}

@keyframes anm-BL-53-move3 {
  50% {
    background: #FFBB00;
    transform: scale(1);
  }
}

@keyframes anm-BL-53-move4 {
  50% {
    background: #FFBB00;
    transform: scale(1);
  }
}

@keyframes anm-BL-53-move5 {
  50% {
    background: #FFBB00;
    transform: scale(1);
  }
}
</style>
