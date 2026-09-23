/**
 * 生图任务启动流程（含本地保存路径守卫）
 *
 * 从 image-generator/index.vue 抽出，供两处复用：
 *   1. ImageGenerator 任务面板点击「生图」；
 *   2. ImageCreateModal「换图」弹框点击「生图」（创建后立即启动）。
 *
 * 三种情况：
 *   1. 从未配置过目录（无 folderName）→ 弹守卫弹窗引导首次选择；
 *   2. 配置过（持久化有 folderName）→ 恢复句柄 + 手势内申请权限，
 *      无感通过后直接生图；
 *   3. 句柄恢复不到 / 用户拒绝授权 → 直接重开文件夹选择器。
 */
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { useImageStore } from '@/store/modules/image';
import {
  isLocalSaveSupported,
  pickLocalSaveFolder,
} from '@/utils/image-save';

export function useImageTaskStart() {
  const imageStore = useImageStore();

  /** 强制设置路径的弹窗开关 */
  const guardOpen = ref(false);
  /** 守卫通过后待启动的任务 ID */
  const pendingTaskId = ref<string | null>(null);

  /** 发起生图（内部自动做本地保存路径守卫） */
  async function requestStart(taskId: string): Promise<void> {
    // 情况 1：从未配置 → 弹守卫弹窗
    if (!imageStore.localSaveFolderName) {
      pendingTaskId.value = taskId;
      guardOpen.value = true;
      return;
    }

    // 情况 2：已配置，恢复句柄并在用户手势内申请权限
    const ready = await imageStore.ensureLocalSaveReady();
    if (ready) {
      await imageStore.startTask(taskId);
      return;
    }

    // 情况 3：恢复失败 / 授权被拒 → 直接重新选择文件夹
    if (!isLocalSaveSupported()) {
      message.warning(
        '当前浏览器不支持系统文件夹选择（需 Chrome / Edge / Safari 15.4+）',
        5,
      );
      return;
    }
    try {
      const picked = await pickLocalSaveFolder();
      if (!picked) {return;}
      imageStore.setLocalSaveFolder(picked.name, picked.handle);
      message.success(`已设置本地保存路径：${picked.name}`, 3);
      await imageStore.startTask(taskId);
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err);
      if (!text.includes('AbortError')) {
        message.error(`设置本地保存路径失败：${text}`, 5);
      }
    }
  }

  /**
   * 守卫弹窗「我知道了」被点击：弹文件夹选择器，成功后继续生图。
   * 若用户取消选目录，本次生图请求被丢弃。
   */
  async function handleGuardConfirm(): Promise<void> {
    const taskId = pendingTaskId.value;
    pendingTaskId.value = null;
    if (!taskId) {return;}

    if (!isLocalSaveSupported()) {
      message.warning(
        '当前浏览器不支持系统文件夹选择（需 Chrome / Edge / Safari 15.4+）',
        5,
      );
      return;
    }

    try {
      const picked = await pickLocalSaveFolder();
      if (!picked) {return;}
      imageStore.setLocalSaveFolder(picked.name, picked.handle);
      message.success(`已设置本地保存路径：${picked.name}`, 3);
      await imageStore.startTask(taskId);
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err);
      if (!text.includes('AbortError')) {
        message.error(`设置本地保存路径失败：${text}`, 5);
      }
    }
  }

  return {
    guardOpen,
    requestStart,
    handleGuardConfirm,
  };
}
