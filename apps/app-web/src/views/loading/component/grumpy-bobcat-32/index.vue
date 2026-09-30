<!--
  组件名称：grumpy-bobcat-32（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/omar-alghaish_grumpy-bobcat-32.html
  作者：omar-alghaish（来源 https://uiverse.io）

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
    <div class="loader-1">
      <div class="loader-2"></div>
      <div class="loader-3"></div>
      <div class="loader-4"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by omar-alghaish - Tags: loader */
.loader-1 {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 5px solid rgb(218, 203, 4);
  border-left-color: transparent;
  animation: animate_681 3s linear infinite;
  position: relative;
}

.loader-2 {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 5px solid rgb(0, 119, 255);
  border-top-color: transparent;
  animation: animate_6810 .9s linear infinite;
  position: absolute;
  margin: 5px;
}

.loader-3 {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 5px solid rgb(30, 255, 0);
  border-right-color: transparent;
  animation: animate_681 2s linear  infinite;
  position: absolute;
  margin: 15px;
}

.loader-4 {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 5px solid rgb(194, 3, 92);
  border-bottom-color: transparent;
  animation: animate_6810 .7s linear  infinite;
  position: absolute;
  margin: 25px;
}

@keyframes animate_6810 {
  0% {
    transform: rotate(360deg);
  }
}

@keyframes animate_681 {
  0% {
    transform: rotate(-360deg);
  }
}
</style>
