<!--
  组件名称：loud-bullfrog-54（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Yaya12085_loud-bullfrog-54.html
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

/* From Uiverse.io by Yaya12085 - Tags: loading, loader, colorful */
.loader ,.loader::before,.loader::after {
  border-width: 2px;
  border-style: solid;
  border-radius: 10px;
  animation: rotate 5s linear infinite;
}

.loader {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 40px;
  height: 40px;
  border-color: #5a4ff3;
}

.loader::before,.loader::after {
  position: absolute;
  content: "";
}

.loader::before {
  border-color: #35a2d2;
  width: 110%;
  height: 110%;
  animation-delay: .5s
}

.loader::after {
  border-color: #9c40fc;
  width: 120%;
  height: 120%;
  animation-delay: .10s;
}

@keyframes rotate {
  to {
    transform: rotate(360deg)
  }
}
</style>
