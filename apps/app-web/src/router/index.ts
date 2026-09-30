import { createRouter, createWebHashHistory } from 'vue-router';

const categoryNames: Record<string, string> = {
  map: '地图',
  layout: '布局',
  typography: '排版',
  modal: '弹框布局',
  effect: '特效',
  chart: '图表',
  widget: '小组件',
  background: '背景',
  font: '字体',
  loading: 'Loader',
};

const categories = Object.keys(categoryNames);

const buildCategoryRoutes = () =>
  categories.map((category) => ({
    path: category,
    name: category.charAt(0).toUpperCase() + category.slice(1),
    component: () => import(`@/views/${category}/index.vue`),
    meta: { title: categoryNames[category] },
  }));

/**
 * 微应用模式占位路由。
 * PC 主应用（app-prompt）地址形如 `#/prompt/pc/<category>?page=N`，
 * 分类页由 `main.ts` 直接渲染（不经过 `<router-view>`），此路由只负责：
 *   - 让分类页里的 `useRoute()` 拿到 category 与 `?page=`（分页初始值）
 *   - 让 `useRouter().replace({ query })` 切页时继续回写主应用 hash，保持 URL 同步
 * 子应用与主应用共用同一个 hash（都是 `createWebHashHistory`），因此无需额外桥接。
 */
const MicroPlaceholder = { name: 'MicroPlaceholder', render: () => null };

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/components/layout/index.vue'),
      meta: { title: '首页' },
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('@/views/home/index.vue'),
          meta: { title: '首页' },
        },
        {
          path: 'component-preview',
          name: 'ComponentPreview',
          component: () => import('@/components/component-preview/index.vue'),
          meta: { title: '组件预览' },
        },
        ...buildCategoryRoutes(),
      ],
    },
    // 微应用模式：主应用 PC 端二级菜单地址
    {
      path: '/prompt/pc/:category',
      name: 'MicroCategory',
      component: MicroPlaceholder,
    },
    // 404 页面
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/notFound/index.vue'),
    },
  ],
});

export default router;
