<template>
  <!--
    PC 端所有二级菜单分类的「统一渲染器」：
    - 一个充满内容区的可见容器，直接把子应用（app-web）整体挂进来
    - 子应用按 props.category 渲染自己的分类主页面 views/<category>/index.vue
    - 不再逐个组件新建容器 / 搬运 DOM
  -->
  <div class="micro-container">
    <div v-if="loading" class="micro-container__loading">
      <a-spin size="large" class="micro-container__loading-spin" />
      <span class="micro-container__loading-text">加载中...</span>
    </div>

    <a-alert
      v-else-if="errorMessage"
      class="micro-container__error"
      type="error"
      :message="errorMessage"
      show-icon
    />

    <div
      v-show="!loading && !errorMessage"
      ref="mountElRef"
      class="micro-container__stage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { loadSubApp } from '@/micro';

const route = useRoute();

/** 当前分类：route.meta.category（如 layout/map/typography/chart/background 等 9 分类） */
const category = computed(() => String(route.meta.category ?? ''));

const loading = ref(true);
const errorMessage = ref('');
/** 子应用挂载容器：始终在 DOM 中（v-show 控制可见性），qiankun 需要真实存在的容器节点 */
const mountElRef = ref<HTMLElement | null>(null);

let microApp: ReturnType<typeof loadSubApp> | null = null;

async function unmountCurrent() {
  if (!microApp) return;
  try {
    await microApp.unmount();
  } catch (err) {
    console.warn('[MicroContainer] unmount failed:', err);
  }
  microApp = null;
}

/** 把子应用挂到可见容器，子应用按 category 渲染分类主页面 */
async function mountSubApp(cat: string) {
  const el = mountElRef.value;
  if (!el) return;
  if (!cat) {
    errorMessage.value = '缺少分类参数（route.meta.category）';
    loading.value = false;
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  try {
    microApp = loadSubApp('app-web', el, { category: cat });
    // 子应用 mount 生命周期内已 await render，loadPromise resolve 即页面渲染完成
    const loadPromise = (
      microApp as unknown as { loadPromise?: Promise<unknown> }
    ).loadPromise;
    if (loadPromise && typeof loadPromise.then === 'function') {
      await loadPromise;
    }
  } catch (err) {
    errorMessage.value = `加载子应用失败：${(err as Error)?.message ?? err}`;
    console.error('[MicroContainer] mount failed:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  mountSubApp(category.value);
});

watch(category, async (cat) => {
  // 切换分类：先卸载旧实例，再按新 category 重新挂载
  await unmountCurrent();
  mountSubApp(cat);
});

onBeforeUnmount(() => {
  unmountCurrent();
});
</script>

<style lang="scss" scoped>
.micro-container {
  width: 100%;
  min-height: 400px;
  box-sizing: border-box;

  &__loading {
    min-height: 240px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px;
    margin: 16px 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: var(--ink-color-3, #666);
    box-sizing: border-box;
  }

  &__loading-text {
    font-size: 18px;
    color: var(--ink-color-3, #666);
    letter-spacing: 1px;
  }

  &__error {
    margin-bottom: 16px;
  }

  /** 充满容器的子应用挂载区（子应用页面自带 min-height，这里保证至少铺满内容区） */
  &__stage {
    width: 100%;
    min-height: calc(100vh - 160px);
    box-sizing: border-box;
  }
}
</style>
