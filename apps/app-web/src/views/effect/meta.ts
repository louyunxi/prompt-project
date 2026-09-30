/** effect 分类下的全部组件标签枚举 */
export const effectTags = ['导航', '光效', '滚动'] as const;
export type EffectTag = (typeof effectTags)[number];

/** 单条组件元信息：目录名 -> 标签 -> 展示文案 */
export interface EffectMeta {
  name: string;
  tag: EffectTag;
  label: string;
}

/**
 * 顺序与 effectTags 声明顺序一致：导航 → 光效 → 滚动，组内按目录名升序。
 * 与本目录 component/ 下的组件目录一一对应，新增组件需在此登记。
 */
export const effectMeta: EffectMeta[] = [
  { name: 'bounce-sidebar', tag: '导航', label: '弹跳侧栏' },
  { name: 'gooey-nav', tag: '导航', label: '黏性形变导航' },
  { name: 'hook-sidebar', tag: '导航', label: '钩形侧栏' },
  { name: 'proximity-sidebar', tag: '导航', label: '近距感应侧栏' },
  { name: 'fluid-orb', tag: '光效', label: '流体光球' },
  { name: 'grid-reveal', tag: '光效', label: '网格揭开' },
  { name: 'matrix-orb', tag: '光效', label: '点阵光球' },
  { name: 'scroll-progress', tag: '滚动', label: '滚动进度' },
];
