<!--
  组件名称：soft-moth-67（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/vikramsinghnegi_soft-moth-67.html
  作者：vikramsinghnegi（来源 https://uiverse.io）

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
    <div class="center-body">
      <div class="loader-circle-9">
        Loading
        <span></span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by vikramsinghnegi  - Tags: loading, loader, effect loader */
.center-body {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #262626;
}

.loader-circle-9 {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  background: transparent;
  border: 3px solid #3c3c3c;
  border-radius: 50%;
  text-align: center;
  line-height: 70px;
  font-family: sans-serif;
  font-size: 12px;
  color: #00eaff;
  text-transform: uppercase;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.loader-circle-9:before {
  content: "";
  position: absolute;
  top: -3px;
  left: -3px;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid #00eaff;
  border-right: 3px solid #00eaff;
  border-radius: 50%;
  animation: animateC 2s linear infinite;
}

.loader-circle-9 span {
  display: block;
  position: absolute;
  top: calc(50% - 2px);
  left: 50%;
  width: 50%;
  height: 4px;
  background: transparent;
  transform-origin: left;
  animation: animate 2s linear infinite;
}

.loader-circle-9 span:before {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00eaff;
  top: -6px;
  right: -8px;
  box-shadow: 0 0 20px #00eaff;
}

@keyframes animateC {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes animate {
  0% {
    transform: rotate(45deg);
  }
  100% {
    transform: rotate(405deg);
  }
}
</style>
