<!--
  组件名称：shaggy-tiger-17（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Shoh2008_shaggy-tiger-17.html
  作者：Shoh2008（来源 https://uiverse.io）

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
    <div class="loader"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Shoh2008 - Tags: loader */
.loader {
  margin: auto;
  width: 100px;
  height: 30px;
  overflow: hidden;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  box-shadow: 0px 35px 0 -5px #aaa, 0 -5px 0 0px #ddd, 0 -25px 0 -5px #fff,
    -25px -30px 0 0px #ddd, -25px 30px 0 0px #ddd, 25px -30px 0 0px #ddd,
    25px 30px 0 0px #ddd, 20px 10px 0 5px #ddd, 20px -10px 0 5px #ddd,
    -20px -10px 0 5px #ddd, -20px 10px 0 5px #ddd;
}

.loader:after,
.loader:before {
  content: "";
  border-radius: 100%;
  width: 35px;
  height: 35px;
  display: block;
  position: absolute;
  border: 4px dashed #fff;
  bottom: -4px;
  transform: rotate(0deg);
  box-sizing: border-box;
  animation: tape 4s linear infinite;
}

.loader:before {
  right: 0;
  box-shadow: 0 0 0 4px #fff, 0 0 0 34px #000;
}

.loader:after {
  left: 0;
  box-shadow: 0 0 0 4px #fff, 0 0 0 65px #000;
}

@keyframes tape {
  0% {
    transform: rotate(0deg) scale(0.4);
  }

  100% {
    transform: rotate(-360deg) scale(0.4);
  }
}
</style>
