<!--
  组件名称：lucky-cobra-80（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Ankesh2002_lucky-cobra-80.html
  作者：Ankesh2002（来源 https://uiverse.io）

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

/* From Uiverse.io by Ankesh2002 - Tags: loader */
.loader {
  position: relative;
  width: 164px;
  height: 164px;
}

.loader::before , .loader::after {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  background-color: #00bd26;
  left: 50%;
  top: 50%;
  animation: rotate 1s ease-in infinite;
}

.loader::after {
  width: 20px;
  height: 20px;
  background-color: #00bd26;
  animation: rotate 1s ease-in infinite, moveY 1s ease-in infinite;
}

@keyframes moveY {
  0% , 100% {
    top: 10%
  }

  45% , 55% {
    top: 59%
  }

  60% {
    top: 40%
  }
}

@keyframes rotate {
  0% {
    transform: translate(-50%, -100%) rotate(0deg) scale(1 , 1)
  }

  25% {
    transform: translate(-50%, 0%) rotate(180deg) scale(1 , 1)
  }

  45% , 55% {
    transform: translate(-50%, 100%) rotate(180deg) scale(3 , 0.5)
  }

  60% {
    transform: translate(-50%, 100%) rotate(180deg) scale(1, 1)
  }

  75% {
    transform: translate(-50%, 0%) rotate(270deg) scale(1 , 1)
  }

  100% {
    transform: translate(-50%, -100%) rotate(360deg) scale(1 , 1)
  }
}
</style>
