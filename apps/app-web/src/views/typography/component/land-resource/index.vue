<!--
  组件名称：LandResource（总览头部统计 + 指标卡片轮播）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB101.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（a-carousel 自动按需注册）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .land-resource 根元素）：
    --lr-bg          #05284b    组件深色背景
    --lr-icon-from   #0afcff    占位图标渐变起始色
    --lr-icon-to     #0ca0fe    占位图标渐变结束色
    --lr-tit         #ffffff    头部标题文字色
    --lr-total       #fed45e    总览数值文字色
    --lr-unit        #fed45e    头部单位文字色
    --lr-nav-tit     #9dd1d7    指标名称文字色
    --lr-nav-num     #00f6ff    指标数值文字色
    --lr-nav-unit    #00f6ff    指标单位文字色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex、plateVO 接口数据，已全部去除，
       改为 mock 数据 + 组件内自包含渲染。
    2. 原 el-carousel（Element Plus）改为 a-carousel（ant-design-vue）：
       indicator-position="none" → :dots="false"；arrow="hover"/"never" →
       :arrows="pageList.length > 1"；loop=false 对应 antd 的 :infinite="false"（无限循环开关）。
    3. 原依赖函数 arrTrans（按每 n 个分组的数组分组函数）已内联进本组件。
    4. 头部背景图 bg-bkmb101.png 已拷贝至本组件 assets/ 目录，样式相对路径引用；
       头部 picture 图标与指标图标源为接口图片（plateIconUrl），改为 CSS 渐变圆点占位，避免过度依赖图片。
-->
<template>
  <div class="land-resource">
    <div class="land-resource__header">
      <div class="land-resource__header-icon">
        <i class="land-resource__header-dot"></i>
      </div>
      <p class="land-resource__tit">{{ mock.title || '' }}</p>
      <div class="land-resource__total-row">
        <span class="land-resource__total">{{ mock.totalValue }}</span>
        <span class="land-resource__unit">{{ mock.unit || '' }}</span>
      </div>
    </div>

    <div v-if="pageList.length" class="land-resource__box">
      <a-carousel
        :infinite="false"
        :autoplay="false"
        :dots="false"
        :arrows="pageList.length > 1"
      >
        <div
          v-for="(itemList, index) in pageList"
          :key="index"
          class="land-resource__page"
        >
          <div class="land-resource__nav">
            <div
              v-for="(item, i) in itemList"
              :key="i"
              class="land-resource__nav-info"
            >
              <i class="land-resource__nav-icon"></i>
              <p class="land-resource__nav-tit">{{ item.name }}</p>
              <p class="land-resource__nav-value">
                <span class="land-resource__nav-num">{{ item.value }}</span>
                <span class="land-resource__nav-unit">{{ item.unit }}</span>
              </p>
            </div>
          </div>
        </div>
      </a-carousel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/** 指标单项（对应源组件 plateMetricList 中的单条数据） */
interface MetricItem {
  name: string;
  value: number;
  unit: string;
  iconUrl: string;
}

/** 总览头部数据（对应源组件 plateMetricGroupList[0]） */
interface LandOverview {
  title: string;
  totalValue: number;
  unit: string;
  iconUrl: string;
  itemList: MetricItem[];
}

/** 每页指标条数 */
const PAGE_SIZE = 3;

/** mock 总览数据（对应源组件 plateVO 接口数据） */
const mock: LandOverview = {
  title: '总览',
  totalValue: 12345,
  unit: '单位',
  iconUrl: '',
  itemList: [
    { name: '指标一', value: 123, unit: '单位', iconUrl: '' },
    { name: '指标二', value: 456, unit: '单位', iconUrl: '' },
    { name: '指标三', value: 789, unit: '单位', iconUrl: '' },
    { name: '指标四', value: 234, unit: '单位', iconUrl: '' },
    { name: '指标五', value: 567, unit: '单位', iconUrl: '' },
    { name: '指标六', value: 890, unit: '单位', iconUrl: '' },
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

/** 指标列表按每页 3 条分组，作为轮播页（对应源组件 list.farmland） */
const pageList = computed(() => arrTrans(PAGE_SIZE, mock.itemList));
</script>

<style lang="scss" scoped>
.land-resource {
  --lr-bg: #05284b;
  --lr-icon-from: #0afcff;
  --lr-icon-to: #0ca0fe;
  --lr-tit: #ffffff;
  --lr-total: #fed45e;
  --lr-unit: #fed45e;
  --lr-nav-tit: #9dd1d7;
  --lr-nav-num: #00f6ff;
  --lr-nav-unit: #00f6ff;

  position: relative;
  width: 100%;
  height: 300px;
  padding: 18px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--lr-bg);
  border-radius: 8px;

  &__header {
    position: relative;
    flex-shrink: 0;
    width: 362px;
    height: 120px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: url('./assets/bg-bkmb101.png') no-repeat center center;
    background-size: contain;
    padding-left: 155px;

    &-icon {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 155px;
    }

    &-dot {
      position: absolute;
      top: 37px;
      left: 37px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--lr-icon-from), var(--lr-icon-to));
    }
  }

  &__tit {
    font-size: 18px;
    font-weight: bold;
    color: var(--lr-tit);
    margin-bottom: 16px;
  }

  &__total-row {
    display: flex;
    align-items: baseline;
  }

  &__total {
    font-size: 30px;
    font-weight: bold;
    color: var(--lr-total);
  }

  &__unit {
    font-size: 14px;
    color: var(--lr-unit);
    margin-left: 12px;
  }

  &__box {
    flex: 1;
    min-height: 0;
    width: 100%;
    margin-top: 10px;

    :deep(.ant-carousel) {
      height: 100%;

      .slick-slider,
      .slick-list,
      .slick-track,
      .slick-slide {
        height: 100%;
      }
    }
  }

  &__page {
    height: 100%;
  }

  &__nav {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
  }

  &__nav-info {
    width: 33.33%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
  }

  &__nav-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--lr-icon-from), var(--lr-icon-to));
  }

  &__nav-tit {
    font-size: 14px;
    font-weight: 400;
    color: var(--lr-nav-tit);
  }

  &__nav-value {
    display: flex;
    align-items: baseline;
  }

  &__nav-num {
    font-size: 16px;
    font-weight: bold;
    color: var(--lr-nav-num);
  }

  &__nav-unit {
    padding-left: 10px;
    font-size: 12px;
    font-weight: 400;
    color: var(--lr-nav-unit);
  }

  // 响应式三档：默认 1281-1919，向下 1280 收缩、向上 1920 放大
  @media (max-width: 1280px) {
    height: 260px;
    padding: 14px 16px;

    &__header {
      width: 300px;
      height: 100px;
      padding-left: 128px;

      &-dot {
        top: 28px;
        left: 30px;
        width: 38px;
        height: 38px;
      }
    }

    &__tit {
      font-size: 15px;
      margin-bottom: 12px;
    }

    &__total {
      font-size: 24px;
    }

    &__unit {
      font-size: 12px;
      margin-left: 8px;
    }

    &__nav-icon {
      width: 32px;
      height: 32px;
    }

    &__nav-tit {
      font-size: 12px;
    }

    &__nav-num {
      font-size: 14px;
    }

    &__nav-unit {
      font-size: 11px;
    }
  }

  @media (min-width: 1920px) {
    height: 340px;
    padding: 20px 24px;

    &__tit {
      font-size: 20px;
    }

    &__total {
      font-size: 34px;
    }

    &__nav-tit {
      font-size: 15px;
    }

    &__nav-num {
      font-size: 18px;
    }
  }
}
</style>
