<!--
  组件名称：hot-crab-48（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/G4b413l_hot-crab-48.html
  作者：G4b413l（来源 https://uiverse.io）

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
      <div class="scanner">
        <span>Loading...</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by G4b413l - Tags: animation, loading, loader, smooth */
.scanner span {
  color: transparent;
  font-size: 1.4rem;
  position: relative;
  overflow: hidden;
}

.scanner span::before {
  content: "Loading...";
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  border-right: 4px solid #17FEFF;
  overflow: hidden;
  color: #17FEFF;
  animation: load91371 2s linear infinite;
}

@keyframes load91371 {
  0%, 10%, 100% {
    width: 0;
  }

  10%,20%,30%,40%,50%,60%,70%,80%,90%,100% {
    border-right-color: transparent;
  }

  11%,21%,31%,41%,51%,61%,71%,81%,91% {
    border-right-color: #17FEFF;
  }

  60%, 80% {
    width: 100%;
  }
}
</style>
