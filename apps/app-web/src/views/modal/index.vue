<template>
  <div class="category-page">
    <div class="category-title">弹框布局</div>
    <div class="category-sub">modal</div>
  </div>
</template>

<style lang="scss" scoped>
.category-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
  gap: 8px;
  background: var(--bg-color);

  .category-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--ink-color);
    letter-spacing: 2px;
  }

  .category-sub {
    font-size: 14px;
    color: var(--ink-color-3);
  }
}
</style>
