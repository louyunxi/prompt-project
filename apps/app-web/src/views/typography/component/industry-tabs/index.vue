<!--
  组件名称：IndustryTabs（板块导航 + 四角指标排版）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB109.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（UI 库，本组件未使用其组件）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .industry-tabs 根元素）：
    --it-bg                #0b2f4a    组件深色背景
    --it-nav-text          #85b5bd    导航文字色（未选中）
    --it-nav-text-active   #00f6ff    导航 hover/选中文字色 + 底部游标色
    --it-title             #9dd1d7    四角指标标题文字色
    --it-value             #fff600    四角指标数值文字色
    --it-placeholder       #2fa8c4    中心图标占位色块颜色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex、plateVO 接口数据
       （plateMetricGroupList.slice(0, 5)），已全部去除，改为 mock 数据 +
       组件内自包含渲染。
    2. 导航游标移动逻辑保留源算法：_initModuleStyle 初始 left 居中于首个
       tab 下方；_changeModuleStyle 点击后 translateX(distance)（0.3s linear），
       distance = index === 0 ? 0 : elNavItem.offsetLeft + elLine.offsetWidth / 6。
    3. 中心图标原为接口图（plateIconUrl），本组件用 CSS 色块占位
       （mock 数据提供 iconUrl 字段，有值时渲染图片）。
    4. 图片物料已拷贝至本组件 assets/（center-bg、top_left_bg、top_right_bg、
       bottom_left_bg、bottom_right_bg），样式相对路径引用。
    5. 响应式：≤1280 收缩、1281–1919 常规、≥1920 放大三档适配。
-->
<template>
  <div class="industry-tabs">
    <!-- 顶部板块导航（最多 5 个 tab） -->
    <div v-if="tabList.length > 1" class="industry-tabs__nav">
      <div ref="navWrapRef" class="industry-tabs__nav-wrap">
        <div
          v-for="(tab, index) in tabList"
          :key="tab.title"
          class="industry-tabs__nav-item"
          :class="{ 'industry-tabs__nav-item--active': activeIndex === index }"
          @click="switchTab(index)"
        >
          <span>{{ tab.title }}</span>
        </div>
        <span ref="lineActiveRef" class="industry-tabs__line-active"></span>
      </div>
    </div>

    <!-- 内容区：中央背景图 + 四角指标 -->
    <div class="industry-tabs__content">
      <div class="industry-tabs__row industry-tabs__row--top">
        <div class="industry-tabs__corner industry-tabs__corner--left">
          <p class="industry-tabs__corner-title">{{ currentTab.topLeft.title }}</p>
          <p class="industry-tabs__corner-num">
            <span>{{ currentTab.topLeft.value }}</span>{{ currentTab.topLeft.unit }}
          </p>
        </div>
        <div class="industry-tabs__corner industry-tabs__corner--right">
          <p class="industry-tabs__corner-title">{{ currentTab.topRight.title }}</p>
          <p class="industry-tabs__corner-num">
            <span>{{ currentTab.topRight.value }}</span>{{ currentTab.topRight.unit }}
          </p>
        </div>
      </div>
      <div class="industry-tabs__row industry-tabs__row--bottom">
        <div class="industry-tabs__corner industry-tabs__corner--left">
          <p class="industry-tabs__corner-title">{{ currentTab.bottomLeft.title }}</p>
          <p class="industry-tabs__corner-num">
            <span>{{ currentTab.bottomLeft.value }}</span>{{ currentTab.bottomLeft.unit }}
          </p>
        </div>
        <div class="industry-tabs__corner industry-tabs__corner--right">
          <p class="industry-tabs__corner-title">{{ currentTab.bottomRight.title }}</p>
          <p class="industry-tabs__corner-num">
            <span>{{ currentTab.bottomRight.value }}</span>{{ currentTab.bottomRight.unit }}
          </p>
        </div>
      </div>

      <!-- 中央背景图 + 中心图标占位 -->
      <div class="industry-tabs__center">
        <img class="industry-tabs__center-bg" src="./assets/center-bg.png" alt="" />
        <img
          v-if="currentTab.iconUrl"
          class="industry-tabs__center-icon"
          :src="currentTab.iconUrl"
          alt=""
        />
        <div v-else class="industry-tabs__center-placeholder"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';

