<!--
  组件名称：RankingProgress（指标排名横向进度条）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB125.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（自动按需注册）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .ranking-progress 根元素）：
    --rkp-bg               #062238     组件深色背景
    --rkp-nav-color        #6dc1cb     tab 导航默认文字色
    --rkp-nav-active       #00f6ff     tab 高亮 / 箭头默认文字色
    --rkp-nav-dim          rgba(0,246,255,0.3) 箭头边界（首/尾）文字色
    --rkp-text             #9dd1d7     条目名称 / 单位文字色
    --rkp-bar-border       #157f97     进度条边框色
    --rkp-bar-bg           #083e54     进度条底色 / 条纹遮罩色
    --rkp-bar-from         #01c3ff     进度渐变起始色
    --rkp-bar-to           #04f4fd     进度渐变结束色
    --rkp-bar-stripe       #031c46     进度背景条纹色
    --rkp-bar-value        #00f4fd     进度值 / 排名数字色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex、plateVO 接口数据，已全部去除，
       改为 mock 数据 + 组件内自包含渲染。
    2. 顶部左右箭头原为 el-icon-arrow-left / el-icon-arrow-right（Element Plus 图标），
       改为 CSS 三角形绘制，保持自包含。
    3. tab 切换逻辑保留：navIndex + boxLeft 滚动偏移（原 left 定位改 ref + translateX），
       boxLeft = -(navIndex * boxScroll.offsetWidth / 2) 与源一致。
    4. hasDot（两位小数）/ classFun / classRightFun（value/最大值*100 计算宽度）/
       textFun（长名称截断）逻辑保留，入参类型由字符串改 number。
    5. 该组件无图片物料，无需 assets 资源目录。
