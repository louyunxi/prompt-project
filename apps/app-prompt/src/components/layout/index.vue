<template>
  <a-layout class="layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="layout-sider"
      width="220"
      :collapsedWidth="60"
    >
      <div class="sider-brand">
        <img :src="logoImg" class="sider-logo" alt="logo" />
        <div v-if="!collapsed" class="sider-title">
          <div class="title-main">左岸AI提示词库</div>
        </div>
      </div>

      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <template v-for="item in menuItems" :key="item.key">
          <a-sub-menu v-if="item.children?.length" :key="item.key">
            <template #icon>
              <component :is="item.icon" v-if="item.icon" />
            </template>
            <template #title>{{ item.title }}</template>

            <template v-for="sub in item.children" :key="sub.key">
              <a-sub-menu v-if="sub.children?.length" :key="sub.key">
                <template #icon>
                  <component :is="sub.icon" v-if="sub.icon" />
                </template>
                <template #title>{{ sub.title }}</template>

                <a-menu-item v-for="leaf in sub.children" :key="leaf.key">
                  <template #icon>
                    <component :is="leaf.icon" v-if="leaf.icon" />
                  </template>
                  <span>{{ leaf.title }}</span>
                </a-menu-item>
              </a-sub-menu>

              <a-menu-item v-else :key="sub.key">
                <template #icon>
                  <component :is="sub.icon" v-if="sub.icon" />
                </template>
                <span>{{ sub.title }}</span>
              </a-menu-item>
            </template>
          </a-sub-menu>

          <a-menu-item v-else :key="item.key">
            <template #icon>
              <component :is="item.icon" v-if="item.icon" />
            </template>
            <span>{{ item.title }}</span>
          </a-menu-item>
        </template>
      </a-menu>

      <div class="sider-footer" v-if="!collapsed">左岸内部专用</div>
    </a-layout-sider>

    <!-- 主区域 -->
    <a-layout class="layout-main">
      <!-- 顶栏 -->
      <a-layout-header class="layout-header">
        <div class="header-left">
          <MenuFoldOutlined
            v-if="!collapsed"
            class="collapse-trigger"
            @click="collapsed = true"
          />
          <MenuUnfoldOutlined
            v-else
            class="collapse-trigger"
            @click="collapsed = false"
          />
          <h2>{{ pageTitle }}</h2>
        </div>

        <div class="header-right">
          <a-dropdown @openChange="(open: boolean) => (dropdownOpen = open)">
            <div class="user-chip">
              <a-avatar :style="{ backgroundColor: '#015ca7' }">
                {{ (userStore.userName || '管').slice(0, 1) }}
              </a-avatar>
              <span class="user-name">
                {{ userStore.userName || '管理员' }}
              </span>
              <DownOutlined
                class="dropdown-arrow"
                :class="{ open: dropdownOpen }"
                style="font-size: 12px; color: #5c6b7a"
              />
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item key="logout" @click="handleLogout">
                  <template #icon>
                    <LogoutOutlined />
                  </template>
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content class="layout-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import {
  HomeOutlined,
  EditOutlined,
  FileTextOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
  LayoutOutlined,
  EnvironmentOutlined,
  AlignLeftOutlined,
  MessageOutlined,
  FireOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  FontColorsOutlined,
  StarOutlined,
  PictureOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue';
import logoImg from '@/assets/images/logo.png';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const collapsed = ref(false);
const dropdownOpen = ref(false);
const selectedKeys = ref<string[]>([]);
const openKeys = ref<string[]>([]);

const pageTitle = computed(() => (route.meta?.title as string) || '');

const updateMenuState = (path: string) => {
  selectedKeys.value = [path.replace(/^\/|\/$/g, '')];

  const keys: string[] = [];
  const parts = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  let prefix = '';
  for (const part of parts) {
    prefix = prefix ? `${prefix}/${part}` : part;
    keys.push(prefix);
  }
  openKeys.value = keys.filter((k) => subMenuKeys.has(k));
};

watch(() => route.path, updateMenuState);

onMounted(() => {
  updateMenuState(route.path);
  if (!openKeys.value.includes('prompt')) {
    openKeys.value = ['prompt', ...openKeys.value];
  }
});

