/**
 * DOM 相关通用工具
 *
 * 背景（motion-v 使用注意）：
 *   motion.div / motion.button / motion.input 等并不是原生元素，而是 motion-v 用
 *   defineComponent 包装出来的组件（内部 h(asTag, ...)），且未暴露任何实例属性。
 *   Vue 对「组件 vnode」的模板 ref 取值逻辑是 getExposeProxy(instance) || instance.proxy，
 *   因此 ref="xxx" 拿到的实际是组件实例代理对象：它非 null，但 instanceof Element 为 false。
 *   直接喂给 ResizeObserver.observe / getBoundingClientRect / focus 等 DOM API 会抛
 *   「parameter 1 is not of type 'Element'」或「xxx is not a function」。
 *   要拿真实 DOM，须取组件实例的 $el（其根元素）。
 *
 * 用法：
 *   const el = ref<HTMLElement | null>(null);
 *   const setEl = (target: unknown) => { el.value = resolveElement(target); };
 *   // 模板：<motion.div :ref="setEl"> 或 <div ref="el"> + onMounted 里 resolveElement(el.value)
 */

/**
 * 解析模板 ref 指向的真实 DOM 元素。
 * 原生元素直接返回；组件实例（含 motion-v 的 motion.*）取其 $el；
 * 其余（null / 空组件实例代理 / 文本节点等）返回 null。
 */
export function resolveElement(target: unknown): HTMLElement | null {
  if (target instanceof HTMLElement) {
    return target;
  }
  const el =
    target && typeof target === 'object'
      ? (target as { $el?: unknown }).$el
      : undefined;
  return el instanceof HTMLElement ? el : null;
}
