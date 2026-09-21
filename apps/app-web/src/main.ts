import { createApp } from 'vue';
import type { App as VueApp } from 'vue';
import App from './App.vue';
import Gallery from './components/gallery/index.vue';
import router from './router';
import pinia from './store';
import './styles/index.scss';
import 'ant-design-vue/dist/reset.css';

/** qiankun 注入的 props */
interface MicroProps {
  /** 挂载容器（qiankun 传入，即子应用 index.html 中的 #app 元素） */
  container?: Element | string;
  /** 主应用分类名，用于平铺对应 views/<category>/component 下的组件 */
  category?: string;
}

let app: VueApp<Element> | null = null;

function render(props: MicroProps = {}) {
  const { container, category } = props;
  // 独立运行时使用自身路由与布局；作为微应用时按主应用传入的 category 平铺组件
  const isMicro = Boolean(container);

  const target = isMicro
    ? typeof container === 'string'
      ? document.querySelector<HTMLElement>(container)
      : container
    : document.querySelector<HTMLElement>('#app');

  if (!target) {
    console.error('[app-web] 未找到挂载节点');
    return;
  }

  app = createApp(
    isMicro ? Gallery : App,
    isMicro ? { category: category ?? '' } : undefined,
  );
  app.use(pinia);
  if (!isMicro) app.use(router);
  app.mount(target);
}

// 独立运行（非 qiankun 环境）时直接挂载
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

export async function bootstrap() {
  // 应用加载时调用，仅在微应用首次加载时执行一次
}

export async function mount(props: MicroProps) {
  render(props);
}

export async function unmount() {
  app?.unmount();
  app = null;
}

export async function update() {
  // 预留：主应用手动更新微应用时调用
}
