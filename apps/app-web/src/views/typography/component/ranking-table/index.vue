<!--
  组件名称：RankingTable（排名数据表格 + 图片多图预览）
  来源迁移：D:\sn-project\frp_gov_web\src\components\GovScreen\GSTemp\src\BKMB131.vue

  依赖插件 / 版本：
    - vue ^3.5.13（catalog 统一版本）
    - ant-design-vue ^4.2.6（a-table / a-tooltip / a-image / a-image-preview-group /
      a-empty 自动按需注册）
    - sass（组件内 scoped 样式）

  运行环境 / 版本：
    - node ^20.19.0 || >=22.12.0
    - pnpm >=9.12.0（本仓库 packageManager 固定 pnpm@10.12.4）

  颜色变量（CSS 自定义属性，定义于 .ranking-table 根元素）：
    --rkt-bg         #062238                 组件深色背景
    --rkt-thead      #9dd1d7                 表头文字色
    --rkt-text       #71ccde                 名称文字色
    --rkt-value      #3aadf8                 数值 / 排名数字文字色
    --rkt-first      #f29a76                 第一名行文字色
    --rkt-second     #b4a64d                 第二名行文字色
    --rkt-third      #7281e9                 第三名行文字色
    --rkt-hover      rgba(0,246,255,0.1)     行 hover 背景色
    --rkt-line       rgba(0,246,255,0.2)     表头下边框色
    --rkt-mark-bg    rgba(0,0,0,0.6)         图片「N张」角标背景色
    --rkt-empty      rgba(255,255,255,0.35)  空图片占位文字色

  迁移说明：
    1. 原组件依赖 GSPlate（面板容器）、CustomTable（@/components/common/table）、
       ViewPics（@/components/common/viewPics.vue）、plateVO 接口数据、
       $eventManager 事件发布，已全部去除，改为 mock 数据 + a-table 自包含渲染。
    2. 原 el-table 改为 a-table（ant-design-vue）：:columns / :data-source /
       :pagination="false" / :row-key / :row-class-name（前三名行 + pointer 行）。
       行 hover 背景 rgba(0,246,255,0.1)、行高 40px、thead 背景透明、首列
       padding-left 0 均通过 CSS 覆盖还原。
    3. 原 el-tooltip 改为 a-tooltip；图片预览由 ViewPics 组件改为
       a-image-preview-group 内置预览（plateIconUrl 逗号分割，最多 5 张）。
    4. level 后缀保留：行 1 -> "st"、2 -> "nd"、3 -> "rd"、其余 "th"；
       metricMapParam 控制行 cursor pointer。
    5. 图片列宽度取合理默认 260px（原 isBottomOne 420 / isWidescreen 170 条件
       简化），用 CSS 媒体查询适配不同屏宽字号。
    6. 图片物料 rank-1.png ~ rank-6.png 已拷贝至本组件 assets/ 目录，
       动态 :src 通过 new URL + import.meta.url 生成。
-->
<template>
  <div class="ranking-table">
    <a-table
      :columns="columns"
      :data-source="tableData"
      :pagination="false"
      :row-key="(record) => record?.metricName ?? ''"
      :row-class-name="rowClassName"
      :scroll="{ x: 640 }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'name'">
          <span class="ranking-table__level">
            {{ coverTwo(index) }}
            <em class="ranking-table__level-suffix">{{ levelSuffix(index) }}</em>
          </span>
          <a-tooltip :title="record.metricName" placement="top">
            <span class="ranking-table__name ranking-table__hidetext">
              {{ record.metricName }}
            </span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'value'">
          <span class="ranking-table__cell-value ranking-table__hidetext">
            {{ record.metricValue }}
          </span>
        </template>
        <template v-else-if="column.key === 'unit'">
          <span class="ranking-table__cell-value ranking-table__hidetext">
            {{ record.metricUnit }}
          </span>
        </template>
        <template v-else-if="column.key === 'icon'">
          <div v-if="record.imgList.length" class="ranking-table__img-box">
            <a-image-preview-group>
              <a-image
                v-for="(img, imgIndex) in record.imgList"
                :key="imgIndex"
                :src="img"
                :width="imgIndex === 0 ? 50 : 0"
                :height="imgIndex === 0 ? 50 : 0"
                :style="{ display: imgIndex === 0 ? 'block' : 'none' }"
                class="ranking-table__item-img"
              />
            </a-image-preview-group>
            <p v-if="record.imgList.length > 1" class="ranking-table__item-mark">
              {{ record.imgList.length }}张
            </p>
          </div>
          <div v-else class="ranking-table__img-box ranking-table__img-box--empty">
            -
          </div>
        </template>
      </template>
      <template #emptyText>
        <a-empty description="暂无数据" />
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

