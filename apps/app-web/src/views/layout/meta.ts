/** layout 分类下的全部组件标签枚举 */
export const layoutTags = ['容器'] as const;
export type LayoutTag = (typeof layoutTags)[number];

/** 单条组件元信息：目录名 -> 标签 -> 展示文案 */
export interface LayoutMeta {
  name: string;
  tag: LayoutTag;
  label: string;
}

/** 顺序：按标签分组，组内按目录名升序（与 /background 的 meta 排序策略一致） */
export const layoutMeta: LayoutMeta[] = [
  { name: 'box-item', tag: '容器', label: 'HUD 卡片容器' },
];
