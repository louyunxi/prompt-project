import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/modules/user';

const WHITE_LIST = ['/login'];

/** 从 pinia-plugin-persistedstate 持久化缓存中解析用户名 */
const getStoredUserName = () => {
  try {
    const raw = localStorage.getItem('admin-user');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.userName || '';
  } catch {
    return '';
  }
};

const platformNames: Record<string, string> = {
  pc: 'PC端',
  h5: 'H5端',
  uniapp: 'uniapp小程序',
};

const categoryNames: Record<string, string> = {
  layout: '页面布局',
  map: '地图',
  typography: '排版',
  modal: '弹框布局',
  effect: '特效',
  chart: '图表',
  widget: '小组件',
  background: '背景',
  font: '字体',
};

const platforms = ['pc', 'h5', 'uniapp'];
const categories = ['layout', 'map', 'typography', 'modal', 'effect', 'chart', 'widget', 'background', 'font'];

const buildPromptRoutes = () =>
  platforms.map((platform) => ({
    path: platform,
    component: () => import(`../views/prompt/${platform}/index.vue`),
    meta: { title: platformNames[platform] },
    redirect: `/prompt/${platform}/layout`,
    children: categories.map((category) => ({
      path: category,
      name: `Prompt${platform.charAt(0).toUpperCase() + platform.slice(1)}${category.charAt(0).toUpperCase() + category.slice(1)}`,
      component:
        platform === 'pc'
          ? () => import('../views/prompt/pc/MicroContainer.vue')
          : () => import(`../views/prompt/${platform}/${category}/index.vue`),
      meta: { title: categoryNames[category], category },
    })),
  }));

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
    },
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
          path: 'page-maker',
          name: 'PageMaker',
          component: () => import('@/views/page-maker/index.vue'),
          meta: { title: '页面制作' },
        },
        {
          path: 'prompt',
          name: 'Prompt',
          redirect: '/prompt/pc/layout',
          component: () => import('@/views/prompt/index.vue'),
          meta: { title: '提示词模版' },
          children: buildPromptRoutes(),
        },
        {
          path: 'favorite',
          name: 'Favorite',
          component: () => import('@/views/favorite/index.vue'),
          meta: { title: '收藏' },
        },
        {
          path: 'gallery',
          name: 'Gallery',
          component: () => import('@/views/gallery/index.vue'),
          meta: { title: '图库' },
        },
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

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  const userName = userStore.userName || getStoredUserName();

  if (WHITE_LIST.includes(to.path)) {
    return next();
  }

  if (!userName) {
    return next({ path: '/login' });
  }

  return next();
});

export default router;
