<!--
  组件名称：ImageCreateModal（全局图片替换弹框，组件级聚合版）

  触发：
    组件容器右上角「换图」按钮被点击 → image-marker 发出
    ImageEvents.CHANGE_IMAGE → layout 接收后打开本弹框。
    载荷为 ChangeImageGroupPayload：含当前组件内按 src 去重后的全部图片
    （entries[].targets：一对多 DOM 目标列表）。

  结构：
    顶部「图片 tab 列表」：列出当前组件内全部可替换图片
      · 缩略图 + 类型 + 目标数量；
      · 切换 tab 会重置详情面板、重新获取参考图。
    详情区 a-tabs 提供两种替换方式：
      1. AI换图：ImageTaskForm（含参考图上传）。点击「生图」后**不关闭
         弹框**，直接在弹框内完成：创建任务 → 路径守卫 → 生图请求 →
         轮询查询 → 回显生成结果 → 成功后调用 applyImageReplaceMany
         把同一结果图同步替换回当前 entry 的全部 targets。
      2. 本地图片修改：选择本地图片，选中后立即用该图片替换当前 entry
         的全部 targets（一对多）。

  参数回填规则（重要）：
    - 以 DEFAULT_GENERATE_IMAGE_PARAMS 为基线；
    - 当前 entry 的 image（DOM 上 image 属性的 JSON）只按字段白名单 merge，
      JSON 里没有的字段保留默认值，绝不覆盖清空；
    - 非法字段直接忽略。
    - tab 切换时按新 entry 重新构建表单参数。

  参考图（图生图）：
    - 切换 tab 时自动把当前 entry.src 下载为 File，作为第一张参考图；
      用户可继续追加（最多 8 张 / 共 40MB）；
    - 自动获取失败时提示用户手动上传，不阻塞流程。

  DOM 替换职责（重要）：
    替换 DOM 图片只在本弹框内完成（applyImageReplaceMany）：
      - AI 生图任务成功后（订阅 TASK_COMPLETE，任务带 changeTargets）
        用本次结果图地址一对多替换当前 entry 的全部目标 DOM——
        即使弹框已关闭也会完成替换；
      - 本地选图后用本地文件 object URL 一对多替换。
    右侧「生图管理」抽屉只负责：生图发起、轮询查询、回显、保存本地，
    不再替换 DOM。
