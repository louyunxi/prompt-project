<template>
  <div
    class="pc-comp-card"
    :style="background ? { backgroundColor: background } : undefined"
  >
    <div class="pc-comp-card__toolbar">
      <div class="pc-comp-card__title">
        <span class="pc-comp-card__name">{{ title || componentName }}</span>
        <a-tag v-if="title && title !== componentName" color="default">
          {{ componentName }}
        </a-tag>
      </div>
      <div class="pc-comp-card__actions">
        <a-tooltip title="复制 prompt.txt 内容到剪贴板">
          <a-button
            size="small"
            type="primary"
            :loading="copying"
            @click="handleCopy"
          >
            <template #icon><CopyOutlined /></template>
            复制
          </a-button>
        </a-tooltip>
        <a-tooltip title="编辑（待实现）">
          <a-button size="small" disabled>
            <template #icon><EditOutlined /></template>
            编辑
          </a-button>
        </a-tooltip>
        <a-tooltip title="换肤（待实现）">
          <a-button size="small" disabled>
            <template #icon><BgColorsOutlined /></template>
            换肤
          </a-button>
        </a-tooltip>
      </div>
    </div>
    <div class="pc-comp-card__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  CopyOutlined,
  EditOutlined,
  BgColorsOutlined,
} from '@ant-design/icons-vue';

/**
 * PcCompCard —— PC 端子应用组件的「公共接口」外壳。
 *
 * 主应用（app-prompt）src/views/prompt/pc 下所有展示子应用（app-web）组件的页面，
 * 必须使用本组件进行包裹；子应用组件由调用方通过 slot 注入（典型做法见 MicroContainer.vue：
 * 子应用在 hiddenContainer 渲染，[data-component-name] 节点 appendChild 到 slot 容器）。
 *
 * props.api 用于访问子应用注册到 props.registerApi 的 SubAppApi（见 apps/app-web/src/main.ts）。
 */

/** 与 apps/app-web/src/main.ts 的 SubAppApi 保持一致 */
interface SubAppApi {
  getPromptContent?: (name: string) => Promise<string> | string;
  listComponents?: (category: string) => Promise<Array<unknown>>;
}

const props = withDefaults(
  defineProps<{
    /** 子应用组件名（用于查找 prompt.txt） */
    componentName: string;
    /** 卡片标题，默认使用 componentName */
    title?: string;
    /** 子应用通过 props.registerApi 暴露的 API；未就绪时按钮提示 */
    api?: SubAppApi | null;
    /** 卡片容器背景色；不传时使用默认 var(--card-bg, #fff)。图表分类传入 #05284b。 */
    background?: string;
  }>(),
  {
    title: '',
    api: null,
    background: '',
  },
);

const copying = ref(false);

async function handleCopy() {
  if (!props.api?.getPromptContent) {
    message.warning('子应用 API 尚未就绪，请稍后再试');
    return;
  }
  copying.value = true;
  try {
    const content = await props.api.getPromptContent(props.componentName);
    if (!content) {
      message.warning(`「${props.componentName}」prompt.txt 为空`);
      return;
    }
    await navigator.clipboard.writeText(content);
    message.success(`已复制「${props.componentName}」的 prompt (${content.length} 字)`);
  } catch (err) {
    console.error('[PcCompCard] copy failed:', err);
    message.error(`复制失败：${(err as Error).message ?? err}`);
  } finally {
    copying.value = false;
  }
}
</script>

<style lang="scss" scoped>
.pc-comp-card {
  display: flex;
  flex-direction: column;
  min-height: 240px;
  border: 1px solid var(--line-color, #e5e7eb);
  border-radius: 8px;
  background: var(--card-bg, #fff);
  overflow: hidden;
  box-sizing: border-box;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--line-color, #e5e7eb);
    background: var(--header-bg, #fafafa);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-color, #1f2937);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    padding: 16px;
    min-height: 200px;
    box-sizing: border-box;
  }
}
</style>