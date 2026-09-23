<!--
  组件名称：DescMetrics（描述文字 + 指标能力卡片）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB107.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（UI 库，本组件未使用其组件）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .desc-metrics 根元素）：
    --dm-bg       #05284b    组件深色背景
    --dm-desc     #acc5e2    描述文字色
    --dm-title    #76f2ad    指标标题（数值）文字色
    --dm-text     #ffffff    指标说明文字色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex、plateVO 接口数据，已全部去除，
       改为 mock 数据 + 组件内自包含渲染。
    2. 描述行数动态计算（computedLineClamp）保留源逻辑：
       0 项 → [10, '']；>0 项 → [6, '75px']；>3 项 → [4, '145px']（源 '145' 补全为 '145px'）。
    3. 源 @media max-width:1680px 适配保留（卡片区高度 calc(100% - 40px)、
       river-title 15px margin-bottom 5、river-desc 12px），并补充 ≤1280 / ≥1920 分档。
    4. 卡片背景图 channeng_down.png 已拷贝至本组件 assets/ 目录（命名 kebab-case 为 channeng-down.png），
       样式相对路径引用。
-->
<template>
  <div class="desc-metrics">
    <div class="desc-metrics__desc" :title="mock.title">
      <span
        v-html="mock.title"
        :style="{ WebkitLineClamp: computedLineClamp[0] }"
      ></span>
    </div>

    <div
      v-if="mock.dataList.length"
      class="desc-metrics__cards"
      :style="{ height: computedLineClamp[1] }"
    >
      <div
        v-for="(item, idx) in mock.dataList.slice(0, 6)"
        :key="idx"
        class="desc-metrics__card"
      >
        <p class="desc-metrics__card-title">{{ item.title }}</p>
        <p class="desc-metrics__card-desc">{{ item.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/** 指标卡片单项（对应源组件 plateMetricList 中的单条数据） */
interface MetricCard {
  title: string;
  description: string;
}

/** mock 数据（对应源组件 plateVO 接口数据） */
const mock: { title: string; dataList: MetricCard[] } = {
  title:
    '这是一段通用说明文字，用于展示组件排版效果。该文本演示描述区域随指标数量变化而动态调整行数（无指标 10 行、1-3 项 6 行、3 项以上 4 行）时的省略号截断行为。',
  dataList: [
    { title: '指标一', description: '指标说明文字，用于描述该指标的含义与展示内容。' },
    { title: '指标二', description: '指标说明文字，用于描述该指标的含义与展示内容。' },
    { title: '指标三', description: '指标说明文字，用于描述该指标的含义与展示内容。' },
    { title: '指标四', description: '指标说明文字，用于描述该指标的含义与展示内容。' },
    { title: '指标五', description: '指标说明文字，用于描述该指标的含义与展示内容。' },
    { title: '指标六', description: '指标说明文字，用于描述该指标的含义与展示内容。' },
  ],
};

/**
 * 描述行数与卡片区高度（保留源组件 computedLineClamp 逻辑）：
 *   0 项 → [10, '']；>0 项 → [6, '75px']；>3 项 → [4, '145px']
 */
const computedLineClamp = computed<[number, string]>(() => {
  if (mock.dataList.length === 0) {
    return [10, ''];
  }
  if (mock.dataList.length > 3) {
    return [4, '145px'];
  }
  return [6, '75px'];
});
</script>

<style lang="scss" scoped>
.desc-metrics {
  --dm-bg: #05284b;
  --dm-desc: #acc5e2;
  --dm-title: #76f2ad;
  --dm-text: #ffffff;

  position: relative;
  width: 100%;
  height: 320px;
  padding: 18px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  background: var(--dm-bg);
  border-radius: 8px;

  &__desc {
    box-sizing: border-box;

    span {
      font-size: 14px;
      font-weight: 400;
      color: var(--dm-desc);
      line-height: 1.5;
      word-break: break-all;
      text-overflow: ellipsis;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      white-space: pre-wrap;
    }
  }

  &__cards {
    position: relative;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    height: 145px;
  }

  &__card {
    width: 30%;
    background: url('./assets/channeng-down.png') no-repeat center bottom;
    background-size: contain;
    text-align: center;
    box-sizing: border-box;
    margin-top: 5px;
    margin-right: 10px;
    padding-bottom: 20px;
  }

  &__card-title {
    font-size: 18px;
    font-weight: bold;
    color: var(--dm-title);
    margin-bottom: 10px;
  }

  &__card-desc {
    font-size: 14px;
    font-weight: 400;
    color: var(--dm-text);
  }

  // 源组件 @media max-width: 1680px 适配（保留）
  @media (max-width: 1680px) {
    &__desc {
      font-size: 14px;
      text-indent: 12px;
    }

    &__cards {
      height: calc(100% - 40px);
      margin-left: 4px;
      margin-right: 4px;
    }

    &__card {
      margin-top: 8px;
      padding-bottom: 6px;
    }

    &__card-title {
      font-size: 15px;
      margin-bottom: 5px;
    }

    &__card-desc {
      font-size: 12px;
    }
  }

  // 响应式分档补充：≤1280 收缩、≥1920 放大
  @media (max-width: 1280px) {
    height: 280px;
    padding: 14px 16px;

    &__card-title {
      font-size: 14px;
    }

    &__card-desc {
      font-size: 11px;
    }
  }

  @media (min-width: 1920px) {
    height: 360px;
    padding: 20px 24px;

    &__desc span {
      font-size: 16px;
    }

    &__card-title {
      font-size: 20px;
    }

    &__card-desc {
      font-size: 15px;
    }
  }
}
</style>
