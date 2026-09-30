<!--
  组件名称：light-bobcat-34（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/G4b413l_light-bobcat-34.html
  作者：G4b413l（来源 https://uiverse.io）

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
    <div class="momentum"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by G4b413l - Tags: loader */
.momentum {
 --uib-size: 40px;
 --uib-speed: 1s;
 --uib-color: rgb(221, 255, 242);
 position: relative;
 display: flex;
 align-items: center;
 justify-content: center;
 height: var(--uib-size);
 width: var(--uib-size);
 animation: rotate01561 var(--uib-speed) linear infinite;
}

.momentum::before,
.momentum::after {
 content: '';
 height: 25%;
 width: 25%;
 border-radius: 50%;
 background-color: var(--uib-color);
}

.momentum::before {
 animation: wobble290123 calc(var(--uib-speed) * 1.25) ease-in-out infinite;
}

.momentum::after {
 animation: wobble9123 calc(var(--uib-speed) * 1.25) ease-in-out infinite;
}

.momentum::before {
 margin-right: 10%;
}

@keyframes wobble9123 {
 0%,
  100% {
  transform: translateX(0);
 }

 50% {
  transform: translateX(calc(var(--uib-size) * 0.2)) scale(1.1);
 }
}

@keyframes wobble290123 {
 0%,
  100% {
  transform: translateX(0);
 }

 50% {
  transform: translateX(calc(var(--uib-size) * -0.2)) scale(1.1);
 }
}

@keyframes rotate01561 {
 0% {
  transform: rotate(0deg);
 }

 100% {
  transform: rotate(360deg);
 }
}
</style>