-->
<template>
  <a-modal
    :open="open"
    :title="modalTitle"
    :width="680"
    :mask-closable="false"
    :destroy-on-close="true"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <div class="image-create-modal">
      <!-- 当前组件信息（仅在有 payload 时展示） -->
      <div v-if="payload" class="image-create-modal__component">
        <span class="image-create-modal__component-label">当前组件：</span>
        <span class="image-create-modal__component-name">
          {{ payload.componentName }}
        </span>
        <span class="image-create-modal__component-meta">
          共 {{ payload.entries.length }} 张可替换图片
        </span>
      </div>

      <!-- 顶部：图片 tab 列表（按 src 去重） -->
      <div v-if="payload?.entries?.length" class="image-create-modal__imgs">
        <a-tabs
          v-model:activeKey="selectedEntryId"
          size="small"
          class="image-create-modal__img-tabs"
        >
          <a-tab-pane
            v-for="entry in payload.entries"
            :key="entry.id"
            :tab="renderEntryTab(entry)"
          >
            <!-- 内容渲染在下方详情区 -->
          </a-tab-pane>
        </a-tabs>
      </div>

      <!-- 详情区：AI换图 / 本地图片修改（仅在选中某张图后展示） -->
      <template v-if="currentEntry">
        <div class="image-create-modal__source">
          <div class="image-create-modal__source-row">
            <span class="image-create-modal__source-label">图片类型：</span>
            <span>{{ kindText }}</span>
            <span
              v-if="currentEntry.targets.length > 1"
              class="image-create-modal__source-tag"
            >
              一对多 · {{ currentEntry.targets.length }} 处
            </span>
          </div>
        </div>

        <a-tabs v-model:activeKey="activeKey" size="small">
          <!-- AI换图 -->
          <a-tab-pane key="ai" tab="AI换图">
            <div class="image-create-modal__ai">
              <!-- 参考图状态 -->
              <div class="image-create-modal__ref">
                <span class="image-create-modal__ref-label">参考图：</span>
                <span
                  v-if="preparingRef"
                  class="image-create-modal__source-loading"
                >
                  <LoadingOutlined />
                  正在获取待替换图片，将自动作为第一张参考图…
                </span>
                <span
                  v-else-if="prepareError"
                  class="image-create-modal__source-warn"
                >
                  待替换图片获取失败，请在下方手动上传参考图
                </span>
                <span v-else>待替换图片已作为第一张参考图，可继续追加</span>
              </div>

              <!-- 参数表单：与任务管理抽屉复用同一组件（含参考图上传） -->
              <a-card size="small" :bordered="true">
                <ImageTaskForm
                  v-if="open"
                  :params="formParams"
                  :disabled="
                    preparingRef || isCurrentGenerating || !!currentTaskId
                  "
                  @update:params="(p) => (formParams = p)"
                />
              </a-card>

              <!-- 弹框内生图状态区：轮询中 / 回显结果 / 失败 -->
              <div v-if="currentTask" class="image-create-modal__result">
                <div
                  v-if="currentTask.status === 'generating'"
                  class="image-create-modal__generating"
                >
                  <a-spin size="small" />
                  <span>
                    生成中{{
                      currentTask.remoteStatusText
                        ? ` · ${currentTask.remoteStatusText}`
                        : ''
                    }}
                    ，完成后将自动替换{{
                      currentEntry.targets.length > 1
                        ? ` ${currentEntry.targets.length} 处`
                        : ''
                    }}页面图片…
                  </span>
                </div>

                <template v-else-if="currentTask.status === 'success'">
                  <a-alert
                    type="success"
                    show-icon
                    :message="successAlertMessage"
                    style="margin-bottom: 8px"
                  />
                  <a-image
                    :src="previewSrc"
                    :alt="currentTask.result?.revisedPrompt ?? currentTask.name"
                    :preview="{ src: previewFullSrc }"
                    class="image-create-modal__preview-img"
                  />
                </template>

                <a-alert
                  v-else-if="currentTask.status === 'failed'"
                  type="error"
                  :message="currentTask.error ?? '生图失败'"
                  show-icon
                />
              </div>
            </div>
          </a-tab-pane>

          <!-- 本地图片修改 -->
          <a-tab-pane key="local" tab="本地图片修改">
            <a-card size="small" :bordered="true">
              <div class="image-create-modal__local">
                <input
                  ref="localFileInput"
                  type="file"
                  accept="image/*"
                  class="image-create-modal__local-input"
                  @change="handleLocalFileChange"
                />
                <a-button type="primary" @click="handlePickLocalImage">
                  <template #icon><FolderOpenOutlined /></template>
                  选择本地图片
                </a-button>
                <span class="image-create-modal__local-tip">
                  {{
                    currentEntry.targets.length > 1
                      ? `选择后将同步替换当前图片的 ${currentEntry.targets.length} 处 DOM`
                      : '选择一张本地图片后，将直接替换当前目标图片'
                  }}
                </span>

                <a-alert
                  v-if="localReplaceDone && localPreviewUrl"
                  type="success"
                  show-icon
                  :message="localSuccessMessage"
                  style="margin-top: 8px"
                />
                <a-image
                  v-if="localPreviewUrl"
                  :src="localPreviewUrl"
                  class="image-create-modal__preview-img"
                  style="margin-top: 8px"
                />
              </div>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </template>

      <a-empty
        v-else-if="payload && !payload.entries.length"
        description="当前组件内没有可替换的图片"
        style="margin: 24px 0"
      />
    </div>

    <template #footer>
      <a-button @click="emit('update:open', false)">关闭</a-button>
      <a-button
        v-if="activeKey === 'ai' && currentEntry"
        type="primary"
        :loading="isCurrentGenerating"
        :disabled="
          !currentEntry ||
          preparingRef ||
          isCurrentGenerating ||
          isCurrentDone
        "
        @click="handleConfirm"
      >
        生图
      </a-button>
    </template>
  </a-modal>

  <!-- 生图前的本地保存路径守卫（与侧边栏共用同一套流程） -->
  <LocalPathGuardModal
    v-model:open="guardOpen"
    @confirm="handleGuardConfirm"
  />
</template>

