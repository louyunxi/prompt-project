<!--
  组件名称：afraid-treefrog-79（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Satwinder04_afraid-treefrog-79.html
  作者：Satwinder04（来源 https://uiverse.io）

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
      <div class="loader-text">Loading...</div>
      <div class="loader-bar"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Satwinder04 - Tags: loader */
.loader {
  /* background-color: blue; */
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.loader-text {
  font-size: 24px;
  color: rgb(0, 0, 0);
  margin-bottom: 20px;
  align-self: center;
}

.loader-bar {
  width: 30%;
  height: 10px;
  border-radius: 5px;
  background-color: rgb(0, 0, 0);
  animation: loader-bar-animation 2s ease-in-out infinite;
}

@keyframes loader-bar-animation {
  0% {
    /* transform: translateX(-100%) rotate(270deg); */
    transform: translateX(-100%);
  }

  50% {
    /* transform: translateX(100%) rotate(-90deg); */
    transform: translateX(100%);
  }

  100% {
    /* transform: translateX(-100%) rotate(270deg); */
    transform: translateX(-100%);
  }
}
</style>
