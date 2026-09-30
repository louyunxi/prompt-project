<!--
  组件名称：purple-dragon-56（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/lesimpleliott_purple-dragon-56.html
  作者：lesimpleliott（来源 https://uiverse.io）

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
      <div class="loader__balls">
        <div class="loader__balls__group">
          <div class="ball item1"></div>
          <div class="ball item1"></div>
          <div class="ball item1"></div>
        </div>
        <div class="loader__balls__group">
          <div class="ball item2"></div>
          <div class="ball item2"></div>
          <div class="ball item2"></div>
        </div>
        <div class="loader__balls__group">
          <div class="ball item3"></div>
          <div class="ball item3"></div>
          <div class="ball item3"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by lesimpleliott  - Tags: loader, ball, funny, jump */
.loader__balls {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 15px;
}
.loader__balls__group {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  height: 100px;
  width: 40px;
}
.ball {
  height: 30px;
  width: 30px;
  border-radius: 15px;
  position: absolute;
  transform-origin: bottom;
}

/* ANIMATION BALL 1*/
.loader__balls__group :nth-child(1) {
  background-color: #99e2d0;
  animation-name: jumpinBallAnimation1;
  animation-duration: 1000ms;
  animation-iteration-count: infinite;
}
@keyframes jumpinBallAnimation1 {
  0% {
    transform: translateY(0) scale(1, 1);
  }
  10% {
    transform: translateY(0) scale(1.3, 0.8);
  }
  11% {
    transform: translateY(0) scale(0.7, 1.2);
    animation-timing-function: cubic-bezier(0, 0, 0.5, 1);
  }
  39% {
    transform: translateY(-75px) scale(1);
    animation-timing-function: cubic-bezier(0, 0, 0.5, 1);
  }
  40% {
    transform: translateY(-75px) scale(1);
  }
  41% {
    transform: translateY(-75px) scale(1);
    animation-timing-function: cubic-bezier(1, 0, 1, 0);
  }
  69% {
    transform: translateY(0px) scale(1, 1);
    animation-timing-function: cubic-bezier(1, 0, 1, 0);
  }
  70% {
    transform: translateY(0) scale(1.5, 0.4);
  }
  80% {
    transform: translateY(0) scale(0.8, 1.2);
  }
  90% {
    transform: translateY(0) scale(1.1, 0.8);
  }
  100% {
    transform: translateY(0) scale(1, 1);
  }
}

/* ANIMATION BALL 2*/
.loader__balls__group :nth-child(2) {
  background-color: #ff79da;
  animation-name: jumpinBallAnimation2;
  animation-duration: 1000ms;
  animation-iteration-count: infinite;
}
@keyframes jumpinBallAnimation2 {
  0% {
    transform: translateY(0) scale(1, 1);
  }
  10% {
    transform: translateY(0) scale(1.3, 0.8);
  }
  11% {
    transform: translateY(0) scale(0.7, 1.2);
    animation-timing-function: cubic-bezier(0, 0.5, 0.5, 1);
  }
  39% {
    transform: translateY(-75px) scale(1);
    animation-timing-function: cubic-bezier(0, 0.5, 0.5, 1);
  }
  40% {
    transform: translateY(-75px) scale(1);
  }
  41% {
    transform: translateY(-75px) scale(1);
    animation-timing-function: cubic-bezier(1, 0, 1, 0.5);
  }
  69% {
    transform: translateY(0px) scale(1, 1);
    animation-timing-function: cubic-bezier(1, 0, 1, 0.5);
  }
  70% {
    transform: translateY(0) scale(1.5, 0.4);
  }
  80% {
    transform: translateY(0) scale(0.8, 1.2);
  }
  90% {
    transform: translateY(0) scale(1.1, 0.8);
  }
  100% {
    transform: translateY(0) scale(1, 1);
  }
}

/* ANIMATION BALL 3*/
.loader__balls__group :nth-child(3) {
  background-color: #9356dc;
  animation-name: jumpinBallAnimation3;
  animation-duration: 1000ms;
  animation-iteration-count: infinite;
}
@keyframes jumpinBallAnimation3 {
  0% {
    transform: translateY(0) scale(1, 1);
  }
  10% {
    transform: translateY(0) scale(1.3, 0.8);
  }
  11% {
    transform: translateY(0) scale(0.7, 1.2);
    animation-timing-function: cubic-bezier(0, 1, 0.5, 1);
  }
  39% {
    transform: translateY(-75px) scale(1);
    animation-timing-function: cubic-bezier(0, 1, 0.5, 1);
  }
  40% {
    transform: translateY(-75px) scale(1);
  }
  41% {
    transform: translateY(-75px) scale(1);
    animation-timing-function: cubic-bezier(1, 0, 1, 1);
  }
  69% {
    transform: translateY(0px) scale(1, 1);
    animation-timing-function: cubic-bezier(1, 0, 1, 1);
  }
  70% {
    transform: translateY(0) scale(1.5, 0.4);
  }
  80% {
    transform: translateY(0) scale(0.8, 1.2);
  }
  90% {
    transform: translateY(0) scale(1.1, 0.8);
  }
  100% {
    transform: translateY(0) scale(1, 1);
  }
}
.loader__balls__group .item1 {
  animation-delay: 0ms;
}
.loader__balls__group .item2 {
  animation-delay: 100ms;
}
.loader__balls__group .item3 {
  animation-delay: 200ms;
}
</style>
