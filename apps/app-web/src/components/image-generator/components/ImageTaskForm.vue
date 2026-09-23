<!--
  组件名称：ImageTaskForm（生图参数表单）

  用途：
    生图任务的参数编辑表单（提示词 / 模型 / 尺寸 / 放大 / 画质 /
    格式 / 透明背景），供两处复用：
      1. ImageTaskPanel：任务管理抽屉中编辑已有任务；
      2. ImageCreateModal：点击页面「换图」小标签后的全局新建任务弹框。

  数据：
    - v-model:params：GenerateImageParams，组件内只做整体更新，
      不直接持有 / 修改业务状态。
    - disabled：生成中时整体禁用。
-->
<template>
  <a-form layout="vertical" :disabled="disabled" class="image-task-form">
    <a-form-item label="提示词">
      <a-textarea
        :value="params.prompt"
        :rows="3"
        :max-length="500"
        allow-clear
        @update:value="(v: string) => patch('prompt', v)"
      />
    </a-form-item>

    <a-row :gutter="8">
      <a-col :span="14">
        <a-form-item label="模型">
          <a-select
            :value="params.model"
            :options="modelOptions"
            @update:value="onModelChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="10">
        <a-form-item label="尺寸">
          <a-select
            :value="params.size"
            :options="sizeOptions"
            @update:value="onSizeChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row :gutter="8">
      <a-col :span="8">
        <a-form-item label="放大">
          <a-select
            :value="params.upscale"
            :options="upscaleOptions"
            @update:value="onUpscaleChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item label="画质">
          <a-select
            :value="params.quality"
            :options="qualityOptions"
            @update:value="onQualityChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item label="格式">
          <a-select
            :value="params.outputFormat"
            :options="outputFormatOptions"
            @update:value="onFormatChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-form-item class="image-task-form__transparent">
      <a-space :size="8" align="center">
        <span class="image-task-form__label">透明背景</span>
        <a-switch
          :checked="params.transparent"
          :disabled="!modelSupportsTransparent"
          @update:checked="onTransparentChange"
        />
        <a-tooltip
          v-if="!modelSupportsTransparent"
          title="当前模型不支持透明背景，已自动关闭"
        >
          <QuestionCircleOutlined style="color: var(--ink-color-3)" />
        </a-tooltip>
      </a-space>
    </a-form-item>

    <!-- 参考图（图生图）：上传后走异步图生图接口 + 3 秒轮询 -->
    <a-form-item class="image-task-form__refs">
      <template #label>
        <span class="image-task-form__refs-label">
          参考图（图生图）
          <span class="image-task-form__refs-hint">
            最多 {{ MAX_REFERENCE_IMAGES }} 张 / 共 40MB
          </span>
        </span>
      </template>

      <div class="ref-uploader">
        <!-- 已选参考图缩略图 -->
        <div
          v-for="ref in referenceImages"
          :key="ref.id"
          class="ref-uploader__item"
          :class="{ 'ref-uploader__item--stale': !ref.file }"
        >
          <img
            v-if="ref.previewUrl"
            :src="ref.previewUrl"
            :alt="ref.name"
            class="ref-uploader__thumb"
          />
          <div v-else class="ref-uploader__stale">
            <FileImageOutlined />
            <span>刷新后已失效</span>
          </div>
          <div class="ref-uploader__mask">
            <a-tooltip :title="ref.name">
              <span class="ref-uploader__name">{{ ref.name }}</span>
            </a-tooltip>
          </div>
          <button
            type="button"
            class="ref-uploader__remove"
            :disabled="disabled"
            title="移除参考图"
            @click="removeReference(ref.id)"
          >
            <CloseOutlined />
          </button>
        </div>

        <!-- 添加参考图 -->
        <a-upload
          v-if="validReferenceCount < MAX_REFERENCE_IMAGES"
          :before-upload="beforeUploadReference"
          :multiple="true"
          accept="image/*"
          :show-upload-list="false"
          :disabled="disabled"
          class="ref-uploader__trigger"
        >
          <div class="ref-uploader__add" :class="{ 'is-disabled': disabled }">
            <PlusOutlined />
            <span>上传参考图</span>
          </div>
        </a-upload>
      </div>

      <div v-if="referenceImages.length" class="ref-uploader__summary">
        已选 {{ validReferenceCount }}/{{ MAX_REFERENCE_IMAGES }} 张 ·
        总计 {{ formatBytes(totalReferenceBytes) }}
        <span v-if="staleReferenceCount" class="ref-uploader__stale-tip">
          （{{ staleReferenceCount }} 张刷新后已失效，需重新上传）
        </span>
      </div>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  CloseOutlined,
  FileImageOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import {
  createReferenceImage,
  IMAGE_MODEL_OPTIONS,
  IMAGE_OUTPUT_FORMAT_OPTIONS,
  IMAGE_QUALITY_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  IMAGE_UPSCALE_OPTIONS,
  MAX_REFERENCE_IMAGES,
  MAX_REFERENCE_TOTAL_BYTES,
  type GenerateImageParams,
  type ImageModelId,
  type ReferenceImage,
} from '@/utils/ai-image';
import { formatBytes } from '@/utils/image-save';

