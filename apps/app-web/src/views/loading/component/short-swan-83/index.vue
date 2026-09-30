<!--
  组件名称：short-swan-83（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Yaya12085_short-swan-83.html
  作者：Yaya12085（来源 https://uiverse.io）

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
    <div class="loader"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Yaya12085 - Tags: loading, progress bar, loader, colorful */
.loader {
  box-sizing: border-box;
  position: relative;
  display: block;
  width: 60px;
  height: 22px;
  border: 2px solid;
  border-radius: 3px;
  margin-left: -3px
}

.loader::after,
.loader::before {
  content: "";
  display: block;
  box-sizing: border-box;
  position: absolute;
  height: 12px;
  background: currentColor;
  top: 3px
}

.loader::before {
  right: -4px;
  border-radius: 3px;
  width: 4px
}

.loader::after {
  width: 1px;
  left: 3px;
  animation: full 2s ease-in-out infinite;
}

@keyframes full {
  20% {
    background-color: red
  }

  45% {
    background-color: yellow;
  }

  to {
    width: 50px;
    background-color: greenyellow;
  }
}
</style>
