<!--
  组件名称：unlucky-stingray-83（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/G4b413l_unlucky-stingray-83.html
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
    <div class="dot-wave">
        <div class="dot-wave__dot"></div>
        <div class="dot-wave__dot"></div>
        <div class="dot-wave__dot"></div>
        <div class="dot-wave__dot"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by G4b413l - Tags: loader */
.dot-wave {
  --uib-size: 50px;
  --uib-speed: 0.6s;
  --uib-color: #0d0909;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  width: var(--uib-size);
  height: calc(var(--uib-size) * 0.17);
  padding-top: calc(var(--uib-size) * 0.34);
}

.dot-wave__dot {
  flex-shrink: 0;
  width: calc(var(--uib-size) * 0.17);
  height: calc(var(--uib-size) * 0.17);
  border-radius: 50%;
  background-color: var(--uib-color);
  will-change: transform;
}

.dot-wave__dot:nth-child(1) {
  animation: jump824 var(--uib-speed) ease-in-out
    calc(var(--uib-speed) * -0.45) infinite;
}

.dot-wave__dot:nth-child(2) {
  animation: jump824 var(--uib-speed) ease-in-out
    calc(var(--uib-speed) * -0.3) infinite;
}

.dot-wave__dot:nth-child(3) {
  animation: jump824 var(--uib-speed) ease-in-out
    calc(var(--uib-speed) * -0.15) infinite;
}

.dot-wave__dot:nth-child(4) {
  animation: jump824 var(--uib-speed) ease-in-out infinite;
}

@keyframes jump824 {
  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-200%);
  }
}
</style>
