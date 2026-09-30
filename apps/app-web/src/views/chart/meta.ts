/** chart 分类下的全部组件标签枚举 */
export const chartTags = [
  '柱状图',
  '环形图',
  '折线图',
  '饼图',
  '数据展示',
] as const;
export type ChartTag = (typeof chartTags)[number];

/** 单条组件元信息：目录名 -> 标签 -> 展示文案 */
export interface ChartMeta {
  name: string;
  tag: ChartTag;
  label: string;
}

/** 顺序：先按标签分组，再按目录名升序（与 /widget 的 meta 排序策略一致） */
export const chartMeta: ChartMeta[] = [
  // 现有图表
  { name: 'bubble-bar', tag: '柱状图', label: '气泡象形柱状图' },
  { name: 'gradient-bar', tag: '柱状图', label: '水平渐变柱状图' },
  { name: 'group-bar', tag: '柱状图', label: '分组渐变柱状图' },
  { name: 'drone-city-ranking-top5', tag: '柱状图', label: '地市投入排行 Top5' },
  { name: 'donut', tag: '环形图', label: '双环环形图' },
  { name: 'donut-ring', tag: '环形图', label: '环形占比图' },
  { name: 'assets-structure-analysis', tag: '环形图', label: '资产结构占比' },
  { name: 'line-area', tag: '折线图', label: '多系列渐变面积折线图' },
  { name: 'line-trend', tag: '折线图', label: '双折线趋势对比图' },
  { name: 'drone-active-device-trend', tag: '折线图', label: '活跃设备趋势' },
  { name: 'assets-fund-trend', tag: '折线图', label: '资金收支趋势' },
  { name: 'pie-3d', tag: '饼图', label: '3D 立体饼图' },
  { name: 'drone-work-type-distribution', tag: '饼图', label: '作业类型分布' },
  // 数据展示
  { name: 'drone-overview-stats', tag: '数据展示', label: '无人机实时总览' },
  { name: 'drone-realtime-alerts', tag: '数据展示', label: '实时异常告警' },
  { name: 'assets-overview', tag: '数据展示', label: '三资总览' },
  { name: 'assets-land-resource', tag: '数据展示', label: '土地资源分类' },
  { name: 'assets-realtime-warning', tag: '数据展示', label: '实时预警追踪' },
  { name: 'assets-city-ranking', tag: '数据展示', label: '监管指数排行' },
];