/* ---------- props / emits ---------- */
const props = defineProps<{
  params: GenerateImageParams;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:params', value: GenerateImageParams): void;
}>();

/* ---------- 选项 ---------- */
const modelOptions = IMAGE_MODEL_OPTIONS.map((m) => ({
  value: m.value,
  label: m.label,
}));
const sizeOptions = IMAGE_SIZE_OPTIONS;
const upscaleOptions = IMAGE_UPSCALE_OPTIONS;
const qualityOptions = IMAGE_QUALITY_OPTIONS;
const outputFormatOptions = IMAGE_OUTPUT_FORMAT_OPTIONS;

const modelSupportsTransparent = computed(() => {
  const meta = IMAGE_MODEL_OPTIONS.find(
    (m) => m.value === (props.params.model as ImageModelId),
  );
  return !!meta?.supportsTransparent;
});

/* ---------- 更新 ---------- */

/** 局部字段更新：整体抛出新 params，保持单一数据源 */
function patch<K extends keyof GenerateImageParams>(
  key: K,
  val: GenerateImageParams[K],
) {
  emit('update:params', { ...props.params, [key]: val });
}

/**
 * a-select / a-switch 的 update 回调会带上 string | number | undefined，
 * 统一包一层断言为目标字段类型。
 */
function onModelChange(v: unknown) {
  patch('model', v as GenerateImageParams['model']);
}
function onSizeChange(v: unknown) {
  patch('size', String(v) as GenerateImageParams['size']);
}
function onUpscaleChange(v: unknown) {
  patch('upscale', String(v) as GenerateImageParams['upscale']);
}
function onQualityChange(v: unknown) {
  patch('quality', v as GenerateImageParams['quality']);
}
function onFormatChange(v: unknown) {
  patch('outputFormat', v as GenerateImageParams['outputFormat']);
}
function onTransparentChange(v: unknown) {
  patch('transparent', Boolean(v));
}

/* ---------- 参考图（图生图） ---------- */

const referenceImages = computed<ReferenceImage[]>(
  () => props.params.referenceImages ?? [],
);

/** 持有 File 的有效参考图数量（刷新恢复后的失效条目不占名额） */
const validReferenceCount = computed(
  () => referenceImages.value.filter((r) => r.file).length,
);

/** 失效条目数量（页面刷新后 File 无法恢复） */
const staleReferenceCount = computed(
  () => referenceImages.value.filter((r) => !r.file).length,
);

/** 当前参考图总字节数（失效条目按持久化的 size 估算） */
const totalReferenceBytes = computed(() =>
  referenceImages.value.reduce((sum, r) => sum + (r.file?.size ?? r.size), 0),
);

/**
 * a-upload 多文件选择时 beforeUpload 会被同步连续调用多次，
 * 这里先把文件攒到 pendingFiles，再用微任务一次性合并，
 * 避免连续多次调用读到尚未刷新的 props.params。
 */
let pendingReferenceFiles: File[] = [];
let referenceFlushScheduled = false;

/** a-upload 拦截：返回 false 阻止组件自动上传，文件由本地收集 */
function beforeUploadReference(file: File): boolean {
  pendingReferenceFiles.push(file);
  if (!referenceFlushScheduled) {
    referenceFlushScheduled = true;
    queueMicrotask(() => {
      const batch = pendingReferenceFiles;
      pendingReferenceFiles = [];
      referenceFlushScheduled = false;
      void appendReferenceFiles(batch);
    });
  }
  return false;
}

