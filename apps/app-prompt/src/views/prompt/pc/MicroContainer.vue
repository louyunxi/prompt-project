<template>
  <div ref="containerRef" class="micro-container"></div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { loadSubApp } from '@/micro';

const route = useRoute();
const containerRef = ref<HTMLDivElement>();

let microApp: ReturnType<typeof loadSubApp> | null = null;

const category = computed(() => String(route.meta.category ?? 'chart'));

function mount() {
  const container = containerRef.value;
  if (!container) return;
  microApp = loadSubApp('app-web', container, { category: category.value });
}

onMounted(mount);

// 切换分类（/prompt/pc/chart → /prompt/pc/layout）时重挂载子应用
watch(category, () => {
  microApp?.unmount();
  mount();
});

onBeforeUnmount(() => {
  microApp?.unmount();
  microApp = null;
});
</script>

<style lang="scss" scoped>
.micro-container {
  width: 100%;
  min-height: 400px;
}
</style>
