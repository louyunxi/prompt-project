<!--
  组件名称：strong-zebra-9（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/JaydipPrajapati1910_strong-zebra-9.html
  作者：JaydipPrajapati1910（来源 https://uiverse.io）

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

/* From Uiverse.io by JaydipPrajapati1910 - Tags: animation, loading, loader, battery */
.loader {
  width: 160px;
  height: 80px;
  border: 4px solid #00F45B;
  border-right-color: transparent;
  padding: 6px;
  background: repeating-linear-gradient(90deg,#00F45B 0 20px,#0000 0 30px) 
    left/0% 100% no-repeat content-box content-box;
  position: relative;
  animation: p5 2s infinite steps(6);
}

.loader::before {
  content: "";
  position: absolute;
  top: -4px;
  bottom: -4px;
  left: 100%;
  width: 20px;
  background: linear-gradient(
        #0000   calc(50% - 14px),#00F45B 0 calc(50% - 10px),
        #0000 0 calc(50% + 10px),#00F45B 0 calc(50% + 14px),#0000 0) left /100% 100%,
    linear-gradient(#00F45B calc(50% - 10px),#0000        0 calc(50% + 10px),#00F45B 0) left /4px 100%,
    linear-gradient(#0000        calc(50% - 10px),#00F45B 0 calc(50% + 10px),#0000        0) right/4px 100%;
  background-repeat: no-repeat;
}

@keyframes p5 {
  100% {
    background-size: 120% 100%
  }
}
</style>
