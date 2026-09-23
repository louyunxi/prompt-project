<!--
  组件名称：ImageGenerator（生图任务管理）
  来源迁移：apps/app-web 模板原创（无源迁移）

  依赖 / 版本：
    - vue ^3.5.13（catalog）
    - ant-design-vue ^4.2.6

  数据来源：
    - 全量状态从 @/store/modules/image 的 useImageStore 读取，
      本组件不维护任何业务状态，只负责 UI 渲染 + 派发 store action。
    - 全局事件由 store 内部通过 imageEventBus 广播，
      其他组件（toast / 背景）只需 on() 即可订阅。

  行为：
    1. 顶部「+ 新建任务」按钮：向 store 追加一个 idle 任务（默认参数）。
    2. 顶部右侧「本地保存路径」：展示当前配置的目录名 + 设置图标，点击
       触发系统文件夹选择器。设置持久化到 pinia image 模块。
    3. 任务列表按 createdAt 倒序，每个任务渲染一个 ImageTaskPanel。
    4. 生图前校验：若本地保存未就绪，弹出 LocalPathGuardModal 让用户
       选择文件夹；选择成功后自动继续生图。
    5. 自动保存：订阅 TASK_COMPLETE 事件，对每个新生成的任务做
       download → compress → save，保存成功回写到 task.localSaved。
    6. 「清空」按钮：移除全部任务（同时回收 blob URL；本地图片文件保留）。
-->
<template>
  <div class="image-generator">
    <div class="image-generator__header">
      <div class="image-generator__title">
        <h3>生图任务管理</h3>
        <span class="image-generator__stats">
          共 {{ imageStore.tasks.length }} 个任务
          <template v-if="imageStore.generatingCount > 0">
            ，生成中 {{ imageStore.generatingCount }}
          </template>
          <template v-if="localSavedCount > 0">
            ，已本地保存 {{ localSavedCount }}
          </template>
        </span>
      </div>

      <!-- 顶部右侧：本地保存路径 + 新建任务 + 清空 -->
      <a-space :size="8">
        <!-- 本地保存路径：右侧设置图标，点击弹出系统文件夹选择 -->
        <a-tooltip
          :title="
            imageStore.localSaveFolderName
                ? '当前已配置：' + imageStore.localSaveFolderName
                : '点击设置本地保存路径（生图结果会自动保存到此目录）'
          "
        >
          <a-tag
            class="image-generator__save-path"
            :color="imageStore.isLocalSaveReady ? 'blue' : 'default'"
            @click="handleOpenFolderPicker"
          >
            <template #icon>
              <FolderOutlined v-if="imageStore.isLocalSaveReady" />
              <FolderOpenOutlined v-else />
            </template>
            {{ imageStore.localSaveFolderName || '本地保存路径未设置' }}
            <SettingOutlined class="image-generator__save-path-icon" />
          </a-tag>
        </a-tooltip>

        <a-button type="primary" size="small" @click="handleNewTask">
          <template #icon><PlusOutlined /></template>
          新建任务
        </a-button>
        <a-button
          size="small"
          :disabled="!imageStore.tasks.length"
          @click="handleClearAll"
        >
          清空
        </a-button>
      </a-space>
    </div>

    <a-empty
      v-if="!imageStore.tasks.length"
      description="暂无生图任务，点击右上角「新建任务」开始"
      style="margin: 24px 0"
    />

    <div v-else class="image-generator__list">
      <ImageTaskPanel
        v-for="task in imageStore.tasks"
        :key="task.id"
        :task="task"
        @request-start="handleRequestStart"
      />
    </div>

    <!-- 强制设置路径的弹窗 -->
    <LocalPathGuardModal
      v-model:open="guardOpen"
      @confirm="handleGuardConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  FolderOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';
import { useImageStore } from '@/store/modules/image';
import { ImageEvents, imageEventBus } from '@/utils/event-bus';
import { DEFAULT_GENERATE_IMAGE_PARAMS } from '@/utils/ai-image';
import {
  buildImageFileName,
  createLocalImageObjectUrl,
  isLocalSaveSupported,
  pickLocalSaveFolder,
  saveImageFromUrlToDir,
  toastSaveError,
} from '@/utils/image-save';
import ImageTaskPanel from './components/ImageTaskPanel.vue';
import LocalPathGuardModal from './components/LocalPathGuardModal.vue';
import { useImageTaskStart } from './composables/useImageTaskStart';

const imageStore = useImageStore();

/* ---------- 派生数据 ---------- */

/** 已本地保存的任务数（用于 stats 提示） */
const localSavedCount = computed(
  () => imageStore.tasks.filter((t) => t.localSaved).length,
);

/* ---------- 路径选择 ---------- */

/**
 * 用户主动点击顶部路径 tag 时的处理：
 * - 支持浏览器：直接弹 showDirectoryPicker
 * - 不支持：弹友好提示
 */
