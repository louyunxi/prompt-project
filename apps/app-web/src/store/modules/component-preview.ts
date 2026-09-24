import { defineStore } from 'pinia';
import { ref } from 'vue';

const COMPONENT_PREVIEW_STORAGE_KEY = 'app-web-component-preview';

/** 组件预览页：持久化上次选择的类型与组件，刷新后默认恢复 */
export const useComponentPreviewStore = defineStore(
  'componentPreview',
  () => {
    /** 一级选择器：组件类型 */
    const category = ref<string>();
    /** 二级选择器：组件名 */
    const componentName = ref<string>();

    const setSelection = (c?: string, n?: string) => {
      category.value = c;
      componentName.value = n;
    };

    const clear = () => {
      category.value = undefined;
      componentName.value = undefined;
    };

    return { category, componentName, setSelection, clear };
  },
  {
    persist: {
      key: COMPONENT_PREVIEW_STORAGE_KEY,
      pick: ['category', 'componentName'],
    },
  },
);