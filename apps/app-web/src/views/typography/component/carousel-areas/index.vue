<!--
  组件名称：CarouselAreas（描述文字 + 区域列表轮播）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB111.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（UI 库，a-carousel 自动按需注册）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .carousel-areas 根元素）：
    --ca-bg              #0b2f4a    组件深色背景
    --ca-desc            #acc5e2    描述文字色
    --ca-text            #ffffff    区域名称文字色
    --ca-num             #fff600    区域数值文字色
    --ca-arrow           #049cad    上下翻页箭头颜色
    --ca-arrow-disabled  #9dd1d7    箭头禁用色
    --ca-scrollbar       rgba(0, 247, 255, 0.4)  描述区滚动条滑块色
    --ca-slide-height    145px      轮播内容区高度
    --ca-img-size        100px      区域图片 / 占位块尺寸

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex、cityData 静态数据、plateVO 接口数据，
       已全部去除，改为 mock 数据 + 组件内自包含渲染。
    2. 源组件使用 el-carousel（Element Plus），本项目 UI 库为 ant-design-vue，
       已改为 a-carousel：arrow="never" → :arrows="false"；
       indicator-position="none" → :dots="false"；interval 3000 → :autoplay-speed="3000"；
       v-model + @change → :after-change 回调更新当前页索引；
       ref.next()/ref.prev() 与源一致（a-carousel ref 暴露同名方法）。
    3. 翻页箭头原为 iconfont 类名，本项目无 iconfont，改用内联 SVG 箭头
       （左右方向，颜色 #049cad，禁用 #9dd1d7 cursor not-allowed）。
    4. 边界处理保留源逻辑：首页禁用上一页、末页禁用下一页；
       自动播放仅在数据超过一页（> 4 条）时开启。
    5. 无图片物料：区域图（plateIconUrl）为空时用 CSS 占位块（.space-img），
       无需 assets 目录。
    6. 响应式：≤1280 收缩、1281–1919 常规、≥1920 放大三档适配。
-->
<template>
  <div class="carousel-areas">
    <!-- 描述区 -->
    <p class="carousel-areas__desc">
      <span v-html="description"></span>
    </p>

    <!-- 轮播区 -->
    <div class="carousel-areas__pic-box">
      <button
        v-if="carouselItemLength > 1"
        type="button"
        class="carousel-areas__arrow carousel-areas__arrow--left"
        :class="{ 'carousel-areas__arrow--disabled': carouselIndex === 0 }"
        :disabled="carouselIndex === 0"
        @click="prevCarousel"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M10 3 L5 8 L10 13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button
        v-if="carouselItemLength > 1"
        type="button"
        class="carousel-areas__arrow carousel-areas__arrow--right"
        :class="{
          'carousel-areas__arrow--disabled':
            carouselIndex === carouselItemLength - 1,
        }"
        :disabled="carouselIndex === carouselItemLength - 1"
        @click="nextCarousel"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M6 3 L11 8 L6 13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <a-carousel
        ref="carouselRef"
        :autoplay="carouselAutoplay"
        :autoplay-speed="3000"
        :dots="false"
        :arrows="false"
        :after-change="handleAfterChange"
      >
        <div
          v-for="pageIndex in carouselItemLength"
          :key="pageIndex"
          class="carousel-areas__page"
        >
          <div class="carousel-areas__list">
            <div
              v-for="(item, idx) in pageData(pageIndex)"
              :key="`${pageIndex}-${idx}`"
              class="carousel-areas__area"
            >
              <img v-if="item.picture" :src="item.picture" alt="" />
              <div v-else class="carousel-areas__space-img"></div>
              <p class="carousel-areas__area-name">{{ item.name }}</p>
              <p class="carousel-areas__area-num">{{ item.number }}</p>
            </div>
          </div>
        </div>
      </a-carousel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

/** 区域项（对应源组件 plateMetricList 中的单条数据） */
interface AreaItem {
  name: string;
  number: number;
  picture: string;
}

/** a-carousel 暴露的方法（本项目自动按需注册，仅声明本组件用到的方法） */
interface CarouselExpose {
  next: () => void;
  prev: () => void;
}

/** mock 数据（对应源组件 plateVO 接口数据） */
const mock: { description: string; dataList: AreaItem[] } = {
  description:
    '这是一段通用介绍文案，用于展示区域列表上方描述区域的排版效果。描述文字支持换行，内容过长时可在区域内滚动查看。',
  dataList: [
    { name: '区域一', number: 128, picture: '' },
    { name: '区域二', number: 96, picture: '' },
    { name: '区域三', number: 75, picture: '' },
    { name: '区域四', number: 210, picture: '' },
    { name: '区域五', number: 152, picture: '' },
    { name: '区域六', number: 88, picture: '' },
    { name: '区域七', number: 143, picture: '' },
    { name: '区域八', number: 64, picture: '' },
  ],
};