/** 排名表格行（对应源组件 plateMetricList 中的单条数据，imgList 为派生字段） */
interface RankRow {
  metricName: string;
  metricValue: number;
  metricUnit: string;
  plateIconUrl: string;
  metricMapParam: boolean;
  imgList: string[];
}

/** 生成 assets 下图片的完整 URL（动态 :src 使用） */
function imgUrl(name: string): string {
  return new URL(`./assets/${name}`, import.meta.url).href;
}

/** 逗号分割图片地址，去空并最多取 5 张（对应源组件 initData 的 imgList 逻辑） */
function splitImgList(url: string): string[] {
  return (url || '')
    .split(/[,，]/)
    .filter((item) => !!item)
    .slice(0, 5);
}

/** mock 排名数据（对应源组件 plateMetricGroupList[0].plateMetricList 接口数据） */
const mockList: Omit<RankRow, 'imgList'>[] = [
  {
    metricName: '条目一',
    metricValue: 98,
    metricUnit: '单位',
    plateIconUrl: `${imgUrl('rank-1.png')},${imgUrl('rank-2.png')}`,
    metricMapParam: true,
  },
  {
    metricName: '条目二',
    metricValue: 87,
    metricUnit: '单位',
    plateIconUrl: `${imgUrl('rank-3.png')}`,
    metricMapParam: true,
  },
  {
    metricName: '条目三',
    metricValue: 76,
    metricUnit: '单位',
    plateIconUrl: `${imgUrl('rank-4.png')},${imgUrl('rank-5.png')},${imgUrl('rank-6.png')}`,
    metricMapParam: true,
  },
  {
    metricName: '条目四',
    metricValue: 65,
    metricUnit: '单位',
    plateIconUrl: '',
    metricMapParam: true,
  },
  {
    metricName: '条目五',
    metricValue: 54,
    metricUnit: '单位',
    plateIconUrl: `${imgUrl('rank-2.png')}`,
    metricMapParam: false,
  },
  {
    metricName: '条目六',
    metricValue: 43,
    metricUnit: '单位',
    plateIconUrl: `${imgUrl('rank-5.png')},${imgUrl('rank-1.png')}`,
    metricMapParam: true,
  },
  {
    metricName: '条目七',
    metricValue: 38,
    metricUnit: '单位',
    plateIconUrl: '',
    metricMapParam: false,
  },
  {
    metricName: '条目八',
    metricValue: 29,
    metricUnit: '单位',
    plateIconUrl: `${imgUrl('rank-6.png')}`,
    metricMapParam: true,
  },
  {
    metricName: '条目九',
    metricValue: 21,
    metricUnit: '单位',
    plateIconUrl: `${imgUrl('rank-3.png')},${imgUrl('rank-4.png')}`,
    metricMapParam: false,
  },
  {
    metricName: '条目十',
    metricValue: 15,
    metricUnit: '单位',
    plateIconUrl: `${imgUrl('rank-1.png')}`,
    metricMapParam: true,
  },
];

/** 表格数据源（预计算每行图片列表） */
const tableData: RankRow[] = mockList.map((row) => ({
  ...row,
  imgList: splitImgList(row.plateIconUrl),
}));

/** 表格列定义（内容通过 #bodyCell 模板按 key 分支渲染） */
const columns: TableColumnsType = [
  { title: '名称', dataIndex: 'metricName', key: 'name' },
  { title: '数值', dataIndex: 'metricValue', key: 'value' },
  { title: '单位', dataIndex: 'metricUnit', key: 'unit' },
  { title: '图片', dataIndex: 'plateIconUrl', key: 'icon', width: 260 },
];

/** 行级样式：前三名行加特殊文字色，metricMapParam 行加 pointer 光标 */
function rowClassName({
  record,
  index,
}: {
  record?: RankRow;
  index: number;
}): string {
  const classes: string[] = [];
  if (index === 0) classes.push('ranking-table__row--first');
  if (index === 1) classes.push('ranking-table__row--second');
  if (index === 2) classes.push('ranking-table__row--third');
  // 开启 :scroll="{ x }" 时 rc-table 会额外渲染一行用于测量横向滚动条宽度的
  // 占位行，该行 record 为 undefined，需做可选链守卫
  if (record?.metricMapParam) classes.push('ranking-table__row--pointer');
  return classes.join(' ');
}

