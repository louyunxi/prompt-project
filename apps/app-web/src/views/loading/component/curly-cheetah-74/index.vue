<!--
  组件名称：curly-cheetah-74（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/AqFox_curly-cheetah-74.html
  作者：AqFox（来源 https://uiverse.io）

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
}

/* From Uiverse.io by AqFox - Tags: loader */
.spinner {
 width: 56px;
 height: 56px;
 border-radius: 50%;
 padding: 7px;
 background: conic-gradient(from 135deg at top,#004dff 90deg, #0000 0) 0 calc(50% - 4px)/19px 9.5px,
          radial-gradient(farthest-side at bottom left,#0000 calc(100% - 7px),#004dff calc(100% - 6px) 99%,#0000) top right/50%  50% content-box content-box,
          radial-gradient(farthest-side at top,#0000 calc(100% - 7px),#004dff calc(100% - 6px) 99%,#0000) bottom   /100% 50% content-box content-box;
 background-repeat: no-repeat;
 animation: spinner-v8og74 1s infinite linear;
}

@keyframes spinner-v8og74 {
 100% {
  transform: rotate(1turn);
 }
}
</style>
