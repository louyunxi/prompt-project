<template>
  <div class="home">
    <!-- 欢迎区 -->
    <div class="hero">
      <div class="hero-text">
        <div class="hero-title">{{ greeting }}，{{ userName }}</div>
        <div class="hero-sub">{{ todayLabel }} · 左岸AI提示词库</div>
      </div>
      <div class="hero-glow"></div>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stat-cards">
      <a-col :span="6" v-for="card in statCards" :key="card.label">
        <div :class="['stat-card', `accent-${card.accent}`]">
          <div class="stat-icon">
            <component :is="card.icon" />
          </div>
          <div class="stat-body">
            <div class="stat-label">{{ card.label }}</div>
            <a-skeleton-input
              v-if="loading"
              :active="true"
              size="small"
              style="width: 80px; margin-top: 6px"
            />
            <div v-else class="stat-value">{{ card.value }}</div>
            <div class="stat-sub">{{ card.sub }}</div>
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- 两栏布局 -->
    <a-row :gutter="16">
      <!-- 最近更新提示词 -->
      <a-col :span="14">
        <a-card class="panel" :bordered="false">
          <template #title>
            <span class="panel-title">
              <span class="panel-bar"></span>最近更新提示词
            </span>
          </template>
          <template #extra>
            <a>全部 ›</a>
          </template>
          <a-skeleton v-if="loading" active :paragraph="{ rows: 5 }" />
          <div v-else class="mini-list">
            <div
              v-for="(item, i) in recentPrompts"
              :key="item.id"
              class="mini-item"
            >
              <div class="mini-index">{{ i + 1 }}</div>
              <div class="mini-text">
                <div class="mini-name">{{ item.title }}</div>
                <div class="mini-desc">
                  {{ item.category }} · 使用 {{ item.usage_count }} 次
                </div>
              </div>
              <div class="mini-time">{{ item.created_at }}</div>
            </div>
            <a-empty v-if="!recentPrompts.length" description="暂无数据" />
          </div>
        </a-card>
      </a-col>

      <!-- 快捷操作 -->
      <a-col :span="10">
        <a-card class="panel" :bordered="false">
          <template #title>
            <span class="panel-title">
              <span class="panel-bar"></span>快捷操作
            </span>
          </template>
          <div class="quick-grid">
            <div
              v-for="q in quickActions"
              :key="q.label"
              class="quick-item"
            >
              <div :class="['quick-icon', `accent-${q.accent}`]">
                <component :is="q.icon" />
              </div>
              <div class="quick-label">{{ q.label }}</div>
              <div class="quick-desc">{{ q.desc }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  FileTextOutlined,
  AppstoreOutlined,
  RocketOutlined,
  StarOutlined,
  PlusOutlined,
  TagsOutlined,
  HeartOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const loading = ref(true);

const userName = computed(() => userStore.userName || '管理员');

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) {return '凌晨好';}
  if (h < 9) {return '早上好';}
  if (h < 12) {return '上午好';}
  if (h < 14) {return '中午好';}
  if (h < 18) {return '下午好';}
  return '晚上好';
});

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const todayLabel = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${weekDays[d.getDay()]}`;
});

interface PromptItem {
  id: string;
  title: string;
  category: string;
  usage_count: number;
  created_at: string;
}

const statTotal = ref(0);
const categoryCount = ref(0);
const usageCount = ref(0);
const favoriteCount = ref(0);
const recentPrompts = ref<PromptItem[]>([]);

const statCards = computed(() => [
  {
    label: '提示词模板',
    value: statTotal.value,
    sub: '模板总数',
    accent: 'blue',
    icon: FileTextOutlined,
  },
  {
    label: '模板分类',
    value: categoryCount.value,
    sub: '覆盖多场景',
    accent: 'cyan',
    icon: AppstoreOutlined,
  },
  {
    label: '累计使用',
    value: usageCount.value,
    sub: '总调用次数',
    accent: 'purple',
    icon: RocketOutlined,
  },
  {
    label: '我的收藏',
    value: favoriteCount.value,
    sub: '已收藏模板',
    accent: 'amber',
    icon: StarOutlined,
  },
]);

const quickActions = [
  {
    label: '新建提示词',
    desc: '创建新的模板',
    accent: 'blue',
    icon: PlusOutlined,
  },
  {
    label: '分类管理',
    desc: '维护模板分类',
    accent: 'cyan',
    icon: TagsOutlined,
  },
  {
    label: '收藏夹',
    desc: '查看收藏模板',
    accent: 'amber',
    icon: HeartOutlined,
  },
  {
    label: '个人设置',
    desc: '账号与偏好',
    accent: 'purple',
    icon: SettingOutlined,
  },
];

const mockCategories = ['文案写作', '代码助手', '数据分析', '图像生成', '办公效率', '学习辅导'];

const mockTitles = [
  '小红书爆款标题生成器',
  'Python 代码解释与优化',
  'SQL 查询语句生成',
  'Midjourney 提示词优化',
  '邮件润色与改写',
  '周报自动生成',
  '产品需求文档撰写',
  '学术论文降重改写',
  '短视频脚本生成',
  '客服话术生成',
];

const fetchData = async () => {
  loading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 600));

    statTotal.value = 128;
    categoryCount.value = mockCategories.length;
    usageCount.value = 3426;
    favoriteCount.value = 18;

    recentPrompts.value = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - i * 3);
      return {
        id: `prompt_${i + 1}`,
        title: mockTitles[i % mockTitles.length],
        category: mockCategories[i % mockCategories.length],
        usage_count: Math.floor(Math.random() * 300) + 20,
        created_at: `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      };
    });
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style lang="scss" scoped>
$blue: #015ca7;
$cyan: #0891b2;
$purple: #7c3aed;
$amber: #e8a13c;

