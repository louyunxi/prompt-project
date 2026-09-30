<!--
  组件名称：nervous-otter-12（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/K2-dev21_nervous-otter-12.html
  作者：K2-dev21（来源 https://uiverse.io）

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
    <div class="spinner">
        <div class="Spinner"></div>
        </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by K2-dev21 - Tags: loader */
.spinner {
  background-image: linear-gradient(#acb6e5 35%, #86fde8);
  width: 100px;
  height: 100px;
  animation: spinning21 1.7s linear infinite;
  text-align: center;
  border-radius: 50px;
  filter: blur(1px);
  box-shadow: 0px -5px 20px 0px rgb(186, 66, 255),
        0px 5px 20px 0px rgb(0, 225, 255);
}

.Spinner {
  background-color: rgb(36, 36, 36);
  width: 100px;
  height: 100px;
  border-radius: 50px;
  filter: blur(10px);
}

@keyframes spinning21 {
  to {
    transform: rotate(360deg);
  }
}
</style>
