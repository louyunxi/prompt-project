<!--
  组件名称：ImageTaskPanel（单个生图任务面板）

  用途：
    渲染 useImageStore 中某个任务的完整生命周期：
      idle（编辑参数）→ generating（loading + 用时）
      → success（大图预览 + 重新下载 + 重新生图 + 本地保存信息）
      → failed（错误信息 + 重试）。
    所有状态的 item 都支持手动收起 / 展开，默认收起（标题行），
    生成中强制展开，超时失败默认折叠。

  数据 / 事件：
    - props.task 由父组件 ImageGenerator 注入，源自 store。
    - 写操作：参数编辑 → imageStore.updateTask；
              开始生图 → emit('request-start')，由父组件决定是否需要先设置本地路径；
              删除 → imageStore.removeTask（仅清记录，不删本地文件）。
-->
<template>
  <a-card class="task-panel" size="small" :bordered="true">
    <template #title>
      <a-space :size="6" align="center">
        <a-tag :color="status.color">{{ status.label }}</a-tag>
        <a-tag v-if="isImageEdit" color="purple">图生图</a-tag>
        <span class="task-panel__name" :title="task.name">{{ task.name }}</span>
        <a-tag
          v-if="task.status === 'failed' && task.failureReason === 'timeout'"
          color="warning"
        >
          超时失败
        </a-tag>
      </a-space>
    </template>

    <template #extra>
      <a-space :size="4">
        <a-tooltip :title="isCollapsed ? '展开详情' : '收起详情'">
          <a-button
            size="small"
            type="text"
            :disabled="isGenerating"
            @click="toggleCollapse"
          >
            <template #icon>
              <DownOutlined v-if="isCollapsed" />
              <UpOutlined v-else />
            </template>
          </a-button>
        </a-tooltip>
        <a-button
          size="small"
          type="text"
          danger
          :disabled="isGenerating"
          @click="handleRemove"
        >
          <template #icon><DeleteOutlined /></template>
        </a-button>
      </a-space>
    </template>

    <!-- 超时失败且被折叠：展示摘要提示 -->
    <div
      v-if="isCollapsed && isTimeoutFailed"
      class="task-panel__collapsed-hint"
    >
      <ClockCircleOutlined />
      <span>
        任务已超时（超过 10 分钟未返回，系统已自动判定为失败）。
        点击右上角「展开详情」可查看参数或重新生图；删除任务不会影响本地已保存的图片。
      </span>
    </div>

    <!-- 展开后的主体内容 -->
    <div v-show="!isCollapsed">
      <!-- 参数编辑区（与全局新建任务弹框复用同一表单组件） -->
      <ImageTaskForm
        class="task-panel__form"
        :params="task.params"
        :disabled="isGenerating"
        @update:params="
          (p) => imageStore.updateTask(task.id, { params: p })
        "
      />

      <!-- 操作按钮区 -->
      <div class="task-panel__actions">
        <a-space>
          <a-button
            type="primary"
            :loading="isGenerating"
            @click="handleStart"
          >
            {{ task.status === 'success' ? '重新生图' : '生图' }}
          </a-button>
        </a-space>
        <span v-if="task.status === 'success'" class="task-panel__cost">
          用时 {{ formatDuration(task.result?.elapsedMs ?? 0) }}
        </span>
      </div>

      <!-- 预览 / 错误 -->
      <div v-if="task.status === 'success' && task.result" class="task-panel__preview">
        <div class="task-panel__preview-bar">
          <a-tooltip title="重新下载原图到浏览器下载目录（未压缩）">
            <a-button
              size="small"
              :loading="downloading"
              @click="handleDownload"
            >
              <template #icon><DownloadOutlined /></template>
              下载
            </a-button>
          </a-tooltip>
          <span class="task-panel__preview-tip">点击图片可查看大图</span>
        </div>
        <a-image
          :src="previewSrc"
          :alt="task.result.revisedPrompt ?? task.name"
          :preview="{ src: previewFullSrc }"
          class="task-panel__preview-img"
        />
        <div v-if="task.result.revisedPrompt" class="task-panel__revised">
          修订提示：{{ task.result.revisedPrompt }}
        </div>
      </div>

      <!-- 本地保存信息：成功保存后展示在预览下方 -->
      <div
        v-if="task.localSaved"
        class="task-panel__local"
      >
        <a-space :size="6" align="center">
          <CheckCircleFilled style="color: #52c41a" />
          <span class="task-panel__local-label">已本地保存</span>
          <a-tooltip title="点击复制完整路径（浏览器安全限制不支持直接打开所在文件夹）">
            <span
              class="task-panel__local-path"
              @click="copyLocalPath"
            >
              {{ task.localSaved.folderName }}/{{ task.localSaved.fileName }}
            </span>
          </a-tooltip>
          <a-tooltip title="复制完整路径">
            <CopyOutlined
              class="task-panel__copy"
              @click="copyLocalPath"
            />
          </a-tooltip>
          <span class="task-panel__local-meta">
            {{ formatBytes(task.localSaved.bytes) }} · {{ task.localSaved.width }}×{{ task.localSaved.height }}
          </span>
        </a-space>
      </div>

      <a-alert
        v-else-if="task.status === 'failed'"
        type="error"
        :message="task.error ?? '生成失败'"
        show-icon
        style="margin-top: 12px"
      />
    </div>

    <!-- 生成中：loading 遮罩 + 实时用时（图生图附带轮询阶段文案） -->
    <div v-if="isGenerating" class="task-panel__loading">
      <a-spin size="large" />
      <span class="task-panel__loading-text">{{ loadingText }}</span>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useImageStore, type ImageTask } from '@/store/modules/image';
