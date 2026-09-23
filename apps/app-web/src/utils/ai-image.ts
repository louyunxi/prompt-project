/**
 * AI 生图接口工具（OpenAI 兼容）
 *
 * 接口来源：draw.hugusir.top
 * Base URL：https://draw.hugusir.top/api/v1
 * 端点：POST /images/generations
 *
 * 鉴权：Authorization: Bearer <API_KEY>
 *   - 运行时优先读取 import.meta.env.VITE_AI_IMAGE_API_KEY；
 *   - 未配置时回退到内置的默认 Key（仅用于本模版 dev 演示，请勿用于生产）。
 *
 * CORS / 反代策略：
 *   前端 baseURL 固定为 /api-proxy（同源），永远不直接打第三方域名，浏览器
 *   不会触发 CORS 预检。真实转发交给部署侧反代：
 *     - dev：Vite server.proxy（参见 apps/app-web/vite.config.ts）
 *     - prod：Nginx location / Vercel rewrites / Netlify _redirects /
 *       阿里云 SLB 等任选其一，把 /api-proxy/* 转发到
 *       https://draw.hugusir.top/api/v1/*。
 *   生产强烈建议在反代侧注入 Authorization 头（保护真实 Key），并在反代
 *   配置中清空请求侧的同名头，避免前端 demo Key 与服务端真实 Key 冲突。
 *
 * 透明背景注意事项：
 *   1. 透明背景只能由支持 transparent 的模型生成，且必须搭配 png / webp。
 *   2. 接口返回的 url 是 CDN 临时链接，CDN 经常会把它压成 JPG，丢失
 *      alpha 通道；本工具默认走 b64_json 拿原始 PNG 字节，再转 blob URL，
 *      既保证透明效果，也避免第三方图床被 img 标签请求时的鉴权/CORS 问题。
 *
 * 注意：
 *   1. 接口文档明确指出："明文只展示一次，请仅保存在服务端环境变量中，
 *      不要写入前端源码、日志或公开仓库"。生产部署务必让反代注入 Key，
 *      不要把真实 Key 打进前端 bundle。
 *   2. 默认模型 gpt-image-2 支持 opaque / transparent / auto 背景策略；
 *      如需更细粒度的画质/尺寸/输出格式控制，可通过 params 传入。
 */
import axios, { type AxiosInstance } from 'axios';
import { downloadImageAsFile } from '@/utils/image-save';

/**
 * 公共 AI 生图前缀（同源路径前缀，前后端共用）
 *
 * 所有调用都必须经过这个前缀，由部署侧的反向代理转发到真实的第三方 API，
 * 浏览器看到的请求始终是同源 → 不会触发 CORS。
 *
 * - dev：由 vite.config.ts 的 server.proxy 转发到
 *   https://draw.hugusir.top/api/v1，路径前缀 /api-proxy → /api/v1。
 * - prod：由部署平台（Nginx / Vercel rewrite / Netlify _redirects /
 *   阿里云 SLB 等）配置同前缀反代；推荐在反代侧注入
 *   Authorization 头，避免把 Key 留在前端 bundle 中（参考下方说明）。
 */
export const AI_IMAGE_PROXY_PREFIX = '/api-proxy';

/** 接口真实 Base URL（仅用于注释说明与生产反代配置参考） */
export const AI_IMAGE_BASE_URL = 'https://draw.hugusir.top/api/v1';

/** 接口路径：文生图（OpenAI Images 兼容） */
export const AI_IMAGE_GENERATIONS_PATH = '/images/generations';

/** 接口路径：图生图（同步，OpenAI Images 兼容，multipart/form-data） */
export const AI_IMAGE_EDITS_PATH = '/images/edits';

/** 接口路径：异步图生图（multipart/form-data，创建后立即返回 JOB_ID） */
export const AI_IMAGE_JOBS_EDIT_PATH = '/ai-jobs/images/edits';

/** 接口路径：异步任务查询前缀（拼接为 /ai-jobs/{JOB_ID}） */
export const AI_IMAGE_JOBS_QUERY_PATH = '/ai-jobs';

/** 异步任务轮询间隔（毫秒） */
export const IMAGE_POLL_INTERVAL_MS = 3000;

