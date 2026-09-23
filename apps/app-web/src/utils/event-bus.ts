/**
 * 全局事件总线（基于 mitt），用于跨组件 / 跨 store 的全局事件通知。
 *
 * 设计目标：
 *   1. 底层使用 mitt（业内最常用的极简事件库，~200 字节）；
 *   2. 类型安全：emit / on 时通过泛型推断 payload；
 *   3. 支持 on / once / off / emit，on 返回 off 函数让调用方一行完成清理；
 *   4. 单个监听器抛错不影响其他监听器；
 *   5. 不持久化，刷新即清空。
 *
 * 使用场景示例：
 *   ```ts
 *   // 1. pinia store 内发事件
 *   import { imageEventBus, ImageEvents } from '@/utils/event-bus';
 *   imageEventBus.emit(ImageEvents.TASK_START, { taskId });
 *
 *   // 2. 任意组件监听
 *   const off = imageEventBus.on<{ taskId: string }>(
 *     ImageEvents.TASK_START,
 *     ({ taskId }) => console.log('start', taskId),
 *   );
 *   onBeforeUnmount(off);
 *   ```
 */
import mitt, { type Emitter } from 'mitt';
import type { GenerateImageParams } from '@/utils/ai-image';

export type EventHandler<T = unknown> = (payload: T) => void;
export type Unsubscribe = () => void;

/** mitt 事件表：事件名为 string，载荷统一 unknown，由 on/emit 泛型收窄 */
type EventMap = Record<string, unknown>;

class EventBus {
  private emitter: Emitter<EventMap> = mitt<EventMap>();

  /** 原始 handler → mitt 实际注册的包装函数（用于 off / once） */
  private wrapped = new Map<
    string,
    Map<EventHandler, (payload: unknown) => void>
  >();

  /** 订阅事件，返回取消订阅的函数 */
  on<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe {
    let bucket = this.wrapped.get(event);
    if (!bucket) {
      bucket = new Map();
      this.wrapped.set(event, bucket);
    }
    // 同一 handler 重复 on 时先摘掉旧的，避免重复触发
    const old = bucket.get(handler as EventHandler);
    if (old) this.emitter.off(event, old);

    const wrappedHandler = (payload: unknown) => {
      try {
        (handler as EventHandler<unknown>)(payload);
      } catch (err) {
        // 单个监听器异常不影响其他监听器
        // eslint-disable-next-line no-console
        console.error(`[event-bus] handler for "${event}" threw:`, err);
      }
    };
    bucket.set(handler as EventHandler, wrappedHandler);
    this.emitter.on(event, wrappedHandler);
    return () => this.off(event, handler);
  }

  /** 只触发一次，自动取消订阅 */
  once<T = unknown>(event: string, handler: EventHandler<T>): Unsubscribe {
    const wrapped: EventHandler<T> = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }

  /** 取消订阅 */
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const bucket = this.wrapped.get(event);
    const wrappedHandler = bucket?.get(handler as EventHandler);
    if (wrappedHandler) {
      this.emitter.off(event, wrappedHandler);
      bucket!.delete(handler as EventHandler);
    }
  }

  /** 广播事件；mitt 对无监听者的事件静默忽略 */
  emit<T = unknown>(event: string, payload?: T): void {
    this.emitter.emit(event, payload);
  }

  /** 清空所有订阅（一般在测试 / 路由切换时调用） */
  clear(): void {
    this.emitter.all.clear();
    this.wrapped.clear();
  }
}

/** 默认全局事件总线实例 */
export const eventBus = new EventBus();

/**
 * AI 生图相关的预定义事件常量。
 * 推荐用常量而不是裸字符串，避免拼写错误。
 */
