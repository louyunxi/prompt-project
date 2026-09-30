<!--
  组件名称：moody-crab-18（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/JkHuger_moody-crab-18.html
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
    <div id="col">
      <div id="img-wrap">
        <span class="loader"></span>
    </div></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by JkHuger - Tags: loader */
#col {
  width: 50%;
  margin: 0 auto;
}

.loader {
  content: ' ';
  border: 5px solid #333;
  border-radius: 30px;
  height: 30px;
  left: 50%;
  margin: -15px 0 0 -15px;
  opacity: 0;
  position: absolute;
  top: 50%;
  width: 30px;
  animation: pulsate 1s ease-out;
  animation-iteration-count: infinite;
}

@keyframes pulsate {
  0% {
    transform: scale(.1);
    opacity: 0.0;
  }

  50% {
    opacity: 1;
  }

  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}
</style>