/** 异步任务轮询默认超时（毫秒，10 分钟，与 store 侧 IMAGE_GENERATION_TIMEOUT_MS 保持一致） */
export const DEFAULT_IMAGE_POLL_TIMEOUT_MS = 10 * 60 * 1000;

/** 图生图参考图数量上限 */
export const MAX_REFERENCE_IMAGES = 8;

/** 图生图参考图总大小上限（字节） */
export const MAX_REFERENCE_TOTAL_BYTES = 40 * 1024 * 1024;

/** 内置默认 API Key（仅用于本模版演示，生产请改为后端转发或环境变量注入） */
const DEFAULT_API_KEY = 'ik_Dnha19xGY1U1xc_EdKpk7W2S5_7GXzK2';

/**
 * 从环境变量中读取 API Key。
 * 兼容 import.meta.env（Vite 注入）与兜底字符串。
 */
function resolveApiKey(): string {
  try {
    // Vite 注入的 env
    const env = (import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }).env;
    const fromEnv = env?.VITE_AI_IMAGE_API_KEY;
    if (fromEnv && fromEnv.trim()) {return fromEnv.trim();}
  } catch {
    /* 非 Vite 环境，直接使用默认值 */
  }
  return DEFAULT_API_KEY;
}

/* -------------------------------------------------------------------------- */
/*                              参数类型 / 选项                                */
/* -------------------------------------------------------------------------- */

/** 支持的模型 ID（来自接口文档「模型 ID 对照表」） */
export type ImageModelId =
  | 'gpt-image-2'
  | 'gpt-image-2-mini'
  | 'gpt-image-1.5'
  | 'gpt-image-2.5-sunburst'
  | 'gpt-image-2.5-flare'
  | 'gemini-2.5-flash-image'
  | 'doubao-seedream-3.5'
  | 'wan2.5-tpi-preview';

/** 模型下拉选项（用于前端 a-select） */
export interface ImageModelOption {
  value: ImageModelId;
  label: string;
  /** 是否支持 transparent 背景 */
  supportsTransparent: boolean;
  /** 单价（积分/张，仅供参考） */
  creditsPerImage: number;
}

export const IMAGE_MODEL_OPTIONS: ImageModelOption[] = [
  {
    value: 'gpt-image-2',
    label: 'gpt-image-2（推荐·支持透明）',
    supportsTransparent: true,
    creditsPerImage: 0.2,
  },
  {
    value: 'gpt-image-2.5-sunburst',
    label: 'gpt-image-2.5-sunburst（高清·支持透明）',
    supportsTransparent: true,
    creditsPerImage: 0.5,
  },
  {
    value: 'gpt-image-2.5-flare',
    label: 'gpt-image-2.5-flare（顶级·支持透明）',
    supportsTransparent: true,
    creditsPerImage: 0.8,
  },
  {
    value: 'gemini-2.5-flash-image',
    label: 'gemini-2.5-flash-image（支持透明）',
    supportsTransparent: true,
    creditsPerImage: 0.1,
  },
  {
    value: 'doubao-seedream-3.5',
    label: 'doubao-seedream-3.5（支持透明）',
    supportsTransparent: true,
    creditsPerImage: 0.2,
  },
  {
    value: 'wan2.5-tpi-preview',
    label: 'wan2.5-tpi-preview（支持透明）',
    supportsTransparent: true,
    creditsPerImage: 0.1,
  },
  {
    value: 'gpt-image-2-mini',
    label: 'gpt-image-2-mini（仅 PNG·透明）',
    supportsTransparent: true,
    creditsPerImage: 0.03,
  },
  {
    value: 'gpt-image-1.5',
    label: 'gpt-image-1.5（不支持透明）',
    supportsTransparent: false,
    creditsPerImage: 0.04,
  },
];

/** 默认模型 */
export const DEFAULT_IMAGE_MODEL: ImageModelId = 'gpt-image-2';

/**
 * 新建生图任务时的默认参数。
 * - 任务管理「新建任务」与「换图」全局弹框共用，避免两处默认值漂移；
 * - 弹框场景会与 DOM 上 image 属性解析出的参数片段 merge，
 *   片段里没有的字段继续使用这里的默认值（不被清空）。
 */
