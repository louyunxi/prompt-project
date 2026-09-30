<!--
  组件名称：curvy-bulldog-27（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Shoh2008_curvy-bulldog-27.html
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
    <div class="loader"></div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Shoh2008 - Tags: loader */
.loader {
  width: 120px;
  height: 150px;
  background-color: #fff;
  background-repeat: no-repeat;
  background-image: linear-gradient(#ddd 50%, #bbb 51%),
    linear-gradient(#ddd, #ddd), linear-gradient(#ddd, #ddd),
    radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, #0000 55%),
    radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, #0000 55%),
    radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, #0000 55%);
  background-position: 0 20px, 45px 0, 8px 6px, 55px 3px, 75px 3px, 95px 3px;
  background-size: 100% 4px, 1px 23px, 30px 8px, 15px 15px, 15px 15px, 15px 15px;
  position: relative;
  border-radius: 6%;
  animation: shake 3s ease-in-out infinite;
  transform-origin: 60px 180px;
}

.loader:before {
  content: "";
  position: absolute;
  left: 5px;
  top: 100%;
  width: 7px;
  height: 5px;
  background: #aaa;
  border-radius: 0 0 4px 4px;
  box-shadow: 102px 0 #aaa;
}

.loader:after {
  content: "";
  position: absolute;
  width: 95px;
  height: 95px;
  left: 0;
  right: 0;
  margin: auto;
  bottom: 20px;
  background-color: #bbdefb;
  background-image: linear-gradient( to right, #0004 0%, #0004 49%, #0000 50%, #0000 100% ),
    linear-gradient(135deg, #64b5f6 50%, #607d8b 51%);
  background-size: 30px 100%, 90px 80px;
  border-radius: 50%;
  background-repeat: repeat, no-repeat;
  background-position: 0 0;
  box-sizing: border-box;
  border: 10px solid #DDD;
  box-shadow: 0 0 0 4px #999 inset, 0 0 6px 6px #0004 inset;
  animation: spin 3s ease-in-out infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg)
  }

  50% {
    transform: rotate(360deg)
  }

  75% {
    transform: rotate(750deg)
  }

  100% {
    transform: rotate(1800deg)
  }
}

@keyframes shake {
  65%, 80%, 88%, 96% {
    transform: rotate(0.5deg)
  }

  50%, 75%, 84%, 92% {
    transform: rotate(-0.5deg)
  }

  0%, 50%, 100% {
    transform: rotate(0)
  }
}
</style>
