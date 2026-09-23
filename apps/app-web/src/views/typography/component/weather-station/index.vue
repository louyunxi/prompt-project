<!--
  组件名称：WeatherStation（气象站传感器两列列表 + 粒子上升动画）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB126.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（a-tooltip 自动按需注册）
    - sass（组件内 scoped 样式，@for 循环生成粒子动画）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .weather-station 根元素）：
    --ws-bg             #062238      组件深色背景
    --ws-label          #a1d0e2      传感器指标名称文字色
    --ws-value          #00f6ff      传感器数值文字色
    --ws-line           #082b45      指标项下边框色
    --ws-line-light     #18ffff      指标项两端发光短线色
    --ws-particle       hsl(180,100%,80%)  粒子发光色（radial-gradient 起点色）

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、inject $dynamicDashboard、$ajax 接口、
       $api.iotAccess、v-loading / iconfont 加载态，已全部去除，改为 mock 数据
       + 组件内自包含静态渲染（无 loading 态）。
    2. 原 el-tooltip（Element Plus）改为 a-tooltip（ant-design-vue），
       textLen 判断超长后显示完整内容。
    3. 50 个粒子上升动画保留源实现：SCSS @for 循环生成随机 keyframes
       （随机尺寸、随机时长 28000+random(9000)ms、随机 delay random(37000)ms、自下而上）。
    4. contentHeight < 225 时 small 模式：容器高度改用 ResizeObserver 监听切换
       （源为 mounted 一次性读取 clientHeight），onBeforeUnmount 释放观察器。
    5. 图片物料 station.png / station-light.png / station-bottom.png
       已拷贝至本组件 assets/ 目录，模板相对路径引用。
