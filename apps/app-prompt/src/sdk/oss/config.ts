/**
 * OSS 路径 / 前缀配置(运行时不再持有 AK/SK)
 */

export const DEFAULT_PREFIX = 'common/ai-source/';

/** 读取默认上传前缀;优先用 `VITE_OSS_PREFIX` 覆盖 */
export const getDefaultPrefix = (): string =>
  (import.meta.env.VITE_OSS_PREFIX as string | undefined) || DEFAULT_PREFIX;
