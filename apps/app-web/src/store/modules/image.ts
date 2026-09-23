/**
 * AI 生图任务 store（pinia）
 *
 * 数据模型：
 *   - tasks: 生图任务列表（永久持久化到 localStorage）
 *   - activeBackgroundTaskId: 当前被「应用为背景」的任务 ID（持久化）
 *   - localSaveFolderName: 用户配置的本地保存目录名（持久化）
 *   - localSaveDirHandle: 真实目录句柄（不持久化，会话级；下次启动需要重新选）
 *
 * 持久化策略：
 *   - tasks 中只序列化 params + result.originalUrl + result.revisedPrompt +
 *     result.elapsedMs，blob URL 不能跨刷新（URL.createObjectURL 是会话级），
 *     持久化后会失效；hydrate 时若 result.imageUrl 是 blob: 开头则替换为
 *     originalUrl（CDN 临时链接，有效期 24h）。
 *   - localSaveFolderName 只存名字（出于浏览器安全，showDirectoryPicker 不会暴露完整路径）
 *   - localSaveDirHandle 是 FileSystemDirectoryHandle：会话内存在内存，
 *     同时通过 IndexedDB（persistDirHandle）跨刷新恢复；刷新后首次使用前
 *     需在用户手势链路内 requestPermission 授权（Chrome 会记住权限，通常无感）。
 *   - 想彻底规避「刷新后图片不见」：把图片上传到自有 OSS 再把 ossUrl 写进
 *     result.originalUrl；此处为 demo，暂不引入后端依赖。
 *
 * 全局事件：
 *   - 任务开始 / 完成 / 失败 / 删除时通过 imageEventBus 广播，
 *     其它组件（如全局 toast、渐变背景组件）只需 on() 即可订阅。
 *   - 详见 utils/event-bus.ts 中的 ImageEvents 常量。
 *
 * 本地保存：
 *   - 由 image-generator 组件订阅后调用 utils/image-save 中的工具，
 *     完成后把结果回写到 task.localSaved。
 *   - 失败也只记 error，不影响任务生命周期。
 *
 * 超时机制：
 *   - startTask 时挂一个 10 分钟定时器；如果超过 IMAGE_GENERATION_TIMEOUT_MS
 *     仍未返回，自动调用 failTask(id, 'timeout')，把 status 置为 failed 并
 *     写入 failureReason='timeout'。
 *   - 正常成功 / 异常失败 / 删除任务都会清理该 timer，避免泄漏。
 *   - 持久化保留 failureReason；store 初始化时还会通过 checkAndFailTimeoutTasks
 *     检查所有恢复出来的 generating 任务，若已超时则立即标记为失败。
 *
 * 刷新恢复（异步图生图）：
 *   - 创建接口返回 JOB_ID 后立即写入 task.remoteJobId 并持久化；
 *   - 刷新后 hydrate 阶段，仍为 generating 且持有 remoteJobId 的任务由
 *     resumeRunningTasks 直接凭 jobId 继续 3 秒轮询，不再重新提交，
 *     成功后走与正常流程一致的自动保存 / DOM 替换；
 *   - generating 但没有 remoteJobId（刷新时还在上传 / 同步请求阶段）
 *     的任务无法恢复，直接标记失败，提示用户重新生图。
 */
import { defineStore, type PiniaPluginContext } from 'pinia';
import { computed, ref } from 'vue';
import {
  generateImageAuto,
  resumeImageEditJob,
  type GenerateImageParams,
  type GenerateImageResult,
  type ReferenceImage,
  releaseReferenceImages,
} from '@/utils/ai-image';
import { ImageEvents, imageEventBus } from '@/utils/event-bus';
import type { ChangeImageTarget } from '@/utils/event-bus';
import {
  clearPersistedDirHandle,
  createLocalImageObjectUrl,
  ensureDirPermission,
  persistDirHandle,
  restoreDirHandle,
} from '@/utils/image-save';

export type ImageTaskStatus = 'idle' | 'generating' | 'success' | 'failed';

/** 生图失败的具体原因（用于 UI 区分折叠展示 / 文案） */
export type ImageTaskFailureReason = 'timeout' | 'error';

/** 单张生成结果（叠加 elapsedMs 便于 UI 直接展示） */
export interface ImageTaskResult extends GenerateImageResult {
  /** 本次生图耗时（毫秒） */
  elapsedMs: number;
}

