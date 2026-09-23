<!--
  组件名称：PopulationGender（人口结构男女比例展示）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB116.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 <style> 的 .population-gender 上）：
    --pg-bg           #04284a   组件深色背景
    --pg-title        #ffffff   顶部标题文字色
    --pg-value        #00f6ff   总数值 / 男女数值 / 站点数值色
    --pg-text         #ffffff   男女名称 / 站点名称文字色
    --pg-man          #4379dc   男性数值色
    --pg-woman        #f29b76   女性数值色
    --pg-line         rgba(0, 246, 255, 0.15)   男女区与站点区分隔线
    --pg-icon-a-from  #0afcff   站点图标（第 1 项）色块渐变起始色
    --pg-icon-a-to    #0ca0fe   站点图标（第 1 项）色块渐变结束色
    --pg-icon-b-from  #f29b76   站点图标（第 2 项）色块渐变起始色
    --pg-icon-b-to    #f5802c   站点图标（第 2 项）色块渐变结束色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex（$attrs.loading 接口触发）、plateVO
       接口数据，本组件已全部去除，改为组件内自包含渲染 + mock 数据。
    2. 顶部为「人口结构」标题 + 总人数；中部用 24 个小人一排放置，
       男性小人数量 = parseInt(男/(男+女)*100) / 100 * 24 取整，男性小人盖在
       女性小人上方（视觉与原组件一致）；再往下为男女图例与站点统计。
    3. 站点图标原为接口图片（plateIconUrl），本组件改为 CSS 渐变色块占位。
    4. 图片物料：selfman.png / selfwomen.png / man.png / woman.png
       已拷贝至本组件 assets/ 目录。
-->
<template>
  <div class="population-gender">
    <div class="population-gender__total">
      {{ mockData.title
      }}<span class="population-gender__total-value"
        >{{ mockData.totalValue }}<i class="population-gender__total-unit">{{
          mockData.unit
        }}</i></span
      >
    </div>

    <div class="population-gender__people">
      <div class="population-gender__row">
        <span
          v-for="idx in 24"
          :key="`woman-${idx}`"
          class="population-gender__figure"
        >
          <img src="./assets/selfwomen.png" alt="" />
        </span>
      </div>
      <div class="population-gender__row population-gender__row--male">
        <span
          v-for="idx in 24"
          :key="`man-${idx}`"
          class="population-gender__figure"
          :class="{ 'population-gender__figure--hide': idx > maleCount }"
        >
          <img src="./assets/selfman.png" alt="" />
        </span>
      </div>
    </div>

    <div class="population-gender__sex-types">
      <div class="population-gender__sex-item population-gender__sex-item--man">
        <img src="./assets/man.png" alt="" />
        <span class="population-gender__sex-name">{{
          mockData.genderList[0].name
        }}</span>
        <span class="population-gender__sex-value">{{
          mockData.genderList[0].value
        }}</span>
        <span class="population-gender__sex-unit">{{
          mockData.genderList[0].unit
        }}</span>
      </div>
      <div
        class="population-gender__sex-item population-gender__sex-item--woman"
      >
        <img src="./assets/woman.png" alt="" />
        <span class="population-gender__sex-name">{{
          mockData.genderList[1].name
        }}</span>
        <span class="population-gender__sex-value">{{
          mockData.genderList[1].value
        }}</span>
        <span class="population-gender__sex-unit">{{
          mockData.genderList[1].unit
        }}</span>
      </div>
    </div>

    <div class="population-gender__center-line"></div>

    <div class="population-gender__site-types">
      <div
        v-for="(item, index) in mockData.siteList"
        :key="index"
        class="population-gender__site-item"
      >
        <div class="population-gender__site-icon"></div>
        <div class="population-gender__site-text">
          <p class="population-gender__site-name">{{ item.name }}</p>
          <p class="population-gender__site-value">
            <i class="population-gender__site-count">{{ item.value }}</i>
            <i class="population-gender__site-unit">{{ item.unit }}</i>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/** 男女单项数据 */
interface GenderItem {
  name: string;
  value: number;
  unit: string;
}

/** 站点单项数据 */
interface SiteItem {
  name: string;
  value: number;
  unit: string;
}

/** 组件 mock 数据（对应源组件 plateMetricGroupList 结构，字段已通用化） */
const mockData = {
  title: '人口结构',
  totalValue: 12800,
  unit: '人',
  genderList: [
    { name: '男性', value: 6720, unit: '人' },
    { name: '女性', value: 6080, unit: '人' },
  ] as GenderItem[],
  siteList: [
    { name: '元素一', value: 8620, unit: '人' },
    { name: '元素二', value: 4180, unit: '人' },
  ] as SiteItem[],
};