import {
  buildImageFileName,
  downloadImageAsFile,
  formatBytes,
} from '@/utils/image-save';
import ImageTaskForm from './ImageTaskForm.vue';

/* ---------- props / emits ---------- */
const props = defineProps<{ task: ImageTask }>();

const emit = defineEmits<{
  (e: 'request-start', taskId: string): void;
}>();

/* ---------- store ---------- */
const imageStore = useImageStore();

/* ---------- 派生状态 ---------- */
const isGenerating = computed(() => props.task.status === 'generating');

/**
 * 是否为图生图任务。
 * 两种情况都算：参数中持有参考图（含刷新后 File 丢失、仅留元信息的
 * 失效条目），或当前仍持有远端异步任务 ID（刷新恢复轮询期间）。
 */
const isImageEdit = computed(
  () =>
    (props.task.params.referenceImages?.length ?? 0) > 0 ||
    !!props.task.remoteJobId,
);

/**
 * 预览图地址：优先使用本地保存图片读回的 blob: 地址（任务详情要求
 * 用本地图片回显）；本地地址尚未恢复（如刷新后目录权限未授予）时，
 * 回退到结果图地址（blob / CDN originalUrl）。
 */
const previewSrc = computed(
  () =>
    props.task.localSaved?.localUrl ||
    props.task.result?.imageUrl ||
    props.task.result?.originalUrl ||
    '',
);

/** 大图预览地址：同样优先本地图片 */
const previewFullSrc = computed(
  () =>
    props.task.localSaved?.localUrl ||
    props.task.result?.originalUrl ||
    props.task.result?.imageUrl ||
    '',
);

/** 生成中遮罩文案：图生图附带远端轮询阶段（排队中 / 处理中） */
const loadingText = computed(() => {
  const mode = isImageEdit.value ? '图生图' : '生图';
  const remote = props.task.remoteStatusText
    ? ` · ${props.task.remoteStatusText}`
    : '';
  return `${mode}中${remote} · 已用时 ${liveElapsedText.value}`;
});

const isTimeoutFailed = computed(
  () =>
    props.task.status === 'failed' &&
    props.task.failureReason === 'timeout',
);
const status = computed(() => {
  const map = {
    idle: { label: '待生图', color: 'default' },
    generating: { label: '生成中', color: 'processing' },
    success: { label: '已完成', color: 'success' },
    failed: { label: '失败', color: 'error' },
  } as const;
  return map[props.task.status];
});

/**
 * 折叠/展开状态（所有任务 item 都支持）。
 * - 默认收起（idle / success / failed 仅展示标题行，点击「展开详情」看内容）；
 * - generating 时强制展开（watcher 控制），折叠按钮也禁用；
 * - 超时失败默认折叠（用户可手动展开）；
 * - 其余状态默认收起，用户可手动展开。
 */
const collapsed = ref(true);
const isCollapsed = computed(() => collapsed.value);

watch(
  () => [props.task.status, props.task.failureReason] as const,
  ([status, reason]) => {
    if (status === 'generating') {
      // 重新生图时强制展开，避免用户看不到进度
      collapsed.value = false;
    } else if (status === 'failed' && reason === 'timeout') {
      // 超时失败默认折叠（用户可手动展开）
      collapsed.value = true;
    }
  },
  { immediate: true },
);

function toggleCollapse(): void {
  if (isGenerating.value) {return;}
  collapsed.value = !collapsed.value;
}

/* ---------- 用时计时（仅在 generating 时运行） ---------- */
const liveElapsedMs = ref(0);
let timerId: ReturnType<typeof setInterval> | null = null;

