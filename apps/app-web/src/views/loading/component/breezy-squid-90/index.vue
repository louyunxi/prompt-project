<!--
  组件名称：breezy-squid-90（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Ali-Tahmazi99_breezy-squid-90.html
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
    <div class="loader">
      <span class="hour"></span>
      <span class="min"></span>
      <span class="circel"></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Ali-Tahmazi99 - Tags: loader */
.loader {
 width: 65px;
 height: 65px;
 border: 8px solid #ee9b00a6;
 border-radius: 50px;
 position: relative;
}

.loader span {
 display: block;
 background: #ee9b00;
}

.loader .hour ,
.loader .min {
 width: 6px;
 height: 22px;
 border-radius: 50px;
 position: absolute;
 top: 24.5px;
 left: 21px;
 animation: load9243 1.2s linear infinite;
 transform-origin: top center;
}

.loader .min {
 height: 17px;
 animation: load9243 4s linear infinite;
}

.loader .circel {
 width: 10px;
 height: 10px;
 border-radius: 50px;
 position: absolute;
 top: 19px;
 left: 19px;
}

@keyframes load9243 {
 0% {
  transform: rotate(0deg);
 }

 100% {
  transform: rotate(360deg);
 }
}
</style>
