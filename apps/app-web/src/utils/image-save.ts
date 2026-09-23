/**
 * 图片本地保存工具（浏览器侧）
 *
 * 业务流程：
 *   1. showDirectoryPicker() 弹出系统文件夹选择器（File System Access API）
 *   2. fetch 下载远端图片（CDN URL）
 *   3. Canvas 压缩：保持宽高比、限制在 maxWidth x maxHeight 内、不放大
 *   4. 通过 FileSystemDirectoryHandle 把压缩后的文件写入本地
 *
 * 兼容性：
 *   - showDirectoryPicker 仅 Chrome / Edge / Opera / Safari 15.4+ 支持
 *   - Firefox 当前不支持，需要给出友好提示
 *
 * 安全 / 隐私：
 *   - 出于浏览器安全考虑，showDirectoryPicker 不会返回完整文件系统路径，
 *     只暴露目录名（handle.name）。这就是我们在 UI 上展示「本地保存路径」
 *     的全部可见信息。
 *   - FileSystemDirectoryHandle 可以结构化克隆并存入 IndexedDB，
 *     因此通过 persistDirHandle / restoreDirHandle 实现跨刷新恢复；
 *     但刷新后首次写入前仍需在用户手势内 requestPermission 授权一次。
 *   - 浏览器没有任何 API 能直接打开系统文件管理器定位到文件，
 *     「完整路径」在 UI 上只能以「目录名/文件名」形式展示 / 复制。
 */
import { message } from 'ant-design-vue';

export interface PickedFolder {
  /** 文件夹名（handle.name，浏览器出于隐私只暴露这个） */
  name: string;
  /** 写入权限的目录 handle */
  handle: FileSystemDirectoryHandle;
}

export interface LocalSavedImageInfo {
  /** 实际写入的最终文件名（同名时自动加 -1 / -2 ... 后缀） */
  fileName: string;
  /** 写入后的实际像素宽 */
  width: number;
  /** 写入后的实际像素高 */
  height: number;
  /** 文件大小（字节） */
  bytes: number;
}

/** 浏览器是否原生支持 showDirectoryPicker */
export function isLocalSaveSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as { showDirectoryPicker?: unknown }).showDirectoryPicker ===
      'function'
  );
}

/**
 * 弹出系统文件夹选择器。
 * 必须在用户点击事件的同步链路内调用（async 之内可以，但不能 setTimeout）。
 */
export async function pickLocalSaveFolder(): Promise<PickedFolder | null> {
  if (!isLocalSaveSupported()) {
    throw new Error(
      '当前浏览器不支持文件夹选择（需 Chrome 86+ / Edge 86+ / Safari 15.4+）',
    );
  }
  const w = window as unknown as {
    showDirectoryPicker: (opts?: {
      mode?: 'read' | 'readwrite';
      id?: string;
    }) => Promise<FileSystemDirectoryHandle>;
  };
  const handle = await w.showDirectoryPicker({
    mode: 'readwrite',
    // id 用于复用浏览器的「记住权限」机制，避免每次都询问
    id: 'app-web-image-save',
  });
  // 显式声明写权限；某些浏览器在 reuse id 时会自动通过
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perm = await (handle as any).requestPermission?.({ mode: 'readwrite' });
  if (perm && perm !== 'granted') {
    throw new Error('用户拒绝了文件夹写入权限');
  }
  return { name: handle.name, handle };
}

/** 把 URL 转成 File 对象（保留 MIME / 文件名） */
export async function downloadImageAsFile(
  url: string,
  fileName = 'image',
): Promise<File> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`下载图片失败：HTTP ${resp.status}`);
  }
  const blob = await resp.blob();
  const mimeType = blob.type || 'image/png';
  const finalName = fileName.includes('.') ? fileName : fileName;
  return new File([blob], finalName, { type: mimeType });
}