<script setup lang="ts">
import { computed, h, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { FolderOpenOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useImageStore, type ImageTask } from '@/store/modules/image';
import {
  createReferenceImageFromUrl,
  DEFAULT_GENERATE_IMAGE_PARAMS,
  type GenerateImageParams,
  type ReferenceImage,
  releaseReferenceImages,
} from '@/utils/ai-image';
import {
  ImageEvents,
  imageEventBus,
  type ChangeImageEntry,
  type ChangeImageGroupPayload,
  type ChangeImageTarget,
} from '@/utils/event-bus';
import { applyImageReplaceMany } from '@/utils/image-apply';
import ImageTaskForm from './ImageTaskForm.vue';
import LocalPathGuardModal from './LocalPathGuardModal.vue';
import { useImageTaskStart } from '../composables/useImageTaskStart';
import { getChangeTargets } from '@/store/modules/image';

const props = defineProps<{
  open: boolean;
  payload: ChangeImageGroupPayload | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const imageStore = useImageStore();
const { guardOpen, requestStart, handleGuardConfirm } =
  useImageTaskStart();

/* ---------- Tab 切换 ---------- */

/** 当前激活的图片 entry（顶部 tab 列表选中项） */
const selectedEntryId = ref<string>('');
/** 当前激活的替换方式：ai（AI换图）/ local（本地图片修改） */
const activeKey = ref<'ai' | 'local'>('ai');

/** 当前选中的 entry 对象（空时为 null） */
const currentEntry = computed<ChangeImageEntry | null>(() => {
  if (!props.payload?.entries?.length) {return null;}
  const found = props.payload.entries.find(
    (e) => e.id === selectedEntryId.value,
  );
  return found ?? props.payload.entries[0] ?? null;
});

/* ---------- 弹框会话任务 / 本地预览状态（须在 watch 前声明） ---------- */

/** 本弹框会话创建的生图任务 ID（null = 本次会话尚未创建任务） */
const currentTaskId = ref<string | null>(null);

/** 当前会话任务（从 store 实时读取，驱动生成中 / 回显 / 失败 UI） */
const currentTask = computed<ImageTask | null>(() =>
  currentTaskId.value
    ? imageStore.tasks.find((t) => t.id === currentTaskId.value) ?? null
    : null,
);

const isCurrentGenerating = computed(
  () => currentTask.value?.status === 'generating',
);
const isCurrentDone = computed(
  () =>
    currentTask.value?.status === 'success' ||
    currentTask.value?.status === 'failed',
);

/** 结果回显地址：优先本次结果图（blob），其次远端原图 */
const previewSrc = computed(
  () =>
    currentTask.value?.result?.imageUrl ||
    currentTask.value?.result?.originalUrl ||
    '',
);
const previewFullSrc = computed(
  () =>
    currentTask.value?.result?.originalUrl ||
    currentTask.value?.result?.imageUrl ||
    '',
);

const localFileInput = ref<HTMLInputElement | null>(null);
const localPreviewUrl = ref('');
const localReplaceDone = ref(false);

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
 * 构建表单参数：
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

/* ---------- Tab 标题渲染（缩略图 + 类型 + 数量） ---------- */

const KIND_LABEL_MAP: Record<ChangeImageTarget['kind'], string> = {
  img: '<img>',
  background: '背景',
  'pseudo-before': '::before',
  'pseudo-after': '::after',
};

function renderEntryTab(entry: ChangeImageEntry) {
  const kindText = KIND_LABEL_MAP[entry.kind];
  const count =
    entry.targets.length > 1 ? ` ×${entry.targets.length}` : '';
  return h('div', { class: 'image-create-modal__img-tab' }, [
    h('img', {
      class: 'image-create-modal__img-tab-thumb',
      src: entry.src,
      alt: '',
      loading: 'lazy',
    }),
    h('div', { class: 'image-create-modal__img-tab-text' }, [
      h('div', { class: 'image-create-modal__img-tab-kind' }, kindText),
      h(
        'div',
        { class: 'image-create-modal__img-tab-count' },
        `${entry.targets.length} 处${count ? '' : ''}`,
      ),
    ]),
  ]);
}

const kindText = computed(() =>
  currentEntry.value ? KIND_LABEL_MAP[currentEntry.value.kind] : '-',
);

const modalTitle = computed(() =>
  props.payload?.componentName
    ? `图片替换 · ${props.payload.componentName}`
    : '图片替换',
);

const successAlertMessage = computed(() =>
  currentEntry.value && currentEntry.value.targets.length > 1
    ? `生图完成，已替换 ${currentEntry.value.targets.length} 处页面图片`
    : '生图完成，已替换页面图片',
);

const localSuccessMessage = computed(() =>
  currentEntry.value && currentEntry.value.targets.length > 1
    ? `已用本地图片替换 ${currentEntry.value.targets.length} 处页面图片`
    : '已用本地图片替换页面图片',
);

/* ---------- 自动获取待替换图片为第一张参考图 ---------- */

const preparingRef = ref(false);
const prepareError = ref(false);

/**
 * 每次打开弹框 / 切换图片 tab 自增的会话 token：
 * 下载待替换图片是异步的，关闭弹框 / 切换 tab 后让在途下载失效。
 */
let openSession = 0;
/** 本次表单的参考图是否已随任务所有权转移给 store（转移后不再释放） */
let refsTransferred = false;

/** 释放当前表单中尚未转移给 store 的参考图预览 URL */
function releaseFormReferences(): void {
  if (refsTransferred) {return;}
  releaseReferenceImages(formParams.value.referenceImages);
}

/** 释放「本地图片修改」选中的本地图片 object URL */
function releaseLocalPreview(): void {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value);
    localPreviewUrl.value = '';
  }
}

