<!--
  组件名称：bad-wasp-77（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Ali-Tahmazi99_bad-wasp-77.html
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
    <div class="loading">
        <div class="d1"></div>
        <div class="d2"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Ali-Tahmazi99 - Tags: loader */
.loading {
  width: 60px;
  height: 60px;
  position: relative;
}

.d1 , .d2 {
  border: 5px solid #6c757d;
  border-radius: 50px;
}

.loading .d1 {
  width: 55px;
  height: 55px;
  position: absolute;
  inset: 0;
  margin: auto;
  border-left-color: transparent;
  animation: load161 1s linear infinite;
}

.loading .d2 {
  width: 40px;
  height: 40px;
  position: absolute;
  inset: 0;
  margin: auto;
  border-top-color: transparent;
  border-right-color: transparent;
  animation: load2812 1.5s linear infinite;
}

@keyframes load161 {
  0% {
    transform: rotate(0);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes load2812 {
  0% {
    transform: rotate(0);
  }

  100% {
    transform: rotate(-360deg);
  }
}
</style>
