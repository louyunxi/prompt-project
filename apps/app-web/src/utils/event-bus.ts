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
   * 页面上的「图片可替换」小标签被点击：{ selector, kind, src, image }。
   * 由 utils/image-marker 的探针发出，全局弹框监听后新建生图任务。
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
 * change-image 事件载荷。
 * 点击页面图片上的「换图」小标签时，由 image-marker 发出。
 */
export interface ChangeImagePayload extends ChangeImageTarget {
  /** 当前图片地址（<img src> 或 background-image 解析出的 url，可能是 data:） */
  src?: string;
  /**
   * DOM 上 image 属性（JSON 字符串）解析出的生图参数片段。
   * 仅包含 DOM 显式声明的字段，消费方需与默认参数 merge，
   * 缺省字段不得被清空。
   */
  image?: Partial<GenerateImageParams>;
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
  [ImageEvents.CHANGE_IMAGE]: ChangeImagePayload;
}

/** AI 生图相关事件总线（与 eventBus 共用同一个底层实例，仅做命名分组） */
export const imageEventBus = eventBus;
