<!--
  组件名称：friendly-turtle-73（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Akshdeep74644_friendly-turtle-73.html
  作者：Akshdeep74644（来源 https://uiverse.io）

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
         <div class="box-1">
         </div>
         <span>
             Loading.....
         </span>
     </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Akshdeep74644 - Tags: loader */
.loader {
  position: relative;
}

.box-1 {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  height: 150px;
  width: 150px;
  background-color: #FFFFFF;
  background-image: linear-gradient(135deg, #FFFFFF 0%, #6284FF 34%, #FF0000 100%);
  border-radius: 50%;
  animation: rotate 3s linear infinite;
  box-shadow: rgba(17, 17, 26, 0.1) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 48px;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.box-1::before {
  content: '';
  position: absolute;
  inset: 15px;
  background: #f5f5f5;
  border-radius: 50%;
  box-shadow: rgb(204, 219, 232) 3px 3px 6px 0px inset, rgba(255, 255, 255, 0.5) -3px -3px 6px 1px inset;
}

.loader span {
  text-align: center;
  position: absolute;
  top: 65px;
  left: 25px;
  color: black;
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  letter-spacing: 2px;
  font-weight: 800;
  font-size: 1rem;
  animation: text-animate412 3s linear infinite;
}

@keyframes text-animate412 {

  10% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>