/** 序号补零（对应源组件 coverTwo） */
function coverTwo(num: number): string {
  return num < 9 ? `0${num + 1}` : String(num + 1);
}

/** level 后缀：行 1 -> st、2 -> nd、3 -> rd、其余 th */
function levelSuffix(index: number): string {
  if (index === 0) return 'st';
  if (index === 1) return 'nd';
  if (index === 2) return 'rd';
  return 'th';
}
</script>

<style lang="scss" scoped>
.ranking-table {
  --rkt-bg: #062238;
  --rkt-thead: #9dd1d7;
  --rkt-text: #71ccde;
  --rkt-value: #3aadf8;
  --rkt-first: #f29a76;
  --rkt-second: #b4a64d;
  --rkt-third: #7281e9;
  --rkt-hover: rgba(0, 246, 255, 0.1);
  --rkt-line: rgba(0, 246, 255, 0.2);
  --rkt-mark-bg: rgba(0, 0, 0, 0.6);
  --rkt-empty: rgba(255, 255, 255, 0.35);

  width: 100%;
  height: 100%;
  padding: 12px;
  box-sizing: border-box;
  overflow: auto;
  background: var(--rkt-bg);
  border-radius: 4px;

  :deep(.ant-table) {
    background: transparent;
    color: var(--rkt-text);
  }

  :deep(.ant-table-thead > tr > th) {
    background: transparent;
    border-bottom: 1px solid var(--rkt-line);
    color: var(--rkt-thead);
    font-weight: normal;
    font-size: 14px;
    line-height: 1.3;
    padding: 8px;

    &::before {
      display: none;
    }
  }

  :deep(.ant-table-tbody > tr > td) {
    height: 40px;
    padding: 4px 8px;
    background: transparent;
    font-size: 14px;
    border-bottom: none;
  }

  :deep(.ant-table-tbody > tr.ant-table-row:hover > td) {
    background: var(--rkt-hover) !important;
  }

  :deep(.ant-table-tbody > tr > td:first-child) {
    padding-left: 0;
  }

  :deep(.ranking-table__row--pointer) {
    cursor: pointer;
  }

  :deep(.ranking-table__row--first) {
    .ranking-table__level,
    .ranking-table__cell-value {
      color: var(--rkt-first);
    }
  }

  :deep(.ranking-table__row--second) {
    .ranking-table__level,
    .ranking-table__cell-value {
      color: var(--rkt-second);
    }
  }

  :deep(.ranking-table__row--third) {
    .ranking-table__level,
    .ranking-table__cell-value {
      color: var(--rkt-third);
    }
  }

  &__level {
    position: relative;
    display: inline-block;
    color: var(--rkt-value);
    font-size: 18px;
    font-weight: bold;
    white-space: nowrap;
    padding-right: 25px;
  }

  &__level-suffix {
    position: absolute;
    right: 10px;
    top: 5px;
    font-style: normal;
    font-weight: normal;
    font-size: 12px;
  }

  &__name {
    display: inline-block;
    color: var(--rkt-text);
    line-height: 1.3;
    vertical-align: middle;
  }

  &__cell-value {
    display: inline-block;
    color: var(--rkt-value);
    font-size: 18px;
    font-weight: bold;
    vertical-align: middle;
  }

  &__hidetext {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }

  &__img-box {
    position: relative;
    width: 50px;
    height: 50px;
    cursor: pointer;

    &--empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--rkt-empty);
      cursor: default;
    }
  }

  &__item-img {
    object-fit: cover;
    border-radius: 2px;
  }

  &__item-mark {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 20px;
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    text-align: center;
    line-height: 20px;
    background: var(--rkt-mark-bg);
  }

  @media screen and (max-width: 1280px) {
    padding: 8px;

    :deep(.ant-table-thead > tr > th) {
      font-size: 13px;
      padding: 6px;
    }

    :deep(.ant-table-tbody > tr > td) {
      height: 36px;
      padding: 3px 6px;
      font-size: 13px;
    }

    .ranking-table__level {
      font-size: 16px;
    }

    .ranking-table__cell-value {
      font-size: 16px;
    }
  }

  @media screen and (min-width: 1920px) {
    :deep(.ant-table-thead > tr > th) {
      font-size: 16px;
    }

    :deep(.ant-table-tbody > tr > td) {
      font-size: 16px;
    }

    .ranking-table__level {
      font-size: 21px;
    }

    .ranking-table__cell-value {
      font-size: 21px;
    }
  }
}
</style>
