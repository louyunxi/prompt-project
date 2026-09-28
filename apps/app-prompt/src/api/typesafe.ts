import appConfig from '@anhui/app-config';

/**
 * jev（TypeSafe AI System One）模型 API
 *
 * 官方文档：https://docs.typesafe.ai/primitives/choice
 * 接口：POST {jevBaseUrl}/v1/systemone
 * 认证：Authorization: Bearer {jevApiKey}
 * 模型：jev-latest（TypeSafe 旗舰模型，choice primitive 用于从候选中匹配最合适项）
 *
 * 密钥统一在 configs/app/index.js 的 apiConfig.jevApiKey 维护。
 * 注意：typesafe.ai 仅放行白名单 origin，浏览器直连会 CORS 预检失败，
 * 请求统一发到同源代理前缀 {jevProxyPath}，dev 由 Vite server.proxy 转发，
 * 生产需部署服务器把该前缀反代到 {jevBaseUrl}。
 */

/** jev 模型默认标识 */
export const JEV_MODEL = 'jev-latest';

/** choice 问题 criteria：key 为选项标识，value 为选项描述 */
export interface ChoiceCriteria {
  [key: string]: string;
}

/** choice 类型问题 */
export interface ChoiceQuestion {
  type: 'choice';
  instructions: string;
  criteria: ChoiceCriteria;
}

/** choice 类型答案 */
export interface ChoiceAnswer {
  type: 'choice';
  /** 命中选项标识（criteria 的 key） */
  choice: string;
  /** 各选项概率分布 */
  probabilities: Record<string, number>;
  /** 置信度（0-1，由概率离散度计算） */
  confidence: number;
}

/** systemOne 请求体 */
export interface SystemOneRequest {
  state: string | Record<string, unknown> | Array<unknown>;
  model: string;
  questions: Record<string, ChoiceQuestion>;
}

/** systemOne 响应体 */
export interface SystemOneResponse {
  model: string;
  answers: Record<string, ChoiceAnswer>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/** 从配置读取 jev 代理前缀与密钥（同源代理，避免 CORS 预检） */
const { jevProxyPath, jevApiKey } = appConfig.apiConfig;

/**
 * 调用 jev（TypeSafe AI System One）接口，返回原始响应。
 * @param request systemOne 请求体（含 state / model / questions）
 */
export async function systemOne(
  request: SystemOneRequest,
): Promise<SystemOneResponse> {
  const res = await fetch(`${jevProxyPath}/v1/systemone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jevApiKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      detail?.error?.message || `jev 模型接口错误：HTTP ${res.status}`,
    );
  }

  return (await res.json()) as SystemOneResponse;
}

/**
 * choice primitive 快捷调用：从 criteria 候选中匹配最符合 state 描述的一项。
 * @param state       待评估的内容（如用户输入的需求文本）
 * @param instructions 选择标准说明（告诉模型怎么选）
 * @param criteria    候选集合 { 标识: 描述 }
 * @param questionId  问题标识，答案会挂在响应 answers 的同名 key 下
 */
export async function systemOneChoice(
  state: string,
  instructions: string,
  criteria: ChoiceCriteria,
  questionId = 'component_match',
): Promise<ChoiceAnswer> {
  const response = await systemOne({
    state,
    model: JEV_MODEL,
    questions: {
      [questionId]: { type: 'choice', instructions, criteria },
    },
  });
  const answer = response.answers?.[questionId];
  if (!answer) {
    throw new Error(`jev 模型响应缺少 ${questionId} 答案`);
  }
  return answer;
}
