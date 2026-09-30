<!--
  组件名称：smart-otter-24（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Gianluks90_smart-otter-24.html
  作者：Gianluks90（来源 https://uiverse.io）

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
      <div class="red bar"></div>
      <div class="orange bar"></div>
      <div class="yellow bar"></div>
      <div class="green bar"></div>
      <div class="blue bar"></div>
      <div class="violet bar"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Gianluks90 - Tags: loader, rainbow */
.loader {
  height: 50px;
  display: flex;
  align-items: flex-end;
  gap: 3px;
}

.bar {
  height: 5px;
  width: 12px;
  animation-duration: 0.45s;
  animation-name: changeHeight;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.red {
  background-color: #E50000;
  box-shadow: 1px 1px 10px #E50000;
  animation-delay: 0.10s;
}

.orange {
  background-color: #FF8D00;
  box-shadow: 1px 1px 10px #FF8D00;
  animation-delay: 0.20s;
}

.yellow {
  background-color: #FFEE00;
  box-shadow: 1px 1px 10px #FFEE00;
  animation-delay: 0.25s;
}

.green {
  background-color: #008121;
  box-shadow: 1px 1px 10px #008121;
  animation-delay: 0.30s;
}

.blue {
  background-color: #004CFF;
  box-shadow: 1px 1px 10px #004CFF;
  animation-delay: 0.35s;
}

.violet {
  background-color: #760188;
  box-shadow: 1px 1px 10px #760188;
  animation-delay: 0.40s;
}

@keyframes changeHeight {
  from {
    height: 5px;
  }

  to {
    height: 40px;
  }
}
</style>
