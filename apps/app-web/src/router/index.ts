import { createRouter, createWebHashHistory } from 'vue-router';

const categoryNames: Record<string, string> = {
  map: '地图',
  typography: '排版',
  modal: '弹框布局',
  effect: '特效',
  chart: '图表',
  widget: '小组件',
  background: '背景',
  font: '字体',
};

const categories = Object.keys(categoryNames);

const buildCategoryRoutes = () =>
  categories.map((category) => ({
    path: category,
    name: category.charAt(0).toUpperCase() + category.slice(1),
    component: () => import(`@/views/${category}/index.vue`),
    meta: { title: categoryNames[category] },
  }));

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
    // 404 页面
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/notFound/index.vue'),
    },
  ],
});

export default router;
