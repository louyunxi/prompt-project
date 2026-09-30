<!--
  组件名称：strong-rat-28（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/JkHuger_strong-rat-28.html
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
    <div class="spinner"></div>
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

/* From Uiverse.io by JkHuger - Tags: loader */
.spinner {
  box-shadow: 0 0 0 7px #42a5f5, inset 0 0 0 1px #42a5f5;
  position: relative;
  width: 100%;
  max-width: 230px;
  aspect-ratio: 230 / 50;
  border-radius: 8px;
  overflow: hidden;
  animation: rotate_5132 6s linear infinite;
}

.spinner:before {
  display: block;
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: #42a5f5;
  animation: load_5123 6s linear infinite;
}

@keyframes rotate_5132 {
  0%,
  42% {
    transform: rotate(0deg);
  }

  48%,
  92% {
    transform: rotate(180deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes load_5123 {
  0% {
    width: 0;
  }

  40%,
  50% {
    width: 100%;
  }

  90%,
  100% {
    width: 0;
  }
}
</style>
