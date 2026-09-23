<!--
  组件名称：FarmingDynamics（农事动态双列表无缝滚动）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB121.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（定义于 <style> 的 .farming-dynamics 上）：
    --fd-bg        #04284a   组件深色背景
    --fd-item-bg   #051b31   列表项背景色
    --fd-title     #00f6ff   名称 / 时间文字色
    --fd-content   #9dd1d7   标题描述文字色
    --fd-dot       #00f6ff   时间轴圆点色
    --fd-line      #065670   时间轴竖线色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、vuex（mapGetters）、接口
       farmRealTimeDynamic / govFarm（$attrs.loading 触发），本组件已全部去除，
       改为组件内自包含渲染 + mock 数据。
    2. 双列表无缝滚动：requestAnimationFrame 每 40ms（stepTime）向上滚动 1px
       （stepNumber），当 scrollY < -(listDomClientHeight + 90) 时重置 scrollY=0
       实现无缝循环；鼠标移入暂停、移出恢复；onBeforeUnmount 取消动画帧。
    3. 源时间格式依赖全局 Date.prototype.format 扩展，本组件内联 formatDate
       （padStart 补零手动格式化 yyyy.MM.dd hh:mm）。
    4. 时间轴保留源视觉：圆点（before）+ 竖线（after）。
    5. 该组件无图片物料，无需 assets 资源目录。
