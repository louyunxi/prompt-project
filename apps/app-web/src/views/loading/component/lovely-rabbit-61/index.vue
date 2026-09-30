<!--
  组件名称：lovely-rabbit-61（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Abrar-Hussain1_lovely-rabbit-61.html
  作者：Abrar-Hussain1（来源 https://uiverse.io）

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
    <div class="loader-container">
      <div class="loader"></div>
      <div class="loader-text">Loading...</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Abrar-Hussain1  - Tags: animation, loading, loader, spinner, modern, circle, animated, circle loader */
.loader-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.loader {
  width: 70px;
  height: 70px;
  position: relative;
}

.loader:before {
  content: "";
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 6px solid #007bff;
  position: absolute;
  top: 0;
  left: 0;
  animation: pulse 1s ease-in-out infinite;
}

.loader:after {
  content: "";
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 6px solid transparent;
  border-top-color: #007bff;
  position: absolute;
  top: 0;
  left: 0;
  animation: spin 2s linear infinite;
}

.loader-text {
  font-size: 24px;
  margin-top: 20px;
  color: #007bff;
  font-family: Arial, sans-serif;
  text-align: center;
  text-transform: uppercase;
}

@keyframes pulse {
  0% {
    transform: scale(0.6);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0;
  }
  100% {
    transform: scale(0.6);
    opacity: 1;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.content {
  display: none;
}

.loaded .loader-container {
  display: none;
}

.loaded .content {
  display: block;
}
</style>
