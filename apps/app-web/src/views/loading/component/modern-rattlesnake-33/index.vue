<!--
  组件名称：modern-rattlesnake-33（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/KhaledMatalkah_modern-rattlesnake-33.html
  作者：KhaledMatalkah（来源 https://uiverse.io）

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

/* From Uiverse.io by KhaledMatalkah - Tags: animation, loader, circle loader, line loader */
.loader {
  width: 100px;
  height: 100px;
  border: 8px solid #ffcc00;
  border-radius: 50%;
  border-top-color: transparent;
  position: relative;
  animation: loaderAnimation 1.5s linear infinite;
}

.loader::before,
.loader::after {
  content: '';
  position: absolute;
  height: 20px;
  width: 20px;
  left: 50%;
  top: 50%;
  background-color: #ffcc00;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.loader::before {
  animation: loaderAnimationBefore 1s linear infinite;
}

.loader::after {
  animation: loaderAnimationAfter 1s linear infinite;
}

@keyframes loaderAnimation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes loaderAnimationBefore {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  50% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }

  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes loaderAnimationAfter {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }

  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
}
</style>