-->
<template>
  <div class="farming-dynamics">
    <div
      v-if="mockDataList.length"
      ref="scrollContainerRef"
      class="farming-dynamics__scroll-container"
      @mouseenter="setScroll(false)"
      @mouseleave="setScroll(true)"
    >
      <ul
        ref="scrollListRef"
        class="farming-dynamics__scroll-list"
        :style="{ transform: `translateY(${scrollY}px)` }"
      >
        <li
          v-for="(item, index) in mockDataList"
          :key="index"
          class="farming-dynamics__item"
        >
          <div class="farming-dynamics__header">
            <p class="farming-dynamics__name">{{ item.name }}</p>
            <p class="farming-dynamics__time">{{ formatDate(item.time) }}</p>
          </div>
          <p class="farming-dynamics__content">{{ item.title }}</p>
        </li>
      </ul>

      <ul
        v-if="isHasScrollHeight()"
        class="farming-dynamics__scroll-list"
        :style="{ marginTop: '90px', transform: `translateY(${scrollY}px)` }"
      >
        <li
          v-for="(item, index) in mockDataList"
          :key="`copy-${index}`"
          class="farming-dynamics__item"
        >
          <div class="farming-dynamics__header">
            <p class="farming-dynamics__name">{{ item.name }}</p>
            <p class="farming-dynamics__time">{{ formatDate(item.time) }}</p>
          </div>
          <p class="farming-dynamics__content">{{ item.title }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

/** 动态单项数据（对应源 farmName / title / operationTime 字段） */
interface DynamicsItem {
  name: string;
  title: string;
  time: string;
}

/** mock 动态列表（字段与文案已通用化） */
const mockDataList: DynamicsItem[] = [
  { name: '人员一', title: '完成元素区域的日常巡检与记录整理，处理异常反馈。', time: '2026-09-20 08:30:00' },
  { name: '人员二', title: '对重点环节执行例行检查，登记现场情况并归档。', time: '2026-09-20 08:12:00' },
  { name: '人员三', title: '跟进遗留问题的整改进度，更新执行任务台账。', time: '2026-09-20 07:55:00' },
  { name: '人员四', title: '组织相关人员进行专项培训，讲解操作注意事项。', time: '2026-09-19 18:40:00' },
  { name: '人员五', title: '完成周期性数据采集与汇总，生成阶段分析说明。', time: '2026-09-19 16:20:00' },
  { name: '人员六', title: '开展现场抽样核验，比对记录数据并修正差异项。', time: '2026-09-19 14:05:00' },
  { name: '人员七', title: '协调资源完成物资调度，保障后续任务顺利开展。', time: '2026-09-19 11:30:00' },
  { name: '人员八', title: '检查设备运行状态，及时上报异常并跟踪处置结果。', time: '2026-09-19 09:15:00' },
  { name: '人员九', title: '汇总本周执行情况，撰写工作总结与改进建议。', time: '2026-09-18 17:50:00' },
  { name: '人员十', title: '部署下阶段执行计划，明确分工与时间节点安排。', time: '2026-09-18 15:25:00' },
];

/** 时间格式化：yyyy.MM.dd hh:mm（替代源全局 Date.prototype.format 扩展） */
function formatDate(time: string): string {
  const date = new Date(time);
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 隔多少毫秒滚动一次 */
const stepTime = 40;
/** 每次滚动的距离（px） */
const stepNumber = 1;

/** 滚动的垂直距离 */
const scrollY = ref(0);
/** 滚动容器引用 */
const scrollContainerRef = ref<HTMLDivElement>();
/** 主列表引用（用于测量列表高度） */
const scrollListRef = ref<HTMLUListElement>();

let containerDomClientHeight = 0;
let listDomClientHeight = 0;
let isScrolling = true;
let animFrameId = 0;
let lastExecutionTime = 0;

/** 是否存在滚动高度（内容高度是否超过容器高度） */
function isHasScrollHeight() {
  return listDomClientHeight - containerDomClientHeight > 0;
}

/** 单步滚动：向上移动 stepNumber px，越界时回到顶部实现无缝循环 */
function scrollStep() {
  if (!isScrolling || !isHasScrollHeight()) return;
  scrollY.value -= stepNumber;
  if (scrollY.value < -listDomClientHeight - 90) {
    scrollY.value = 0;
  }
}

/** 动画帧循环：按 stepTime 节流执行滚动 */
function animateFn(currentTime: number) {
  if (currentTime - lastExecutionTime >= stepTime) {
    scrollStep();
    lastExecutionTime = currentTime;
  }
  animFrameId = requestAnimationFrame(animateFn);
}

/** 鼠标移入暂停 / 移出恢复 */
function setScroll(running: boolean) {
  isScrolling = running;
}

onMounted(() => {
  nextTick(() => {
    containerDomClientHeight = scrollContainerRef.value?.clientHeight ?? 0;
    listDomClientHeight = scrollListRef.value?.clientHeight ?? 0;
    if (isHasScrollHeight()) {
      animFrameId = requestAnimationFrame(animateFn);
    }
  });
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrameId);
});
</script>

<style lang="scss" scoped>
.farming-dynamics {
  --fd-bg: #04284a;
  --fd-item-bg: #051b31;
  --fd-title: #00f6ff;
  --fd-content: #9dd1d7;
  --fd-dot: #00f6ff;
  --fd-line: #065670;

  box-sizing: border-box;
  width: 100%;
  height: 400px;
  background: var(--fd-bg);
  position: relative;

  &__scroll-container {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow-y: hidden;
  }

  &__scroll-list {
    box-sizing: border-box;
    padding: 16px 16px 0 46px;
  }

  &__item {
    position: relative;
    margin-bottom: 12px;
    padding: 10px 12px;
    background-color: var(--fd-item-bg);
    font-size: 14px;
    line-height: 20px;

    &::before {
      content: '';
      display: inline-block;
      width: 10px;
      height: 10px;
      background-color: var(--fd-dot);
      border-radius: 50%;
      position: absolute;
      top: 0;
      left: -30px;
      z-index: 2;
    }

    &::after {
      content: '';
      display: inline-block;
      height: calc(100% + 16px);
      position: absolute;
      top: 0;
      left: -25px;
      border-left: 1px solid var(--fd-line);
    }

    &:last-child::after {
      border: none;
    }
  }

  &__header {
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    color: var(--fd-title);
    font-weight: bold;
  }

  &__name {
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    min-width: 114px;
    text-align: right;
    font-weight: normal;
  }

  &__content {
    color: var(--fd-content);
  }

  @media (max-width: 1280px) {
    height: 340px;

    &__item {
      font-size: 13px;
      line-height: 18px;
    }

    &__time {
      min-width: 100px;
      font-size: 12px;
    }
  }

  @media (min-width: 1920px) {
    height: 460px;

    &__item {
      font-size: 15px;
    }
  }
}
</style>