/** 四角指标项（对应源组件 plateMetricList 中的单条数据） */
interface CornerMetric {
  title: string;
  value: number;
  unit: string;
}

/** 板块 tab 项（对应源组件 plateMetricGroupList 中的单条数据） */
interface IndustryTab {
  title: string;
  topLeft: CornerMetric;
  topRight: CornerMetric;
  bottomLeft: CornerMetric;
  bottomRight: CornerMetric;
  iconUrl: string;
}

/** mock 板块数据（对应源组件 plateMetricGroupList.slice(0, 5)） */
const tabList: IndustryTab[] = [
  {
    title: '板块一',
    topLeft: { title: '指标一', value: 128, unit: '单位' },
    topRight: { title: '指标二', value: 96, unit: '单位' },
    bottomLeft: { title: '指标三', value: 75, unit: '单位' },
    bottomRight: { title: '指标四', value: 210, unit: '单位' },
    iconUrl: '',
  },
  {
    title: '板块二',
    topLeft: { title: '指标五', value: 152, unit: '单位' },
    topRight: { title: '指标六', value: 88, unit: '单位' },
    bottomLeft: { title: '指标七', value: 64, unit: '单位' },
    bottomRight: { title: '指标八', value: 186, unit: '单位' },
    iconUrl: '',
  },
  {
    title: '板块三',
    topLeft: { title: '指标九', value: 213, unit: '单位' },
    topRight: { title: '指标十', value: 105, unit: '单位' },
    bottomLeft: { title: '指标十一', value: 143, unit: '单位' },
    bottomRight: { title: '指标十二', value: 98, unit: '单位' },
    iconUrl: '',
  },
  {
    title: '板块四',
    topLeft: { title: '指标十三', value: 86, unit: '单位' },
    topRight: { title: '指标十四', value: 176, unit: '单位' },
    bottomLeft: { title: '指标十五', value: 121, unit: '单位' },
    bottomRight: { title: '指标十六', value: 54, unit: '单位' },
    iconUrl: '',
  },
  {
    title: '板块五',
    topLeft: { title: '指标十七', value: 234, unit: '单位' },
    topRight: { title: '指标十八', value: 67, unit: '单位' },
    bottomLeft: { title: '指标十九', value: 190, unit: '单位' },
    bottomRight: { title: '指标二十', value: 112, unit: '单位' },
    iconUrl: '',
  },
];

/** 当前选中 tab 索引（对应源 currentDeviceId） */
const activeIndex = ref(0);

/** 当前选中板块 */
const currentTab = computed(() => tabList[activeIndex.value]);

const navWrapRef = ref<HTMLDivElement>();
const lineActiveRef = ref<HTMLSpanElement>();

/** 初始化底部游标：居中于首个 tab 下方（对应源 _initModuleStyle） */
function initLineStyle() {
  const navWrap = navWrapRef.value;
  const line = lineActiveRef.value;
  if (!navWrap || !line) return;
  const firstItem = navWrap.children[0] as HTMLElement | undefined;
  if (!firstItem) return;
  line.style.left = `${(firstItem.offsetWidth - line.offsetWidth) / 2}px`;
}

/** 切换板块并移动游标（对应源 _changeModuleStyle） */
function switchTab(index: number) {
  activeIndex.value = index;
  nextTick(() => {
    const navWrap = navWrapRef.value;
    const line = lineActiveRef.value;
    if (!navWrap || !line) return;
    const navItem = navWrap.children[index] as HTMLElement | undefined;
    if (!navItem) return;
    const distance = index === 0 ? 0 : navItem.offsetLeft + line.offsetWidth / 6;
    line.style.transform = `translateX(${distance}px)`;
    line.style.transition = 'linear 0.3s';
  });
}

onMounted(() => {
  nextTick(() => {
    initLineStyle();
  });
});
</script>

