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
          <a-space :size="12">
            <!-- 生图管理入口：右上角按钮 + 角标（生成中数量） -->
            <a-tooltip title="打开生图管理（生成中的任务会在这里实时提示）">
              <a-badge
                :key="imageStore.generatingCount"
                :count="imageStore.generatingCount"
                :dot="false"
                :offset="[-4, 4]"
                :number-style="{ backgroundColor: '#015ca7' }"
              >
                <a-button
                  type="default"
                  size="middle"
                  @click="drawerOpen = true"
                >
                  <template #icon><PictureOutlined /></template>
                  生图管理
                </a-button>
              </a-badge>
            </a-tooltip>

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
          </a-space>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content class="layout-content">
        <router-view />
      </a-layout-content>
    </a-layout>

    <!-- 生图管理抽屉（全局单例）。
         force-render：页面加载即挂载内容，保证刷新后恢复轮询的任务
         完成时，自动保存 / DOM 替换监听无需先手动打开抽屉就已在线。 -->
    <AppDrawer
      v-model:open="drawerOpen"
      title="生图管理"
      placement="right"
      :width="640"
      :destroy-on-close="false"
      :force-render="true"
    >
      <ImageGenerator />
    </AppDrawer>

    <!-- 全局新建生图任务弹框（页面「换图」小标签触发） -->
    <ImageCreateModal
      v-model:open="createModalOpen"
      :payload="changeImagePayload"
      @created="handleTaskCreated"
    />
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useThemeStore } from '@/store/modules/theme';
import { useImageStore } from '@/store/modules/image';
import { ImageEvents, imageEventBus } from '@/utils/event-bus';
import {
  HomeOutlined,
  EnvironmentOutlined,
  AlignLeftOutlined,
  MessageOutlined,
  FireOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  FontColorsOutlined,
  PictureOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons-vue';
import AppDrawer from '@/components/drawer/index.vue';
import ImageGenerator from '@/components/image-generator/index.vue';
import ImageCreateModal from '@/components/image-generator/components/ImageCreateModal.vue';
import { startImageMarker } from '@/utils/image-marker';
import { reapplyImageReplacements } from '@/utils/image-apply';
import type {
  ChangeImagePayload,
  ChangeImageTarget,
} from '@/utils/event-bus';

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();
const imageStore = useImageStore();

const collapsed = ref(false);
const selectedKeys = ref<string[]>([]);
const drawerOpen = ref(false);

/** 全局「换图」新建任务弹框状态 */
const createModalOpen = ref(false);
const changeImagePayload = ref<ChangeImagePayload | null>(null);
/** 图片替换标记探针的停止函数 */
let stopImageMarkerFn: (() => void) | null = null;

const pageTitle = computed(() => (route.meta?.title as string) || '');

const updateMenuState = (path: string) => {
  selectedKeys.value = [path.replace(/^\/|\/$/g, '')];
};

watch(() => route.path, updateMenuState);

onMounted(() => {
  updateMenuState(route.path);
});

/**
 * 订阅 imageEventBus，在全局弹出 toast。
 * 这里把「生图任务开始 / 完成 / 失败」做成全局可见提示，
 * 任何页面（包括没挂载 ImageGenerator 抽屉的页面）都能感知。
 */
const offFns: Array<() => void> = [];

onMounted(() => {
  offFns.push(
    imageEventBus.on<{ taskId: string }>(ImageEvents.TASK_START, (e) => {
      const task = imageStore.tasks.find((t) => t.id === e.taskId);
      message.info(`开始生图：${task?.name ?? e.taskId}`);
    }),
    imageEventBus.on<{ taskId: string; elapsedMs: number }>(
      ImageEvents.TASK_COMPLETE,
      (e) => {
        const task = imageStore.tasks.find((t) => t.id === e.taskId);
        const seconds = (e.elapsedMs / 1000).toFixed(1);
        message.success(
          `生图完成：${task?.name ?? e.taskId}（耗时 ${seconds}s）`,
          4,
        );
      },
    ),
    imageEventBus.on<{ taskId: string; error: string }>(
      ImageEvents.TASK_FAIL,
      (e) => {
        const task = imageStore.tasks.find((t) => t.id === e.taskId);
        message.error(
          `生图失败：${task?.name ?? e.taskId}（${e.error}）`,
          5,
        );
      },
    ),
    // 页面图片「换图」小标签点击 → 打开全局新建任务弹框
    imageEventBus.on<ChangeImagePayload>(
      ImageEvents.CHANGE_IMAGE,
      (payload) => {
        changeImagePayload.value = payload;
        createModalOpen.value = true;
      },
    ),
  );

  // 启动图片替换标记探针：扫描 views 主内容区所有渲染图片的 DOM
  stopImageMarkerFn = startImageMarker('.layout-content');
});

onBeforeUnmount(() => {
  offFns.forEach((off) => off());
  offFns.length = 0;
  stopImageMarkerFn?.();
  stopImageMarkerFn = null;
});

/**
 * 全局弹框点击「生图」后：
 * 任务已创建并直接发起生图（路径守卫在弹框内完成），
 * 这里仅关闭弹框并展开右侧生图管理抽屉，让用户实时看到任务进度。
 */
function handleTaskCreated() {
  createModalOpen.value = false;
  drawerOpen.value = true;
}

/* ---------- 刷新后：本地图片地址恢复 + DOM 替换重放 ---------- */

/**
 * 收集所有「换图任务」的替换记录：
 * 任务按 createdAt 倒序存储，这里反转为正序灌入，
 * 使同一目标的最新任务在 Map 中最后写入、最终生效。
 */
function collectReplaceItems() {
  return imageStore.tasks
    .filter((t) => t.changeTarget && t.localSaved?.localUrl)
    .map((t) => ({
      ...(t.changeTarget as ChangeImageTarget),
      url: t.localSaved!.localUrl as string,
    }))
    .reverse();
}

/** 用任务中已恢复的本地图片地址全量重放 DOM 替换 */
function syncLocalReplacements(): void {
  reapplyImageReplacements(collectReplaceItems());
}

/**
 * 首次用户手势兜底：刷新后目录权限若处于 prompt 状态，
 * 静默恢复拿不到本地文件，在第一次点击 / 按键时（合规手势链路）
 * 申请只读权限、重建本地 URL，然后重放替换。只执行一次。
 */
function handleFirstGesture(): void {
  window.removeEventListener('pointerdown', handleFirstGesture);
  window.removeEventListener('keydown', handleFirstGesture);
  void (async () => {
    await imageStore.hydrateLocalSavedUrls(true);
    syncLocalReplacements();
  })();
}

// 任务的本地 URL 恢复完成后（store 异步 hydrate / 手势兜底）自动重放
watch(
  () =>
    imageStore.tasks
      .map((t) => `${t.id}:${t.localSaved?.localUrl ?? ''}`)
      .join('|'),
  () => syncLocalReplacements(),
);

onMounted(() => {
  // 立即重放已恢复的部分；其余的等 store hydrate 完成后由 watcher 重放
  syncLocalReplacements();
  window.addEventListener('pointerdown', handleFirstGesture);
  window.addEventListener('keydown', handleFirstGesture);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', handleFirstGesture);
  window.removeEventListener('keydown', handleFirstGesture);
});

interface MenuItem {
  key: string;
  title: string;
  icon: any;
}

const menuItems: MenuItem[] = [
  { key: '', title: '首页', icon: HomeOutlined },
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

const handleThemeChange = (checked: boolean | string | number) => {
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