/** 本地保存的文件信息（保存成功后由组件回写） */
export interface ImageTaskLocalSaved {
  /** 最终写入的文件名（同名自动加 -1 后缀） */
  fileName: string;
  /** 文件夹名（冗余，便于历史展示） */
  folderName: string;
  /** 实际像素 */
  width: number;
  height: number;
  /** 文件字节数 */
  bytes: number;
  /** 保存时间戳 */
  savedAt: number;
  /**
   * 本地图片的可回显地址（blob: object URL，运行时态，不持久化）。
   * 由「目录句柄 + fileName」读回本地文件生成，供任务详情回显和
   * 替换目标 DOM 使用；刷新后通过 hydrateLocalSavedUrls 重新生成。
   */
  localUrl?: string;
}

/** 单个生图任务的全量状态 */
export interface ImageTask {
  /** 任务 ID（生成自时间戳 + 随机串） */
  id: string;
  /** 任务名（默认取 prompt 前 30 字，可由调用方覆盖） */
  name: string;
  /** 生图参数（传给 ai-image.generateImage） */
  params: GenerateImageParams;
  /** 当前状态 */
  status: ImageTaskStatus;
  /** 成功结果 */
  result?: ImageTaskResult;
  /** 错误信息（status === 'failed' 时有值） */
  error?: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 开始生图时间戳 */
  startedAt?: number;
  /** 结束时间戳（成功 / 失败都会记） */
  completedAt?: number;
  /** 本地保存信息（成功后才会有值；失败时会被忽略，文件不会出现在磁盘上） */
  localSaved?: ImageTaskLocalSaved;
  /**
   * 「换图」任务的目标 DOM 列表（selector + kind），由新建任务弹框写入。
   * 同一 src 在组件容器内可能被多个 DOM 复用，全部记录以便一对多替换。
   * 纯数据可持久化：刷新页面、本地图片 URL 恢复后，可重新替换回原 DOM。
   * 兼容：旧版本任务可能只有单一 changeTarget，fromPersisted 会自动迁移。
   */
  changeTargets?: ChangeImageTarget[];
  /**
   * @deprecated 仅用于兼容旧持久化数据，新代码请使用 changeTargets。
   * 读取时统一走 getChangeTargets(task)，会自动合并两套字段。
   */
  changeTarget?: ChangeImageTarget;
  /**
   * 失败原因：
   *   - 'timeout'：超过 10 分钟未返回，自动判定为失败（会被 UI 默认折叠）
   *   - 'error'：API 抛错或网络异常
   */
  failureReason?: ImageTaskFailureReason;
  /**
   * 异步图生图（带参考图）轮询阶段的远端状态文案（排队中 / 处理中），
   * 仅运行时有效，不参与持久化。
   */
  remoteStatusText?: string;
  /**
   * 异步图生图远端任务 ID（JOB_ID）。
   * 创建接口一返回就写入并随任务持久化：页面刷新后，仍处于 generating
   * 且持有该 ID 的任务可以直接凭它继续轮询（resumeImageEditJob），
   * 直到拿到完整结果。任务进入成功 / 失败终态后清空。
   */
  remoteJobId?: string;
}

/** 用于持久化的最小子集（去掉 blob URL / raw 等会话级或超大的字段） */
interface PersistedTask
  extends Omit<ImageTask, 'result' | 'localSaved'> {
  result?: Omit<ImageTaskResult, 'blobUrl'> & { blobUrl?: undefined };
  localSaved?: Omit<ImageTaskLocalSaved, 'localUrl'> & {
    localUrl?: undefined;
  };
}

const STORAGE_KEY = 'app-web-image-tasks';

/**
 * localStorage 安全包装：写入失败（最典型是配额超限 QuotaExceededError）
 * 只打日志不抛错。插件默认的 setItem 若抛错会中断状态订阅，导致任务终态
 * （success / failed）永远写不进持久化，刷新后又被 resumeRunningTasks
 * 当成进行中任务恢复轮询（表现就是「任务早就完成了，每次刷新还在查状态」）。
 */
const safeLocalStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[image-store] 任务状态持久化写入失败', error);
    }
  },
  removeItem: (key: string) => localStorage.removeItem(key),
};

/**
 * 单次生图允许的最长耗时（10 分钟）。
 * 超过这个时间仍未返回即视为超时，自动调用 failTask(id, 'timeout')。
 */
export const IMAGE_GENERATION_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * 持久化 params：参考图的 File / object URL 都是会话级，无法跨刷新保留，
 * 仅保留 id / name / size 用于展示，file 置空、previewUrl 置空。
 * 刷新后用户如需重新生图，要重新上传参考图（UI 会标注「已失效」）。
 */
