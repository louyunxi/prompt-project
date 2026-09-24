<template>
  <div
    class="preview-stage"
    :class="{ 'preview-stage--filled': matched }"
  >
    <div v-if="matched" class="preview-grid">
      <div
        v-for="size in sizes"
        :key="`${size.width}x${size.height}`"
        class="preview-item"
      >
        <div class="preview-item__label">
          {{ size.width }} × {{ size.height }} · {{ size.ratio }}
        </div>
        <div
          class="preview-item__box"
          :style="{ width: `${size.width}px`, height: `${size.height}px` }"
        >
          <component :is="matched" />
        </div>
      </div>
    </div>

    <a-empty
      v-else
      class="preview-stage__empty"
      description="请选择类型与组件进行预览"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

const props = defineProps<{
  /** 一级文件夹名（views 下分类目录） */
  category?: string;
  /** 二级文件夹名（component 下的组件目录） */
  componentName?: string;
}>();

/** 收集 views/<category>/component/<name>/index.vue 下的全部组件 */
const componentModules = import.meta.glob<{ default: Component }>(
  '../../views/*/component/*/index.vue',
  { eager: true },
);

const matched = computed<Component | null>(() => {
  if (!props.category || !props.componentName) return null;
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

/** 预览容器尺寸（宽 × 高），并自动计算最简整数比 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

const sizes = [
  { width: 248, height: 248 },
  { width: 398, height: 248 },
  { width: 360, height: 254 },
  { width: 360, height: 254 },
  { width: 364, height: 312 },
  { width: 398, height: 350 },
  { width: 398, height: 456 },
  { width: 364, height: 472 },
].map(({ width, height }) => {
  const g = gcd(width, height);
  return { width, height, ratio: `${width / g}:${height / g}` };
});
</script>

<style lang="scss" scoped>
.preview-stage {
  flex: 1;
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-color);
  border-radius: 8px;
  background: var(--card-bg);
  overflow: auto;

  &--filled {
    display: block;
    padding: 10px;
  }

  &__empty {
    width: 100%;
  }
}

.preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;

  &__label {
    font-size: 12px;
    color: var(--ink-color-2);
  }

  &__box {
    overflow: auto;
    border: 1px solid var(--line-color);
    border-radius: 6px;
    background: var(--bg-color);
    box-sizing: border-box;
  }
}
</style>