<!--
  组件名称：swift-donkey-38（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Satwinder04_swift-donkey-38.html
  作者：Satwinder04（来源 https://uiverse.io）

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
    <div class="loader3">
      <div class="bars bar1"></div>
      <div class="bars bar2"></div>
      <div class="bars bar3"></div>
      <div class="bars bar4"></div>
      <div class="bars bar5"></div>
      <div class="bars bar6"></div>
      <div class="bars bar7"></div>
      <div class="bars bar8"></div>
      <div class="bars bar9"></div>
      <div class="bars bar10"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Satwinder04 - Tags: loader */
.loader3 {
  display: flex;
  justify-content: center;
  align-items: center;
}

.bars {
  width: 10px;
  height: 20px;
  margin: 0 2px;
  border-radius: 4px;
  animation: loader3 3s ease-in-out infinite;
}

.bar1 {
  background-color: #4285F4;
  animation-delay: -0.8s;
}

.bar2 {
  background-color: #4285F4;
  animation-delay: -0.7s;
}

.bar3 {
  background-color: #4285F4;
  animation-delay: -0.6s;
}

.bar4 {
  background-color: #4285F4;
  animation-delay: -0.5s;
}

.bar5 {
  background-color: #4285F4;
  animation-delay: -0.4s;
}

.bar6 {
  background-color: #4285F4;
  animation-delay: -0.3s;
}

.bar7 {
  background-color: #4285F4;
  animation-delay: -0.2s;
}

.bar8 {
  background-color: #4285F4;
  animation-delay: -0.1s;
}

.bar9 {
  background-color: #4285F4;
  animation-delay: 0s;
}

.bar10 {
  background-color: #4285F4;
  animation-delay: 0.1s;
}

@keyframes loader3 {
  0% {
    transform: scale(1);
  }

  20% {
    transform: scale(1, 2.32);
  }

  40% {
    transform: scale(1);
  }
}
</style>