async function handleOpenFolderPicker() {
  if (!isLocalSaveSupported()) {
    message.warning(
      '当前浏览器不支持系统文件夹选择（需 Chrome / Edge / Safari 15.4+）',
      4,
    );
    return;
  }
  try {
    const picked = await pickLocalSaveFolder();
    if (picked) {
      imageStore.setLocalSaveFolder(picked.name, picked.handle);
      message.success(`已设置本地保存路径：${picked.name}`, 3);
    }
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    // 用户取消时不报错
    if (
      text.includes('AbortError') ||
      text.includes('用户取消') ||
      text.includes('permission denied') === false
    ) {
      if (!text.includes('AbortError')) {
        message.error(`设置本地保存路径失败：${text}`, 5);
      }
    }
  }
}

/* ---------- 生图流程（含路径守卫） ---------- */

const { guardOpen, requestStart, handleGuardConfirm } = useImageTaskStart();

/**
 * 任务面板点击「生图」时通过 @request-start 抛上来，
 * 路径守卫（首次选目录 / 恢复句柄 / 重新授权）统一在 composable 内处理。
 */
async function handleRequestStart(taskId: string) {
  await requestStart(taskId);
}

/* ---------- 自动保存：订阅 TASK_COMPLETE ---------- */

const offFns: Array<() => void> = [];

/**
 * 收到 TASK_COMPLETE 后：
 * 1. 找到对应 task
 * 2. 拿到 result.originalUrl（CDN 链接，原始未压缩）
 * 3. 下载 → 压缩 → 写本地
 * 4. 读回本地文件生成可回显 object URL，回写 task.localSaved.localUrl
 *
 * 本地保存失败仅 toast 提示，不动任务态。
 * 注意：DOM 图片替换已统一收敛到「图片替换」弹框内完成，抽屉不再替换 DOM。
 */
async function handleAutoSave(
  taskId: string,
  originalUrl: string | undefined,
) {
  const task = imageStore.tasks.find((t) => t.id === taskId);
  if (!task) {return;}
  // 重新生成会把上一次的 localSaved 保留下来（当前不重复落盘），
  // 因此这里直接返回，也绝不能用旧的本地图替换 DOM
  if (task.localSaved) {return;}
  if (!imageStore.isLocalSaveReady) {return;}
  if (!originalUrl) {
    message.warn(`任务 ${task.name} 缺少远端原图，无法保存到本地`);
    return;
  }

  const handle = imageStore.localSaveDirHandle!;
  // 选格式：偏好 outputFormat，没有再根据 transparent 推
  const format = (task.params.outputFormat ?? 'png').toLowerCase();
  const fileName = buildImageFileName(task.id, format);

  try {
    const info = await saveImageFromUrlToDir(handle, originalUrl, fileName, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.92,
    });

    // 读回刚写入的本地文件，生成可直接回显 / 替换 DOM 的 blob: 地址。
    // 读回失败不影响保存结果，替换时回退到结果图地址。
    let localUrl: string | undefined;
    try {
      localUrl = await createLocalImageObjectUrl(handle, info.fileName);
    } catch {
      localUrl = undefined;
    }

    imageStore.updateTask(task.id, {
      localSaved: {
        fileName: info.fileName,
        folderName: imageStore.localSaveFolderName,
        width: info.width,
        height: info.height,
        bytes: info.bytes,
        savedAt: Date.now(),
        localUrl,
      },
    });
    message.success(
      `已保存到本地：${imageStore.localSaveFolderName}/${info.fileName}`,
      4,
    );
  } catch (err) {
    toastSaveError(err);
  }
}

onMounted(() => {
  offFns.push(
    imageEventBus.on<{ taskId: string; elapsedMs: number; result?: unknown }>(
      ImageEvents.TASK_COMPLETE,
      (e) => {
        const task = imageStore.tasks.find((t) => t.id === e.taskId);
        if (!task) {return;}
        const r = (e.result ?? task.result) as
          | { originalUrl?: string; imageUrl?: string }
          | undefined;
        void handleAutoSave(e.taskId, r?.originalUrl ?? r?.imageUrl);
      },
    ),
  );
});

onBeforeUnmount(() => {
  offFns.forEach((off) => off());
  offFns.length = 0;
});

/* ---------- 任务 CRUD ---------- */

/** 新建任务：使用统一默认参数（DOM image 属性 merge 也以此为基线） */
function handleNewTask() {
  imageStore.addTask({ ...DEFAULT_GENERATE_IMAGE_PARAMS }, undefined);
}

/** 清空全部任务（弹窗二次确认；本地图片文件不会被删除） */
function handleClearAll() {
  if (!imageStore.tasks.length) {return;}
  // eslint-disable-next-line no-alert
  if (
    window.confirm(
      `确认清空全部 ${imageStore.tasks.length} 个任务？本操作仅清除任务记录，已保存到本地的图片不会被删除。`,
    )
  ) {
    imageStore.clearTasks();
  }
}
</script>

<style lang="scss" scoped>
.image-generator {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--line-color);
  }

  &__title {
    display: flex;
    flex-direction: column;
    gap: 4px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--ink-color);
    }
  }

  &__stats {
    font-size: 12px;
    color: var(--ink-color-3);
  }

  &__save-path {
    cursor: pointer;
    user-select: none;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
      opacity: 0.85;
    }
  }

  &__save-path-icon {
    margin-left: 6px;
    font-size: 12px;
    opacity: 0.7;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>