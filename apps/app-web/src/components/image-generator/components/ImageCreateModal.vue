<!--
  组件名称：ImageCreateModal（全局新建生图任务弹框）

  触发：
    页面图片上的「换图」小标签被点击 → image-marker 发出
    ImageEvents.CHANGE_IMAGE → layout 接收后打开本弹框。

  结构：
    a-modal 内放 a-card，card-body 即与任务管理抽屉复用的
    ImageTaskForm（同一份参数表单组件，含参考图上传），因此本弹框
    与右侧「生图管理」侧边栏看到的表单、功能完全一致。

  参数回填规则（重要）：
    - 以 DEFAULT_GENERATE_IMAGE_PARAMS 为基线；
    - payload.image（DOM 上 image 属性的 JSON）只按字段白名单 merge，
      JSON 里没有的字段保留默认值，绝不覆盖清空；
    - 非法字段直接忽略。

  参考图（图生图）：
    - 打开弹框时自动把 payload.src（待替换图片）下载为 File，
      作为第一张参考图；用户可继续追加（最多 8 张 / 共 40MB）；
    - 自动获取失败时提示用户手动上传，不阻塞流程。

  生图：
    点击「生图」后：imageStore.addTask 创建任务 → 关闭弹框 →
    emit('created', taskId)（layout 展开右侧抽屉）→ 经过与侧边栏
    相同的本地保存路径守卫后直接 startTask，侧边栏无需再点一次。
-->
<template>
  <a-modal
    :open="open"
    title="新建生图任务"
    ok-text="生图"
    cancel-text="取消"
    :width="580"
    :mask-closable="false"
    :destroy-on-close="true"
    :confirm-loading="preparingRef || starting"
    @update:open="(v: boolean) => emit('update:open', v)"
    @ok="handleConfirm"
  >
    <div class="image-create-modal">
      <!-- 替换目标信息 -->
      <div v-if="payload" class="image-create-modal__source">
        <div class="image-create-modal__source-row">
          <span class="image-create-modal__source-label">替换目标：</span>
          <code class="image-create-modal__source-selector">
            {{ payload.selector }}
          </code>
        </div>
        <div class="image-create-modal__source-row">
          <span class="image-create-modal__source-label">图片类型：</span>
          <span>{{ kindText }}</span>
        </div>
        <div class="image-create-modal__source-row">
          <span class="image-create-modal__source-label">参考图：</span>
          <span v-if="preparingRef" class="image-create-modal__source-loading">
            <LoadingOutlined />
            正在获取待替换图片，将自动作为第一张参考图…
          </span>
          <span v-else-if="prepareError" class="image-create-modal__source-warn">
            待替换图片获取失败，请在下方手动上传参考图
          </span>
          <span v-else>待替换图片已作为第一张参考图，可继续追加</span>
        </div>
      </div>

      <!-- 参数表单：与任务管理抽屉复用同一组件（含参考图上传） -->
      <a-card size="small" :bordered="true">
        <ImageTaskForm
          v-if="open"
          :params="formParams"
          :disabled="preparingRef || starting"
          @update:params="(p) => (formParams = p)"
        />
      </a-card>
    </div>
  </a-modal>

  <!-- 生图前的本地保存路径守卫（与侧边栏共用同一套流程） -->
  <LocalPathGuardModal
    v-model:open="guardOpen"
    @confirm="handleGuardConfirm"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { LoadingOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useImageStore } from '@/store/modules/image';
import {
  createReferenceImageFromUrl,
  DEFAULT_GENERATE_IMAGE_PARAMS,
  type GenerateImageParams,
  type ReferenceImage,
  releaseReferenceImages,
} from '@/utils/ai-image';
import type { ChangeImagePayload } from '@/utils/event-bus';
import ImageTaskForm from './ImageTaskForm.vue';
import LocalPathGuardModal from './LocalPathGuardModal.vue';
import { useImageTaskStart } from '../composables/useImageTaskStart';

const props = defineProps<{
  open: boolean;
  payload: ChangeImagePayload | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'created', taskId: string): void;
}>();

const imageStore = useImageStore();
const { guardOpen, requestStart, handleGuardConfirm } =
  useImageTaskStart();

/* ---------- 参数回填 ---------- */

/** 允许从 DOM image JSON 中读取的字段白名单（其余键忽略） */
const ALLOWED_PARAM_KEYS: (keyof GenerateImageParams)[] = [
  'prompt',
  'size',
  'transparent',
  'model',
  'quality',
  'upscale',
  'outputFormat',
  'responseFormat',
  'n',
];

const formParams = ref<GenerateImageParams>({
  ...DEFAULT_GENERATE_IMAGE_PARAMS,
});

/**
 * 打开弹框时构建表单参数：
 * 默认参数为基线，仅 merge image 片段中显式声明且合法的字段，
 * 缺失字段继续保留默认值（不覆盖清空）。
 */
