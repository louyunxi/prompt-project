<!--
  组件名称：tidy-skunk-55（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/JkHuger_tidy-skunk-55.html
  作者：JkHuger（来源 https://uiverse.io）

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
    <main id="container">
            
            <div class="dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
            <div class="dots2">
                <div class="dot2"></div>
                <div class="dot2"></div>
                <div class="dot2"></div>
                <div class="dot2"></div>
                <div class="dot2"></div>
                <div class="dot2"></div>
                <div class="dot2"></div>
                <div class="dot2"></div>
                <div class="dot2"></div>
                <div class="dot2"></div>
            </div>
            <div class="circle"></div>
        </main>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by JkHuger - Tags: loader, pacman */
.circle {
  position: relative;
  left: -100px;
  width: 0;
  height: 0;
  border: 50px solid #FDD835;
  border-radius: 50%;
  border-right-color: transparent;
  animation: move 5s linear 0s infinite normal forwards;
}

.circle:before {
  content: "";
  position: absolute;
  top: -50px;
  left: -50px;
  width: 0;
  height: 0;
  border: 50px solid #FDD835;
  border-radius: 50%;
  border-right-color: transparent;
  animation: chomp1 .25s ease-in-out 0s infinite normal forwards;
}

.circle:after {
  content: "";
  position: absolute;
  top: -50px;
  left: -50px;
  width: 0;
  height: 0;
  border: 50px solid #FDD835;
  border-radius: 50%;
  border-right-color: transparent;
  animation: chomp2 .25s ease-in-out 0s infinite normal forwards;
}

.loader {
  position: relative;
  top: 50px;
  width: 300px;
  height: 0px;
  border-top: 10px dotted black;
  animation: loader_4013 5s ease-in-out 0s infinite normal forwards;
}

.dots {
  position: relative;
  top: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dot {
  position: relative;
  width: 10px;
  height: 10px;
  margin: 0 10px;
  border-radius: 50%;
  background: #1E88E5;
  animation: dot1 5s linear 0s infinite none normal;
}

.dot:nth-child(1) {
  animation-delay: 0s
}

.dot:nth-child(2) {
  animation-delay: 0.25s
}

.dot:nth-child(3) {
  animation-delay: 0.5s
}

.dot:nth-child(4) {
  animation-delay: 0.75s
}

.dot:nth-child(5) {
  animation-delay: 1s
}

.dot:nth-child(6) {
  animation-delay: 1.25s
}

.dot:nth-child(7) {
  animation-delay: 1.5s
}

.dot:nth-child(8) {
  animation-delay: 1.75s
}

.dot:nth-child(9) {
  animation-delay: 1.9s
}

.dot:nth-child(10) {
  animation-delay: 2.1s
}

.dots2 {
  position: relative;
  top: 50px;
  left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dot2 {
  position: relative;
  left: -10px;
  width: 10px;
  height: 10px;
  margin: 0 10px;
  border-radius: 50%;
  background: #F44336;
  opacity: 0;
  animation: dot2 5s linear 0s infinite none normal;
}

.dot2:nth-child(10) {
  animation-delay: 2.5s
}

.dot2:nth-child(9) {
  animation-delay: 2.75s
}

.dot2:nth-child(8) {
  animation-delay: 3.0s
}

.dot2:nth-child(7) {
  animation-delay: 3.25s
}

.dot2:nth-child(6) {
  animation-delay: 3.5s
}

.dot2:nth-child(5) {
  animation-delay: 3.75s
}

.dot2:nth-child(4) {
  animation-delay: 4.0s
}

.dot2:nth-child(3) {
  animation-delay: 4.25s
}

.dot2:nth-child(2) {
  animation-delay: 4.5s
}

.dot2:nth-child(1) {
  animation-delay: 4.6s
}
/* #F44336;, #1E88E5, #FDD835; */
@keyframes chomp1 {
  0% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(45deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

@keyframes chomp2 {
  0% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(-45deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

@keyframes move {
  0%, 100% {
    left: -100px;
  }

  0%, 48% {
    transform: rotateY(0deg);
  }

  50%, 100% {
    transform: rotateY(180deg);
  }

  50% {
    left: 100%;
  }
}

@keyframes loader_4013 {
  0%, 100% {
    border-top: 10px dotted #1E88E5;
  }

  0%, 48% {
    border-top: 10px dotted #1E88E5;
  }

  50%, 100% {
    border-top: 10px dotted #F44336;
  }

  50% {
    border-top: 10px dotted #F44336;
  }
}

@keyframes dot1 {
  0%,4% {
    background: #1E88E5;
    opacity: 1;
  }

  5%,94% {
    background: #F44336;
    opacity: 0;
  }

  95%,100% {
    background: #1E88E5;
    opacity: 1;
  }
}

@keyframes dot2 {
  0%,4% {
    background: #F44336;
    opacity: 1;
  }

  5%,94% {
    opacity: 0;
  }

  95%,100% {
    background: #F44336;
    opacity: 1;
  }
}
</style>
