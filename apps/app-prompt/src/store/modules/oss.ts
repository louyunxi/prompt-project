import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { OssGalleryItem } from '@/sdk/oss';

/**
 * OSS 图库状态
 * 持久化 key: `oss-gallery`,只缓存 galleryList。
 * - 刷新时:以 OSS 上的索引文件为准,用 setGallery 覆盖本地
 * - 上传时:用 addItems 合并新条目,再写回 OSS 索引文件
 */
export const useOssStore = defineStore(
  'oss',
  () => {
    const galleryList = ref<OssGalleryItem[]>([]);

    /** 覆盖为指定列表(刷新时以远端为准) */
    const setGallery = (list: OssGalleryItem[]) => {
      galleryList.value = list;
    };

    /** 合并新条目(按 key 去重,新条目排最前,旧的保留) */
    const addItems = (items: OssGalleryItem[]) => {
      const map = new Map<string, OssGalleryItem>();
      for (const it of items) {
        map.set(it.key, it);
      }
      for (const it of galleryList.value) {
        if (!map.has(it.key)) {
          map.set(it.key, it);
        }
      }
      galleryList.value = Array.from(map.values());
    };

    return { galleryList, setGallery, addItems };
  },
  {
    persist: {
      key: 'oss-gallery',
      pick: ['galleryList'],
    },
  },
);
