<!--
  组件名称：bad-firefox-25（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Fadhilmagass_bad-firefox-25.html
  作者：Fadhilmagass（来源 https://uiverse.io）

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
      <div class="dot dot-1"></div>
      <div class="dot dot-2"></div>
      <div class="dot dot-3"></div>
      <div class="dot dot-4"></div>
      <div class="dot dot-5"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Fadhilmagass - Tags: simple, animation, loader */
.loader {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  height: 100%;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 6px;
  border-radius: 50%;
  -webkit-animation: dot-pulse2 1.5s ease-in-out infinite;
  animation: dot-pulse2 1.5s ease-in-out infinite;
}

.dot-1 {
  background-color: #4285f4;
  -webkit-animation-delay: 0s;
  animation-delay: 0s;
}

.dot-2 {
  background-color: #34a853;
  -webkit-animation-delay: 0.3s;
  animation-delay: 0.3s;
}

.dot-3 {
  background-color: #fbbc05;
  -webkit-animation-delay: 0.6s;
  animation-delay: 0.6s;
}

.dot-4 {
  background-color: #ea4335;
  -webkit-animation-delay: 0.9s;
  animation-delay: 0.9s;
}

.dot-5 {
  background-color: #4285f4;
  -webkit-animation-delay: 1.2s;
  animation-delay: 1.2s;
}

@keyframes dot-pulse2 {
  0% {
    -webkit-transform: scale(0.5);
    transform: scale(0.5);
    opacity: 0.5;
  }

  50% {
    -webkit-transform: scale(1);
    transform: scale(1);
    opacity: 1;
  }

  100% {
    -webkit-transform: scale(0.5);
    transform: scale(0.5);
    opacity: 0.5;
  }
}
</style>
