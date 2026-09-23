<!--
  组件名称：NumberRain（数字雨 / 矩阵代码雨）

  来源迁移：
    - 源文件：D:\sn-project\frp_gov_web\src\components\effect\number-rain.vue
    - 说明：纯 SCSS 实现，迁移到本工程时移除 Google Fonts 外部 @import
      （改用系统等宽字体栈），脚本由 Options API 空壳改为 <script setup lang="ts">，
      其余动画逻辑（typing / mask / steps 逐列刷新）完全保留。

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .number-rain 上）：
    --nr-bg      #03121d   组件底色（深蓝黑）
    --nr-text    #00ebf5   数字雨文字色（荧光青）
    --nr-glow    #ffffff   文字辉光色（text-shadow 内核白）

  迁移说明：
    1. 源组件引入 Google Fonts Inconsolata，迁移后使用系统等宽字体栈替代。
    2. 50 列由 v-for 生成，每列 ::before 展示随机 01 串 + ::after 黑色渐变遮罩，
       遮罩 alpha 仍保留 SCSS random 逐列随机（黑色遮罩未提炼为变量，保持源效果）。
    3. Vue 3 scoped 样式会自动对 @keyframes 命名做 hash 处理，动画引用同步改写。
    4. 无图片物料，全部由 CSS 绘制。
-->
<template>
  <div class="number-rain">
    <div class="number-rain__container">
      <p v-for="item in COLUMN_COUNT" :key="item"></p>
    </div>
  </div>
</template>

<script setup lang="ts">
/** 列数：与源组件 $n: 50 保持一致 */
const COLUMN_COUNT = 50;
</script>

<style scoped lang="scss">
.number-rain {
  --nr-bg: #03121d;
  --nr-text: #00ebf5;
  --nr-glow: #ffffff;

  position: relative;
  width: 100%;
  height: 320px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--nr-bg);

  @media (min-width: 1920px) {
    height: 400px;
  }
}

.number-rain__container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  flex-direction: row;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace, sans-serif;

  $str: '101011011011101001001010100010101010111010101110';
  $length: str-length($str);
  $n: 50;
  $animationTime: 4;
  $perColumnNums: 45;

  @function randomChar() {
    $r: random($length);
    @return str-slice($str, $r, $r);
  }

  @function randomChars($number) {
    $value: '';

    @if $number > 0 {
      @for $i from 1 through $number {
        $value: $value + randomChar();
      }
    }
    @return $value;
  }

  p {
    position: relative;
    width: 5%;
    height: 100%;
    text-align: center;
    font-size: 38px;
    word-break: break-all;
    white-space: pre-wrap;

    &::before,
    &::after {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      overflow: hidden;
    }
  }

  @for $i from 0 through $n {
    $content: randomChars($perColumnNums);
    $contentNext: randomChars($perColumnNums);
    $delay: random($n);
    $randomAnimationTine: #{$animationTime + random(20) / 10 - 1}s;

    p:nth-child(#{$i})::before {
      content: $content;
      color: var(--nr-text);
      text-shadow: 0 0 1px var(--nr-glow), 0 0 2px var(--nr-glow),
        0 0 5px currentColor, 0 0 10px currentColor;
      animation: typing-#{$i} $randomAnimationTine steps(20, end)
        #{$delay * 0.1s * -1} infinite;
      z-index: 1;
    }

    p:nth-child(#{$i})::after {
      $alpha: random(40) / 100 + 0.6;
      content: '';
      background: linear-gradient(
        rgba(0, 0, 0, $alpha),
        rgba(0, 0, 0, $alpha),
        rgba(0, 0, 0, $alpha),
        transparent 100%,
        transparent
      );
      background-size: 100% 220%;
      background-repeat: no-repeat;
      animation: mask $randomAnimationTine infinite #{($delay - 2) * 0.1s * -1}
        linear;
      z-index: 2;
    }

    @keyframes typing-#{$i} {
      0% {
        height: 0;
      }
      25% {
        height: 100%;
      }
      100% {
        height: 100%;
        content: $contentNext;
      }
    }
  }

  @keyframes mask {
    0% {
      background-position: 0 220%;
    }
    30% {
      background-position: 0 0%;
    }
    100% {
      background-position: 0 0%;
    }
  }
}

/** 用户开启系统级 reduced-motion 时关闭动画 */
@media (prefers-reduced-motion: reduce) {
  .number-rain__container p::before,
  .number-rain__container p::after {
    animation: none;
  }
}
</style>
