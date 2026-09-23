<!--
  组件名称：RiverCards（河段卡片轮播）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB114.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（UI 库，本组件未使用其组件）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .river-cards 根元素）：
    --rc-bg             #0b2f4a                  组件深色背景
    --rc-name           #ffffff                  卡片名称文字色
    --rc-total          #00f6ff                  卡片数值文字色 + 分页点激活色
    --rc-unit           #ffffff                  卡片单位文字色
    --rc-item-text      rgba(255, 255, 255, 0.5) 卡片指标文案文字色
    --rc-dot            #066c80                  分页点默认色
    --rc-img-placeholder #2fa8c4                 卡片图片占位色块颜色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex、plateVO 接口数据
       （plateMetricGroupList），已全部去除，改为 mock 数据 + 组件内自包含渲染。
    2. 源组件使用 swiper.js（slidesPerView auto、centeredSlides、loop、
       autoplay 5000、分页 clickable）。本项目无 swiper，且 a-carousel 不支持
       多卡片每屏 + 居中效果，故按任务要求实现自定义轮播：
       - overflow hidden 视口 + flex 轨道，transform: translateX 按卡片步长平移；
       - 每屏显示 3 张卡片（步长 = 视口宽度 / 3，挂载时按实际尺寸计算）；
       - 卡片居中：初始平移 +1 步长（translateX = (1 - index) * 步长）；
       - 自动播放 5000ms（setInterval，onBeforeUnmount 清除）；
       - loop：末尾直接回绕到开头（关闭过渡避免长距离回滑）；
       - 底部自定义分页点：点击切换，激活 #00f6ff / 默认 #066c80。
    3. 卡片图片原为接口图（plateIconUrl），本组件用 CSS 色块占位
       （mock 数据提供 picture 字段，有值时渲染图片）。
    4. 图片物料已拷贝至本组件 assets/（river-bg、base-bg），样式相对路径引用。
    5. 响应式：≤1280 收缩、1281–1919 常规、≥1920 放大三档适配。
-->
<template>
  <div class="river-cards">
    <!-- 轮播视口 -->
    <div ref="viewportRef" class="river-cards__viewport">
      <div
        ref="trackRef"
        class="river-cards__track"
        :class="{ 'river-cards__track--single': cardList.length === 1 }"
      >
        <div v-for="(card, index) in cardList" :key="index" class="river-cards__item">
          <div class="river-cards__image">
            <img v-if="card.picture" :src="card.picture" alt="" />
            <div v-else class="river-cards__image-placeholder"></div>
          </div>
          <div class="river-cards__info">
            <span class="river-cards__name">{{ card.name }}</span>
            <span class="river-cards__total"
              >{{ card.total }}<span class="river-cards__unit">{{ card.unit }}</span>
            </span>
            <div
              v-for="(text, idx) in card.itemList"
              :key="idx"
              class="river-cards__item-text"
            >
              <span>{{ text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义分页点 -->
    <div v-if="cardList.length > 1" class="river-cards__pagination">
      <span
        v-for="(card, index) in cardList"
        :key="index"
        class="river-cards__dot"
        :class="{ 'river-cards__dot--active': currentIndex === index }"
        @click="goToSlide(index)"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/** 河段卡片项（对应源组件 plateMetricGroupList 中的单条数据） */
interface RiverCard {
  name: string;
  total: number;
  unit: string;
  picture: string;
  itemList: string[];
}

/** mock 数据（对应源组件 plateMetricGroupList） */
const cardList: RiverCard[] = [
  {
    name: '河段一',
    total: 128,
    unit: '单位',
    picture: '',
    itemList: ['指标一：128', '指标二：96'],
  },
  {
    name: '河段二',
    total: 96,
    unit: '单位',
    picture: '',
    itemList: ['指标一：96', '指标二：75'],
  },
  {
    name: '河段三',
    total: 210,
    unit: '单位',
    picture: '',
    itemList: ['指标一：210', '指标二：152', '指标三：88'],
  },
  {
    name: '河段四',
    total: 152,
    unit: '单位',
    picture: '',
    itemList: ['指标一：152', '指标二：143'],
  },
  {
    name: '河段五',
    total: 64,
    unit: '单位',
    picture: '',
    itemList: ['指标一：64', '指标二：186'],
  },
];

/** 卡片间距（px，对应源 swiper spaceBetween 10） */
const CARD_GAP = 10;

/** 自动播放间隔（ms，对应源 swiper autoplay delay 5000） */
const AUTOPLAY_DELAY = 5000;

const viewportRef = ref<HTMLDivElement>();
const trackRef = ref<HTMLDivElement>();

/** 当前居中卡片索引 */
const currentIndex = ref(0);

/** 每次平移的步长（卡片宽度 + 间距 = 视口宽度 / 3，挂载时按实际尺寸计算） */
const cardStep = ref(0);

let autoTimer: ReturnType<typeof setInterval> | null = null;
let resizeObserver: ResizeObserver | null = null;

/** 计算步长：视口宽度 / 3（每屏 3 张卡片） */
function updateCardStep() {
  const viewport = viewportRef.value;
  if (!viewport) return;
  cardStep.value = viewport.offsetWidth / 3;
}

/** 移动到第 index 张卡片并居中显示 */
function goToSlide(index: number) {
  const track = trackRef.value;
  if (!track || cardList.length === 0) return;
  const target = ((index % cardList.length) + cardList.length) % cardList.length;
  track.style.transition = 'transform 0.5s ease';
  // 单卡片：轨道居中；多卡片：平移使目标卡片位于视口中央
  track.style.transform =
    cardList.length === 1
      ? 'translateX(0px)'
      : `translateX(${(1 - target) * cardStep.value}px)`;
  currentIndex.value = target;
}

/** 自动播放：下一张，末尾回绕到开头（对应源 swiper loop + autoplay） */
function nextSlide() {
  if (currentIndex.value >= cardList.length - 1) {
    // 末尾直接回绕到开头（关闭过渡，避免长距离回滑）
    const track = trackRef.value;
    if (track) {
      track.style.transition = 'none';
      track.style.transform = 'translateX(0px)';
    }
    currentIndex.value = 0;
    return;
  }
  goToSlide(currentIndex.value + 1);
}

/** 启动自动播放（对应源 swiper autoplay） */
function startAutoplay() {
  stopAutoplay();
  if (cardList.length <= 1) return;
  autoTimer = setInterval(nextSlide, AUTOPLAY_DELAY);
}

/** 停止自动播放 */
function stopAutoplay() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

onMounted(() => {
  updateCardStep();
  goToSlide(0);
  startAutoplay();
  // 容器尺寸变化（窗口缩放 / 父容器重排）时重算步长并保持当前卡片位置
  if (viewportRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateCardStep();
      goToSlide(currentIndex.value);
    });
    resizeObserver.observe(viewportRef.value);
  }
});

