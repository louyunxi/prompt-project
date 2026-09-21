import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'app-web-theme';

export const useThemeStore = defineStore(
  'theme',
  () => {
    /** 当前主题模式 */
    const theme = ref<ThemeMode>('light');

    const isDark = computed(() => theme.value === 'dark');

    /** 将主题应用到根节点（CSS 变量切换） */
    const applyTheme = (mode: ThemeMode) => {
      document.documentElement.setAttribute('data-theme', mode);
    };

    const setTheme = (mode: ThemeMode) => {
      theme.value = mode;
    };

    const toggleTheme = () => {
      setTheme(isDark.value ? 'light' : 'dark');
    };

    // 主题变化时同步到根节点
    watch(theme, applyTheme, { immediate: true });

    return {
      theme,
      isDark,
      setTheme,
      toggleTheme,
    };
  },
  {
    persist: {
      key: THEME_STORAGE_KEY,
      pick: ['theme'],
    },
  },
);
