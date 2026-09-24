/** OSS SDK 公共类型定义 */

export interface OssUploadOptions {
  /** 显式指定对象 key;省略时按 prefix + 文件名 自动生成 */
  key?: string;
  /** 对象前缀(不含 bucket),如 `common/ai-source/` */
  prefix?: string;
  /** 用户名;省略则默认路径 `common/ai-source/<文件名>`,传入后变为 `common/ai-source/<username>/<文件名>` */
  username?: string;
  /** 自定义 Content-Type,省略则按文件类型推断 */
  contentType?: string;
  /** 进度回调,percent 为 0-1 */
  onProgress?: (percent: number) => void;
  /** 成功回调 */
  onSuccess?: (result: OssUploadResult) => void;
  /** 失败回调 */
  onError?: (err: Error) => void;
}

export interface OssUploadResult {
  /** 对象 key */
  key: string;
  /** 对象完整访问 URL */
  url: string;
  /** ETag */
  etag: string;
  /** 原始响应 */
  raw: unknown;
}

/** 图库索引文件里的一条图片记录 */
export interface OssGalleryItem {
  /** 对象 key(不含 host) */
  key: string;
  /** 对象完整访问 URL */
  url: string;
  /** 原始文件名 */
  name: string;
  /** 字节数 */
  size: number;
  /** 上传时间戳(ms) */
  uploadTime: number;
  /** MIME 类型(如 image/png),用于区分图片/文件;旧数据可能缺失 */
  type?: string;
}