const description = mock.description;
const dataList = mock.dataList;

const carouselRef = ref<CarouselExpose>();

/** 每页 4 个，总页数（对应源 carouselItemLength） */
const carouselItemLength = computed(() => Math.ceil(dataList.length / 4));

/** 仅当超过一页时自动播放（对应源 carouselAutoplay） */
const carouselAutoplay = computed(() => dataList.length > 4);

/** 当前页索引（对应源 carouseActionIndex） */
const carouselIndex = ref(0);

/** 取第 page 页的数据（对应源 slice((i - 1) * 4, i * 4)） */
function pageData(page: number): AreaItem[] {
  return dataList.slice((page - 1) * 4, page * 4);
}

/** a-carousel afterChange 回调：同步当前页索引 */
function handleAfterChange(current: number) {
  carouselIndex.value = current;
}

/** 下一页（对应源 nextCarousel） */
function nextCarousel() {
  if (carouselIndex.value === carouselItemLength.value - 1) return;
  carouselRef.value?.next();
}

/** 上一页（对应源 prevCarousel） */
function prevCarousel() {
  if (carouselIndex.value === 0) return;
  carouselRef.value?.prev();
}
</script>

<style lang="scss" scoped>
.carousel-areas {
  --ca-bg: #0b2f4a;
  --ca-desc: #acc5e2;
  --ca-text: #ffffff;
  --ca-num: #fff600;
  --ca-arrow: #049cad;
  --ca-arrow-disabled: #9dd1d7;
  --ca-scrollbar: rgba(0, 247, 255, 0.4);
  --ca-slide-height: 145px;
  --ca-img-size: 100px;

  width: 100%;
  height: 240px;
  box-sizing: border-box;
  padding: 0 10px;
  display: flex;
  align-items: stretch;
  flex-direction: column;
  justify-content: center;
  background: var(--ca-bg);
  border-radius: 8px;

  // ---- 描述区 ----
  &__desc {
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
    overflow: auto;

    span {
      font-size: 14px;
      font-weight: 400;
      color: var(--ca-desc);
      line-height: 1.5;
      white-space: pre-wrap;
    }

    &::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 2px;
      background: var(--ca-scrollbar);
    }

    &::-webkit-scrollbar-track {
      border-radius: 0;
      background: rgba(0, 0, 0, 0);
    }
  }

  // ---- 轮播区 ----
  &__pic-box {
    position: relative;
    height: var(--ca-slide-height);
    display: flex;
    align-items: center;
  }

  &__arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: var(--ca-arrow);
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    z-index: 20;

    &--left {
      left: -10px;
    }

    &--right {
      right: -10px;
    }

    &--disabled {
      color: var(--ca-arrow-disabled);
      cursor: not-allowed;
    }
  }

  // a-carousel 内部结构高度撑满
  :deep(.ant-carousel) {
    width: 100%;

    .slick-slider,
    .slick-list,
    .slick-track,
    .slick-slide {
      height: var(--ca-slide-height);
    }
  }

  &__page {
    height: var(--ca-slide-height);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__list {
    width: 100%;
    display: flex;
    justify-content: space-evenly;
    flex-wrap: wrap;
  }

  &__area {
    width: 25%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;

    img {
      width: var(--ca-img-size);
      height: var(--ca-img-size);
    }
  }

  &__space-img {
    width: var(--ca-img-size);
    height: var(--ca-img-size);
    border-radius: 6px;
    box-sizing: border-box;
    border: 1px solid var(--ca-arrow);
    background: radial-gradient(
      circle,
      rgba(4, 156, 173, 0.35) 0%,
      rgba(4, 156, 173, 0.08) 60%,
      transparent 100%
    );
  }

  &__area-name {
    font-size: 14px;
    font-weight: 400;
    color: var(--ca-text);
    line-height: 22px;
    margin-top: -0.5vh;
    padding-bottom: 5px;
    white-space: pre-wrap;
  }

  &__area-num {
    color: var(--ca-num);
  }

  // ---- 响应式：≤1280 收缩 ----
  @media (max-width: 1280px) {
    height: 210px;

    --ca-slide-height: 130px;
    --ca-img-size: 90px;

    &__desc span {
      font-size: 12px;
    }
  }

  // ---- 响应式：≥1920 放大 ----
  @media (min-width: 1920px) {
    height: 260px;

    --ca-slide-height: 155px;
    --ca-img-size: 108px;

    &__desc span {
      font-size: 15px;
    }
  }
}
</style>
