<!--
  组件名称：average-dodo-53（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/mrhyddenn_average-dodo-53.html
  作者：mrhyddenn（来源 https://uiverse.io）

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
        <div class="circle"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by mrhyddenn - Tags: loader */
.loader {
  background: transparent;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.circle {
  width: 80px;
  height: 80px;
  border: 2px solid #ccc;
  position: absolute;
  border-radius: 50%;
  animation: circle14512 2s linear infinite;
}

.circle::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #9ae932;
  box-shadow: 0 0 20px #9ae932, 0 0 60px #9ae932;
}

@keyframes circle14512 {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
