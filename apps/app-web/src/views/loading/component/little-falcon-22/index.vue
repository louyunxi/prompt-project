<!--
  组件名称：little-falcon-22（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/JkHuger_little-falcon-22.html
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
    <div class="item">
        <div class="loader-pulse"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by JkHuger - Tags: loader */
.loader-pulse {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #8f44fd;
  animation: load-pulse 0.85s infinite linear;
}

@keyframes load-pulse {
  0% {
    transform: scale(0.15);
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 0;
  }
}
</style>
