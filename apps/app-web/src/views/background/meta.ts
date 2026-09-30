/** background 分类下的全部组件标签枚举 */
export const backgroundTags = ['渐变', '图片', '特效'] as const;
export type BackgroundTag = (typeof backgroundTags)[number];

/** 单条组件元信息：目录名 -> 标签 -> 展示文案 */
export interface BackgroundMeta {
  name: string;
  tag: BackgroundTag;
  label: string;
}

/** 顺序：先按标签分组，再按目录名升序（与 /widget、/chart 的 meta 排序策略一致） */
export const backgroundMeta: BackgroundMeta[] = [
  { name: 'gradient-background', tag: '渐变', label: '渐变光斑背景' },
  { name: 'image-background', tag: '图片', label: '图片背景（CSS）' },
  { name: 'img-background', tag: '图片', label: '图片背景（img）' },
  { name: 'effect-background', tag: '特效', label: '粒子上升背景' },
  { name: 'number-rain', tag: '特效', label: '数字雨背景' },
];