/**
 * 主动获取当前 entry 的 src 作为参考图。
 * 切换 tab 时调用：让详情面板始终与「正在替换的图片」保持一致。
 */
async function prepareReferenceForEntry(): Promise<void> {
  const session = ++openSession;
  const entry = currentEntry.value;
  if (!entry?.src) {return;}

  // 切换 tab 时旧 entry 的参考图一律释放（已转移给 store 的除外）
  releaseFormReferences();
  refsTransferred = false;

  preparingRef.value = true;
  prepareError.value = false;

  // 先用空白参考图列表，确保表单处于「准备中」状态时旧的参考图不被误用
  formParams.value = {
    ...buildFormParams(entry.image),
    referenceImages: [],
  };

  try {
    const refImage: ReferenceImage = await createReferenceImageFromUrl(
      entry.src,
      'replace-target',
    );
    if (session !== openSession) {
      // 已经切换/合并，放弃
      releaseReferenceImages([refImage]);
      return;
    }
    formParams.value = {
      ...formParams.value,
      referenceImages: [refImage],
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
      releaseLocalPreview();
      localReplaceDone.value = false;
      currentTaskId.value = null;
      return;
    }

    // 打开：默认选中第一条 entry，重置状态、构建表单
    refsTransferred = false;
    preparingRef.value = false;
    prepareError.value = false;
    activeKey.value = 'ai';
    localReplaceDone.value = false;
    releaseLocalPreview();
    currentTaskId.value = null;

    const entries = props.payload?.entries ?? [];
    if (entries.length) {
      selectedEntryId.value = entries[0].id;
    } else {
      selectedEntryId.value = '';
    }
    // 首次准备参考图（entry 变化时由下方 watcher 触发）
    void prepareReferenceForEntry();
  },
  { immediate: true },
);

/** tab 切换：重新构建表单 + 获取新参考图；不重置 currentTaskId（任务归属 entry 而非 modal） */
watch(
  () => selectedEntryId.value,
  () => {
    if (!props.open) {return;}
    if (!currentEntry.value) {return;}
    // 切换图片后清空当前任务回显（之前任务可能属于旧 entry）
    currentTaskId.value = null;
    localReplaceDone.value = false;
    activeKey.value = 'ai';
    void prepareReferenceForEntry();
  },
);

onBeforeUnmount(() => {
  openSession += 1;
  releaseFormReferences();
  releaseLocalPreview();
  offFns.forEach((off) => off());
  offFns.length = 0;
});

/* ---------- AI换图：弹框内发起生图 + 回显 + 一对多替换 DOM ---------- */

/**
 * 订阅 TASK_COMPLETE：任务带 changeTargets（由本弹框创建）时，
 * 用本次结果图地址一对多替换目标 DOM。
 * 订阅挂在组件级：即使生成期间用户关闭了弹框，任务完成时仍会完成替换。
 */
const offFns: Array<() => void> = [];

onMounted(() => {
  offFns.push(
    imageEventBus.on<{ taskId: string; result?: unknown }>(
      ImageEvents.TASK_COMPLETE,
      (e) => {
        const task = imageStore.tasks.find((t) => t.id === e.taskId);
        if (!task) {return;}
        // 读取一对多目标列表（兼容旧字段 + 自动去重）
        const targets = getChangeTargets(task);
        if (!targets.length) {return;}
        const r = (e.result ?? task.result) as
          | { imageUrl?: string; originalUrl?: string }
          | undefined;
        const replaceUrl =
          r?.imageUrl ||
          r?.originalUrl ||
          task.result?.imageUrl ||
          task.result?.originalUrl;
        if (!replaceUrl) {return;}
        applyImageReplaceMany(targets, replaceUrl);
        if (e.taskId === currentTaskId.value) {
          message.success(
            targets.length > 1
              ? `已替换 ${targets.length} 处页面图片`
              : '已替换页面图片',
            3,
          );
        }
      },
    ),
  );
});

