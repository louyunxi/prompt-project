<!--
  组件名称：SensorDevices（传感设备状态卡片轮播）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB122.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（a-carousel / a-tooltip 自动按需注册）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .sensor-devices 根元素）：
    --sd-name-color         #ffffff     设备名称文字色
    --sd-unit-color         #a1d0e2     单位文字色
    --sd-value-color        #00f6ff     数值文字色
    --sd-rule-color         #00a216     ruleName 默认边框/文字色（逐项通过 ruleColor 覆盖）
    --sd-indicator-bg       #0e4372     轮播指示器默认背景
    --sd-indicator-active   #00ffff     轮播指示器激活背景

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、inject $dynamicDashboard（skin3 判断）、
       iotAccess / iotAccessThird 接口、SuffixNumberReg 等外部依赖，已全部去除，
       改为 mock 数据 + 组件内自包含渲染。
    2. 原 el-carousel / el-tooltip（Element Plus）改为 a-carousel / a-tooltip（ant-design-vue），
       arrow="never" 对应 antd 默认 arrows=false；分页指示器仅当数据 > 6 项时显示
       （:dots="deviceList.length > 6"）。
    3. 分页逻辑（每页 6 条，grid 2 列 3 行）保留：mock deviceList 8 条，
       按 6 条/页切分为轮播页，每页 6 个 sensor-item。
    4. 图片物料 device-bg.png 已拷贝至本组件 assets/ 目录，模板相对路径引用。
-->
<template>
  <div class="sensor-devices">
    <a-carousel v-if="carouselList.length" autoplay :dots="deviceList.length > 6">
      <div
        v-for="(pageList, index) in carouselList"
        :key="index"
        class="sensor-devices__list"
      >
        <div
          v-for="item in pageList"
          :key="item.name"
          class="sensor-devices__item"
        >
          <div class="sensor-devices__content">
            <div class="sensor-devices__left">
              <a-tooltip :title="item.name" placement="topLeft">
                <div class="sensor-devices__client-name">{{ item.name }}</div>
              </a-tooltip>
              <div class="sensor-devices__value-unit">
                单位：{{ item.unit }}
              </div>
            </div>
            <div
              class="sensor-devices__right"
              :class="{ 'sensor-devices__right--spic': !item.ruleName }"
            >
              <div class="sensor-devices__sensor-value-unit">
                <a-tooltip :title="String(item.value)" placement="bottom">
                  <div class="sensor-devices__value-unit-num">
                    {{ item.value ?? '--' }}
                  </div>
                </a-tooltip>
              </div>
              <div v-if="item.ruleName" class="sensor-devices__rule-name">
                <span
                  class="sensor-devices__rule-name-text"
                  :style="{
                    color: item.ruleColor,
                    borderColor: item.ruleColor,
                  }"
                >
                  {{ item.ruleName }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-carousel>
    <div v-else class="sensor-devices__no-data">暂无数据</div>
  </div>
</template>

<script setup lang="ts">
/** 传感设备单项（对应源组件 sensorList 中的单条数据） */
interface DeviceItem {
  name: string;
  unit: string;
  value: string | number;
  ruleName: string;
  ruleColor: string;
}

/** mock 传感设备数据（对应源组件 iotAccess 接口返回的 sensorList） */
const deviceList: DeviceItem[] = [
  { name: '设备一', unit: '单位', value: 23.5, ruleName: '正常', ruleColor: '#00a216' },
  { name: '设备二', unit: '单位', value: 45.8, ruleName: '异常', ruleColor: '#e5484d' },
  { name: '设备三', unit: '单位', value: 12.6, ruleName: '', ruleColor: '#00a216' },
  { name: '设备四', unit: '单位', value: 78.2, ruleName: '预警', ruleColor: '#f5a623' },
  { name: '设备五', unit: '单位', value: 33.1, ruleName: '正常', ruleColor: '#00a216' },
  { name: '设备六', unit: '单位', value: 56.9, ruleName: '', ruleColor: '#00a216' },
  { name: '设备七', unit: '单位', value: 89.4, ruleName: '离线', ruleColor: '#9b9b9b' },
  { name: '设备八', unit: '单位', value: 67.3, ruleName: '正常', ruleColor: '#00a216' },
];

/** 每页展示条数（grid 2 列 3 行） */
const PAGE_SIZE = 6;

/** 按每页 6 条切分为轮播页（对应源组件 getListFn 中的分页逻辑） */
const carouselList: DeviceItem[][] = deviceList.reduce<DeviceItem[][]>(
  (pages, _, index) => {
    if (index % PAGE_SIZE === 0) {
      pages.push(deviceList.slice(index, index + PAGE_SIZE));
    }
    return pages;
  },
  [],
);
</script>

<style lang="scss" scoped>
.sensor-devices {
  --sd-name-color: #ffffff;
  --sd-unit-color: #a1d0e2;
  --sd-value-color: #00f6ff;
  --sd-rule-color: #00a216;
  --sd-indicator-bg: #0e4372;
  --sd-indicator-active: #00ffff;

  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  overflow: hidden;

  & :deep(.ant-carousel) {
    height: 100%;
    padding-top: 10px;

    .slick-slider,
    .slick-list,
    .slick-track,
    .slick-slide,
    .slick-slide > div {
      height: 100%;
    }

    .slick-dots {
      bottom: 0;
      li {
        width: 18px;
        height: 4px;
        margin: 0 4px;
        button {
          height: 4px;
          border-radius: 2px;
          background: var(--sd-indicator-bg);
          opacity: 1;
        }
        &.slick-active {
          button {
            background: var(--sd-indicator-active);
          }
        }
      }
    }
  }

  &__list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(3, 1fr);
    grid-gap: 10px;
    height: 100%;
    padding-bottom: 14px;
    box-sizing: border-box;
  }

  &__item {
    min-width: 165px;
    width: 100%;
    padding: 0 10px;
    display: flex;
    align-items: center;
    background: url('./assets/device-bg.png') no-repeat center center;
    background-size: 100% 100%;
  }

  &__content {
    width: 100%;
    font-size: 14px;
    display: flex;
    justify-content: center;
  }

  &__left,
  &__right {
    height: 44px;
    display: flex;
    flex-direction: column;
  }

  &__left {
    justify-content: center;
    min-width: 50%;
  }

  &__right {
    flex: 1;
    &--spic {
      justify-content: center;
    }
  }

  &__client-name {
    width: 100%;
    margin-bottom: 6px;
    font-weight: 400;
    color: var(--sd-name-color);
    font-size: 14px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__sensor-value-unit {
    font-size: 18px;
    color: var(--sd-value-color);
    cursor: pointer;
    text-align: right;
    font-weight: 500;
    margin-bottom: 4px;
  }

  &__value-unit {
    color: var(--sd-unit-color);
    font-size: 12px;
    padding-bottom: 3px;
  }

  &__rule-name {
    text-align: right;
    padding-bottom: 3px;
  }

  &__rule-name-text {
    display: inline-block;
    border: 1px solid var(--sd-rule-color);
    color: var(--sd-rule-color);
    border-radius: 4px;
    padding: 0 4px;
    height: 18px;
    line-height: 16px;
    font-size: 12px;
    box-sizing: border-box;
  }

  &__no-data {
    width: 100%;
    color: var(--sd-unit-color);
    font-size: 18px;
    text-align: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  * {
    box-sizing: border-box;
  }
}
</style>