interface MenuItem {
  key: string;
  title: string;
  icon?: any;
  children?: MenuItem[];
}

const categoryChildren = (prefix: string): MenuItem[] => [
  { key: `${prefix}/layout`, title: '页面布局', icon: LayoutOutlined },
  { key: `${prefix}/map`, title: '地图', icon: EnvironmentOutlined },
  { key: `${prefix}/typography`, title: '排版', icon: AlignLeftOutlined },
  { key: `${prefix}/modal`, title: '弹框布局', icon: MessageOutlined },
  { key: `${prefix}/effect`, title: '特效', icon: FireOutlined },
  { key: `${prefix}/chart`, title: '图表', icon: BarChartOutlined },
  { key: `${prefix}/widget`, title: '小组件', icon: AppstoreOutlined },
  { key: `${prefix}/background`, title: '背景', icon: BgColorsOutlined },
  { key: `${prefix}/font`, title: '字体', icon: FontColorsOutlined },
];

const menuItems: MenuItem[] = [
  { key: '', title: '首页', icon: HomeOutlined },
  { key: 'page-maker', title: '页面制作', icon: EditOutlined },
  {
    key: 'prompt',
    title: '提示词模版',
    icon: FileTextOutlined,
    children: [
      {
        key: 'prompt/pc',
        title: 'PC端',
        icon: DesktopOutlined,
        children: categoryChildren('prompt/pc'),
      },
      {
        key: 'prompt/h5',
        title: 'H5端',
        icon: MobileOutlined,
        children: categoryChildren('prompt/h5'),
      },
      {
        key: 'prompt/uniapp',
        title: 'uniapp小程序',
        icon: TabletOutlined,
        children: categoryChildren('prompt/uniapp'),
      },
    ],
  },
  { key: 'favorite', title: '收藏', icon: StarOutlined },
  { key: 'gallery', title: '图库', icon: PictureOutlined },
];

const subMenuKeys = new Set<string>();
const collectSubMenuKeys = (items: MenuItem[]) => {
  for (const item of items) {
    if (item.children?.length) {
      subMenuKeys.add(item.key);
      collectSubMenuKeys(item.children);
    }
  }
};
collectSubMenuKeys(menuItems);

const handleMenuClick = ({ key }: any) => {
  if (key === '') {
    router.push('/');
    return;
  }
  router.push(`/${key}`);
};

const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};
</script>

<style lang="scss" scoped>
$sider-primary: #2e7cf6;
$sider-dark: #1d5fdb;
$sider-text-muted: rgba(255, 255, 255, 0.65);

@mixin slim-scrollbar($size, $thumb-color, $track-color: transparent) {
  scrollbar-width: thin;
  scrollbar-color: $thumb-color $track-color;

  &::-webkit-scrollbar {
    width: $size;
    height: $size;
  }

  &::-webkit-scrollbar-track {
    background: $track-color;
  }

  &::-webkit-scrollbar-thumb {
    background: $thumb-color;
    border-radius: $size;
  }

  &::-webkit-scrollbar-corner {
    background: $track-color;
  }
}

.layout {
  height: 100vh;
  padding: 14px;
  gap: 14px;
  background: #d8e6fb;
}

