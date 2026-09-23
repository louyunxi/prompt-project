<template>
  <div class="single-component">
    <component v-if="matched" :is="matched" />
    <a-empty
      v-else
      class="single-component__empty"
      :description="`未找到组件 ${category}/${componentName}`"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

/** 收集 views/<category>/component/<name>/index.vue 下的全部组件 */
const componentModules = import.meta.glob<{ default: Component }>(
  '../../views/*/component/*/index.vue',
  { eager: true },
);

const props = defineProps<{
  /** 主应用传入的分类（与 componentName 一起定位路径） */
  category: string;
  /** 主应用传入的组件名 */
  componentName: string;
}>();

const matched = computed<Component | null>(() => {
  for (const [path, mod] of Object.entries(componentModules)) {
    if (
      path.includes(`/views/${props.category}/component/`) &&
      path.endsWith(`/${props.componentName}/index.vue`)
    ) {
      return mod.default;
    }
  }
  return null;
});
</script>

<style lang="scss" scoped>
.single-component {
  width: 100%;

  &__empty {
    padding: 32px 0;
  }
}
</style>