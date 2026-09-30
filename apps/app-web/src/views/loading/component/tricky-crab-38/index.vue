<!--
  组件名称：tricky-crab-38（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/fateself_tricky-crab-38.html
  作者：fateself（来源 https://uiverse.io）

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
        <span style="--i:1"></span>
        <span style="--i:2"></span>
        <span style="--i:3"></span>
        <span style="--i:4"></span>
        <span style="--i:5"></span>
        <span style="--i:6"></span>
        <span style="--i:7"></span>
        <span style="--i:8"></span>
        <span style="--i:9"></span>
        <span style="--i:10"></span>
        <span style="--i:11"></span>
        <span style="--i:12"></span>
        <span style="--i:13"></span>
        <span style="--i:14"></span>
        <span style="--i:15"></span>
        <span style="--i:16"></span>
        <span style="--i:17"></span>
        <span style="--i:18"></span>
        <span style="--i:19"></span>
        <span style="--i:20"></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* From Uiverse.io by fateself - Tags: loader */
.loader {
  position: relative;
  width: 100%;
  max-width: 120px;
  aspect-ratio: 1 / 1;
}

.loader span {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(calc(18deg * var(--i)));
}

.loader span::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #00ff0a;
  box-shadow: 0 0 10px #00ff0a, 0 0 20px #00ff0a, 0 0 40px #00ff0a,
    0 0 60px #00ff0a, 0 0 80px #00ff0a, 0 0 100px #00ff0a;
  animation: animate34 2s linear infinite;
  animation-delay: calc(0.1s * var(--i));
}

@keyframes animate34 {
  0% {
    transform: scale(1);
  }

  80%,
  100% {
    transform: scale(0);
  }
}
</style>
