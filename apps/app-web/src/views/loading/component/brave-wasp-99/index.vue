<!--
  组件名称：brave-wasp-99（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/G4b413l_brave-wasp-99.html
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
    <div class="line-wobble"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by G4b413l - Tags: loader */
.line-wobble {
 --uib-size: 80px;
 --uib-speed: 1.55s;
 --uib-color: black;
 --uib-line-weight: 5px;
 position: relative;
 display: flex;
 align-items: center;
 justify-content: center;
 height: var(--uib-line-weight);
 width: var(--uib-size);
 border-radius: calc(var(--uib-line-weight) / 2);
 overflow: hidden;
 transform: translate3d(0, 0, 0);
}

.line-wobble::before {
 content: '';
 position: absolute;
 top: 0;
 left: 0;
 height: 100%;
 width: 100%;
 background-color: var(--uib-color);
 opacity: 0.1;
}

.line-wobble::after {
 content: '';
 height: 100%;
 width: 100%;
 border-radius: calc(var(--uib-line-weight) / 2);
 animation: wobble var(--uib-speed) ease-in-out infinite;
 transform: translateX(-90%);
 background-color: var(--uib-color);
}

@keyframes wobble {
 0%,
  100% {
  transform: translateX(-90%);
 }

 50% {
  transform: translateX(90%);
 }
}
</style>
