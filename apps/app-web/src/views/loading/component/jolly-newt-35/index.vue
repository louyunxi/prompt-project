<!--
  组件名称：jolly-newt-35（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/NlghtM4re_jolly-newt-35.html
  作者：NlghtM4re（来源 https://uiverse.io）

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
    <div class="container">
      <div class="tree">
        <div class="branch" style="--x:0">
          <span style="--i:0;"></span>
          <span style="--i:1;"></span>
          <span style="--i:2;"></span>
          <span style="--i:3;"></span>
        </div>
        <div class="branch" style="--x:1">
          <span style="--i:0;"></span>
          <span style="--i:1;"></span>
          <span style="--i:2;"></span>
          <span style="--i:3;"></span>
        </div>
        <div class="branch" style="--x:2">
          <span style="--i:0;"></span>
          <span style="--i:1;"></span>
          <span style="--i:2;"></span>
          <span style="--i:3;"></span>
        </div>
        <div class="branch" style="--x:3">
          <span style="--i:0;"></span>
          <span style="--i:1;"></span>
          <span style="--i:2;"></span>
          <span style="--i:3;"></span>
        </div>
        <div class="stem">
          <span style="--i:0;"></span>
          <span style="--i:1;"></span>
          <span style="--i:2;"></span>
          <span style="--i:3;"></span>
        </div>
        <span class="shadow"></span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by NlghtM4re - Tags: 3d, green, loader, smooth, tree */
.container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tree {
  position: relative;
  width: 50px;
  height: 50px;
  transform-style: preserve-3d;
  transform: rotateX(-20deg) rotateY(30deg);
  animation: treeAnimate 5s linear infinite;
}

@keyframes treeAnimate {
  0% {
    transform: rotateX(-20deg) rotateY(360deg);
  }

  100% {
    transform: rotateX(-20deg) rotateY(0deg);
  }
}

.tree div {
  position: absolute;
  top: -50px;
  left: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform: translateY(calc(25px * var(--x))) translateZ(0px);
}

.tree div.branch span {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #69c069, #77dd77);
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  border-bottom: 5px solid #00000019;
  transform-origin: bottom;
  transform: rotateY(calc(90deg * var(--i))) rotateX(30deg) translateZ(28.5px);
}

.tree div.stem span {
  position: absolute;
  top: 110px;
 /* updated top value */
  left: calc(50% - 7.5px);
  width: 15px;
  height: 50%;
  background: linear-gradient(90deg, #bb4622, #df7214);
  border-bottom: 5px solid #00000019;
  transform-origin: bottom;
  transform: rotateY(calc(90deg * var(--i))) translateZ(7.5px);
}

.shadow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  filter: blur(20px);
  transform-style: preserve-3d;
  transform: rotateX(90deg) translateZ(-65px);
}
</style>