-->
<template>
  <div
    ref="wrapperRef"
    class="weather-station"
    :class="{ 'weather-station--small': isSmall }"
  >
    <div class="weather-station__sensor-list">
      <div class="weather-station__list-col">
        <div
          v-for="item in leftList"
          :key="item.label"
          class="weather-station__list-item"
        >
          <div class="weather-station__content">
            <a-tooltip
              v-if="textLen(item.label) >= 5"
              :title="item.label"
              placement="right"
            >
              <span class="weather-station__label">{{ item.label }}</span>
            </a-tooltip>
            <span v-else class="weather-station__label">{{ item.label }}</span>
            <a-tooltip
              v-if="textLen(item.value, item.unit) >= 5"
              :title="`${item.value}${item.unit}`"
              placement="top"
            >
              <span :class="['weather-station__value', valueClass(item)]">
                {{ item.value }}{{ item.unit }}
              </span>
            </a-tooltip>
            <span v-else :class="['weather-station__value', valueClass(item)]">
              {{ item.value }}{{ item.unit }}
            </span>
          </div>
        </div>
      </div>
      <div class="weather-station__list-col weather-station__list-col--right">
        <div
          v-for="item in rightList"
          :key="item.label"
          class="weather-station__list-item"
        >
          <div class="weather-station__content">
            <a-tooltip
              v-if="textLen(item.label) >= 5"
              :title="item.label"
              placement="right"
            >
              <span class="weather-station__label">{{ item.label }}</span>
            </a-tooltip>
            <span v-else class="weather-station__label">{{ item.label }}</span>
            <a-tooltip
              v-if="textLen(item.value, item.unit) >= 5"
              :title="`${item.value}${item.unit}`"
              placement="top"
            >
              <span :class="['weather-station__value', valueClass(item)]">
                {{ item.value }}{{ item.unit }}
              </span>
            </a-tooltip>
            <span v-else :class="['weather-station__value', valueClass(item)]">
              {{ item.value }}{{ item.unit }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="weather-station__sensor-img">
      <div class="weather-station__img-container">
        <img class="weather-station__img" src="./assets/station.png" alt="" />
        <img
          class="weather-station__light"
          src="./assets/station-light.png"
          alt=""
        />
        <img
          class="weather-station__bottom weather-station__bottom--1"
          src="./assets/station-bottom.png"
          alt=""
        />
        <img
          class="weather-station__bottom weather-station__bottom--2"
          src="./assets/station-bottom.png"
          alt=""
        />
        <img
          class="weather-station__bottom weather-station__bottom--3"
          src="./assets/station-bottom.png"
          alt=""
        />
      </div>
      <div class="weather-station__particle-container">
        <div
          v-for="i in PARTICLE_NUM"
          :key="i"
          class="weather-station__circle-container"
        >
          <div class="weather-station__circle"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/** 粒子数量（与下方 SCSS $particleNum 保持一致） */
const PARTICLE_NUM = 50;

/** 传感器指标项（对应源组件 sensorList 中的单条数据） */
interface SensorItem {
  label: string;
  value: string | number;
  unit: string;
}

/** mock 左侧传感器指标列表 */
const leftList: SensorItem[] = [
  { label: '指标一', value: 23.5, unit: '单位' },
  { label: '指标二', value: 86.24, unit: '单位' },
  { label: '指标三', value: 12.6, unit: '单位' },
  { label: '指标四详细名称', value: 45.8, unit: '单位' },
  { label: '指标五', value: 67.3, unit: '单位' },
];

/** mock 右侧传感器指标列表 */
const rightList: SensorItem[] = [
  { label: '指标一', value: 156.78, unit: '单位' },
  { label: '指标二', value: 34.2, unit: '单位' },
  { label: '指标三详细名称', value: 89.05, unit: '单位' },
  { label: '指标四', value: 51.9, unit: '单位' },
];

/** 容器引用（用于测量高度切换 small 模式） */
const wrapperRef = ref<HTMLElement>();

/** 是否 small 模式（容器高度 < 225 时缩小字号与间距） */
const isSmall = ref(false);

/** 文本长度统计（对应源组件 textLen，Rain 特殊 +1 逻辑去除） */
function textLen(value: string | number, unit = ''): number {
  return String(value).trim().length + unit.trim().length;
}

/** 数值字号分级：>8 最小、>7 中号，否则默认（对应源组件 value 的 small / medium 类） */
function valueClass(item: SensorItem): string {
  const len = textLen(item.value, item.unit);
  if (len > 8) return 'weather-station__value--small';
  if (len > 7) return 'weather-station__value--medium';
  return '';
}

/** 容器高度变化观察器（对应源 mounted 一次性读取 clientHeight，改为持续监听） */
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!wrapperRef.value) return;
  const updateSmall = () => {
    isSmall.value = (wrapperRef.value?.clientHeight ?? 0) < 225;
  };
  updateSmall();
  resizeObserver = new ResizeObserver(updateSmall);
  resizeObserver.observe(wrapperRef.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style lang="scss" scoped>
.weather-station {
  --ws-bg: #062238;
  --ws-label: #a1d0e2;
  --ws-value: #00f6ff;
  --ws-line: #082b45;
  --ws-line-light: #18ffff;
  --ws-particle: hsl(180, 100%, 80%);

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  width: 100%;
  max-width: 350px;
  height: 100%;
  margin: 0 auto;
  overflow: hidden;
  background: var(--ws-bg);
  border-radius: 4px;

  &--small {
    .weather-station__sensor-list {
      height: 210px;
      padding-top: 0;

      .weather-station__label {
        font-size: 12px;
        line-height: 12px;
        margin-bottom: 3px;
      }

      .weather-station__value {
        font-size: 15px;
        line-height: 21px;
      }
    }

    .weather-station__sensor-img {
      top: 43%;
      height: 210px;

      .weather-station__img {
        width: 192px;
        margin-left: 2px;
      }

      .weather-station__light {
        width: 175px;
        left: 5px;
        top: 4px;
      }

      .weather-station__bottom {
        bottom: -4px;
        left: 26px;
        width: 134px;
      }

      .weather-station__particle-container {
        top: 35%;
        width: 138px;
      }
    }
  }

  &__sensor-list {
    height: 230px;
    display: flex;
    justify-content: space-between;
    align-content: flex-start;
    box-sizing: border-box;
    padding-bottom: 2px;
  }

  &__list-col {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 50%;
    padding-top: 8px;

    &--right {
      align-items: flex-end;
    }
  }

  &__list-item {
    display: flex;
  }

  &__content {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 71px;
    border-bottom: 2px solid var(--ws-line);

    &::before,
    &::after {
      position: absolute;
      z-index: 3;
      bottom: -1.5px;
      content: '';
      height: 1px;
      width: 6px;
      border-radius: 10px;
      background-color: var(--ws-line-light);
    }

    &::before {
      left: 0;
    }

    &::after {
      right: 0;
    }
  }

  &__label {
    display: inline-block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    line-height: 14px;
    color: var(--ws-label);
    margin-bottom: 4px;
  }

  &__value {
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 16px;
    line-height: 24px;
    color: var(--ws-value);
    padding-bottom: 3px;

    &--medium {
      font-size: 14px;
    }

    &--small {
      font-size: 12px;
    }
  }

  &__sensor-img {
    position: absolute;
    top: 48%;
    left: 50%;
    width: 184px;
    height: 230px;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  &__img-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  &__img {
    position: relative;
    z-index: 3;
    width: 216px;
    margin-left: -10px;
  }

  &__light {
    position: absolute;
    width: 182px;
    left: 1px;
    top: 20px;
  }

  &__bottom {
    opacity: 0;
    bottom: -6px;
    left: 22px;
    width: 140px;
    position: absolute;

    &--1 {
      opacity: 1;
      animation: weather-station-glow 6s linear infinite;
    }

    &--2 {
      animation: weather-station-glow 6s linear 2s infinite;
    }

    &--3 {
      animation: weather-station-glow 6s linear 4s infinite;
    }
  }

  &__particle-container {
    overflow: hidden;
    position: absolute;
    left: 50%;
    top: 38%;
    transform: translateX(-50%);
    width: 144px;
    height: 130px;
  }

  &__circle-container {
    position: absolute;
    transform: translateY(-150px);
    animation-iteration-count: infinite;
    animation-timing-function: linear;

    $particleNum: 50;
    $particleBaseSize: 3;

    @for $i from 1 through $particleNum {
      &:nth-child(#{$i}) {
        $circleSize: random($particleBaseSize);
        width: #{$circleSize}px;
        height: #{$circleSize}px;

        $startPositionY: random(10) + 150;
        $framesName: 'ws-move-frames-' + $i;
        $moveDuration: 28000 + random(9000) + ms;

        animation-name: #{$framesName};
        animation-duration: $moveDuration;
        animation-delay: random(37000) + ms;

        @keyframes #{$framesName} {
          from {
            transform: translate3d(
              #{random(150)}px,
              #{$startPositionY}px,
              0
            );
          }

          to {
            transform: translate3d(
              #{random(150)}px,
              #{-$startPositionY - random(30)}px,
              0
            );
          }
        }
      }
    }
  }

  &__circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    mix-blend-mode: screen;
    background-image: radial-gradient(
      var(--ws-particle),
      var(--ws-particle) 10%,
      hsla(180, 100%, 80%, 0) 56%
    );
    animation: weather-station-fadein 200ms infinite, weather-station-scale 2s infinite;
  }

  @media screen and (max-width: 1280px) {
    max-width: 320px;

    &__list-col {
      padding-top: 4px;
    }

    &__content {
      width: 66px;
    }

    &__label {
      font-size: 13px;
    }

    &__value {
      font-size: 15px;
    }
  }

  @media screen and (min-width: 1920px) {
    max-width: 380px;

    &__label {
      font-size: 15px;
    }

    &__value {
      font-size: 17px;
    }
  }
}

@keyframes weather-station-fadein {
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

@keyframes weather-station-scale {
  0% {
    transform: scale3d(0.4, 0.4, 1);
  }
  50% {
    transform: scale3d(2, 2, 1);
  }
  100% {
    transform: scale3d(0.4, 0.4, 1);
  }
}

@keyframes weather-station-glow {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.3) translateY(2px);
  }
  100% {
    opacity: 0;
    transform: scale(1.5) translateY(5px);
  }
}
</style>
