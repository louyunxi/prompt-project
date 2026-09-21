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
        <div class="sider-logo">web</div>
        <div v-if="!collapsed" class="sider-title">
          <div class="title-main">web端示例项目</div>
        </div>
      </div>

      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item v-for="item in menuItems" :key="item.key">
          <template #icon>
            <component :is="item.icon" />
          </template>
          <span>{{ item.title }}</span>
        </a-menu-item>
      </a-menu>

      <div class="sider-footer" v-if="!collapsed">web 端示例</div>
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
          <div class="theme-chip">
            <span class="theme-label">
              {{ themeStore.isDark ? '深色模式' : '浅色模式' }}
            </span>
            <a-switch
              size="small"
              :checked="themeStore.isDark"
              @change="handleThemeChange"
            />
          </div>
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
import { useThemeStore } from '@/store/modules/theme';
import {
  HomeOutlined,
  LayoutOutlined,
  EnvironmentOutlined,
  AlignLeftOutlined,
  MessageOutlined,
  FireOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  FontColorsOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons-vue';

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();

const collapsed = ref(false);
const selectedKeys = ref<string[]>([]);

const pageTitle = computed(() => (route.meta?.title as string) || '');

const updateMenuState = (path: string) => {
  selectedKeys.value = [path.replace(/^\/|\/$/g, '')];
};

watch(() => route.path, updateMenuState);

onMounted(() => {
  updateMenuState(route.path);
});

interface MenuItem {
  key: string;
  title: string;
  icon: any;
}

const menuItems: MenuItem[] = [
  { key: '', title: '首页', icon: HomeOutlined },
  { key: 'layout', title: '页面布局', icon: LayoutOutlined },
  { key: 'map', title: '地图', icon: EnvironmentOutlined },
  { key: 'typography', title: '排版', icon: AlignLeftOutlined },
  { key: 'modal', title: '弹框布局', icon: MessageOutlined },
  { key: 'effect', title: '特效', icon: FireOutlined },
  { key: 'chart', title: '图表', icon: BarChartOutlined },
  { key: 'widget', title: '小组件', icon: AppstoreOutlined },
  { key: 'background', title: '背景', icon: BgColorsOutlined },
  { key: 'font', title: '字体', icon: FontColorsOutlined },
];

const handleMenuClick = ({ key }: any) => {
  if (key === '') {
    router.push('/');
    return;
  }
  router.push(`/${key}`);
};

const handleThemeChange = (checked: boolean) => {
  themeStore.setTheme(checked ? 'dark' : 'light');
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
  background: var(--bg-color);
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

  :deep(.ant-menu) {
    background: transparent;

    &.ant-menu-dark {
      .ant-menu-item-selected {
        background: linear-gradient(90deg, #6aa8ff 0%, #4489ff 100%) !important;
        box-shadow: 0 4px 12px rgba(21, 74, 173, 0.35);
        color: #fff !important;
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
      .ant-menu-item {
        margin-inline: 0 !important;
      }

      .ant-menu-item-icon {
        margin-right: 0 !important;
        min-width: auto;
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
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-weight: 700;
    font-size: 14px;
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
  background: var(--card-bg);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(30, 99, 224, 0.12);
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--line-color);
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
    color: var(--ink-color-2);
    transition: color 0.15s;

    &:hover {
      color: var(--primary-color);
    }
  }

  h2 {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 0;
    color: var(--ink-color);
  }
}

.header-right {
  .theme-chip {
    display: flex;
    align-items: center;
    gap: 10px;

    .theme-label {
      font-size: 13px;
      color: var(--ink-color-2);
    }
  }
}

.layout-content {
  padding: 24px 28px 40px;
  overflow: auto;
  background: var(--bg-color);

  @include slim-scrollbar(4px, rgba(46, 124, 246, 0.35));
}
</style>
