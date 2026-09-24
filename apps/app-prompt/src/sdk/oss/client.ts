/**
 * 阿里云 OSS 浏览器端 SDK
 *
 * 基于后端 `/file/encryptParam` 返回的 PostObject 签名,
 * 前端直接 multipart/form-data POST 到 OSS host。
 * 前端完全不持有 AccessKey。
 *
 * 默认上传 key: `<dir>/common/ai-source/<原文件名>`。
 * - `dir` 来自后端 encryptParam 返回值(默认 `snkoudai`),
 *   同时写入 policy 的 `starts-with $key` 约束,前端必须遵守。
 * - `common/ai-source` 是固定业务子目录。
 * - 后端若把 `dir` 改为 `common/ai-source` 或空,SDK 会自动跟着走。
 */

import {
  getEncryptParam,
  type EncryptParamVO,
} from './server';
import type {
  OssUploadOptions,
  OssUploadResult,
  OssGalleryItem,
} from './types';

// ============================================================================
// 签名缓存
// ============================================================================

interface CachedParam {
  param: EncryptParamVO;
  /** ms 时间戳 */
  expireAtMs: number;
}

let _cache: CachedParam | null = null;

/** 取签名(提前 60s 视为过期,避免边界 race) */
const getCachedParam = async (): Promise<EncryptParamVO> => {
  if (_cache && Date.now() < _cache.expireAtMs - 60_000) {
    return _cache.param;
  }
  const param = await getEncryptParam();
  _cache = {
    param,
    expireAtMs: Number(param.expire) * 1000,
  };
  return param;
};

/** 清空签名缓存(退出登录或 token 变化时调用) */
export const resetOssClient = (): void => {
  _cache = null;
};

// ============================================================================
// 工具
// ============================================================================

/** 拼接对象 key 为完整 URL */
export const buildObjectUrl = (key: string, host: string): string =>
  `${host.replace(/\/$/, '')}/${key.replace(/^\/+/, '')}`;

/** 自动生成对象 key:prefix/<原文件名>(仅清洗非法字符,不做随机化) */
export const buildObjectKey = (file: File, prefix: string): string => {
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '');
  const safeName = file.name.replace(/[\\/:*?"<>|]/g, '_');
  return cleanPrefix ? `${cleanPrefix}/${safeName}` : safeName;
};

/** 推断常见 Content-Type */
const inferContentType = (file: File | Blob): string => {
  if (file.type) {
    return file.type;
  }
  const name = (file as File).name || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    pdf: 'application/pdf',
    txt: 'text/plain',
    json: 'application/json',
    mp4: 'video/mp4',
  };
  return map[ext] || 'application/octet-stream';
};

// ============================================================================
// 上传(基于 PostObject,XHR 支持进度)
// ============================================================================

export const uploadFile = async (
  file: File | Blob,
  options: OssUploadOptions = {},
): Promise<OssUploadResult> => {
  const param = await getCachedParam();

  const filename = file instanceof File ? file.name : `${Date.now()}.bin`;
  // 默认 key = <dir>/common/ai-source/[<username>/]<文件名>;
  // dir 默认 snkoudai(后端 policy 强约束),业务子目录固定 common/ai-source,
  // 传入 username 后再追加一级用户子目录
  const cleanDir = (param.dir || '').replace(/^\/+|\/+$/g, '');
  const safeUser = (options.username || '').replace(/[\\/:*?"<>|]/g, '_');
  const bizDir = safeUser
    ? `common/ai-source/${safeUser}`
    : 'common/ai-source';
  const defaultPrefix = cleanDir ? `${cleanDir}/${bizDir}` : bizDir;
  const prefix = options.prefix || defaultPrefix;
  const key = options.key || buildObjectKey(file as File, prefix);
  const contentType = options.contentType || inferContentType(file);

  return new Promise<OssUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', param.host, true);
    // 60s 超时,避免 CORS 拒绝时 Promise 永久 pending
    xhr.timeout = 60_000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        options.onProgress?.(e.loaded / e.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // success_action_status=200 时 OSS 返回 200 + <PostResponse> XML
        let etag = '';
        try {
          etag =
            xhr.responseXML
              ?.querySelector('ETag')
              ?.textContent?.replace(/"/g, '') || '';
        } catch {
          // ignore parse error
        }
        const url = buildObjectUrl(key, param.host);
        const result: OssUploadResult = {
          key,
          url,
          etag,
          raw: { status: xhr.status, body: xhr.responseText },
        };
        options.onSuccess?.(result);
        resolve(result);
      } else {
        const err = new Error(
          `OSS POST 失败 [${xhr.status}]: ${xhr.responseText || xhr.statusText}`,
        );
        options.onError?.(err);
        reject(err);
      }
    };

    xhr.onerror = () => {
      const err = new Error('网络错误或 CORS 拒绝,请检查 OSS 桶 CORS 配置(需允许 POST)');
      options.onError?.(err);
      reject(err);
    };

    xhr.ontimeout = () => {
      const err = new Error('OSS 上传超时(60s),请检查网络或 OSS 桶 CORS');
      options.onError?.(err);
      reject(err);
    };

    const form = new FormData();
    form.append('key', key);
    form.append('policy', param.policy);
    form.append('OSSAccessKeyId', param.accessid);
    form.append('signature', param.signature);
    form.append('success_action_status', '200');
    form.append('Content-Type', contentType);
    form.append('file', file, filename);

    xhr.send(form);
  });
};

// ============================================================================
// 图库索引文件(每个用户一份,记录该用户上传过的图片)
// ============================================================================

/** 生成用户图库索引文件的 key:<dir>/common/ai-source/<username>/<username>-oss.js */
export const buildGalleryIndexKey = (
  param: EncryptParamVO,
  username: string,
): string => {
  const cleanDir = (param.dir || '').replace(/^\/+|\/+$/g, '');
  const safeUser = username.replace(/[\\/:*?"<>|]/g, '_');
  const prefix = cleanDir
    ? `${cleanDir}/common/ai-source/${safeUser}`
    : `common/ai-source/${safeUser}`;
  return `${prefix}/${safeUser}-oss.js`;
};

/**
 * 读取用户图库索引(公开读 URL)。
 * 文件不存在(404)或暂未公开(403)时静默返回空数组,不抛错,避免阻塞页面。
 */
export const fetchGalleryIndex = async (
  username: string,
): Promise<OssGalleryItem[]> => {
  const param = await getCachedParam();
  const key = buildGalleryIndexKey(param, username);
  const url = buildObjectUrl(key, param.host);
  const res = await fetch(`${url}?t=${Date.now()}`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (res.status === 404 || res.status === 403) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`读取图库索引失败 [${res.status}]: ${res.statusText}`);
  }
  const text = await res.text();
  if (!text.trim()) {
    return [];
  }
  const data: unknown = JSON.parse(text);
  return Array.isArray(data) ? (data as OssGalleryItem[]) : [];
};

/**
 * 覆盖上传用户图库索引文件(内容为 JSON 数组)。
 */
export const uploadGalleryIndex = async (
  username: string,
  items: OssGalleryItem[],
): Promise<OssUploadResult> => {
  const param = await getCachedParam();
  const key = buildGalleryIndexKey(param, username);
  const blob = new Blob([JSON.stringify(items)], {
    type: 'application/javascript; charset=utf-8',
  });
  return uploadFile(blob, {
    key,
    contentType: 'application/javascript',
  });
};