/**
 * 点击「生图」：
 * 创建任务 → 经路径守卫后直接 startTask（轮询在 store 内驱动）。
 * 不关闭弹框、不再 emit created，生成状态 / 结果回显全部留在弹框内。
 * 若之前创建的 idle 任务尚未启动（如路径守卫被取消），再次点击只重走启动。
 * 注意：changeTargets 写入的是「当前选中 entry」的 targets（一对多）。
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
  const entry = currentEntry.value;
  if (!entry) {
    message.warning('缺少替换目标，无法生图');
    return;
  }

  if (currentTaskId.value) {
    await requestStart(currentTaskId.value);
    return;
  }

  // 把当前 entry 的全部 targets 一对多写入任务（用于一对多替换 + 刷新重放）
  const changeTargets: ChangeImageTarget[] = entry.targets.map((t) => ({
    selector: t.selector,
    kind: t.kind,
  }));
  const taskId = imageStore.addTask(
    { ...formParams.value },
    undefined,
    changeTargets,
  );
  // 参考图所有权随 params 转移给 store（由 store 在删除/清空时释放）
  refsTransferred = true;
  currentTaskId.value = taskId;
  await requestStart(taskId);
}

/* ---------- 本地图片修改：选图后直接一对多替换 DOM ---------- */

function handlePickLocalImage(): void {
  localFileInput.value?.click();
}

function handleLocalFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) {return;}

  if (!file.type.startsWith('image/')) {
    message.warning('请选择图片文件');
    return;
  }

  const entry = currentEntry.value;
  if (!entry) {
    message.warning('缺少替换目标，无法替换');
    return;
  }

  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value);
  }
  const objectUrl = URL.createObjectURL(file);
  localPreviewUrl.value = objectUrl;
  localReplaceDone.value = false;

  applyImageReplaceMany(entry.targets, objectUrl);
  localReplaceDone.value = true;
  message.success(
    entry.targets.length > 1
      ? `已用本地图片替换 ${entry.targets.length} 处页面图片`
      : '已用本地图片替换页面图片',
    3,
  );
}
</script>

<style lang="scss" scoped>
.image-create-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__component {
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--fill-color, #f5f7fa);
    border: 1px solid var(--line-color, #e5e7eb);
    font-size: 12px;
    color: var(--ink-color-2);
    display: flex;
    align-items: center;
    gap: 8px;

    &-label {
      color: var(--ink-color-3);
      flex-shrink: 0;
    }

    &-name {
      color: var(--ink-color);
      font-weight: 600;
    }

    &-meta {
      margin-left: auto;
      color: var(--ink-color-3);
    }
  }

  &__imgs {
    border: 1px solid var(--line-color, #e5e7eb);
    border-radius: 6px;
    padding: 4px 8px 0;
  }

  &__img-tabs {
    :deep(.ant-tabs-nav) {
      margin-bottom: 0;
    }
  }

  &__img-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    min-width: 100px;

    &-thumb {
      width: 36px;
      height: 36px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid var(--line-color, #e5e7eb);
      background: #fafafa;
      flex-shrink: 0;
    }

    &-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      line-height: 1.2;
      min-width: 0;
    }

    &-kind {
      font-size: 12px;
      color: var(--ink-color);
      font-weight: 500;
    }

    &-count {
      font-size: 11px;
      color: var(--ink-color-3);
    }
  }

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

  &__source-tag {
    display: inline-flex;
    align-items: center;
    padding: 1px 8px;
    border-radius: 999px;
    background: rgba(1, 115, 125, 0.12);
    color: #015ca7;
    font-size: 11px;
    font-weight: 500;
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

  &__ai {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__ref {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--ink-color-2);
    padding: 0 2px;
  }

  &__ref-label {
    color: var(--ink-color-3);
    flex-shrink: 0;
  }

  &__result {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__generating {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 6px;
    background: var(--fill-color, #f5f7fa);
    border: 1px solid var(--line-color, #e5e7eb);
    font-size: 12px;
    color: var(--ink-color-2);
  }

  &__preview-img {
    width: 100%;
    border-radius: 6px;
    border: 1px solid var(--line-color);
    overflow: hidden;
    background:
      linear-gradient(45deg, #f5f5f5 25%, transparent 25%) 0 0,
      linear-gradient(-45deg, #f5f5f5 25%, transparent 25%) 0 8px,
      linear-gradient(45deg, transparent 75%, #f5f5f5 75%) 8px -8px,
      linear-gradient(-45deg, transparent 75%, #f5f5f5 75%) -8px 0;
    background-size: 16px 16px;
    background-color: #fafafa;

    :deep(img) {
      display: block;
      width: 100%;
      max-height: 200px;
      object-fit: contain;
      cursor: zoom-in;
    }
  }

  &__local {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  &__local-input {
    display: none;
  }

  &__local-tip {
    font-size: 12px;
    color: var(--ink-color-3);
  }
}
</style>