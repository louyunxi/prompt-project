<!--
  组件名称：nervous-firefox-94（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Ali-Tahmazi99_nervous-firefox-94.html
  作者：Ali-Tahmazi99（来源 https://uiverse.io）

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
    <div class="load-row">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Ali-Tahmazi99 - Tags: loader */
.load-row {
  width: 100px;
  height: 50px;
  line-height: 50px;
  text-align: center;
}

.load-row span {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: #f76002;
  border-radius: 50px;
  animation: up-down6 0.5s ease-in infinite alternate;
}

.load-row span:nth-child(2) {
  background: #e85b04c4;
  animation-delay: 0.16s;
}

.load-row span:nth-child(3) {
  background: #e85b0491;
  animation-delay: 0.32s;
}

.load-row span:nth-child(4) {
  background: #e85b0456;
  animation-delay: 0.48s;
}

@keyframes up-down6 {
  0% {
    transform: translateY(-10px);
  }

  100% {
    transform: translateY(10px);
  }
}
</style>