@mixin accent-map($c, $bg, $soft) {
  --accent: #{$c};
  --accent-bg: #{$bg};
  --accent-soft: #{$soft};
}

.accent-blue {
  @include accent-map($blue, #e6f1fa, rgba(1, 92, 167, 0.08));
}
.accent-cyan {
  @include accent-map($cyan, #e0f7fa, rgba(8, 145, 178, 0.08));
}
.accent-purple {
  @include accent-map($purple, #f3e8ff, rgba(124, 58, 237, 0.08));
}
.accent-amber {
  @include accent-map($amber, #fdf2e0, rgba(232, 161, 60, 0.1));
}

.home {
  animation: fade 0.25s;
}

@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* 欢迎区 */
.hero {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  padding: 22px 26px;
  margin-bottom: 16px;
  background: linear-gradient(120deg, #0565b4 0%, #29a9e0 120%);
  color: #fff;

  .hero-text {
    position: relative;
    z-index: 1;
  }

  .hero-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .hero-sub {
    margin-top: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.72);
  }

  .hero-glow {
    position: absolute;
    right: -60px;
    top: -60px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.18),
      transparent 70%
    );
  }
}

/* 统计卡片 */
.stat-cards {
  margin-bottom: 16px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
  min-height: 112px;
  padding: 20px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #eef2f6;
  overflow: hidden;
  transition:
    transform 0.18s,
    box-shadow 0.18s;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--accent);
  }

  &::after {
    content: '';
    position: absolute;
    right: -28px;
    top: -28px;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: var(--accent-soft);
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(22, 34, 46, 0.08);
  }

  .stat-icon {
    flex-shrink: 0;
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-bg);
    color: var(--accent);
    font-size: 22px;
    position: relative;
    z-index: 1;
  }

  .stat-body {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
  }

  .stat-label {
    color: #5c6b7a;
    font-size: 13px;
  }

  .stat-value {
    font-size: 30px;
    font-weight: 700;
    line-height: 1.2;
    margin-top: 4px;
    color: #1f2d3d;
  }

  .stat-sub {
    font-size: 12px;
    color: #9aa7b4;
    margin-top: 6px;
  }
}

/* 面板 */
.panel {
  border-radius: 14px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(22, 34, 46, 0.04);

  :deep(.ant-card-head) {
    border-bottom: 1px solid #f0f3f6;
    min-height: 48px;
  }

  .panel-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #1f2d3d;
  }

  .panel-bar {
    width: 4px;
    height: 14px;
    border-radius: 2px;
    background: $blue;
  }
}

/* 最近更新列表 */
.mini-list {
  padding: 4px 0;
}

.mini-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 12px;
  margin: 0 -12px;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.15s;

  &:hover {
    background: #f6f9fc;
    transform: translateX(2px);
  }

  .mini-index {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: #eef2f6;
    color: #5c6b7a;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:first-child .mini-index {
    background: $blue;
    color: #fff;
  }

  .mini-text {
    flex: 1;
    min-width: 0;
  }

  .mini-name {
    font-size: 13.5px;
    font-weight: 500;
    color: #1f2d3d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mini-desc {
    color: #9aa7b4;
    font-size: 12px;
    margin-top: 2px;
  }

  .mini-time {
    color: #9aa7b4;
    font-size: 12px;
    font-family: 'JetBrains Mono', Consolas, monospace;
    flex-shrink: 0;
  }
}

/* 快捷操作网格 */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 8px;
  border-radius: 12px;
  border: 1px solid #eef2f6;
  cursor: pointer;
  transition:
    transform 0.18s,
    box-shadow 0.18s,
    border-color 0.18s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(22, 34, 46, 0.07);
    border-color: transparent;
  }

  .quick-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-bg);
    color: var(--accent);
    font-size: 20px;
    margin-bottom: 10px;
  }

  .quick-label {
    font-size: 13px;
    font-weight: 600;
    color: #1f2d3d;
  }

  .quick-desc {
    font-size: 11px;
    color: #9aa7b4;
    margin-top: 2px;
  }
}

@media (max-width: 1100px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
}

</style>