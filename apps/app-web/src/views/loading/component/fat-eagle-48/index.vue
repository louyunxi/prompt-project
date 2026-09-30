<!--
  组件名称：fat-eagle-48（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/csozidev_fat-eagle-48.html
  作者：csozidev（来源 https://uiverse.io）

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
      <p class="text">
      <span class="letter letter1">L</span>
      <span class="letter letter2">o</span>
      <span class="letter letter3">a</span>
      <span class="letter letter4">d</span>
      <span class="letter letter5">i</span>
      <span class="letter letter6">n</span>
      <span class="letter letter7">g</span>
      <span class="letter letter8">.</span>
      <span class="letter letter9">.</span>
      <span class="letter letter10">.</span>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by csozidev - Tags: loading, loader, smooth, text animation, animated, wave, text, infinite */
/* Wave text loader made by: csozi | Website: english.csozi.hu*/

.text {
  color: black;
  font-weight: bolder;
}

@keyframes letter {
  0% {
    font-size: 30px;
  }

  50% {
    font-size: 40px;
  }

  100% {
    font-size: 30px;
  }
}

.letter {
  animation: letter 1s infinite;
}

.letter1 {
  animation-delay: 0s;
}

.letter2 {
  animation-delay: -0.9s;
}

.letter3 {
  animation-delay: -0.8s;
}

.letter4 {
  animation-delay: -0.7s;
}

.letter5 {
  animation-delay: -0.6s;
}

.letter6 {
  animation-delay: -0.5s;
}

.letter7 {
  animation-delay: -0.4s;
}

.letter8 {
  animation-delay: -0.3s;
}

.letter9 {
  animation-delay: -0.2s;
}

.letter10 {
  animation-delay: -0.1s;
}
</style>