/** 把一批文件追加为参考图，逐张做类型 / 数量 / 总大小校验 */
async function appendReferenceFiles(files: File[]): Promise<void> {
  const current = referenceImages.value;
  // 有效图在前，失效占位条目追加在后（保留展示）
  const valid = current.filter((r) => r.file);
  const stale = current.filter((r) => !r.file);
  const next: ReferenceImage[] = [...valid];
  let ignoredByCount = false;
  let ignoredBySize = false;

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      message.warning(`「${file.name}」不是图片文件，已忽略`);
      continue;
    }
    if (next.length >= MAX_REFERENCE_IMAGES) {
      ignoredByCount = true;
      break;
    }
    const totalBytes =
      next.reduce((sum, r) => sum + (r.file?.size ?? r.size), 0) + file.size;
    if (totalBytes > MAX_REFERENCE_TOTAL_BYTES) {
      ignoredBySize = true;
      break;
    }
    next.push(createReferenceImage(file));
  }

  if (ignoredByCount) {
    message.warning(`参考图最多 ${MAX_REFERENCE_IMAGES} 张，已忽略多余图片`);
  }
  if (ignoredBySize) {
    message.warning('参考图总大小不能超过 40MB，已忽略后续图片');
  }

  if (next.length !== valid.length) {
    patch('referenceImages', [...next, ...stale]);
  }
}

/** 移除单张参考图（立即回收其 object URL） */
function removeReference(id: string): void {
  const target = referenceImages.value.find((r) => r.id === id);
  if (target?.previewUrl) {
    URL.revokeObjectURL(target.previewUrl);
  }
  patch(
    'referenceImages',
    referenceImages.value.filter((r) => r.id !== id),
  );
}
</script>

<style lang="scss" scoped>
.image-task-form {
  :deep(.ant-form-item) {
    margin-bottom: 6px;
  }

  /* label 与控件并排（水平布局），垂直更紧凑 */
  :deep(.ant-form-item-row) {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  :deep(.ant-form-item-label) {
    /* 宽度按内容自适应，避免挤占窄列（放大/画质/格式）内的控件 */
    flex: 0 0 auto;
    padding: 0;
    text-align: left;

    > label {
      margin: 0;
      height: 32px;
      line-height: 32px;
      white-space: nowrap;
      font-size: 12px;
      color: var(--ink-color-3);
    }
  }

  :deep(.ant-form-item-control) {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__transparent {
    margin-bottom: 0;
  }

  &__label {
    font-size: 13px;
    color: var(--ink-color-2);
  }

  /* 参考图 label 较长（图生图 + 容量提示），单独放宽并允许换行 */
  &__refs {
    :deep(.ant-form-item-label) {
      flex-basis: 96px;

      > label {
        height: auto;
        line-height: 1.4;
      }
    }
  }

  &__refs-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__refs-hint {
    font-size: 11px;
    font-weight: normal;
    color: var(--ink-color-3);
  }
}

/* 参考图上传器 */
.ref-uploader {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  &__item {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: 6px;
    border: 1px solid var(--line-color, #e5e7eb);
    overflow: hidden;
    background: #fafafa;

    &--stale {
      opacity: 0.65;
    }
  }

  &__thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__stale {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--ink-color-3);
    font-size: 10px;

    .anticon {
      font-size: 20px;
    }
  }

  &__mask {
    position: absolute;
    inset: auto 0 0 0;
    padding: 2px 4px;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.65),
      rgba(0, 0, 0, 0)
    );
    opacity: 0;
    transition: opacity 0.15s;

    .ref-uploader__item:hover & {
      opacity: 1;
    }
  }

  &__name {
    display: block;
    font-size: 10px;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__remove {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 10px;
    line-height: 18px;
    text-align: center;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: #ff4d4f;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__add {
    width: 56px;
    height: 56px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 1px dashed var(--line-color, #d9d9d9);
    border-radius: 6px;
    background: #fafafa;
    color: var(--ink-color-3);
    font-size: 11px;
    cursor: pointer;
    transition:
      border-color 0.15s,
      color 0.15s;

    .anticon {
      font-size: 18px;
    }

    &:hover {
      border-color: #015ca7;
      color: #015ca7;
    }

    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__summary {
    flex-basis: 100%;
    font-size: 11px;
    color: var(--ink-color-3);
  }

  &__stale-tip {
    color: #fa8c16;
  }
}
</style>