export const DEFAULT_GENERATE_IMAGE_PARAMS: GenerateImageParams = {
  prompt: '科技物联网蓝色色系清爽背景，不要有文字，高清',
  model: DEFAULT_IMAGE_MODEL,
  size: '16:9',
  upscale: '',
  quality: 'high',
  outputFormat: 'png',
  transparent: true,
  responseFormat: 'b64_json',
};

/** 尺寸：宽高比 / 具体像素（宽高须为 16 的倍数） */
export const IMAGE_SIZE_OPTIONS = [
  { value: 'auto', label: 'auto（模型默认）' },
  { value: '1:1', label: '1:1' },
  { value: '3:2', label: '3:2' },
  { value: '2:3', label: '2:3' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '21:9', label: '21:9' },
];

/** 放大倍率（upscale） */
export type ImageUpscale = '' | '1k' | '2k' | '4k';
export const IMAGE_UPSCALE_OPTIONS: { value: ImageUpscale; label: string }[] = [
  { value: '', label: '原始' },
  { value: '1k', label: '1K' },
  { value: '2k', label: '2K' },
  { value: '4k', label: '4K' },
];

/** 画质 */
export type ImageQuality = 'low' | 'medium' | 'high' | 'auto';
export const IMAGE_QUALITY_OPTIONS: { value: ImageQuality; label: string }[] = [
  { value: 'auto', label: '自动' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
];

/** 输出文件格式 */
export type ImageOutputFormat = 'png' | 'jpeg' | 'webp';
export const IMAGE_OUTPUT_FORMAT_OPTIONS: {
  value: ImageOutputFormat;
  label: string;
}[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WEBP' },
];

/** 接口返回格式。默认 b64_json：拿到原始字节，避开 CDN 转码丢 alpha。 */
export type ImageResponseFormat = 'url' | 'b64_json';
export const IMAGE_RESPONSE_FORMAT_OPTIONS: {
  value: ImageResponseFormat;
  label: string;
}[] = [
  { value: 'b64_json', label: 'Base64（推荐·保真）' },
  { value: 'url', label: 'URL（响应更轻）' },
];

/* -------------------------------------------------------------------------- */
/*                              请求 / 响应                                  */
/* -------------------------------------------------------------------------- */

/** 参考图（图生图输入） */
export interface ReferenceImage {
  /** 唯一标识（列表渲染 key） */
  id: string;
  /**
   * 源文件（提交 multipart 用）。
   * 页面刷新后 File 无法从持久化恢复，此时为 null（UI 需提示重新上传）。
   */
  file?: File | null;
  /** 预览 URL（object URL，需在不再使用时 revoke；刷新恢复后为空串） */
  previewUrl: string;
  /** 文件名（持久化保留，用于列表展示） */
  name: string;
  /** 文件字节数（持久化保留，用于大小校验/展示） */
  size: number;
}

/** 单次生图请求参数（用户视角：prompt + size + transparent 等） */
export interface GenerateImageParams {
  /** 生图提示词（必填） */
  prompt: string;
  /**
   * 图片尺寸（宽高比或具体像素）。
   * 支持：'auto' | '1:1' | '3:2' | '2:3' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9'
   * 也可传 'WIDTHxHEIGHT'（宽高均须为 16 的倍数）。
   */
  size?: string;
  /** 是否透明背景；为 true 时使用 transparent，否则 opaque */
  transparent?: boolean;
  /** 模型 ID，默认 gpt-image-2 */
  model?: ImageModelId;
  /** 画质：low | medium | high | auto，默认 high */
  quality?: ImageQuality;
  /** 放大倍率：''（不放大）| '1k' | '2k' | '4k' */
  upscale?: ImageUpscale;
  /** 输出文件格式：png（默认，透明背景推荐）/ jpeg / webp */
  outputFormat?: ImageOutputFormat;
  /** 返回格式：b64_json（默认，更可靠）/ url（响应更轻） */
  responseFormat?: ImageResponseFormat;
  /** 生成张数（默认 1，计费按张累计） */
  n?: number;
  /**
   * 参考图（图生图）。传入非空数组时走异步图生图接口
   * （POST /ai-jobs/images/edits + 轮询），否则走文生图接口。
   * 最多 8 张、总大小不超过 40MB。
   */
  referenceImages?: ReferenceImage[];
}

/** 单张生成结果（接口原始结构） */
export interface GeneratedImageItem {
  /** 临时访问 URL（response_format=url 时返回） */
  url?: string;
  /** Base64 内容（response_format=b64_json 时返回） */
  b64_json?: string;
  /** 服务端修订后的提示词 */
  revised_prompt?: string;
  /** 平台补充字段 */
  storageKey?: string;
  mimeType?: string;
  bytes?: number;
}

/** 接口成功响应（OpenAI Images 兼容结构） */
export interface GenerateImageResponse {
  created: number;
  data: GeneratedImageItem[];
  /** 部分模型还会返回请求 ID、阶段、状态、用量统计等扩展字段 */
  request_id?: string;
  stage?: string;
  status?: string;
  usage?: unknown;
}

/** axios 业务错误结构（接口文档约定） */
export interface AiImageApiError {
  code?: number;
  msg?: string;
  data?: unknown;
}

/** 异步任务查询结果（GET /ai-jobs/{JOB_ID}） */
export interface ImageJobStatus {
  /** 任务状态：pending | processing | success | failed（可能为其他字符串） */
  status?: string;
  /** 失败时的可读错误信息 */
  errorMessage?: string;
  /**
   * 成功时的图片接口原始兼容响应
   * （OpenAI Images 结构 { created, data: [...] }）。
   * 不同网关也可能直接把 data 挂在 job 上，解析时做兼容。
   */
  responseBody?: GenerateImageResponse;
  /** 成功时返回的图片数据（部分网关直接放在 job.data） */
  data?: GeneratedImageItem[];
  [key: string]: unknown;
}

/** 轮询过程中的状态回调（用于 store/UI 展示「排队中 / 处理中」） */
export type ImageJobStatusCallback = (
  status: string,
  job: ImageJobStatus,
) => void;

/** 轮询选项 */
export interface PollImageJobOptions {
  /** 轮询间隔，默认 3000ms */
  intervalMs?: number;
  /** 总超时，默认 10 分钟 */
  timeoutMs?: number;
  /** 中止信号（任务删除 / 页面卸载时可中止轮询） */
  signal?: AbortSignal;
  /** 每次查询后的状态回调 */
  onStatus?: ImageJobStatusCallback;
  /**
   * 异步任务创建成功、拿到远端 JOB_ID 后的回调。
   * 调用方应在此把 jobId 持久化，页面刷新后可用
   * resumeImageEditJob 凭它继续轮询。
   */
  onJobCreated?: (jobId: string) => void;
}

/** 对外暴露的统一结果：始终给到一个可以直接塞进 <img src> 的 imageUrl */
export interface GenerateImageResult {
  /** 可直接用作 <img src> 的 URL（blob URL 或远端 URL） */
  imageUrl: string;
  /** 若 imageUrl 为 blob URL，此字段给出原始远端 URL（如果有）；调用方负责 revoke */
  blobUrl?: string;
  /** 接口返回的原始 CDN URL（response_format=url 时） */
  originalUrl?: string;
  /** 接口修订后的提示词 */
  revisedPrompt?: string;
  /**
   * 接口原始响应，便于调用方调试。
   * 可选：b64_json 场景下单条响应可达数 MB，持久化等场景必须剔除。
   */
  raw?: GenerateImageResponse;
}

/* -------------------------------------------------------------------------- */
/*                              核心实现                                      */
/* -------------------------------------------------------------------------- */

/** 共享 axios 实例：始终使用同源代理前缀，由部署侧反代到第三方 API。
 *  - dev：Vite server.proxy（vite.config.ts）把 /api-proxy/* 转发到目标 API。
 *  - prod：部署平台（Vercel rewrite / Nginx / 阿里云 SLB 等）配置同前缀反代。
 *  这种"始终同源"的写法彻底避开浏览器 CORS，调用方不需要做任何环境判断。
 */
const http: AxiosInstance = axios.create({
  baseURL: AI_IMAGE_PROXY_PREFIX,
  // 生图接口可能耗时较长（同步接口通常 30s~数分钟，复杂 prompt 可能更久），
  // 超时统一放到 20 分钟，避免被 axios 默认 0（无超时）和低端网关 30s 中断。
  timeout: 20 * 60 * 1000,
});

/** 把 Base64 字符串转成 Blob URL（保留 alpha 通道），便于 <img> 直接使用 */
function b64ToBlobUrl(b64: string, mimeType: string): string {
  const byteString = atob(b64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    bytes[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

/** 由 outputFormat 推断 mime */
function mimeOf(fmt: ImageOutputFormat): string {
  if (fmt === 'jpeg') {return 'image/jpeg';}
  if (fmt === 'webp') {return 'image/webp';}
  return 'image/png';
}

/** 解析后的请求参数（文生图 / 图生图共用） */
interface ResolvedGenerateOptions {
  prompt: string;
  size: string;
  model: ImageModelId;
  quality: ImageQuality;
  upscale: ImageUpscale;
  n: number;
  transparent: boolean;
  safeOutputFormat: ImageOutputFormat;
  effectiveResponseFormat: ImageResponseFormat;
}

/**
 * 统一解析 + 校验生图参数：
 * - prompt 必填；
 * - 透明背景强制 png + b64_json（避免 CDN 转码丢 alpha）；
 * - 不支持透明的模型直接抛错。
 */
function resolveGenerateOptions(
  params: GenerateImageParams,
): ResolvedGenerateOptions {
  const {
    prompt,
    size = 'auto',
    transparent = false,
    model = DEFAULT_IMAGE_MODEL,
    quality = 'high',
    upscale = '',
    outputFormat = 'png',
    responseFormat = 'b64_json',
    n = 1,
  } = params;

  if (!prompt || !prompt.trim()) {
    throw new Error('[ai-image] prompt 不能为空');
  }

  const safeOutputFormat: ImageOutputFormat =
    transparent && outputFormat === 'jpeg' ? 'png' : outputFormat;
  const effectiveResponseFormat: ImageResponseFormat =
    transparent && responseFormat === 'url' ? 'b64_json' : responseFormat;

  if (transparent) {
    const meta = IMAGE_MODEL_OPTIONS.find((m) => m.value === model);
    if (meta && !meta.supportsTransparent) {
      throw new Error(
        `[ai-image] 模型 ${model} 不支持透明背景，请更换为支持 transparent 的模型`,
      );
    }
  }

  return {
    prompt,
    size,
    model,
    quality,
    upscale,
    n,
    transparent,
    safeOutputFormat,
    effectiveResponseFormat,
  };
}

/**
 * 把接口原始响应归一化为 GenerateImageResult：
 * b64_json → blob URL（保 alpha），url → 直接使用远端 URL。
 */
function normalizeImageResponse(
  raw: GenerateImageResponse,
  responseFormat: ImageResponseFormat,
  outputFormat: ImageOutputFormat,
): GenerateImageResult {
  const first = raw.data?.[0];
  if (!first) {
    throw new Error('[ai-image] 接口未返回 data[0]');
  }

  let imageUrl: string | undefined;
  let blobUrl: string | undefined;
  let originalUrl: string | undefined;

  if (responseFormat === 'b64_json' && first.b64_json) {
    blobUrl = b64ToBlobUrl(first.b64_json, mimeOf(outputFormat));
    imageUrl = blobUrl;
    originalUrl = first.url; // 即便返回了 url 也是个回退链接
  } else if (first.url) {
    imageUrl = first.url;
    originalUrl = first.url;
  }

  if (!imageUrl) {
    throw new Error('[ai-image] 接口未返回可用的图片数据');
  }

  return {
    imageUrl,
    blobUrl,
    originalUrl,
    revisedPrompt: first.revised_prompt,
    raw,
  };
}

/**
 * 同步文生图（POST /images/generations，OpenAI Images 兼容）
 *
 * @example
 * ```ts
 * const res = await generateImage({
 *   prompt: 'A futuristic city skyline at dusk, neon lights, cinematic',
 *   model: 'gpt-image-2.5-sunburst',
 *   size: '16:9',
 *   transparent: true,
 *   outputFormat: 'png',
 *   upscale: '2k',
 *   quality: 'high',
 * });
 * document.querySelector('img').src = res.imageUrl;
 * ```
 */
export async function generateImage(
  params: GenerateImageParams,
): Promise<GenerateImageResult> {
  const opts = resolveGenerateOptions(params);

  const body: Record<string, unknown> = {
    model: opts.model,
    prompt: opts.prompt,
    n: opts.n,
    size: opts.size,
    quality: opts.quality,
    style: 'natural',
    background: opts.transparent ? 'transparent' : 'opaque',
    response_format: opts.effectiveResponseFormat,
    output_format: opts.safeOutputFormat,
  };
  if (opts.upscale) {body.upscale = opts.upscale;}

  const apiKey = resolveApiKey();
  const response = await http.post<GenerateImageResponse>(
    AI_IMAGE_GENERATIONS_PATH,
    body,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return normalizeImageResponse(
    response.data,
    opts.effectiveResponseFormat,
    opts.safeOutputFormat,
  );
}

/* -------------------------------------------------------------------------- */
/*                           图生图（参考图 / 异步轮询）                         */
/* -------------------------------------------------------------------------- */

/** 生成参考图 ID */
function createReferenceId(): string {
  return `ref-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** 把一个本地 File 包装成 ReferenceImage（自动创建 object URL 预览） */
export function createReferenceImage(file: File): ReferenceImage {
  return {
    id: createReferenceId(),
    file,
    previewUrl: URL.createObjectURL(file),
    name: file.name || 'reference.png',
    size: file.size,
  };
}

/**
 * 把远端图片 URL 下载为 File 并包装成 ReferenceImage。
 * 用于「换图」场景：把待替换的 <img>/背景图自动作为第一张参考图。
 * 文件名没有扩展名时，按下载到的 MIME 自动补全。
 */
export async function createReferenceImageFromUrl(
  url: string,
  fileNameHint?: string,
): Promise<ReferenceImage> {
  const hint =
    fileNameHint ||
    url.split('?')[0].split('/').pop() ||
    'reference.png';
  let file = await downloadImageAsFile(url, hint);
  if (!file.name.includes('.')) {
    const subtype = file.type.split('/')[1]?.toLowerCase();
    const ext =
      subtype === 'jpeg' || subtype === 'jpg'
        ? 'jpg'
        : subtype === 'svg+xml'
          ? 'svg'
          : subtype || 'png';
    file = new File([file], `${file.name}.${ext}`, { type: file.type });
  }
  return createReferenceImage(file);
}

/** 释放参考图的 object URL（任务删除 / 清空 / 替换参考图列表时调用） */
export function releaseReferenceImages(
  refs?: ReferenceImage[] | null,
): void {
  refs?.forEach((r) => {
    if (r.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(r.previewUrl);
    }
  });
}

/** 取出真正可提交（持有 File）的参考图；刷新恢复后的失效条目被过滤 */
export function getValidReferenceImages(
  refs?: ReferenceImage[] | null,
): Array<ReferenceImage & { file: File }> {
  return (refs ?? []).filter(
    (r): r is ReferenceImage & { file: File } => r.file instanceof File,
  );
}

/** 校验参考图数量（≤8）与总大小（≤40MB） */
export function validateReferenceImages(refs: ReferenceImage[]): void {
  if (refs.length > MAX_REFERENCE_IMAGES) {
    throw new Error(
      `[ai-image] 参考图最多 ${MAX_REFERENCE_IMAGES} 张，当前 ${refs.length} 张`,
    );
  }
  const totalBytes = refs.reduce((sum, r) => sum + (r.file?.size ?? r.size), 0);
  if (totalBytes > MAX_REFERENCE_TOTAL_BYTES) {
    throw new Error(
      `[ai-image] 参考图总大小不能超过 40MB，当前约 ${(
        totalBytes /
        1024 /
        1024
      ).toFixed(1)}MB`,
    );
  }
}

/**
 * 组装图生图 multipart/form-data：
 * - 1 张参考图：字段 image；
 * - 多张参考图：字段 image[]（多次 append）；
 * - 不手动设置 Content-Type，由浏览器自动写入 multipart boundary。
 */
function buildImageEditFormData(params: GenerateImageParams): FormData {
  const opts = resolveGenerateOptions(params);
  const refs = getValidReferenceImages(params.referenceImages);
  if (!refs.length) {
    throw new Error('[ai-image] 图生图至少需要 1 张有效的参考图');
  }
  validateReferenceImages(refs);

  const form = new FormData();
  form.append('model', opts.model);
  form.append('prompt', opts.prompt);
  form.append('n', String(opts.n));
  form.append('size', opts.size);
  form.append('quality', opts.quality);
  form.append('style', 'natural');
  form.append(
    'background',
    opts.transparent ? 'transparent' : 'opaque',
  );
  form.append('response_format', opts.effectiveResponseFormat);
  form.append('output_format', opts.safeOutputFormat);
  if (opts.upscale) {form.append('upscale', opts.upscale);}

  if (refs.length === 1) {
    form.append('image', refs[0].file);
  } else {
    refs.forEach((r) => form.append('image[]', r.file));
  }
  return form;
}

/** 鉴权头（multipart 请求只带 Authorization，不带 Content-Type） */
function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${resolveApiKey()}` };
}

/**
 * 创建异步图生图任务（POST /ai-jobs/images/edits，multipart/form-data）。
 * 接口快速返回 JOB_ID，后续通过 pollImageJob 轮询结果。
 */
export async function createImageEditJob(
  params: GenerateImageParams,
): Promise<string> {
  const form = buildImageEditFormData(params);
  const response = await http.post<Record<string, unknown>>(
    AI_IMAGE_JOBS_EDIT_PATH,
    form,
    { headers: authHeaders() },
  );
  const body = response.data ?? {};
  // 兼容不同网关对「任务 ID」字段的命名差异（id / job_id / task_id / request_id 等），
  // 并支持嵌套在 data / job 下。匹配不到时打印原始响应，便于定位真实字段名。
  const data = (body.data ?? {}) as Record<string, unknown>;
  const job = (body.job ?? {}) as Record<string, unknown>;
  const jobId =
    (body.id as string) ||
    (body.jobId as string) ||
    (body.job_id as string) ||
    (body.JOB_ID as string) ||
    (body.task_id as string) ||
    (body.taskId as string) ||
    (body.request_id as string) ||
    (body.requestId as string) ||
    (data.id as string) ||
    (data.job_id as string) ||
    (data.task_id as string) ||
    (job.id as string) ||
    (job.job_id as string);
  if (!jobId) {
    console.warn(
      '[ai-image] 异步图生图创建成功，但未识别到任务 ID，原始响应：',
      body,
    );
    throw new Error('[ai-image] 异步图生图创建成功但未返回任务 ID');
  }
  return String(jobId);
}

/** 查询异步任务状态（GET /ai-jobs/{JOB_ID}） */
export async function getImageJob(jobId: string): Promise<ImageJobStatus> {
  const response = await http.get<Record<string, unknown>>(
    `${AI_IMAGE_JOBS_QUERY_PATH}/${encodeURIComponent(jobId)}`,
    { headers: authHeaders() },
  );
  const raw = response.data ?? {};

  // 该网关统一用 { code, data: {...} } 包装响应；剥离包装，拿到真正的任务对象。
  // 兼容部分网关直接返回裸任务对象的情况。
  const wrapped = raw.data as Record<string, unknown> | null | undefined;
  const body =
    wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)
      ? wrapped
      : raw;

  // responseBody 在部分网关下是 JSON 字符串（而非对象），需先解析。
  let responseBody = body.responseBody;
  if (typeof responseBody === 'string' && responseBody.trim()) {
    try {
      responseBody = JSON.parse(responseBody) as unknown;
    } catch {
      /* 解析失败则保留原字符串，由下游兼容处理 */
    }
  }

  return { ...body, responseBody } as ImageJobStatus;
}

/** 从异步任务查询结果中兼容提取图片接口原始响应 */
function extractJobImageResponse(job: ImageJobStatus): GenerateImageResponse {
  // 标准形态：{ status: 'success', responseBody: { created, data: [...] } }
  const body = job.responseBody as GenerateImageResponse | undefined;
  if (body && Array.isArray(body.data) && body.data.length) {
    return body;
  }
  // 兼容形态 A：job.data 直接是 GeneratedImageItem[]
  if (Array.isArray(job.data) && job.data.length) {
    return {
      created:
        typeof job.created === 'number'
          ? job.created
          : Math.floor(Date.now() / 1000),
      data: job.data,
    };
  }
  // 兼容形态 B：job.data 是整个图片响应
  const nested = (job.data as unknown as { data?: unknown } | undefined)?.data;
  if (Array.isArray(nested) && nested.length) {
    return {
      created:
        typeof job.created === 'number'
          ? job.created
          : Math.floor(Date.now() / 1000),
      data: nested as GenerateImageResponse['data'],
    };
  }
  throw new Error('[ai-image] 异步任务已成功但未返回图片数据');
}

/** 可被 abort 的延迟 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort);
  });
}

/**
 * 按固定间隔（默认 3 秒）轮询异步任务，直到 success / failed。
 * - 成功：返回图片接口原始兼容响应；
 * - 失败：抛出包含 errorMessage 的错误；
 * - 超时：抛出轮询超时错误（默认 10 分钟，与 store 超时一致）。
 */
export async function pollImageJob(
  jobId: string,
  options: PollImageJobOptions = {},
): Promise<GenerateImageResponse> {
  const intervalMs = options.intervalMs ?? IMAGE_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_IMAGE_POLL_TIMEOUT_MS;
  const startedAt = Date.now();

  for (;;) {
    options.signal?.throwIfAborted();

    const job = await getImageJob(jobId);
    const status = (job.status ?? '').toLowerCase();
    options.onStatus?.(status, job);

    if (
      status === 'success' ||
      status === 'succeeded' ||
      status === 'completed'
    ) {
      return extractJobImageResponse(job);
    }
    if (
      status === 'failed' ||
      status === 'error' ||
      status === 'cancelled' ||
      status === 'canceled'
    ) {
      throw new Error(
        job.errorMessage || `图生图异步任务失败（状态：${status || '未知'}）`,
      );
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error(
        `[ai-image] 图生图任务轮询超时（已超过 ${
          timeoutMs / 60000
        } 分钟，任务 ID：${jobId}）`,
      );
    }
    await sleep(intervalMs, options.signal);
  }
}

/**
 * 异步图生图：创建任务 → 3 秒轮询 → 归一化结果。
 * 带参考图的生图统一走这里（用户要求参考图必须走异步接口）。
 */
export async function generateImageEdit(
  params: GenerateImageParams,
  options: PollImageJobOptions = {},
): Promise<GenerateImageResult> {
  const opts = resolveGenerateOptions(params);
  const jobId = await createImageEditJob(params);
  // 拿到 JOB_ID 的第一时间通知调用方持久化，
  // 覆盖「创建成功但页面在轮询期间刷新」的场景
  options.onJobCreated?.(jobId);
  const raw = await pollImageJob(jobId, options);
  return normalizeImageResponse(
    raw,
    opts.effectiveResponseFormat,
    opts.safeOutputFormat,
  );
}

/**
 * 恢复一个已创建的异步图生图任务：不重新提交，直接凭 jobId 继续
 * 3 秒轮询，直到拿到结果 / 失败 / 超时。
 *
 * 页面刷新后由 store 对「状态仍为 generating 且持有 remoteJobId」的
 * 任务调用。params 只需标量字段（提示词 / 透明背景 / 输出格式等），
 * 用于结果归一化；参考图 File 已随刷新丢失，但恢复轮询不再需要它们。
 */
export async function resumeImageEditJob(
  jobId: string,
  params: GenerateImageParams,
  options: PollImageJobOptions = {},
): Promise<GenerateImageResult> {
  const opts = resolveGenerateOptions(params);
  const raw = await pollImageJob(jobId, options);
  return normalizeImageResponse(
    raw,
    opts.effectiveResponseFormat,
    opts.safeOutputFormat,
  );
}

/**
 * 统一生图入口（store 只调这一个）：
 * - 存在有效参考图 → 异步图生图（创建 + 3 秒轮询）；
 * - 否则 → 同步文生图。
 */
export async function generateImageAuto(
  params: GenerateImageParams,
  options: PollImageJobOptions = {},
): Promise<GenerateImageResult> {
  const refs = getValidReferenceImages(params.referenceImages);
  if (refs.length) {
    return generateImageEdit(
      { ...params, referenceImages: refs },
      options,
    );
  }
  return generateImage(params);
}

/** 导出底层 http 实例，便于调用方在需要时扩展拦截器 */
export const aiImageHttp = http;