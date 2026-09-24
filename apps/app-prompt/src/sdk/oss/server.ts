/**
 * 后端 OSS 签名前缀接口
 *
 * 通过后端 `/file/getOssInfo` 与 `/file/encryptParam` 获取
 * OSS 桶配置与上传签名,前端不需要也不应该持有 AccessKey。
 */

const BASE_URL = 'https://www.snkoudai.com/api/foundation';

export interface OssInfoVO {
  alioss_BUCKETNAME: string;
  alioss_DIR: string;
  alioss_ENDPOINT: string;
  alioss_HOST: string;
  alioss_URL_PRE: string;
}

/** 服务端返回的 PostObject 签名参数(字段名按常见约定) */
export interface EncryptParamVO {
  accessid: string;
  host: string;
  policy: string;
  signature: string;
  /** 秒级时间戳 */
  expire: number;
  /** 上传目录前缀(以 / 结尾) */
  dir: string;
}

interface BaseResp<T> {
  curDate?: string;
  respCode: number;
  respDesc: string;
  success?: boolean;
  failed?: boolean;
  obj?: T;
}

/**
 * 通用接口调用,自动处理 BaseResp 包装 / 平铺响应。
 * - 看到 respCode 字段:按 BaseResp 解嵌套,respCode !== 0 抛错
 * - 没有 respCode:直接返回 JSON 本体(适用于 encryptParam 这种直接平铺的接口)
 */
const callApi = async <T>(path: string): Promise<T> => {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`[oss-server] ${path} 非 JSON 响应: ${text.slice(0, 200)}`);
  }
  if (json && typeof json === 'object' && 'respCode' in (json as Record<string, unknown>)) {
    const wrapped = json as BaseResp<T>;
    if (wrapped.respCode !== 0) {
      throw new Error(
        `[oss-server] ${path} 失败 [${wrapped.respCode}]: ${wrapped.respDesc}`,
      );
    }
    return (wrapped.obj as T) ?? ({} as T);
  }
  return json as T;
};

/**
 * 获取 OSS 桶元信息
 * 接口:`GET /file/getOssInfo`
 */
export const getOssInfo = (): Promise<OssInfoVO> =>
  callApi<OssInfoVO>('/file/getOssInfo');

/**
 * 获取 PostObject 签名参数
 * 接口:`GET /file/encryptParam`
 */
export const getEncryptParam = (): Promise<EncryptParamVO> =>
  callApi<EncryptParamVO>('/file/encryptParam');