<template>
  <div class="login-page" :style="{ backgroundImage: `url(${bgImg})` }">
    <QingEffect class="login-weather" />
    <div class="login-form">
      <div class="login-header">
        <img :src="logoImg" class="login-logo" alt="logo" />
        <h1>左岸AI提示词库</h1>
        <p>提示词模板管理与分享</p>
      </div>

      <a-alert
        v-if="errorMsg"
        :message="errorMsg"
        type="error"
        show-icon
        class="login-error"
      />

      <a-form
        :model="formState"
        :rules="rules"
        layout="vertical"
        @finish="handleLogin"
      >
        <a-form-item label="用户名" name="username">
          <a-input
            v-model:value="formState.username"
            size="large"
            placeholder="请输入用户名（仅限英文字母）"
            autocomplete="username"
          />
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="formState.password"
            size="large"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            :loading="loading"
            block
          >
            登 录
          </a-button>
        </a-form-item>
      </a-form>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useUserStore } from '@/store/modules/user';
import type { Rule } from 'ant-design-vue/es/form';
import QingEffect from '@/components/weatherEffect/qing.vue';
import logoImg from '@/assets/images/logo.png';
import bgImg from '@/assets/images/bg.jpg';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const errorMsg = ref('');

const formState = reactive({
  username: '',
  password: '',
});

const validateUsername = (_rule: any, value: string): Promise<void> => {
  if (!value) {
    return Promise.reject(new Error('请输入用户名'));
  }
  if (!/^[a-zA-Z]+$/.test(value)) {
    return Promise.reject(new Error('用户名只能包含英文字母'));
  }
  return Promise.resolve();
};

const validatePassword = (_rule: any, value: string): Promise<void> => {
  if (!value) {
    return Promise.reject(new Error('请输入密码'));
  }
  return Promise.resolve();
};

const rules: Record<string, Rule[]> = {
  username: [{ required: true, validator: validateUsername, trigger: 'blur' }],
  password: [{ required: true, validator: validatePassword, trigger: 'blur' }],
};

const handleLogin = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (formState.password !== 'zaxh123456') {
      message.error('密码错误，非内部人员禁止使用');
      return;
    }

    userStore.login(formState.username, formState.password);
    router.push('/');
  } catch (e) {
    errorMsg.value = (e as Error).message || '登录失败';
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #c9e5fb;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background-image: radial-gradient(
        circle at 20% 30%,
        rgba(255, 255, 255, 0.06) 0,
        transparent 40%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(255, 255, 255, 0.05) 0,
        transparent 40%
      );
  }
}

.login-weather {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.login-form {
  position: relative;
  z-index: 2;
  width: 400px;
  max-width: 90vw;
  background: #fff;
  border-radius: 16px;
  padding: 35px 40px 25px;
  box-shadow: 0 24px 40px rgba(120, 120, 120, 0.35);
  animation: login-form-in 1s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes login-form-in {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  .login-logo {
    width: 100px;
    height: 100px;
    margin-bottom: 8px;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  p {
    color: #5c6b7a;
    font-size: 13px;
  }
}

.login-error {
  margin-bottom: 16px;
}
</style>
