<!--
  组件名称：gentle-grasshopper-65（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Praashoo7_gentle-grasshopper-65.html
  作者：Praashoo7（来源 https://uiverse.io）

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
      <p class="heading">Loading</p>
      <div class="loading">
        <div class="load"></div>
        <div class="load"></div>
        <div class="load"></div>
        <div class="load"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Praashoo7 - Tags: loader, smooth */
.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.heading {
  color: black;
  letter-spacing: 0.2em;
  margin-bottom: 1em;
}

.loading {
  display: flex;
  width: 5em;
  align-items: center;
  justify-content: center;
}

.load {
  width: 23px;
  height: 3px;
  background-color: limegreen;
  animation: 1s move_5011 infinite;
  border-radius: 5px;
  margin: 0.1em;
}

.load:nth-child(1) {
  animation-delay: 0.2s;
}

.load:nth-child(2) {
  animation-delay: 0.4s;
}

.load:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes move_5011 {
  0% {
    width: 0.2em;
  }

  25% {
    width: 0.7em;
  }

  50% {
    width: 1.5em;
  }

  100% {
    width: 0.2em;
  }
}
</style>
