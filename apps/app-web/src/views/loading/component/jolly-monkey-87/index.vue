<!--
  组件名称：jolly-monkey-87（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/EddyBel_jolly-monkey-87.html
  作者：EddyBel（来源 https://uiverse.io）

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
      <div class="loader__circle"></div>
      <div class="loader__circle"></div>
      <div class="loader__circle"></div>
      <div class="loader__circle"></div>
      <div class="loader__circle"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by EddyBel - Tags: loader */
.loader {
  position: relative;
  display: flex;
  gap: 0.3em;
}

.loader::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 2em;
  filter: blur(45px);
  background-color: #e299ff;
  background-image: radial-gradient(at 52% 57%, hsla(11,83%,72%,1) 0px, transparent 50%),
  radial-gradient(at 37% 57%, hsla(175,78%,66%,1) 0px, transparent 50%);
}

.loader__circle {
  --size__loader: 0.6em;
  width: var(--size__loader);
  height: var(--size__loader);
  border-radius: 50%;
  animation: loader__circle__jumping 2s infinite;
  background-color: #b499ff;
}

.loader__circle:nth-child(2n) {
  animation-delay: 300ms;
  background-color: #e499ff;
}

.loader__circle:nth-child(3n) {
  animation-delay: 600ms;
}

@keyframes loader__circle__jumping {
  0%, 100% {
    transform: translateY(0px);
  }

  25% {
    transform: translateY(-15px) scale(0.5);
  }

  50% {
    transform: translateY(0px);
  }

  75% {
    transform: translateY(5px) scale(0.9);
  }
}
</style>