.layout-sider {
  overflow: auto;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: linear-gradient(180deg, $sider-primary 0%, $sider-dark 100%);
  box-shadow: 0 8px 24px rgba(30, 99, 224, 0.25);

  @include slim-scrollbar(2px, rgba(255, 255, 255, 0.35));

  :deep(.ant-layout-sider-children) {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: auto;

    @include slim-scrollbar(2px, rgba(255, 255, 255, 0.35));
  }

  // 未收起时才需要覆盖缩进
  &:not(.ant-layout-sider-collapsed) {
    :deep(.ant-menu) {
      .ant-menu-item,
      .ant-menu-submenu-title {
        padding-left: 14px !important;
      }

      .ant-menu-sub .ant-menu-item,
      .ant-menu-sub .ant-menu-submenu-title {
        padding-left: 22px !important;
      }

      .ant-menu-sub .ant-menu-sub .ant-menu-item,
      .ant-menu-sub .ant-menu-sub .ant-menu-submenu-title {
        padding-left: 30px !important;
      }
    }
  }

  :deep(.ant-menu) {
    background: transparent;

    // 二级子菜单：比侧边栏浅一点
    .ant-menu-sub {
      background: rgba(255, 255, 255, 0.08) !important;
      border-radius: 10px;
      margin-inline: 8px !important;
      padding: 4px 0 !important;
    }

    // 三级子菜单：再浅一层
    .ant-menu-sub .ant-menu-sub {
      background: rgba(255, 255, 255, 0.1) !important;
    }

    // 子菜单内菜单项缩进减小，避免过挤
    .ant-menu-sub .ant-menu-item {
      margin-inline: 4px;
    }

    &.ant-menu-dark {
      .ant-menu-item-selected {
        background: linear-gradient(90deg, #6aa8ff 0%, #4489ff 100%) !important;
        box-shadow: 0 4px 12px rgba(21, 74, 173, 0.35);
        color: #fff !important;
      }

      .ant-menu-item-group-title {
        color: rgba(255, 255, 255, 0.85);
        font-size: 13px;
        letter-spacing: 1px;
        padding-left: 24px;
        padding-top: 14px;
        padding-bottom: 7px;
      }

      // 一级菜单
      > .ant-menu-item,
      > .ant-menu-submenu > .ant-menu-submenu-title {
        font-size: 14px;
      }

      > .ant-menu-submenu > .ant-menu-submenu-title {
        color: #fff;

        .anticon {
          color: #fff;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.16);
        }
      }

      // 二级菜单
      .ant-menu-sub .ant-menu-item {
        font-size: 13.5px;
      }

      // 三级菜单
      .ant-menu-sub .ant-menu-sub .ant-menu-item {
        font-size: 13px;
      }

      .ant-menu-submenu-selected > .ant-menu-submenu-title {
        color: #fff;
      }

      .ant-menu-item {
        margin-bottom: 4px;
        border-radius: 10px;
        margin-inline: 8px;
        width: auto;
        color: #fff;

        &:hover {
          background: rgba(255, 255, 255, 0.16);
        }

        .anticon {
          color: #fff;
        }
      }
    }
  }

  &.ant-layout-sider-collapsed {
    .sider-brand {
      justify-content: center;
      padding: 24px 6px 20px;
    }

    :deep(.ant-menu) {
      .ant-menu-item,
      .ant-menu-submenu-title {
        margin-inline: 0 !important;
      }

      .ant-menu-item-icon {
        margin-right: 0 !important;
        min-width: auto;
      }

      .ant-menu-submenu-arrow {
        display: none;
      }
    }
  }
}

.sider-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 24px 20px 20px;
  cursor: default;

  .sider-logo {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    object-fit: contain;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px;
  }

  .sider-title {
    .title-main {
      color: #fff;
      font-weight: 700;
      font-size: 16px;
      line-height: 1.3;
    }
  }
}

.sider-footer {
  margin-top: auto;
  padding: 14px 20px;
  color: $sider-text-muted;
  font-size: 11px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.layout-main {
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(30, 99, 224, 0.12);
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #eef2f8;
  padding: 0 24px;
  line-height: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;

  .collapse-trigger {
    font-size: 18px;
    cursor: pointer;
    color: #5c6b7a;
    transition: color 0.15s;

    &:hover {
      color: $sider-primary;
    }
  }

  h2 {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 0;
  }
}

.header-right {
  .user-chip {
    display: flex;
    align-items: center;
    gap: 9px;
    cursor: pointer;

    .user-name {
      font-size: 13px;
      font-weight: 500;
      margin-right: -5px;
    }

    .dropdown-arrow {
      transition: transform 0.3s ease;
      transform-origin: center;

      &.open {
        transform: rotate(180deg);
      }
    }
  }
}

.layout-content {
  padding: 24px 28px 40px;
  overflow: auto;
  background: #fff;

  @include slim-scrollbar(4px, rgba(46, 124, 246, 0.35));
}
</style>