onBeforeUnmount(() => {
  stopAutoplay();
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style lang="scss" scoped>
.river-cards {
  --rc-bg: #0b2f4a;
  --rc-name: #ffffff;
  --rc-total: #00f6ff;
  --rc-unit: #ffffff;
  --rc-item-text: rgba(255, 255, 255, 0.5);
  --rc-dot: #066c80;
  --rc-img-placeholder: #2fa8c4;

  width: 100%;
  box-sizing: border-box;
  padding: 16px 16px 8px;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--rc-bg);
  border-radius: 8px;

  // ---- 轮播视口（overflow hidden，每屏 3 张） ----
  &__viewport {
    width: 100%;
    max-width: 722px; // 3 × 234px + 2 × 10px
    margin: 0 auto;
    overflow: hidden;
  }

  &__track {
    display: flex;
    gap: 10px;
    will-change: transform;

    &--single {
      justify-content: center;
    }
  }

  // ---- 卡片 ----
  &__item {
    width: calc((100% - 20px) / 3);
    flex-shrink: 0;
    box-sizing: border-box;
    height: 21vh;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-image: url('./assets/river-bg.png');
    background-size: 100% 100%;
    padding: 15px;
  }

  &__image {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 115px;
    height: 102px;
    box-sizing: border-box;
    background-image: url('./assets/base-bg.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    padding-bottom: 25px;

    img {
      width: 55px;
      animation: Aniupdown 2.6s ease-in-out infinite;
    }
  }

  &__image-placeholder {
    width: 55px;
    height: 55px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 1px solid var(--rc-img-placeholder);
    background: radial-gradient(
      circle,
      rgba(47, 168, 196, 0.45) 0%,
      rgba(47, 168, 196, 0.12) 60%,
      transparent 100%
    );
    animation: Aniupdown 2.6s ease-in-out infinite;
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__name {
    font-size: 18px;
    font-weight: 400;
    color: var(--rc-name);
  }

  &__total {
    margin-top: 3px;
    font-size: 24px;
    font-weight: bold;
    color: var(--rc-total);

    .river-cards__unit {
      font-size: 16px;
      font-weight: 400;
      color: var(--rc-unit);
    }
  }

  &__item-text {
    margin-top: 7px;
    font-size: 14px;
    font-weight: 400;
    color: var(--rc-item-text);
  }

  // ---- 分页点 ----
  &__pagination {
    display: flex;
    justify-content: center;
    margin-top: 12px;
    min-height: 12px;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--rc-dot);
    margin: 0 4px;
    cursor: pointer;

    &--active {
      background: var(--rc-total);
    }
  }

  // ---- 响应式：≤1280 收缩 ----
  @media (max-width: 1280px) {
    padding: 12px 12px 6px;

    &__item {
      padding: 12px 18px;
      min-height: 185px;
    }

    &__image {
      width: 108px;
      height: 95px;

      img,
      .river-cards__image-placeholder {
        width: 50px;
        height: 50px;
      }
    }

    &__name {
      font-size: 16px;
    }

    &__total {
      font-size: 20px;

      .river-cards__unit {
        font-size: 14px;
      }
    }

    &__item-text {
      font-size: 12px;
    }
  }

  // ---- 响应式：≥1920 放大 ----
  @media (min-width: 1920px) {
    padding: 18px 20px 10px;

    &__item {
      padding: 16px;
    }

    &__image {
      width: 120px;
      height: 106px;

      img,
      .river-cards__image-placeholder {
        width: 58px;
        height: 58px;
      }
    }

    &__name {
      font-size: 20px;
    }

    &__total {
      font-size: 26px;

      .river-cards__unit {
        font-size: 17px;
      }
    }

    &__item-text {
      font-size: 15px;
    }
  }
}

// 卡片图片上下浮动动画（对应源 @keyframes Aniupdown）
@keyframes Aniupdown {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-20%);
  }

  100% {
    transform: translateY(0);
  }
}
</style>
