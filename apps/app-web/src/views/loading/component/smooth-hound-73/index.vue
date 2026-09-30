<!--
  组件名称：smooth-hound-73（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/coding-masala_smooth-hound-73.html
  作者：coding-masala（来源 https://uiverse.io）

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
      <div class="box"></div>
      <div class="box"></div>
      <div class="box"></div>
      <div class="box"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by coding-masala - Tags: loader */
.loader {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
}

.box {
  width: 20px;
  height: 20px;
  margin: 0 8px;
  border-radius: 50%;
  animation: jump_4123 1s ease-in-out infinite;
}

.box:nth-child(1) {
  background-color: #4e4e4e;
  animation-delay: 0.2s;
}

.box:nth-child(2) {
  background-color: #bdbdbd;
  animation-delay: 0.4s;
}

.box:nth-child(3) {
  background-color: #4e4e4e;
  animation-delay: 0.6s;
}

.box:nth-child(4) {
  background-color: #bdbdbd;
  animation-delay: 0.8s;
}

@keyframes jump_4123 {
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-30px);
  }
}
</style>
