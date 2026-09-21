import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore(
  'user',
  () => {
    /** 缓存的用户名（唯一登录凭证，密码不保存） */
    const userName = ref('');

    const isLoggedIn = computed(() => !!userName.value);

    /**
     * 登录校验
     * - 账号必须全英文
     * - 密码固定为 zaxh123456
     */
    const login = (username: string, password: string) => {
      if (!/^[a-zA-Z]+$/.test(username)) {
        throw new Error('账号必须为全英文');
      }
      if (password !== 'zaxh123456') {
        throw new Error('密码错误');
      }
      userName.value = username;
    };

    const logout = () => {
      userName.value = '';
    };

    return {
      userName,
      isLoggedIn,
      login,
      logout,
    };
  },
  {
    persist: {
      key: 'admin-user',
      pick: ['userName'],
    },
  },
);