function toPersistedParams(params: GenerateImageParams): GenerateImageParams {
  const refs = params.referenceImages;
  if (!refs?.length) {return params;}
  const lightRefs: ReferenceImage[] = refs.map((r) => ({
    id: r.id,
    name: r.name,
    size: r.size,
    previewUrl: '',
    file: null,
  }));
  return { ...params, referenceImages: lightRefs };
}

/** 把内存中的任务压缩成可序列化结构（去掉 blob URL 等会话级字段） */
function toPersisted(tasks: ImageTask[]): PersistedTask[] {
  return tasks.map((t) => ({
    ...t,
    // 轮询状态文案是纯运行时态
    remoteStatusText: undefined,
    params: toPersistedParams(t.params),
    result: t.result
      ? {
          imageUrl: t.result.originalUrl ?? t.result.imageUrl,
          originalUrl: t.result.originalUrl,
          revisedPrompt: t.result.revisedPrompt,
          elapsedMs: t.result.elapsedMs,
          // blobUrl 是会话级，不能持久化；显式置空
          blobUrl: undefined,
          // raw 含完整 b64_json（单张可达数 MB），持久化会撑爆 localStorage
          // 配额导致写入静默失败（任务永远停在 generating + remoteJobId，
          // 每次刷新都被 resumeRunningTasks 恢复轮询已完成任务），这里剔除
          raw: undefined,
        }
      : undefined,
    // localSaved.localUrl 是会话级 blob: URL，持久化时显式剥离；
    // 刷新后用「目录句柄 + fileName」重新生成
    localSaved: t.localSaved
      ? { ...t.localSaved, localUrl: undefined }
      : undefined,
  }));
}

/** 把持久化结构还原成运行时结构（imageUrl 退回 originalUrl 避免失效） */
function fromPersisted(persisted: unknown): ImageTask[] {
  if (!Array.isArray(persisted)) {return [];}
  return persisted.map((t: PersistedTask): ImageTask => {
    let imageUrl = t.result?.imageUrl ?? '';
    if (imageUrl.startsWith('blob:')) {
      // 跨刷新后 blob: URL 已无效，退回到 CDN 链接（如果原记录里有）
      imageUrl = t.result?.originalUrl ?? '';
    }
    // 旧持久化数据：单一 changeTarget → 自动迁移到 changeTargets 数组
    const changeTargets: ChangeImageTarget[] | undefined = Array.isArray(
      t.changeTargets,
    )
      ? t.changeTargets
      : t.changeTarget
        ? [t.changeTarget]
        : undefined;
    return {
      ...t,
      changeTargets,
      // 旧字段在迁移后清空，避免重复消费
      changeTarget: undefined,
      result: t.result
        ? {
            imageUrl,
            originalUrl: t.result.originalUrl,
            revisedPrompt: t.result.revisedPrompt,
            elapsedMs: t.result.elapsedMs,
            // blobUrl 不还原（已经失效）；raw 不持久化（体积过大）
            blobUrl: undefined,
            raw: undefined,
          }
        : undefined,
    };
  });
}

/**
 * 检查已恢复的任务列表，把仍处于 generating 且已超时的任务标记为失败。
 * 用于页面刷新 / store 重新初始化后兜底：避免刷新前正在生成的任务
 * 因 setTimeout 丢失而永远卡在 generating。
 */
function checkAndFailTimeoutTasks(
  tasks: ImageTask[],
  failTask: (
    id: string,
    reason: ImageTaskFailureReason,
    error?: string,
  ) => Promise<void>,
): void {
  const now = Date.now();
  tasks.forEach((task) => {
    if (task.status !== 'generating') {return;}
    const startedAt = task.startedAt ?? task.createdAt;
    if (now - startedAt >= IMAGE_GENERATION_TIMEOUT_MS) {
      void failTask(
        task.id,
        'timeout',
        `生图超时（页面刷新后检测到任务已超过 ${
          IMAGE_GENERATION_TIMEOUT_MS / 60000
        } 分钟未返回）`,
      );
    }
  });
}

/**
 * 从任务中读取「换图」目标列表，统一兼容新旧字段。
 * - 新数据：直接读 changeTargets；
 * - 旧数据：读 changeTarget，缺省时返回空数组。
 * 自动去重 selector+kind，避免同一目标被记录两次。
 */