/**
 * 用 Canvas 压缩图片。
 * 规则：
 *   - 保持原始宽高比（不会出现拉伸）
 *   - 实际宽高严格 ≤ (maxWidth, maxHeight)
 *   - 若原图比限制还小，则不放大（ratio cap 为 1）
 *   - 保留原 MIME（PNG 仍为 PNG、JPG 仍为 JPG、WebP 仍为 WebP）
 *   - PNG 不支持 quality，会被 toBlob 忽略；JPG/WebP 使用传入 quality
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.92,
): Promise<File> {
  const mimeType = file.type || 'image/png';
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(
    maxWidth / bitmap.width,
    maxHeight / bitmap.height,
    1,
  );
  const newWidth = Math.max(1, Math.round(bitmap.width * ratio));
  const newHeight = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(newWidth, newHeight)
      : Object.assign(document.createElement('canvas'), {
          width: newWidth,
          height: newHeight,
        });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = (canvas as any).getContext('2d') as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error('Canvas 2d context 不可用');
  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);

  const blob = await canvasToBlobCompat(canvas, mimeType, quality);
  return new File([blob], file.name, { type: mimeType });
}

/** OffscreenCanvas / HTMLCanvasElement 统一包一层 toBlob */
async function canvasToBlobCompat(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  // OffscreenCanvas 走 convertToBlob
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({
      type: mimeType,
      // PNG 不支持 quality
      quality: mimeType === 'image/png' ? undefined : quality,
    });
  }
  // HTMLCanvasElement 走 toBlob
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob 返回空'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      mimeType === 'image/png' ? undefined : quality,
    );
  });
}

/**
 * 把 File / Blob 写入目录 handle。同名文件自动加后缀 -1 / -2 ...
 */
export async function saveFileToDir(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  file: File | Blob,
): Promise<string> {
  const dotIdx = fileName.lastIndexOf('.');
  const ext = dotIdx > 0 ? fileName.slice(dotIdx + 1) : '';
  const base = dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName;

  let finalName = fileName;
  let counter = 1;
  // 同名文件检查（最多尝试 999 次后强制退出）
  while (counter < 1000) {
    try {
      await dirHandle.getFileHandle(finalName, { create: false });
      // 已存在，加后缀重试
      finalName = ext ? `${base}-${counter}.${ext}` : `${base}-${counter}`;
      counter++;
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name = (err as any)?.name;
      if (name === 'NotFoundError') break;
      throw err;
    }
  }
  if (counter >= 1000) {
    throw new Error('同名文件过多，请清理目录后重试');
  }

  const fileHandle = await dirHandle.getFileHandle(finalName, {
    create: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writable = await (fileHandle as any).createWritable();
  await writable.write(file);
  await writable.close();
  return finalName;
}

/**
 * 端到端把远端 URL 图片下载、压缩、保存到本地目录。
 * 抛错由调用方统一处理。
 */
export async function saveImageFromUrlToDir(
  dirHandle: FileSystemDirectoryHandle,
  url: string,
  fileName: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  },
): Promise<LocalSavedImageInfo> {
  const file = await downloadImageAsFile(url, fileName);
  const compressed = await compressImage(
    file,
    options?.maxWidth ?? 1920,
    options?.maxHeight ?? 1080,
    options?.quality ?? 0.92,
  );
  const finalName = await saveFileToDir(dirHandle, file.name, compressed);
  const bitmap = await createImageBitmap(compressed);
  return {
    fileName: finalName,
    width: bitmap.width,
    height: bitmap.height,
    bytes: compressed.size,
  };
}

/**
 * 按文件名从本地保存目录中读回文件（File 句柄）。
 * 用于保存成功后 / 刷新页面后重新生成本地图片的可回显地址。
 * 需要目录句柄至少具备 read 权限。
 */
export async function readFileFromDir(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
): Promise<File> {
  const fileHandle = await dirHandle.getFileHandle(fileName, {
    create: false,
  });
  return fileHandle.getFile();
}

/**
 * 读取本地保存目录中的图片并生成可直接用于 <img src> /
 * background-image 的 blob: object URL。
 *
 * 注意：object URL 是会话级的（刷新后失效），不能持久化，
 * 刷新后需要用「目录句柄 + fileName」重新调用本函数生成。
 * 调用方负责在不需要时 URL.revokeObjectURL() 回收。
 */
export async function createLocalImageObjectUrl(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
): Promise<string> {
  const file = await readFileFromDir(dirHandle, fileName);
  return URL.createObjectURL(file);
}

/**
 * 默认文件名生成器：{短任务ID}_{时间戳}.{ext}
 * 避免同名覆盖（同一任务重复生成也会产生不同时间戳）。
 */
export function buildImageFileName(
  taskId: string,
  ext: string,
  now: number = Date.now(),
): string {
  const short = taskId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
  return `${short}-${now}.${ext}`;
}

/** 把字节数格式化为可读字符串 */
export function formatBytes(bytes: number): string {
  if (!bytes && bytes !== 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** 一站式：保存失败时统一 toast，避免每个调用方都写一遍 */
export function toastSaveError(err: unknown): void {
  const text = err instanceof Error ? err.message : String(err ?? '未知错误');
  message.error(`本地保存失败：${text}`, 5);
}

/* =======================================================================
 * 目录句柄的 IndexedDB 持久化（跨刷新恢复，免去重复选择文件夹）
 * ===================================================================== */

const FOLDER_DB_NAME = 'app-web-image';
const FOLDER_DB_STORE = 'handles';
const FOLDER_DB_KEY = 'local-save-dir';
const FOLDER_DB_VERSION = 1;

function openFolderDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FOLDER_DB_NAME, FOLDER_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FOLDER_DB_STORE)) {
        db.createObjectStore(FOLDER_DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('打开 IndexedDB 失败'));
  });
}