-->
<template>
  <div class="ranking-progress">
    <div class="ranking-progress__title-nav">
      <div
        v-if="tabList.length > 1"
        :class="
          navIndex === 0
            ? 'ranking-progress__nav-left ranking-progress__nav--dim'
            : 'ranking-progress__nav-left'
        "
        @click="onNav('prev')"
      >
        <span class="ranking-progress__arrow ranking-progress__arrow--left"></span>
      </div>
      <div class="ranking-progress__nav-box">
        <div
          ref="boxScroll"
          class="ranking-progress__nav-box-scroll"
          :style="{ transform: `translateX(${boxLeft}px)` }"
        >
          <p
            v-for="(tab, index) in tabList"
            :key="tab.title"
            :class="navIndex === index ? 'active' : ''"
            @click="onNav('click', index)"
          >
            {{ textFun(tab.title, 8) }}
          </p>
        </div>
      </div>
      <div
        v-if="tabList.length > 1"
        :class="
          navIndex === tabList.length - 1
            ? 'ranking-progress__nav-right ranking-progress__nav--dim'
            : 'ranking-progress__nav-right'
        "
        @click="onNav('next')"
      >
        <span class="ranking-progress__arrow ranking-progress__arrow--right"></span>
      </div>
    </div>
    <div class="ranking-progress__main">
      <div v-for="(item, index) in currentList" :key="index" class="ranking-progress__box">
        <div class="ranking-progress__box-title">
          <p class="ranking-progress__name" :title="item.name">
            {{ textFun(item.name, 16) }}
          </p>
          <p class="ranking-progress__msg" :title="item.unit">
            {{ textFun(item.unit, 10) }}
          </p>
        </div>
        <div v-if="item.value && item.value !== 0" class="ranking-progress__bar">
          <span class="ranking-progress__rank">{{ index + 1 }}</span>
          <div class="ranking-progress__bar-left">
            <div :style="classFun(item.value)" class="ranking-progress__small"></div>
            <div :style="classRightFun(item.value)" class="ranking-progress__bg"></div>
          </div>
          <div class="ranking-progress__bar-right">{{ hasDot(item.value) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

/** 排名条目（对应源组件 plateMetricList 中的单条数据） */
interface RankItem {
  name: string;
  value: number;
  unit: string;
}

/** 指标组 tab（对应源组件 plateMetricGroupList 中的单个分组） */
interface RankTab {
  title: string;
  list: RankItem[];
}

/** mock 指标组数据（对应源组件 plateMetricGroupList 接口数据） */
const tabList: RankTab[] = [
  {
    title: '指标组一',
    list: [
      { name: '条目一', value: 86, unit: '单位' },
      { name: '条目二', value: 62, unit: '单位' },
      { name: '条目三', value: 45, unit: '单位' },
      { name: '条目四', value: 33, unit: '单位' },
      { name: '条目五', value: 21, unit: '单位' },
    ],
  },
  {
    title: '指标组二',
    list: [
      { name: '条目一', value: 95, unit: '单位' },
      { name: '条目二', value: 71, unit: '单位' },
      { name: '条目三', value: 58, unit: '单位' },
      { name: '条目四', value: 40, unit: '单位' },
      { name: '条目五', value: 18, unit: '单位' },
    ],
  },
  {
    title: '指标组三',
    list: [
      { name: '条目一', value: 77, unit: '单位' },
      { name: '条目二', value: 54, unit: '单位' },
      { name: '条目三', value: 39, unit: '单位' },
      { name: '条目四', value: 26, unit: '单位' },
      { name: '条目五', value: 12, unit: '单位' },
    ],
  },
  {
    title: '指标组四',
    list: [
      { name: '条目一', value: 88, unit: '单位' },
      { name: '条目二', value: 66, unit: '单位' },
      { name: '条目三', value: 47, unit: '单位' },
      { name: '条目四', value: 29, unit: '单位' },
      { name: '条目五', value: 15, unit: '单位' },
    ],
  },
];

/** 当前 tab 索引 */
const navIndex = ref(0);

/** tab 导航滚动偏移（对应源组件 boxLeft） */
const boxLeft = ref(0);

/** tab 导航滚动容器（对应源组件 $refs.boxScroll） */
const boxScroll = ref<HTMLElement>();

/** 当前 tab 对应的排名列表 */
const currentList = computed(() => tabList[navIndex.value]?.list ?? []);

/** 当前列表最大值，用于进度条宽度换算 */
const maxValue = computed(() =>
  Math.max(0, ...currentList.value.map((item) => item.value)),
);

/** 切换 tab：prev / next / click（对应源组件 onNav） */
function onNav(type: 'prev' | 'next' | 'click', index = 0) {
  const last = tabList.length - 1;
  let next = navIndex.value;
  if (type === 'prev') {
    if (navIndex.value === 0) return;
    next = navIndex.value - 1;
  } else if (type === 'next') {
    if (navIndex.value === last) return;
    next = navIndex.value + 1;
  } else {
    if (index === navIndex.value) return;
    next = index;
  }
  navIndex.value = next;
  const offset = boxScroll.value?.offsetWidth ?? 0;
  boxLeft.value = -(next * offset) / 2;
}

/** 保留两位小数（对应源组件 hasDot，入参由字符串改 number） */
function hasDot(num: number): string {
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

/** 进度条填充宽度：value / 最大值 * 100（对应源组件 classFun） */
function classFun(value: number): string {
  const width = Math.min((value / (maxValue.value || 1)) * 100, 100);
  return `width:${width}%`;
}

/** 进度条剩余宽度：100 - 填充宽度（对应源组件 classRightFun） */
function classRightFun(value: number): string {
  const width = Math.min((value / (maxValue.value || 1)) * 100, 100);
  return `width:${100 - width}%`;
}

/** 长文本截断（对应源组件 textFun） */
function textFun(val: string, num: number): string {
  if (val && val.length > num) {
    return `${val.slice(0, num - 1)}...`;
  }
  return val;
}
</script>

<style lang="scss" scoped>
.ranking-progress {
  --rkp-bg: #062238;
  --rkp-nav-color: #6dc1cb;
  --rkp-nav-active: #00f6ff;
  --rkp-nav-dim: rgba(0, 246, 255, 0.3);
  --rkp-text: #9dd1d7;
  --rkp-bar-border: #157f97;
  --rkp-bar-bg: #083e54;
  --rkp-bar-from: #01c3ff;
  --rkp-bar-to: #04f4fd;
  --rkp-bar-stripe: #031c46;
  --rkp-bar-value: #00f4fd;

  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 365px;
  margin: 0 auto;
  padding: 12px;
  background: var(--rkp-bg);
  border-radius: 4px;

  &__title-nav {
    height: 30px;
    margin-bottom: 6px;
    display: flex;
    padding: 0 12px;

    .ranking-progress__nav-left,
    .ranking-progress__nav-right {
      width: 30px;
      color: var(--rkp-nav-active);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .ranking-progress__nav--dim {
      color: var(--rkp-nav-dim);
    }
  }

  &__arrow {
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;

    &--left {
      border-right: 6px solid currentColor;
    }

    &--right {
      border-left: 6px solid currentColor;
    }
  }

  &__nav-box {
    flex: 1;
    display: flex;
    align-items: center;
    color: var(--rkp-nav-color);
    overflow: hidden;
  }

  &__nav-box-scroll {
    flex: 1;
    display: flex;
    transition: all 1s;

    p {
      flex-grow: 0;
      flex-shrink: 0;
      width: 50%;
      display: flex;
      justify-content: center;
      position: relative;
      cursor: pointer;
    }

    .active {
      color: var(--rkp-nav-active);
      font-weight: 550;

      &::after {
        content: ' ';
        position: absolute;
        bottom: -6px;
        left: 50%;
        width: 20px;
        height: 3px;
        background: var(--rkp-nav-active);
        border-radius: 2px;
        transform: translateX(-50%);
      }
    }
  }

  &__main {
    flex: 1;
    overflow-y: auto;
    margin-right: 10px;
  }

  &__box {
    display: flex;
    flex-direction: column;
    padding: 0 10px 0;
  }

  &__box-title {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    p {
      color: var(--rkp-text);
      font-size: 14px;
    }
  }

  &__bar {
    display: flex;
    align-items: center;
    height: 20px;
    width: 100%;
    margin-bottom: 10px;
  }

  &__rank {
    width: 22px;
    margin-right: 6px;
    color: var(--rkp-bar-value);
    font-size: 13px;
    font-weight: 550;
    text-align: center;
  }

  &__bar-left {
    width: calc(100% - 78px);
    border: 1px solid var(--rkp-bar-border);
    background: var(--rkp-bar-bg);
    display: flex;
    padding: 4px;
  }

  &__small {
    height: 100%;
    background-image: linear-gradient(to right, var(--rkp-bar-from) 0%, var(--rkp-bar-to) 100%);
    background-repeat: repeat;

    &::before {
      content: '';
      display: inline-block;
      width: 100%;
      height: 100%;
      background-image: linear-gradient(
        to right,
        transparent 0%,
        transparent 85%,
        var(--rkp-bar-bg) 100%
      );
      background-size: 6px;
      background-repeat: repeat;
    }
  }

  &__bg {
    height: 100%;
    background-image: linear-gradient(
      to left,
      var(--rkp-bar-stripe) 0%,
      var(--rkp-bar-stripe) 85%,
      transparent 85%
    );
    background-size: 6px;
    background-repeat: repeat;
  }

  &__bar-right {
    width: 78px;
    margin-left: 4px;
    border: 1px solid var(--rkp-bar-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--rkp-bar-value);
    font-weight: 550;
    font-size: 14px;
    background: var(--rkp-bar-bg);
  }

  &__main::-webkit-scrollbar {
    width: 3px;
  }

  &__main::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    background-color: rgba(0, 247, 255, 0.2);
    border-radius: 3px;
  }

  &__main::-webkit-scrollbar-thumb {
    border-radius: 7px;
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    background-color: rgba(0, 247, 255, 0.4);
  }

  @media screen and (max-width: 1280px) {
    max-width: 320px;
    padding: 8px;

    &__box-title p {
      font-size: 13px;
    }

    &__bar-right {
      font-size: 13px;
    }
  }

  @media screen and (min-width: 1920px) {
    max-width: 400px;

    &__bar-right {
      font-size: 15px;
    }
  }
}
</style>