export function getChangeTargets(task: ImageTask): ChangeImageTarget[] {
  const list: ChangeImageTarget[] = [];
  const seen = new Set<string>();
  const push = (t: ChangeImageTarget | undefined) => {
    if (!t?.selector) {return;}
    const key = `${t.selector}__${t.kind}`;
    if (seen.has(key)) {return;}
    seen.add(key);
    list.push(t);
  };
  if (Array.isArray(task.changeTargets)) {
    task.changeTargets.forEach(push);
  }
  // 兼容旧字段（即使迁移过，这里再兜一次不会有副作用：seen 屏蔽重复）
  push(task.changeTarget);
  return list;
}

export const useImageStore = defineStore(
  'image',
  () => {
    /** 全部生图任务（按 createdAt 倒序） */
    const tasks = ref<ImageTask[]>([]);

    /** 当前被「应用为背景」的任务 ID（背景组件监听这个 ID） */
    const activeBackgroundTaskId = ref<string | null>(null);

    /**
     * 本地保存目录名（持久化）。
     * 浏览器出于安全考虑，showDirectoryPicker 不会暴露完整系统路径，
     * 这里只能存 handle.name 作为展示。
     */
    const localSaveFolderName = ref<string>('');

    /**
     * 本地保存目录的 FileSystemDirectoryHandle。
     * - 会话内由选择文件夹写入；
     * - 同时持久化到 IndexedDB，刷新后通过 restoreLocalSaveDirHandle 恢复；
     * - 恢复后首次写入仍需 requestPermission（在用户手势链路内完成）。
     */
    const localSaveDirHandle = ref<FileSystemDirectoryHandle | null>(null);

    /**
     * 生图任务的超时定时器：id → setTimeout handle。
     * 仅在 setup 闭包内持有，组件 / 路由切换不影响（store 是单例）。
     * - 成功完成 / 异常失败 / 删除任务 / 清空任务 都会清理对应定时器；
     * - 浏览器刷新后这些 handler 全部失效，无需手动清理。
     */
    const timeoutTimers = new Map<string, ReturnType<typeof setTimeout>>();

    /**
     * 异步图生图的轮询中止控制器：id → AbortController。
     * - 任务删除 / 清空 / 超时失败时 abort，立即停止 3 秒轮询；
     * - 文生图任务不创建 controller（Map 中无条目）。
     */
    const abortControllers = new Map<string, AbortController>();

    /** 远端轮询状态 → 中文文案 */
    const REMOTE_STATUS_TEXT: Record<string, string> = {
      pending: '排队中',
      queued: '排队中',
      waiting: '排队中',
      created: '排队中',
      processing: '处理中',
      running: '处理中',
      working: '处理中',
      success: '已完成',
      succeeded: '已完成',
      completed: '已完成',
      failed: '失败',
      error: '失败',
    };

    /** 清理某个任务的超时定时器（无对应 id 时 no-op） */
    function clearTimeoutTimer(id: string): void {
      const t = timeoutTimers.get(id);
      if (t !== undefined) {
        clearTimeout(t);
        timeoutTimers.delete(id);
      }
    }

    /** 中止某个任务的异步轮询（无 controller 时 no-op） */
    function abortTaskPolling(id: string): void {
      const controller = abortControllers.get(id);
      if (controller) {
        controller.abort();
        abortControllers.delete(id);
      }
    }

    /** 当前背景任务（成功态才会被消费，失败 / 生成中忽略） */
    const activeBackgroundTask = computed<ImageTask | null>(() => {
      if (!activeBackgroundTaskId.value) {return null;}
      const t = tasks.value.find((x) => x.id === activeBackgroundTaskId.value);
      return t && t.status === 'success' ? t : null;
    });

    /** 当前正在生图的任务数量（用于全局 loading 提示） */
    const generatingCount = computed(
      () => tasks.value.filter((t) => t.status === 'generating').length,
    );

    /**
     * 本地保存是否「就绪」：目录名存在 + handle 可用。
     * UI 层据此决定：直接生图 / 弹提示并强制选目录。
     */
    const isLocalSaveReady = computed(
      () => !!localSaveDirHandle.value && !!localSaveFolderName.value,
    );

    /* ---------- 本地保存路径 ---------- */

    /**
     * 设置本地保存目录：name + handle 写入 state，
     * 并把 handle 异步持久化到 IndexedDB（失败不影响本次使用）。
     * 来自 utils/image-save.pickLocalSaveFolder 的返回值。
     */
    function setLocalSaveFolder(
      name: string,
      handle: FileSystemDirectoryHandle,
    ): void {
      localSaveFolderName.value = name;
      localSaveDirHandle.value = handle;
      void persistDirHandle(handle).catch(() => {
        // IndexedDB 不可用（隐私模式等）：仅本次会话有效，不打断流程
      });
    }

    /** 清除本地保存目录（state + IndexedDB 一并清理） */
    function clearLocalSaveFolder(): void {
      localSaveFolderName.value = '';
      localSaveDirHandle.value = null;
      void clearPersistedDirHandle().catch(() => {
        /* 忽略清理失败 */
      });
    }

    /**
     * 从 IndexedDB 恢复目录句柄（store 初始化 / hydrate 后调用）。
     * 只恢复 handle，不动 folderName（folderName 走 pinia persist）。
     */
    async function restoreLocalSaveDirHandle(): Promise<void> {
      if (localSaveDirHandle.value) {return;}
      const handle = await restoreDirHandle();
      if (handle) {
        localSaveDirHandle.value = handle;
      }
    }

    /**
     * 确保本地保存目录「可用」：有 handle 且已授权。
     * 必须在用户点击等手势链路内调用（内部可能触发 requestPermission）。
     * - 内存有 handle → 直接校验权限；
     * - 内存没有 → 尝试从 IndexedDB 恢复后再校验；
     * - 都没有 / 用户拒绝授权 → 返回 false，调用方应引导重新选择目录。
     */
    async function ensureLocalSaveReady(): Promise<boolean> {
      let handle = localSaveDirHandle.value;
      if (!handle) {
        await restoreLocalSaveDirHandle();
        handle = localSaveDirHandle.value;
      }
      if (!handle) {return false;}
      return ensureDirPermission(handle, 'readwrite');
    }

    /**
     * 为所有「已本地保存但当前会话没有 localUrl」的任务重新生成本地
     * 图片可回显地址（blob: object URL）。
     *
     * 刷新页面后调用：持久化里只有目录句柄（IndexedDB）+ fileName，
     * object URL 是会话级的无法持久化，需要读回本地文件重新生成。
     *
     * @param interactive true：允许在用户手势链路内弹权限申请；
     *                    false：只静默查询已授权状态（页面刚加载时用）。
     * @returns 本次成功恢复 URL 的任务数
     */
    async function hydrateLocalSavedUrls(
      interactive: boolean,
    ): Promise<number> {
      let handle = localSaveDirHandle.value;
      if (!handle) {
        await restoreLocalSaveDirHandle();
        handle = localSaveDirHandle.value;
      }
      if (!handle) {return 0;}
      const permitted = await ensureDirPermission(handle, 'read', interactive);
      if (!permitted) {return 0;}

      let count = 0;
      // 串行读取，避免一次性对大量文件发起磁盘 IO
      for (const task of tasks.value) {
        const saved = task.localSaved;
        if (!saved?.fileName || saved.localUrl) {continue;}
        try {
          const localUrl = await createLocalImageObjectUrl(
            handle,
            saved.fileName,
          );
          updateTask(task.id, {
            localSaved: { ...saved, localUrl },
          });
          count += 1;
        } catch {
          // 文件被移动 / 删除 / 权限不足：静默跳过，
          // 任务详情仍可回退到 CDN originalUrl，等下次手势再试
        }
      }
      return count;
    }

    /* ---------- 任务 CRUD ---------- */

    /**
     * 新增一个 idle 任务，返回任务 ID。
     * 默认取 prompt 前 30 字作为展示名，调用方也可通过 name 覆盖。
     * changeTargets 由「换图」弹框传入（组件级聚合后的目标列表），
     * 用于任务完成后把本地图片同步替换回组件内全部目标 DOM，
     * 可持久化，刷新后仍能重放。
     */
    function addTask(
      params: GenerateImageParams,
      name?: string,
      changeTargets?: ChangeImageTarget[],
    ): string {
      const id =
        `task-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
      const task: ImageTask = {
        id,
        name: (name || params.prompt || '').slice(0, 30) || '未命名任务',
        params,
        status: 'idle',
        createdAt: Date.now(),
        changeTargets: changeTargets && changeTargets.length
          ? changeTargets.map((t) => ({ selector: t.selector, kind: t.kind }))
          : undefined,
      };
      tasks.value.unshift(task);
      return id;
    }

    /** 部分更新某个任务（找不到时静默忽略） */
    function updateTask(id: string, patch: Partial<ImageTask>): void {
      const idx = tasks.value.findIndex((t) => t.id === id);
      if (idx === -1) {return;}
      const prev = tasks.value[idx];
      tasks.value.splice(idx, 1, { ...prev, ...patch });
    }

    /**
     * 删除任务（同时 revoke blob URL / 参考图预览 URL、中止异步轮询、
     * 清理超时定时器、清理 active 标记、广播 TASK_REMOVE）。
     * 如果删除的恰好是当前背景任务，会自动清空背景。
     */
    function removeTask(id: string): void {
      const task = tasks.value.find((t) => t.id === id);
      if (!task) {return;}
      clearTimeoutTimer(id);
      abortTaskPolling(id);
      if (task.result?.blobUrl) {
        URL.revokeObjectURL(task.result.blobUrl);
      }
      if (task.localSaved?.localUrl) {
        URL.revokeObjectURL(task.localSaved.localUrl);
      }
      releaseReferenceImages(task.params.referenceImages);
      tasks.value = tasks.value.filter((t) => t.id !== id);
      if (activeBackgroundTaskId.value === id) {
        activeBackgroundTaskId.value = null;
      }
      imageEventBus.emit(ImageEvents.TASK_REMOVE, { taskId: id });
    }

    /** 清空全部任务 */
    function clearTasks(): void {
      // 先回收所有 blob URL + 参考图预览 URL + 中止轮询 + 清理全部定时器
      tasks.value.forEach((t) => {
        clearTimeoutTimer(t.id);
        abortTaskPolling(t.id);
        if (t.result?.blobUrl) {URL.revokeObjectURL(t.result.blobUrl);}
        if (t.localSaved?.localUrl) {
          URL.revokeObjectURL(t.localSaved.localUrl);
        }
        releaseReferenceImages(t.params.referenceImages);
      });
      tasks.value = [];
      activeBackgroundTaskId.value = null;
    }

    /* ---------- 任务执行 ---------- */

    /** 远端轮询状态 → 回写 remoteStatusText */
    function makeOnStatus(id: string) {
      return (status: string) => {
        const text =
          REMOTE_STATUS_TEXT[status] ??
          (status ? `处理中（${status}）` : '处理中');
        updateTask(id, { remoteStatusText: text });
      };
    }

    /**
     * 为任务注册运行时守卫：AbortController + 超时定时器。
     * 正常启动（10 分钟完整时长）与刷新恢复（只给剩余时长）共用。
     */
    function registerTaskGuard(id: string, timeoutMs: number): AbortSignal {
      const controller = new AbortController();
      abortControllers.set(id, controller);
      const timerId = setTimeout(() => {
        abortTaskPolling(id);
        void failTask(
          id,
          'timeout',
          `生图超时（已超过 ${IMAGE_GENERATION_TIMEOUT_MS / 60000} 分钟未返回）`,
        );
      }, Math.max(0, timeoutMs));
      timeoutTimers.set(id, timerId);
      return controller.signal;
    }

    /** 成功收尾：更新状态、清空远端 jobId、广播 TASK_COMPLETE */
    function finalizeTaskSuccess(
      id: string,
      result: GenerateImageResult,
      startedAt: number,
    ): void {
      clearTimeoutTimer(id);
      abortControllers.delete(id);
      const elapsedMs = Date.now() - startedAt;
      updateTask(id, {
        status: 'success',
        completedAt: Date.now(),
        result: { ...result, elapsedMs },
        error: undefined,
        remoteStatusText: undefined,
        // 已拿到终态，持久化的远端 jobId 不再需要
        remoteJobId: undefined,
      });
      imageEventBus.emit(ImageEvents.TASK_COMPLETE, {
        taskId: id,
        result,
        elapsedMs,
      });
    }

    /** 失败收尾：超时分支（已由 failTask 处理）之外的错误在此落盘 */
    function finalizeTaskError(
      id: string,
      err: unknown,
      startedAt: number,
    ): void {
      clearTimeoutTimer(id);
      abortControllers.delete(id);
      // 超时分支已通过 failTask 把任务置为 failed，这里忽略迟到的 abort/结果
      const latest = tasks.value.find((t) => t.id === id);
      if (!latest || latest.status !== 'generating') {return;}
      const error =
        err instanceof Error ? err.message : String(err ?? '未知错误');
      updateTask(id, {
        status: 'failed',
        completedAt: Date.now(),
        error,
        failureReason: 'error',
        remoteStatusText: undefined,
        remoteJobId: undefined,
      });
      imageEventBus.emit(ImageEvents.TASK_FAIL, {
        taskId: id,
        error,
        elapsedMs: Date.now() - startedAt,
        reason: 'error',
      });
    }

    /**
     * 启动指定任务的生图流程。
     * - 自动管理 idle → success / failed 状态；
     * - 参数中带有效参考图时走异步图生图（创建任务 + 3 秒轮询），
     *   JOB_ID 一返回就写入 remoteJobId 并持久化，轮询期间刷新页面
     *   也能凭它恢复（见 resumeTaskPolling）；
     * - 失败有错误信息、不影响其他任务；
     * - 超时控制：10 分钟未返回则自动标记为 failed（reason='timeout'），
     *   同时中止轮询；
     * - 完成后通过 imageEventBus 广播 TASK_COMPLETE / TASK_FAIL。
     */
    async function startTask(id: string): Promise<void> {
      const task = tasks.value.find((t) => t.id === id);
      if (!task) {return;}
      if (task.status === 'generating') {return;}

      const startedAt = Date.now();
      // 重新生成前先清理残留的定时器 / 轮询，并回收上一次的 blob 结果
      clearTimeoutTimer(id);
      abortTaskPolling(id);
      if (task.result?.blobUrl) {
        URL.revokeObjectURL(task.result.blobUrl);
      }
      updateTask(id, {
        status: 'generating',
        startedAt,
        error: undefined,
        failureReason: undefined,
        remoteStatusText: undefined,
        // 清掉旧的远端 jobId，等新任务创建后重新写入
        remoteJobId: undefined,
        // 清掉上一次的 result，便于 UI 立刻反馈「重新生图中」
        result: undefined,
      });
      imageEventBus.emit(ImageEvents.TASK_START, {
        taskId: id,
        params: task.params,
      });

      const signal = registerTaskGuard(id, IMAGE_GENERATION_TIMEOUT_MS);

      try {
        const result = await generateImageAuto(task.params, {
          signal,
          onStatus: makeOnStatus(id),
          // JOB_ID 拿到即持久化：这是刷新后能恢复轮询的关键
          onJobCreated: (jobId) => updateTask(id, { remoteJobId: jobId }),
        });
        finalizeTaskSuccess(id, result, startedAt);
      } catch (err) {
        finalizeTaskError(id, err, startedAt);
      }
    }

    /**
     * 刷新页面后恢复单个「生成中」的异步图生图任务：
     * 不重新提交，直接用持久化的 remoteJobId 继续 3 秒轮询。
     * 超时只按「原始开始时间」的剩余时长计算，保证总耗时仍不超过
     * IMAGE_GENERATION_TIMEOUT_MS。
     */
    async function resumeTaskPolling(id: string): Promise<void> {
      const task = tasks.value.find((t) => t.id === id);
      if (!task || task.status !== 'generating' || !task.remoteJobId) {
        return;
      }

      const startedAt = task.startedAt ?? task.createdAt;
      const remainingMs = Math.max(
        1000,
        IMAGE_GENERATION_TIMEOUT_MS - (Date.now() - startedAt),
      );
      const signal = registerTaskGuard(id, remainingMs);

      try {
        const result = await resumeImageEditJob(
          task.remoteJobId,
          task.params,
          {
            signal,
            timeoutMs: remainingMs,
            onStatus: makeOnStatus(id),
          },
        );
        finalizeTaskSuccess(id, result, startedAt);
      } catch (err) {
        finalizeTaskError(id, err, startedAt);
      }
    }

    /**
     * 恢复所有「生成中且持有远端 jobId」的任务（store hydrate 后调用）。
     * 没有 jobId 的生成中任务无法恢复（刷新时还在上传 / 文生图请求阶段），
     * 由调用方提前标记为失败。
     */
    async function resumeRunningTasks(): Promise<void> {
      const targets = tasks.value.filter(
        (t) => t.status === 'generating' && !!t.remoteJobId,
      );
      await Promise.all(targets.map((t) => resumeTaskPolling(t.id)));
    }

    /**
     * 把正在生图的任务强制标记为失败。
     * 用于超时处理；若任务已不存在或已不在 generating 状态则静默忽略。
     */
    async function failTask(
      id: string,
      reason: ImageTaskFailureReason,
      error?: string,
    ): Promise<void> {
      const task = tasks.value.find((t) => t.id === id);
      if (!task || task.status !== 'generating') {return;}
      clearTimeoutTimer(id);
      const elapsedMs = task.startedAt ? Date.now() - task.startedAt : 0;
      const finalError =
        error ??
        (reason === 'timeout'
          ? `生图超时（已超过 ${IMAGE_GENERATION_TIMEOUT_MS / 60000} 分钟未返回）`
          : '未知错误');
      updateTask(id, {
        status: 'failed',
        completedAt: Date.now(),
        error: finalError,
        failureReason: reason,
        remoteStatusText: undefined,
        remoteJobId: undefined,
      });
      imageEventBus.emit(ImageEvents.TASK_FAIL, {
        taskId: id,
        error: finalError,
        elapsedMs,
        reason,
      });
    }

    /* ---------- 背景控制 ---------- */

    /** 把某个任务「应用为背景」，所有其他任务的标记会被清掉 */
    function applyAsBackground(id: string): void {
      activeBackgroundTaskId.value = id;
      imageEventBus.emit(ImageEvents.APPLY_BACKGROUND, { taskId: id });
    }

    /** 清除背景，回到默认渐变 */
    function clearBackground(): void {
      activeBackgroundTaskId.value = null;
      imageEventBus.emit(ImageEvents.CLEAR_BACKGROUND, {});
    }

    return {
      tasks,
      activeBackgroundTaskId,
      activeBackgroundTask,
      generatingCount,
      localSaveFolderName,
      localSaveDirHandle,
      isLocalSaveReady,
      addTask,
      updateTask,
      removeTask,
      clearTasks,
      startTask,
      resumeTaskPolling,
      resumeRunningTasks,
      failTask,
      applyAsBackground,
      clearBackground,
      setLocalSaveFolder,
      clearLocalSaveFolder,
      restoreLocalSaveDirHandle,
      ensureLocalSaveReady,
      hydrateLocalSavedUrls,
    };
  },
  {
    persist: {
      key: STORAGE_KEY,
      storage: safeLocalStorage,
      // localSaveFolderName 持久化（名字是用户配置，跨刷新保留）
      // localSaveDirHandle 不持久化（浏览器限制，下次启动需重新选）
      pick: [
        'tasks',
        'activeBackgroundTaskId',
        'localSaveFolderName',
      ],
      serializer: {
        serialize: (value: unknown) =>
          JSON.stringify({
            ...(value as Record<string, unknown>),
            tasks: toPersisted((value as { tasks?: ImageTask[] }).tasks ?? []),
          }),
        deserialize: (raw: string) => {
          const obj = JSON.parse(raw);
          return {
            ...obj,
            tasks: fromPersisted(obj.tasks),
          };
        },
      },
      afterHydrate: (context: PiniaPluginContext) => {
        const store = context.store as unknown as {
          tasks: ImageTask[];
          failTask: (
            id: string,
            reason: ImageTaskFailureReason,
            error?: string,
          ) => Promise<void>;
          restoreLocalSaveDirHandle: () => Promise<void>;
          hydrateLocalSavedUrls: (interactive: boolean) => Promise<number>;
          resumeRunningTasks: () => Promise<void>;
        };
        // 1. 刷新前已超过 10 分钟的 generating 任务直接判超时失败
        checkAndFailTimeoutTasks(store.tasks, store.failTask);

        // 2. 仍在 generating 但没有远端 jobId 的任务无法恢复：
        //    刷新发生在上传 / 文生图同步请求阶段，请求随页面销毁已丢失，
        //    直接标记失败并提示用户重新生图（超时分支上一步已处理）
        store.tasks
          .filter((t) => t.status === 'generating' && !t.remoteJobId)
          .forEach((t) => {
            void store.failTask(
              t.id,
              'error',
              '页面刷新时任务尚未提交成功，状态无法恢复，请重新生图',
            );
          });

        // 3. 持有远端 jobId 的 generating 任务：立即恢复 3 秒轮询，
        //    直到拿到完整结果（成功后同样触发自动保存 / DOM 替换）
        void store.resumeRunningTasks();

        // 4. 异步从 IndexedDB 恢复目录句柄（刷新后无需重新选文件夹）；
        //    句柄恢复后静默尝试（不弹权限框）用本地文件重建可回显 URL，
        //    未授权时等 layout 的用户手势兜底再试。
        void store
          .restoreLocalSaveDirHandle()
          .then(() => store.hydrateLocalSavedUrls(false));
      },
    },
  },
);