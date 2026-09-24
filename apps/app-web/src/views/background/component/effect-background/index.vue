<!--
  组件名称：EffectBackground（粒子上升背景）

  来源迁移：
    - 源文件：D:\sn-project\frp_gov_web\src\components\common\effect-background.vue
    - 说明：纯 SCSS 实现，迁移时修复了源组件动画名 typo
      （animation 引用了 fadein-frames，而 @keyframes 实际定义的是 fade-frames，
      导致闪烁动画失效），并将 103 个静态 div 改为 v-for 渲染（200 个粒子，
      与 $particleNum: 200 保持一致）。

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 <style> 的 .effect-background 上）：
    --eb-bg       #04121f   组件底色（深蓝黑）
    --eb-particle hsl(180, 100%, 80%)   粒子主色（荧光青，径向渐变内芯）

  迁移说明：
    1. 粒子颜色 hsl(180, 100%, 80%) 提炼为 --eb-particle；渐变末端透明
       hsla(180, 100%, 80%, 0) 保持源效果。
    2. 每个粒子容器随机生成 move-frames-#{$i} 位移动画（自下而上），
       :nth-child 依赖 DOM 顺序，v-for 顺序渲染可正确匹配。
    3. 无图片物料，全部由 CSS 绘制。
-->
<template>
  <div class="effect-background">
    <div v-for="item in PARTICLE_NUM" :key="item" class="effect-background__container">
      <div class="effect-background__circle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** 粒子数：与源组件 $particleNum: 200 保持一致 */
const PARTICLE_NUM = 200;
</script>

<style scoped lang="scss">
@use 'sass:math';

.effect-background {
  --eb-bg: #04121f;
  --eb-particle: hsl(180, 100%, 80%);

  position: relative;
  width: 100%;
  height: 320px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--eb-bg);

  @media (min-width: 1920px) {
    height: 400px;
  }

  $particleNum: 200;

  &__container {
    position: absolute;
    transform: translateY(-10vh);
    animation-iteration-count: infinite;
    animation-timing-function: linear;

    .effect-background__circle {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      mix-blend-mode: screen;
      background-image: radial-gradient(
        var(--eb-particle),
        var(--eb-particle) 10%,
        hsla(180, 100%, 80%, 0) 56%
      );

      animation: fade-frames 200ms infinite, scale-frames 2s infinite;

      @keyframes fade-frames {
        0% {
          opacity: 1;
        }

        50% {
          opacity: 0.7;
        }

        100% {
          opacity: 1;
        }
      }

      @keyframes scale-frames {
        0% {
          transform: scale3d(0.4, 0.4, 1);
        }

        50% {
          transform: scale3d(2.2, 2.2, 1);
        }

        100% {
          transform: scale3d(0.4, 0.4, 1);
        }
      }
    }
  }

  $particleBaseSize: 8;

  @for $i from 1 through $particleNum {
    .effect-background__container:nth-child(#{$i}) {
      $circleSize: math.random($particleBaseSize);
      width: $circleSize + px;
      height: $circleSize + px;

      $startPositionY: math.random(10) + 100;
      $framesName: 'move-frames-' + $i;
      $moveDuration: 28000 + math.random(9000) + ms;

      animation-name: #{$framesName};
      animation-duration: $moveDuration;
      animation-delay: math.random(37000) + ms;

      @keyframes #{$framesName} {
        from {
          transform: translate3d(
            #{math.random(100) + vw},
            #{$startPositionY + vh},
            0
          );
        }

        to {
          transform: translate3d(
            #{math.random(100) + vw},
            #{- $startPositionY - math.random(30) + vh},
            0
          );
        }
      }

      .effect-background__circle {
        animation-delay: math.random(4000) + ms;
      }
    }
  }
}

/** 用户开启系统级 reduced-motion 时关闭动画 */
@media (prefers-reduced-motion: reduce) {
  .effect-background__container {
    animation-play-state: paused;
  }
}
</style>
