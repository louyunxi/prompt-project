<!--
  组件名称：honest-elephant-63（loader 加载动画）
  来源迁移：E:/app-dir/galaxy-main/loaders/Bethel-nz_honest-elephant-63.html
  作者：Bethel-nz（来源 https://uiverse.io）

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
    <svg class="pl" viewBox="0 0 128 128" width="128px" height="128px" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="pl-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="hsl(193,90%,55%)"></stop>
                <stop offset="100%" stop-color="hsl(223,90%,55%)"></stop>
            </linearGradient>
        </defs>
        <circle class="pl__ring" r="56" cx="64" cy="64" fill="none" stroke="hsla(0,10%,10%,0.1)" stroke-width="16" stroke-linecap="round"></circle>
        <path class="pl__worm" d="M92,15.492S78.194,4.967,66.743,16.887c-17.231,17.938-28.26,96.974-28.26,96.974L119.85,59.892l-99-31.588,57.528,89.832L97.8,19.349,13.636,88.51l89.012,16.015S81.908,38.332,66.1,22.337C50.114,6.156,36,15.492,36,15.492a56,56,0,1,0,56,0Z" fill="none" stroke="url(#pl-grad)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="44 1111" stroke-dashoffset="10"></path>
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.loading-component {
  position: relative;
}

/* From Uiverse.io by Bethel-nz - Tags: loader */
.pl,
.pl__worm {
  animation-duration: 3s;
  animation-iteration-count: infinite;
}

.pl {
  animation-name: bump9;
  animation-timing-function: linear;
  width: 8em;
  height: 8em;
}

.pl__ring {
  stroke: hsla(var(--hue),10%,10%,0.1);
  transition: stroke 0.3s;
}

.pl__worm {
  animation-name: worm9;
  animation-timing-function: cubic-bezier(0.42,0.17,0.75,0.83);
}

/* Animations */
@keyframes bump9 {
  from,
  42%,
  46%,
  51%,
  55%,
  59%,
  63%,
  67%,
  71%,
  74%,
  78%,
  81%,
  85%,
  88%,
  92%,
  to {
    transform: translate(0,0);
  }

  44% {
    transform: translate(1.33%,6.75%);
  }

  53% {
    transform: translate(-16.67%,-0.54%);
  }

  61% {
    transform: translate(3.66%,-2.46%);
  }

  69% {
    transform: translate(-0.59%,15.27%);
  }

  76% {
    transform: translate(-1.92%,-4.68%);
  }

  83% {
    transform: translate(9.38%,0.96%);
  }

  90% {
    transform: translate(-4.55%,1.98%);
  }
}

@keyframes worm9 {
  from {
    stroke-dashoffset: 10;
  }

  25% {
    stroke-dashoffset: 295;
  }

  to {
    stroke-dashoffset: 1165;
  }
}
</style>