<style lang="scss" scoped>
.industry-tabs {
  --it-bg: #0b2f4a;
  --it-nav-text: #85b5bd;
  --it-nav-text-active: #00f6ff;
  --it-title: #9dd1d7;
  --it-value: #fff600;
  --it-placeholder: #2fa8c4;

  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px 16px;
  background: var(--it-bg);
  border-radius: 8px;

  // ---- 顶部导航 ----
  &__nav {
    width: 100%;
    height: 34px;
    padding-top: 10px;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
  }

  &__nav-wrap {
    display: flex;
    position: relative;
  }

  &__nav-item {
    cursor: pointer;
    height: 100%;
    display: flex;
    align-items: center;
    margin-left: 40px;

    & > span {
      height: 16px;
      font-family: Microsoft YaHei;
      font-size: 16px;
      font-weight: 400;
      color: var(--it-nav-text);
    }

    &:nth-child(1) {
      margin-left: 0;
    }

    &:hover > span,
    &--active > span {
      font-weight: bold;
      color: var(--it-nav-text-active);
    }
  }

  &__line-active {
    position: absolute;
    bottom: -5px;
    width: 30px;
    height: 3px;
    background: var(--it-nav-text-active);
    border-radius: 2px;
  }

  // ---- 内容区 ----
  &__content {
    position: relative;
    width: 100%;
    height: 165px;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    flex: 1;
    font-size: 15px;

    &--bottom {
      margin-top: 5px;
    }
  }

  &__corner {
    width: 123px;
    height: 80px;
    background-repeat: no-repeat;
    background-size: 100% 95%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;

    &--left {
      background-image: url('./assets/top_left_bg.png');
      background-position: top left;

      .industry-tabs__corner-title,
      .industry-tabs__corner-num {
        width: 100%;
        text-align: left;
        padding-left: 10px;
        padding-right: 20px;
        box-sizing: border-box;
      }
    }

    &--right {
      background-image: url('./assets/top_right_bg.png');
      background-position: top right;

      .industry-tabs__corner-title,
      .industry-tabs__corner-num {
        width: 100%;
        text-align: left;
        padding-left: 40px;
        box-sizing: border-box;
      }
    }
  }

  &__row--bottom {
    .industry-tabs__corner--left {
      background-image: url('./assets/bottom_left_bg.png');
      background-position: bottom left;
    }

    .industry-tabs__corner--right {
      background-image: url('./assets/bottom_right_bg.png');
      background-position: bottom right;
    }
  }

  &__corner-title {
    color: var(--it-title);
  }

  &__corner-num {
    color: var(--it-value);
    margin-top: 10px;
    font-size: 12px;

    span {
      font-size: 24px;
    }
  }

  // ---- 中央背景图 + 中心图标 ----
  &__center {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }

  &__center-bg {
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -51%);
    width: 190px;
  }

  &__center-icon {
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -51%);
    width: 70px;
    height: 70px;
  }

  &__center-placeholder {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -51%);
    width: 70px;
    height: 70px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 1px solid var(--it-placeholder);
    background: radial-gradient(
      circle,
      rgba(47, 168, 196, 0.45) 0%,
      rgba(47, 168, 196, 0.12) 60%,
      transparent 100%
    );
  }

  // ---- 响应式：≤1280 收缩 ----
  @media (max-width: 1280px) {
    padding: 10px 12px 12px;

    &__nav {
      height: 30px;
      padding-top: 8px;
    }

    &__nav-item {
      margin-left: 32px;

      & > span {
        font-size: 14px;
        height: 14px;
      }
    }

    &__content {
      height: 150px;
    }

    &__corner {
      width: 112px;
      height: 72px;
    }

    &__corner-title {
      font-size: 13px;
    }

    &__corner-num {
      margin-top: 8px;
      font-size: 10px;

      span {
        font-size: 20px;
      }
    }

    &__center-bg {
      width: 170px;
    }

    &__center-icon,
    &__center-placeholder {
      width: 60px;
      height: 60px;
    }
  }

  // ---- 响应式：≥1920 放大 ----
  @media (min-width: 1920px) {
    padding: 14px 20px 18px;

    &__nav-item {
      margin-left: 48px;

      & > span {
        font-size: 17px;
        height: 17px;
      }
    }

    &__content {
      height: 180px;
    }

    &__corner {
      width: 136px;
      height: 88px;
    }

    &__corner-title {
      font-size: 16px;
    }

    &__corner-num {
      margin-top: 12px;
      font-size: 13px;

      span {
        font-size: 26px;
      }
    }

    &__center-bg {
      width: 210px;
    }

    &__center-icon,
    &__center-placeholder {
      width: 76px;
      height: 76px;
    }
  }
}
</style>
