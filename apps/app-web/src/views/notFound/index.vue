<template>
  <div class="not-found-page">
    <a-result status="404" title="404" sub-title="抱歉，您访问的页面不存在">
      <template #extra>
        <a-button type="primary" @click="handleBack">返回首页</a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const handleBack = () => {
  router.push('/');
};
</script>

<style lang="scss" scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-color);
}
</style>
