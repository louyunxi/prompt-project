<template>
  <div class="home">
    <div class="home-blank">
      <div class="home-title">web端示例项目</div>
      <div class="home-sub">app-web 空白首页</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-blank {
  min-height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .home-title {
    font-size: 32px;
    font-weight: 700;
    color: var(--ink-color);
    letter-spacing: 2px;
  }

  .home-sub {
    font-size: 14px;
    color: var(--ink-color-3);
  }
}
</style>
