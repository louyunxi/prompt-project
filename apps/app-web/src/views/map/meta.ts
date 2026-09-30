/** map 分类下的全部组件标签枚举 */
export const mapTags = ['底图', '区域', '绘制'] as const;
export type MapTag = (typeof mapTags)[number];

/** 单条组件元信息：目录名 -> 标签 -> 展示文案 */
export interface MapMeta {
  name: string;
  tag: MapTag;
  label: string;
}

/** 顺序：先按标签分组，再按目录名升序（与 /chart、/widget 的 meta 排序策略一致） */
export const mapMeta: MapMeta[] = [
  { name: 'anhui-map', tag: '区域', label: '安徽轮廓光晕走线' },
  { name: 'anhui-map-marker', tag: '区域', label: '安徽轮廓 + 监测点' },
  { name: 'areamap', tag: '区域', label: '区域轮廓与蒙层' },
  { name: 'basemap', tag: '底图', label: '天地图卫星底图' },
  { name: 'drawmap', tag: '绘制', label: '地块绘制（点/线/面）' },
];
