<!--
  组件名称：slippery-catfish-7（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Flowelife_slippery-catfish-7.html
  作者：Flowelife（来源 https://uiverse.io）

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
    <div class="loader">Loading...</div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Flowelife - Tags: loader, connect, loop */
@keyframes load-loop {
  0% {
    background-position: 100%;
  }

  40% {
    background-position: 50%;
  }

  50% {
    background-position: 50%;
  }

  90% {
    background-position: 0%;
  }

  100% {
    background-position: 0%;
  }
}

.loader {
  position: relative;
  font-family: sans-serif;
  display: flex;
  height: auto;
  width: auto;
  letter-spacing: 3px;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  font-size: 1.45em;
  color: transparent;
  background: linear-gradient(to right,#fff 33.3%,#008cdd 33.3%, #008cdd 66.6%, #fff 66.6%) no-repeat;
  background-size: 300%;
  background-position: 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: infinite 1.4s load-loop ease;
}

.loader::after {
  content: '';
  width: 100%;
  height: 100%;
  position: absolute;
  display: block;
  background: linear-gradient(to right,#008cdd 33.3%, transparent 33.3% , transparent 66.6%, #008cdd 66.6%) no-repeat;
  background-size: 300%;
  background-position: 100%;
  top: 0;
  left: 0;
  z-index: -1;
  animation: infinite 1.4s load-loop ease;
}
</style>
