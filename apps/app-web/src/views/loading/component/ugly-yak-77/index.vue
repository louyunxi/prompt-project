<!--
  组件名称：ugly-yak-77（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/DSB2004_ugly-yak-77.html
  作者：DSB2004（来源 https://uiverse.io）

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
    <div id="Loading">
      <div id="loading_div">
        <div id="loading_bouncer"></div>
        <div id="shadow"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by DSB2004  - Tags: simple, gradient, loader */
#Loading {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
#loading_div {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
@keyframes bounce {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-50px);
  }
  100% {
    transform: translateY(0px);
  }
}
@keyframes shadow {
  0% {
    height: 50px;
    width: 50px;
  }
  50% {
    height: 10px;
    width: 10px;
  }
  100% {
    height: 50px;
    width: 50px;
  }
}
#loading_bouncer {
  height: 50px;
  width: 50px;
  border-radius: 100%;
  background: linear-gradient(
    to bottom,
    rgb(89, 0, 255),
    rgb(0, 110, 255),
    rgb(25, 0, 255)
  );
  animation: bounce 500ms ease-in-out infinite;
}
#shadow {
  position: absolute;
  height: 50px;
  width: 50px;
  border-radius: 100%;
  background: black;
  top: 30px;
  transform: rotateX(80deg);
  animation: shadow 500ms ease-in-out infinite;
}
</style>
