<template>
  <div class="page-placeholder">
    <h2>{{ (route.meta?.title as string) || '特效' }}</h2>
    <p>页面建设中，敬请期待。</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
</script>

<style scoped lang="scss">
.page-placeholder {
  padding: 24px;

  h2 {
    font-size: 20px;
    margin-bottom: 16px;
  }

  p {
    color: #888;
  }
}
</style>
