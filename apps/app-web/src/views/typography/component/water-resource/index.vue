<!--
  组件名称：WaterResource（描述文字 + 指标图标轮播）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB105.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（a-carousel 自动按需注册）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .water-resource 根元素）：
    --wr-bg          #05284b    组件深色背景
    --wr-desc        #acc5e2    描述文字色
    --wr-label       #ffffff    指标名称文字色
    --wr-value       #00f6ff    指标数值文字色
    --wr-icon-from   #0afcff    占位图标渐变起始色
    --wr-icon-to     #0ca0fe    占位图标渐变结束色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex、plateVO 接口数据，已全部去除，
       改为 mock 数据 + 组件内自包含渲染。
    2. 原 el-carousel（Element Plus）改为 a-carousel（ant-design-vue）：
       indicator-position="none" → :dots="false"；arrow="hover"/"never" →
       :arrows="pageList.length > 1"；interval=4000 → autoplay + :autoplay-speed="4000"。
    3. 原依赖函数 arrTrans（按每 n 个分组的数组分组函数）已内联进本组件。
    4. 89x89 指标图源为接口图片（plateIconUrl），改为 CSS 渐变圆形 + 白点占位图标，
       无图片物料，无需 assets 目录。
-->
<template>
  <div class="water-resource">
    <div class="water-resource__desc" :title="mock.description">
      <span
        v-html="mock.description"
        :style="{ WebkitLineClamp: mock.dataList.length > 0 ? 2 : 8 }"
      ></span>
    </div>

    <a-carousel
      v-if="pageList.length"
      autoplay
      :autoplay-speed="4000"
      :dots="false"
      :arrows="pageList.length > 1"
      class="water-resource__carousel"
    >
      <div
        v-for="(itemList, index) in pageList"
        :key="index"
        class="water-resource__page"
      >
        <div
          v-for="(item, idx) in itemList"
          :key="idx"
          class="water-resource__col"
        >
          <i class="water-resource__col-pic"></i>
          <p class="water-resource__col-label">{{ item.label }}</p>
          <p class="water-resource__col-value">
            {{ (item.value || '') + (item.unit || '') }}
          </p>
        </div>
      </div>
    </a-carousel>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/** 指标单项（对应源组件 plateMetricList 中的单条数据） */
interface MetricItem {
  label: string;
  value: number | string;
  unit: string;
  iconUrl: string;
}

/** 每页指标条数 */
const PAGE_SIZE = 3;

/** mock 数据（对应源组件 plateVO 接口数据） */
const mock: { description: string; dataList: MetricItem[] } = {
  description:
    '这是一段通用说明文字，用于展示文字排版与多行省略效果。当指标数据存在时，描述最多展示两行，超出部分以省略号截断；该组件同时演示图文混合的自动轮播排版。',
  dataList: [
    { label: '指标一', value: 128, unit: '单位', iconUrl: '' },
    { label: '指标二', value: 86.5, unit: '单位', iconUrl: '' },
    { label: '指标三', value: 52, unit: '单位', iconUrl: '' },
    { label: '指标四', value: 234, unit: '单位', iconUrl: '' },
    { label: '指标五', value: 167, unit: '单位', iconUrl: '' },
    { label: '指标六', value: 99.9, unit: '单位', iconUrl: '' },
  ],
};

/** 数组分组：把数组按每 num 个一组切分（拷贝自源项目 @/utils/utils） */
function arrTrans<T>(num: number, arr: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += num) {
    result.push(arr.slice(i, i + num));
  }
  return result;
}

/** 指标列表按每页 3 条分组，作为轮播页（对应源组件 dataList） */
const pageList = computed(() => arrTrans(PAGE_SIZE, mock.dataList));
</script>

<style lang="scss" scoped>
.water-resource {
  --wr-bg: #05284b;
  --wr-desc: #acc5e2;
  --wr-label: #ffffff;
  --wr-value: #00f6ff;
  --wr-icon-from: #0afcff;
  --wr-icon-to: #0ca0fe;

  position: relative;
  width: 100%;
  height: 320px;
  padding: 18px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  background: var(--wr-bg);
  border-radius: 8px;
  overflow: hidden;

  &__desc {
    display: flex;
    align-items: center;
    padding: 0 10px;
    font-weight: 400;
    font-size: 14px;
    color: var(--wr-desc);

    span {
      line-height: 24px;
      word-break: break-all;
      text-overflow: ellipsis;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      white-space: pre-wrap;
    }
  }

  &__carousel {
    height: 145px;
    margin-top: 12px;

    :deep(.slick-slider),
    :deep(.slick-list),
    :deep(.slick-track),
    :deep(.slick-slide) {
      height: 100%;
    }
  }

  &__page {
    height: 100%;
  }

  &__col {
    width: 33.33%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__col-pic {
    position: relative;
    width: 89px;
    height: 89px;
    display: block;
    margin-bottom: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--wr-icon-from), var(--wr-icon-to));

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 24px;
      height: 24px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
    }
  }

  &__col-label {
    font-size: 12px;
    line-height: 22px;
    text-align: center;
    color: var(--wr-label);
  }

  &__col-value {
    text-align: center;
    font-weight: bold;
    font-size: 14px;
    line-height: 24px;
    color: var(--wr-value);
  }

  // 响应式三档：默认 1281-1919，向下 1280 收缩、向上 1920 放大
  @media (max-width: 1280px) {
    height: 280px;
    padding: 14px 16px;

    &__desc {
      font-size: 12px;

      span {
        line-height: 20px;
      }
    }

    &__carousel {
      height: 118px;
      margin-top: 8px;
    }

    &__col-pic {
      width: 70px;
      height: 70px;
      margin-bottom: 6px;
    }

    &__col-label {
      font-size: 11px;
      line-height: 18px;
    }

    &__col-value {
      font-size: 12px;
      line-height: 20px;
    }
  }

  @media (min-width: 1920px) {
    height: 360px;
    padding: 20px 24px;

    &__carousel {
      height: 165px;
      margin-top: 16px;
    }

    &__col-pic {
      width: 100px;
      height: 100px;
      margin-bottom: 12px;
    }

    &__col-label {
      font-size: 13px;
      line-height: 24px;
    }

    &__col-value {
      font-size: 16px;
      line-height: 26px;
    }
  }
}
</style>