/** 24 个小人中男性所占数量（对应源组件 isNanMore.munMan 计算逻辑） */
const maleCount = computed(() => {
  const male = Number(mockData.genderList[0]?.value ?? 0);
  const female = Number(mockData.genderList[1]?.value ?? 0);
  const total = male + female;
  if (!total) return 0;
  // 男性占比百分比（两位小数）后取整数值，再换算到 24 个小人并四舍五入
  const percentMan = ((male / total) * 100).toFixed(2);
  const munMan = (parseInt(percentMan, 10) / 100) * 24;
  return Math.round(munMan);
});
</script>

<style lang="scss" scoped>
.population-gender {
  --pg-bg: #04284a;
  --pg-title: #ffffff;
  --pg-value: #00f6ff;
  --pg-text: #ffffff;
  --pg-man: #4379dc;
  --pg-woman: #f29b76;
  --pg-line: rgba(0, 246, 255, 0.15);
  --pg-icon-a-from: #0afcff;
  --pg-icon-a-to: #0ca0fe;
  --pg-icon-b-from: #f29b76;
  --pg-icon-b-to: #f5802c;

  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  padding: 14px 12px;
  background: var(--pg-bg);

  &__total {
    font-size: 18px;
    font-weight: 400;
    color: var(--pg-title);
    text-align: center;

    &-value {
      margin-left: 20px;
      font-size: 24px;
      font-weight: bold;
      color: var(--pg-value);
    }

    &-unit {
      margin-left: 4px;
      font-size: 18px;
      font-style: normal;
    }
  }

  &__people {
    position: relative;
    height: 34px;
    padding: 20px 0;
  }

  &__row {
    display: flex;
    justify-content: space-around;

    &--male {
      position: absolute;
      top: 20px;
      left: 0;
      width: 100%;
    }
  }

  &__figure {
    width: 15px;
    height: 34px;

    img {
      width: 100%;
    }

    &--hide {
      opacity: 0;
    }
  }

  &__sex-types {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__sex-item {
    display: flex;
    align-items: flex-end;

    img {
      height: 20px;
      width: auto;
    }

    &--man {
      .population-gender__sex-value,
      .population-gender__sex-unit {
        color: var(--pg-man);
      }
    }

    &--woman {
      .population-gender__sex-value,
      .population-gender__sex-unit {
        color: var(--pg-woman);
      }
    }
  }

  &__sex-name {
    margin: 0 10px;
    font-size: 14px;
    color: var(--pg-text);
  }

  &__sex-value {
    margin-bottom: -4px;
    font-size: 24px;
    font-weight: bold;
  }

  &__sex-unit {
    font-size: 14px;
  }

  &__center-line {
    border-top: 1px solid var(--pg-line);
  }

  &__site-types {
    display: flex;
    justify-content: space-around;
    padding-top: 10px;
  }

  &__site-item {
    display: flex;
    align-items: center;
  }

  &__site-icon {
    width: 48px;
    height: 48px;
    margin-right: 14px;
    background: linear-gradient(135deg, var(--pg-icon-a-from), var(--pg-icon-a-to));
  }

  &__site-item:nth-child(2) {
    .population-gender__site-icon {
      background: linear-gradient(
        135deg,
        var(--pg-icon-b-from),
        var(--pg-icon-b-to)
      );
    }
  }

  &__site-text {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 48px;
  }

  &__site-name {
    font-size: 14px;
    font-weight: 400;
    color: var(--pg-text);
  }

  &__site-value {
    font-size: 24px;
    color: var(--pg-value);
  }

  &__site-count {
    font-weight: bold;
  }

  &__site-unit {
    margin-left: 4px;
    font-size: 16px;
  }

  @media (max-width: 1280px) {
    &__total {
      font-size: 16px;

      &-value {
        font-size: 20px;
      }

      &-unit {
        font-size: 15px;
      }
    }

    &__figure {
      width: 12px;
      height: 28px;
    }

    &__sex-value {
      font-size: 20px;
    }

    &__site-value {
      font-size: 20px;
    }

    &__site-icon {
      width: 40px;
      height: 40px;
    }
  }

  @media (min-width: 1920px) {
    &__total {
      font-size: 20px;

      &-value {
        font-size: 28px;
      }
    }

    &__figure {
      width: 18px;
      height: 40px;
    }

    &__sex-value {
      font-size: 28px;
    }

    &__site-value {
      font-size: 28px;
    }
  }
}
</style>