function buildFormParams(
  image: Partial<GenerateImageParams> | undefined,
): GenerateImageParams {
  const merged: GenerateImageParams = { ...DEFAULT_GENERATE_IMAGE_PARAMS };
  if (image && typeof image === 'object') {
    ALLOWED_PARAM_KEYS.forEach((key) => {
      const val = image[key];
      if (val !== undefined && val !== null) {
        // 仅做类型粗校验，明显非法的值不覆盖默认值
        if (key === 'transparent' || key === 'n') {
          if (typeof val !== 'boolean' && typeof val !== 'number') {return;}
        } else if (typeof val !== 'string') {
          return;
        }
        // 字符串字段空串视为无效，不覆盖（避免清空提示词等）
        if (typeof val === 'string' && val.trim() === '') {return;}
        Object.assign(merged, { [key]: val });
      }
    });
  }
  return merged;
}

const kindText = computed(() => {
  const map: Record<ChangeImagePayload['kind'], string> = {
    img: '<img> 图片',
    background: 'CSS 背景图',
    'pseudo-before': '::before 伪元素背景图',
    'pseudo-after': '::after 伪元素背景图',
  };
  return props.payload ? map[props.payload.kind] : '-';
});

/* ---------- 自动获取待替换图片为第一张参考图 ---------- */

const preparingRef = ref(false);
const prepareError = ref(false);
const starting = ref(false);

/**
 * 每次打开弹框自增的会话 token：
 * 下载待替换图片是异步的，关闭弹框 / 重新打开后让在途下载失效。
 */
let openSession = 0;
/** 本次表单的参考图是否已随任务所有权转移给 store（转移后不再释放） */
let refsTransferred = false;

/** 释放当前表单中尚未转移给 store 的参考图预览 URL */
function releaseFormReferences(): void {
  if (refsTransferred) {return;}
  releaseReferenceImages(formParams.value.referenceImages);
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      // 关闭：使在途下载失效；未创建任务则释放本弹框持有的参考图
      openSession += 1;
      preparingRef.value = false;
      prepareError.value = false;
      releaseFormReferences();
      return;
    }

    // 打开：重置状态 + 以默认参数构建表单
    const session = ++openSession;
    refsTransferred = false;
    preparingRef.value = false;
    prepareError.value = false;
    formParams.value = buildFormParams(props.payload?.image);

    const src = props.payload?.src;
    if (!src) {return;}

    preparingRef.value = true;
    void (async () => {
      try {
        const refImage: ReferenceImage = await createReferenceImageFromUrl(
          src,
          'replace-target',
        );
        // 弹框已关闭 / 已重新打开：放弃这次结果并回收 object URL
        if (session !== openSession || !props.open) {
          releaseReferenceImages([refImage]);
          return;
        }
        formParams.value = {
          ...formParams.value,
          referenceImages: [
            refImage,
            ...(formParams.value.referenceImages ?? []),
          ],
        };
      } catch (err) {
        if (session !== openSession) {return;}
        prepareError.value = true;
        const text = err instanceof Error ? err.message : String(err);
        message.warning(`待替换图片获取失败：${text}，可手动上传参考图`, 5);
      } finally {
        if (session === openSession) {
          preparingRef.value = false;
        }
      }
    })();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  openSession += 1;
  releaseFormReferences();
});

/* ---------- 生图 ---------- */

/**
 * 点击「生图」：
 * 创建任务 → 关闭弹框 → emit created（layout 展开侧边栏）→
 * 路径守卫通过后直接 startTask，侧边栏无需再手动点击。
 */
async function handleConfirm(): Promise<void> {
  if (preparingRef.value) {
    message.info('正在获取待替换图片，请稍候');
    return;
  }
  if (!formParams.value.prompt?.trim()) {
    message.warning('请填写提示词后再生图');
    return;
  }

  // 换图任务：把目标 DOM（selector + kind）随任务持久化，
  // 生图保存到本地后据此把本地图片替换回原 DOM，刷新后也能重放
  const changeTarget = props.payload
    ? { selector: props.payload.selector, kind: props.payload.kind }
    : undefined;
  const taskId = imageStore.addTask(
    { ...formParams.value },
    undefined,
    changeTarget,
  );
  // 参考图所有权随 params 转移给 store（由 store 在删除/清空时释放）
  refsTransferred = true;

  emit('created', taskId);
  emit('update:open', false);

  starting.value = true;
  try {
    await requestStart(taskId);
  } finally {
    starting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.image-create-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__source {
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--fill-color, #f5f7fa);
    border: 1px solid var(--line-color, #e5e7eb);
    font-size: 12px;
    color: var(--ink-color-2);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__source-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  &__source-label {
    color: var(--ink-color-3);
    flex-shrink: 0;
  }

  &__source-selector {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      'Courier New', monospace;
    font-size: 11px;
    color: #015ca7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  &__source-loading {
    color: #015ca7;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__source-warn {
    color: #fa8c16;
  }
}
</style>