/** 把目录句柄写入 IndexedDB（File System Access 句柄可结构化克隆） */
export async function persistDirHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openFolderDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FOLDER_DB_STORE, 'readwrite');
      tx.objectStore(FOLDER_DB_STORE).put(handle, FOLDER_DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error('写入目录句柄失败'));
    });
  } finally {
    db.close();
  }
}

/** 从 IndexedDB 读取目录句柄；不存在 / 不支持 / 失败时统一返回 null */
export async function restoreDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await openFolderDB();
    try {
      return await new Promise<FileSystemDirectoryHandle | null>(
        (resolve, reject) => {
          const tx = db.transaction(FOLDER_DB_STORE, 'readonly');
          const req = tx.objectStore(FOLDER_DB_STORE).get(FOLDER_DB_KEY);
          req.onsuccess = () =>
            resolve(
              (req.result as FileSystemDirectoryHandle | undefined) ?? null,
            );
          req.onerror = () =>
            reject(req.error ?? new Error('读取目录句柄失败'));
        },
      );
    } finally {
      db.close();
    }
  } catch {
    // 隐私模式 / 旧浏览器 / 数据损坏：静默降级为 null（走重新选择流程）
    return null;
  }
}

/** 清除已持久化的目录句柄（用户重置路径时调用） */
export async function clearPersistedDirHandle(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openFolderDB();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(FOLDER_DB_STORE, 'readwrite');
        tx.objectStore(FOLDER_DB_STORE).delete(FOLDER_DB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () =>
          reject(tx.error ?? new Error('删除目录句柄失败'));
      });
    } finally {
      db.close();
    }
  } catch {
    // 忽略：最坏情况只是下次启动恢复不到句柄
  }
}

/**
 * 确保目录句柄具备指定权限。
 * - 已授权（granted）：直接返回 true；
 * - 未决定（prompt）：
 *   - interactive=true（默认）：在用户手势链路内发起 requestPermission；
 *   - interactive=false：只查询不弹窗，未授权直接返回 false
 *     （用于页面刷新后的静默恢复，避免无手势时请求被浏览器拒绝）；
 * - 拒绝（denied）/ 不支持权限 API / 用户拒绝：返回 false。
 *
 * 注意：requestPermission 必须由用户点击等手势触发（允许紧接在 await 之后，
 * 但不能放进 setTimeout）。
 */
export async function ensureDirPermission(
  handle: FileSystemDirectoryHandle,
  mode: 'read' | 'readwrite' = 'readwrite',
  interactive = true,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = handle as any;
  try {
    if (typeof h.queryPermission === 'function') {
      const queried = await h.queryPermission({ mode });
      if (queried === 'granted') {return true;}
      if (!interactive) {return false;}
    }
    if (typeof h.requestPermission === 'function') {
      if (!interactive) {return false;}
      const requested = await h.requestPermission({ mode });
      return requested === 'granted';
    }
    // 没有权限 API（如 Safari）：乐观返回，真正写入失败时再由调用方报错
    return true;
  } catch {
    return false;
  }
}