export const ImageEvents = {
  /** 任务开始：{ taskId, params } */
  TASK_START: 'image:task:start',
  /** 任务完成：{ taskId, result, elapsedMs } */
  TASK_COMPLETE: 'image:task:complete',
  /** 任务失败：{ taskId, error, elapsedMs } */
  TASK_FAIL: 'image:task:fail',
  /** 任务被删除：{ taskId } */
  TASK_REMOVE: 'image:task:remove',
  /** 应用某任务为组件背景：{ taskId } */
  APPLY_BACKGROUND: 'image:apply:background',
  /** 清除背景（回到默认渐变）：{} */
  CLEAR_BACKGROUND: 'image:clear:background',
  /**
   * 组件级「图片可替换」聚合事件：点击当前组件右上角的「换图」按钮时，
   * 由 image-marker 发出。载荷包含当前组件内按 src 去重后的全部图片
   * 及其一对多 DOM 目标。消费方（弹框）先选要替换哪张图，再做 AI/本地替换。
   * 注意：事件名固定为 change-image（对外约定，勿改）。
   */
  CHANGE_IMAGE: 'change-image',
} as const;

/** ImageEvents 取值类型（用于 on / emit 的事件名校验） */
export type ImageEventName =
  (typeof ImageEvents)[keyof typeof ImageEvents];

/**
 * 图片替换目标（可持久化的最小子集）。
 * 只包含定位 DOM 必需的 selector + kind，可随生图任务一起持久化，
 * 刷新页面后仍能把本地保存的图片重新应用回原 DOM。
 */
export interface ChangeImageTarget {
  /**
   * 目标 DOM 的全局唯一选择器：[data-img-mark-id="xxxxx"]。
   * 探针首次命中元素时写入该属性，document.querySelector(selector)
   * 一定能且只能找回这一个 DOM。
   */
  selector: string;
  /** 图片渲染方式 */
  kind: 'img' | 'background' | 'pseudo-before' | 'pseudo-after';
}

/**
 * 当前组件内一张「去重后的图片」：同一个 src 在同一组件内可能被多次渲染，
 * 这里把同一 src 的所有 ChangeImageTarget 聚到同一 entry 下，做一对多替换。
 */
export interface ChangeImageEntry {
  /** group 内唯一 id（弹框 tab key / 选中态） */
  id: string;
  /**
   * 当前图片地址（用于缩略图回显 + 默认参数解析来源）。
   * data: URL 也允许，便于本地默认背景图。
   */
  src: string;
  /**
   * 同一 src 对应的渲染方式（同一 src 内可能既有 <img> 也有 CSS 背景，
   * 这里只取首个命中为代表，避免 tab 缩略图重复）。
   */
  kind: ChangeImageTarget['kind'];
  /**
   * 同一图片的所有 DOM 目标（>=1），替换时对全部目标生效。
   */
  targets: ChangeImageTarget[];
  /**
   * 业务方 image 属性解析出的生图参数片段；缺失字段由默认值补齐。
   */
  image?: Partial<GenerateImageParams>;
}

/**
 * 组件级「换图」事件载荷。
 * 点击当前组件右上角的「换图」按钮时，由 image-marker 发出。
 * 弹框拿到 payload 后：先把 entries 渲染成 tab 列表让用户选图，
 * 选中某张图后再展示 AI换图 / 本地图片修改 详情；替换时一对多。
 */
export interface ChangeImageGroupPayload {
  /**
   * 当前组件容器根 [data-image-component-id="xxx"] 选择器，
   * 持久化在任务里用于刷新后还原组件上下文。
   */
  componentSelector: string;
  /**
   * 当前组件的展示名（取自 data-image-component / data-component-name
   * 或 .layout-content 直系子节点 fallback），仅用于弹框标题展示。
   */
  componentName: string;
  /** 当前组件内按 src 去重后的全部可替换图片 */
  entries: ChangeImageEntry[];
}

/** 生图事件的 payload 类型映射 */
export interface ImageEventPayloads {
  [ImageEvents.TASK_START]: { taskId: string; params: unknown };
  [ImageEvents.TASK_COMPLETE]: {
    taskId: string;
    result: unknown;
    elapsedMs: number;
  };
  [ImageEvents.TASK_FAIL]: {
    taskId: string;
    error: string;
    elapsedMs: number;
  };
  [ImageEvents.TASK_REMOVE]: { taskId: string };
  [ImageEvents.APPLY_BACKGROUND]: { taskId: string };
  [ImageEvents.CLEAR_BACKGROUND]: Record<string, never>;
  [ImageEvents.CHANGE_IMAGE]: ChangeImageGroupPayload;
}

/** AI 生图相关事件总线（与 eventBus 共用同一个底层实例，仅做命名分组） */
export const imageEventBus = eventBus;
