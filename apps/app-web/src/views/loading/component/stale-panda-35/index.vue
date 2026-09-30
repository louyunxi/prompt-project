<!--
  组件名称：stale-panda-35（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Shoh2008_stale-panda-35.html
  作者：Shoh2008（来源 https://uiverse.io）

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
    <span class="loader"></span>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Shoh2008 - Tags: loader */
.loader {
  width: 106px;
  height: 56px;
  display: block;
  margin: 30px auto;
  background-image: linear-gradient(#e1e1e1 50px, transparent 0), linear-gradient(#e1e1e1 50px, transparent 0), linear-gradient(#e1e1e1 50px, transparent 0), linear-gradient(#e1e1e1 50px, transparent 0), radial-gradient(circle 14px, #e1e1e1 100%, transparent 0);
  background-size: 48px 15px , 15px 35px, 15px 35px, 25px 15px, 28px 28px;
  background-position: 25px 5px, 58px 20px, 25px 17px, 2px 37px, 76px 0px;
  background-repeat: no-repeat;
  position: relative;
  transform: rotate(-45deg);
  box-sizing: border-box;
}

.loader::after,
.loader::before {
  content: '';
  position: absolute;
  width: 56px;
  height: 56px;
  border: 6px solid #e1e1e1;
  border-radius: 50%;
  left: -45px;
  top: -10px;
  background-repeat: no-repeat;
  background-image: linear-gradient(#e1e1e1 64px, transparent 0), linear-gradient(#e1e1e1 66px, transparent 0), radial-gradient(circle 4px, #e1e1e1 100%, transparent 0);
  background-size: 40px 1px , 1px 40px, 8px 8px;
  background-position: center center;
  box-sizing: border-box;
  animation: bike 0.3s linear infinite;
}

.loader::before {
  left: 25px;
  top: 60px;
}

@keyframes bike {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
