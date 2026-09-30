<!--
  组件名称：white-rat-90（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/ChaudaryHammad_white-rat-90.html
  作者：ChaudaryHammad（来源 https://uiverse.io）

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

/* From Uiverse.io by ChaudaryHammad - Tags: loading, loader, cool loader */
.loader {
  width: 50px;
  aspect-ratio: 1.154;
  position: relative;
  background: conic-gradient(from 120deg at 50% 64%,#0000, #ff1919 1deg 120deg,#0000 121deg);
  animation: l27-0 1.5s infinite cubic-bezier(0.3,1,0,1);
}

.loader:before,
.loader:after {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  transform-origin: 50% 66%;
  animation: l27-1 1.5s infinite;
}

.loader:after {
  --s: -1;
}

@keyframes l27-0 {
  0%,30% {
    transform: rotate(0)
  }

  70% {
    transform: rotate(120deg)
  }

  70.01%,100% {
    transform: rotate(360deg)
  }
}

@keyframes l27-1 {
  0% {
    transform: rotate(calc(var(--s,1)*120deg)) translate(0)
  }

  30%,70% {
    transform: rotate(calc(var(--s,1)*120deg)) translate(calc(var(--s,1)*-5px),10px)
  }

  100% {
    transform: rotate(calc(var(--s,1)*120deg)) translate(0)
  }
}
</style>
