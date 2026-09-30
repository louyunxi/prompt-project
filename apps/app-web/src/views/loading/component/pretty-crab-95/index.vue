<!--
  组件名称：pretty-crab-95（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/G4b413l_pretty-crab-95.html
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
    <div class="leap-frog">
    <div class="leap-frog__dot"></div>
    <div class="leap-frog__dot"></div>
    <div class="leap-frog__dot"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by G4b413l - Tags: loader */
.leap-frog {
 --uib-size: 40px;
 --uib-speed: 2s;
 --uib-color: rgb(37, 37, 149);
 position: relative;
 display: flex;
 align-items: center;
 justify-content: space-between;
 width: var(--uib-size);
 height: var(--uib-size);
}

.leap-frog__dot {
 position: absolute;
 top: 0;
 left: 0;
 display: flex;
 align-items: center;
 justify-content: flex-start;
 width: 100%;
 height: 100%;
}

.leap-frog__dot::before {
 content: '';
 display: block;
 height: calc(var(--uib-size) * 0.22);
 width: calc(var(--uib-size) * 0.22);
 border-radius: 50%;
 background-color: var(--uib-color);
 will-change: transform;
}

.leap-frog__dot:nth-child(1) {
 animation: leapFrog var(--uib-speed) ease infinite;
}

.leap-frog__dot:nth-child(2) {
 transform: translateX(calc(var(--uib-size) * 0.4));
 animation: leapFrog var(--uib-speed) ease calc(var(--uib-speed) / -1.5)
    infinite;
}

.leap-frog__dot:nth-child(3) {
 transform: translateX(calc(var(--uib-size) * 0.8)) rotate(0deg);
 animation: leapFrog var(--uib-speed) ease calc(var(--uib-speed) / -3)
    infinite;
}

@keyframes leapFrog {
 0% {
  transform: translateX(0) rotate(0deg);
 }

 33.333% {
  transform: translateX(0) rotate(180deg);
 }

 66.666% {
  transform: translateX(calc(var(--uib-size) * -0.4)) rotate(180deg);
 }

 99.999% {
  transform: translateX(calc(var(--uib-size) * -0.8)) rotate(180deg);
 }

 100% {
  transform: translateX(0) rotate(0deg);
 }
}
</style>
