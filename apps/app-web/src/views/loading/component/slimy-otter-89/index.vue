<!--
  组件名称：slimy-otter-89（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/G4b413l_slimy-otter-89.html
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
    <div class="ping"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by G4b413l - Tags: loader */
.ping {
 --uib-size: 50px;
 --uib-speed: 1s;
 --uib-color: #3950cf;
 position: relative;
 height: var(--uib-size);
 width: var(--uib-size);
}

.ping::before,
.ping::after {
 content: '';
 position: absolute;
 top: 0;
 left: 0;
 height: 100%;
 width: 100%;
 border-radius: 50%;
 background-color: var(--uib-color);
 animation: pulse7132 var(--uib-speed) linear infinite;
 transform: scale(0);
 opacity: 0;
}

.ping::after {
 animation-delay: calc(var(--uib-speed) / -2);
}

@keyframes pulse7132 {
 0% {
  transform: scale(0);
  opacity: 1;
 }

 100% {
  transform: scale(1);
  opacity: 0;
 }
}
</style>