function startTimer() {
  if (timerId !== null) {return;}
  const startedAt = props.task.startedAt ?? Date.now();
  liveElapsedMs.value = 0;
  timerId = setInterval(() => {
    liveElapsedMs.value = Date.now() - startedAt;
  }, 100);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

watch(
  isGenerating,
  (val) => {
    if (val) {startTimer();}
    else {stopTimer();}
  },
  { immediate: true },
);

onBeforeUnmount(() => stopTimer());

function formatDuration(ms: number): string {
  const totalSec = Math.floor((ms || 0) / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const liveElapsedText = computed(() => formatDuration(liveElapsedMs.value));

/* ---------- 事件处理 ---------- */

/**
 * 点击「生图 / 重新生图」：抛 @request-start 给父组件，
 * 由父组件统一做「路径守卫」校验后真正调用 store.startTask。
 */
function handleStart() {
  emit('request-start', props.task.id);
}

/* ---------- 重新下载原图 ---------- */

const downloading = ref(false);

/**
 * 重新下载远端原图（未压缩）到浏览器默认下载目录。
 * 走 fetch → blob → objectURL → a[download]，避免跨域时 download 属性失效。
 */
async function handleDownload() {
  const result = props.task.result;
  const url = result?.originalUrl || result?.imageUrl;
  if (!url || downloading.value) {return;}
  downloading.value = true;
  try {
    const ext = (props.task.params.outputFormat || 'png').toLowerCase();
    const file = await downloadImageAsFile(
      url,
      buildImageFileName(props.task.id, ext),
    );
    const objUrl = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 延迟回收，确保浏览器已接管下载
    setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
    message.success('已开始下载原图', 2);
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    message.error(`下载失败：${text}`, 4);
  } finally {
    downloading.value = false;
  }
}

function handleRemove() {
  if (isGenerating.value) {return;}
  // eslint-disable-next-line no-alert
  if (
    window.confirm(
      props.task.localSaved
        ? '确认删除该任务？本地已保存的图片不会被删除。'
        : '确认删除该任务？',
    )
  ) {
    imageStore.removeTask(props.task.id);
  }
}

/**
 * 复制本地保存路径到剪贴板。
 * 注：浏览器出于安全考虑不暴露完整文件系统路径，
 * 我们只能展示「目录名/文件名」的拼接形式。
 */
async function copyLocalPath() {
  if (!props.task.localSaved) {return;}
  const text = `${props.task.localSaved.folderName}/${props.task.localSaved.fileName}`;
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text);
    } else {
      // 降级到 textarea + execCommand
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    message.success('完整路径已复制（浏览器不支持直接打开所在文件夹）', 3);
  } catch (err) {
    message.error('复制失败，请手动复制');
  }
}
</script>

<style lang="scss" scoped>
.task-panel {
  position: relative;

  :deep(.ant-card-head) {
    padding: 0 10px;
    min-height: 34px;
  }

  :deep(.ant-card-body) {
    padding: 8px 10px 10px;
  }

  &__name {
    font-size: 13px;
    color: var(--ink-color);
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 2px;
  }

  &__cost {
    font-size: 12px;
    color: var(--ink-color-3);
    font-variant-numeric: tabular-nums;
  }

  &__preview {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__preview-bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__preview-tip {
    font-size: 11px;
    color: var(--ink-color-3);
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

  &__revised {
    font-size: 11px;
    color: var(--ink-color-3);
    line-height: 1.5;
  }

  &__local {
    margin-top: 8px;
    padding: 6px 8px;
    border: 1px solid #b7eb8f;
    background: #f6ffed;
    border-radius: 6px;
    font-size: 12px;
    color: var(--ink-color-2);
  }

  &__local-label {
    font-weight: 600;
    color: #389e0d;
  }

  &__local-path {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      'Courier New', monospace;
    background: rgba(82, 196, 26, 0.08);
    padding: 1px 6px;
    border-radius: 4px;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    vertical-align: middle;
    cursor: pointer;

    &:hover {
      background: rgba(82, 196, 26, 0.18);
    }
  }

  &__local-meta {
    margin-left: 4px;
    color: var(--ink-color-3);
    font-variant-numeric: tabular-nums;
  }

  &__copy {
    cursor: pointer;
    color: var(--ink-color-3);

    &:hover {
      color: #52c41a;
    }
  }

  /* 折叠态的摘要提示 */
  &__collapsed-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 6px;
    padding: 8px 10px;
    border-radius: 6px;
    background: #fffbe6;
    border: 1px solid #ffe58f;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ink-color-2);

    .anticon {
      flex-shrink: 0;
      margin-top: 2px;
      color: #faad14;
    }
  }

  /* 生成中遮罩 */
  &__loading {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.78);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    border-radius: 6px;
    pointer-events: none;
  }

  &__loading-text {
    font-size: 13px;
    color: var(--ink-color-2);
    letter-spacing: 1px;
    font-variant-numeric: tabular-nums;
  }
}
</style>