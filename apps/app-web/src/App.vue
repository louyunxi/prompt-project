<template>
  <a-config-provider :locale="zhCN" :theme="antdThemeConfig">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { theme as antdTheme } from 'ant-design-vue';
import { useThemeStore } from '@/store/modules/theme';

const themeStore = useThemeStore();

/** 将本地主题同步到 Ant Design Vue（暗色算法 + 主色） */
const antdThemeConfig = computed(() => ({
  algorithm: themeStore.isDark
    ? antdTheme.darkAlgorithm
    : antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#015ca7',
  },
}));
</script>
