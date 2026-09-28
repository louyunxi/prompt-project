import {
  JEV_MODEL,
  systemOne,
  type ChoiceAnswer,
  type ChoiceCriteria,
  type SystemOneRequest,
  type SystemOneResponse,
} from '@/api/typesafe';
import type { PcComponent } from './pc-components';

/**
 * 组件智能匹配公共函数
 *
 * 把 PC 端组件清单转成 jev 模型（TypeSafe AI System One）choice primitive 的
 * 候选 criteria，让模型根据用户输入的需求文本，从候选中选出最适合的组件，
 * 并返回完整请求 / 响应供「模型接口展示」使用。
 */

/** 问题标识 */
export const MATCH_QUESTION_ID = 'component_match';

/** 选择标准说明 */
const MATCH_INSTRUCTIONS =
  '根据用户输入的需求，从候选中选出最适合展示该内容/效果的 PC 端组件；若语义最接近的一项。';

/** 匹配结果：命中组件 + 模型完整请求/响应 */
export interface ComponentMatchResult {
  /** 命中组件元数据（按 answer.choice 反查） */
  component: PcComponent;
  /** 模型答案（choice / confidence / probabilities） */
  answer: ChoiceAnswer;
  /** 完整请求体（用于接口展示） */
  request: SystemOneRequest;
  /** 完整响应体（用于接口展示） */
  response: SystemOneResponse;
}

/** 组件清单 → choice criteria：key 为组件 name，value 为「分类 · 中文标题」 */
export function buildComponentCriteria(
  components: PcComponent[],
): ChoiceCriteria {
  return Object.fromEntries(
    components.map((c) => [c.name, `${c.categoryName} · ${c.title}`]),
  );
}

/**
 * 输入需求 → 匹配最合适的 PC 端组件。
 * @param input         用户输入的需求描述
 * @param components    候选组件清单（全部）
 * @param selectedNames 参与匹配的组件名子集（默认全部）
 */
export async function matchComponent(
  input: string,
  components: PcComponent[],
  selectedNames: string[] = components.map((c) => c.name),
): Promise<ComponentMatchResult> {
  const candidates = components.filter((c) => selectedNames.includes(c.name));
  if (!candidates.length) {
    throw new Error('未选择候选组件');
  }

  const request: SystemOneRequest = {
    state: input,
    model: JEV_MODEL,
    questions: {
      [MATCH_QUESTION_ID]: {
        type: 'choice',
        instructions: MATCH_INSTRUCTIONS,
        criteria: buildComponentCriteria(candidates),
      },
    },
  };

  const response = await systemOne(request);
  const answer: ChoiceAnswer | undefined =
    response.answers?.[MATCH_QUESTION_ID];
  if (!answer) {
    throw new Error(`jev 模型响应缺少 ${MATCH_QUESTION_ID} 答案`);
  }

  const component =
    candidates.find((c) => c.name === answer.choice) ?? candidates[0];

  return { component, answer, request, response };
}
