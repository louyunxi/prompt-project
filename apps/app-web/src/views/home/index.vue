<template>
  <div class="home">
    <div class="home-header">
      <div class="home-eyeb">开发者工具集</div>
      <h1 class="home-title">web 端示例项目</h1>
      <p class="home-sub">精选在线小工具，按需取用，提升日常开发效率</p>
    </div>

    <div class="home-grid">
      <div
        v-for="tool in TOOLS"
        :key="tool.key"
        class="tool-card"
        role="button"
        tabindex="0"
        :aria-label="
          `${tool.title}，${
            tool.openType === 'blank' ? '点击在新标签页打开' : '点击打开在线工具'
          }`
        "
        @click="openTool(tool)"
        @keydown.enter.prevent="openTool(tool)"
        @keydown.space.prevent="openTool(tool)"
      >
        <div class="tool-card__icon" :style="iconStyle(tool)">
          <component :is="tool.icon" />
        </div>
        <div class="tool-card__body">
          <div class="tool-card__title">{{ tool.title }}</div>
          <div class="tool-card__desc">{{ tool.desc }}</div>
        </div>
      </div>
    </div>

    <a-modal
      v-model:open="modalOpen"
      :title="activeTool?.title ?? '在线工具'"
      :footer="null"
      :width="activeTool?.modalWidth ?? '88vw'"
      :style="{ top: '32px', maxWidth: '1280px' }"
      :body-style="{ padding: 0, height: '76vh', overflow: 'hidden' }"
      class="tool-modal"
      destroy-on-close
    >
      <iframe
        v-if="activeTool"
        :key="activeTool.key"
        :src="activeTool.url"
        :title="activeTool.title"
        class="tool-modal__frame"
        loading="lazy"
        referrerpolicy="no-referrer"
        allow="clipboard-read; clipboard-write"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  BorderOutlined,
  BgColorsOutlined,
  HighlightOutlined,
  ScissorOutlined,
  FileImageOutlined,
  ControlOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  SlidersOutlined,
  LineChartOutlined,
  FormOutlined,
  RadiusSettingOutlined,
  CheckSquareOutlined,
  SwapOutlined,
  CreditCardOutlined,
  EditOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue';
import type { Component } from 'vue';

interface ToolItem {
  key: string;
  title: string;
  desc: string;
  tag: string;
  host: string;
  url: string;
  icon: Component;
  /** 卡片图标背景渐变（双 CSS 颜色） */
  iconFrom: string;
  iconTo: string;
  /** 卡片底部 tag 颜色 */
  tagColor: string;
  /** 弹框宽度（CSS 长度） */
  modalWidth: string;
  /** 打开方式：modal=弹框内嵌 iframe（默认），blank=新标签页打开 */
  openType?: 'modal' | 'blank';
  /** 弹框打开后需要额外提示用户的文案（如 uiverse.io 需手动复制代码） */
  notice?: string;
}

/** uiverse.io 不提供在线取码，打开后统一提示手动复制 */
const UIVERSE_NOTICE =
  'uiverse.io 的组件需要手动搬运：在页面中复制 HTML / CSS 代码，再粘贴给模型生成同款组件';

const TOOLS: ToolItem[] = [
  {
    key: 'uiverse-forms',
    title: '表单',
    desc: 'uiverse.io 精选表单样式合集，覆盖登录、注册、订阅等常见形态',
    tag: 'UI',
    host: 'uiverse.io',
    url: 'https://uiverse.io/forms',
    icon: FormOutlined,
    iconFrom: '#0f766e',
    iconTo: '#14b8a6',
    tagColor: '#0f766e',
    modalWidth: '88vw',
    notice: UIVERSE_NOTICE,
  },
  {
    key: 'uiverse-buttons',
    title: '预设按钮',
    desc: '悬停、点击、发光等按钮动效合集，风格覆盖拟态与霓虹',
    tag: 'UI',
    host: 'uiverse.io',
    url: 'https://uiverse.io/buttons',
    icon: RadiusSettingOutlined,
    iconFrom: '#1e40af',
    iconTo: '#3b82f6',
    tagColor: '#1e40af',
    modalWidth: '88vw',
    notice: UIVERSE_NOTICE,
  },
  {
    key: 'uiverse-checkboxes',
    title: '复选框',
    desc: '带动画与拟态质感的 checkbox 样式合集，选中态各具特色',
    tag: 'UI',
    host: 'uiverse.io',
    url: 'https://uiverse.io/checkboxes',
    icon: CheckSquareOutlined,
    iconFrom: '#7c3aed',
    iconTo: '#a855f7',
    tagColor: '#7c3aed',
    modalWidth: '88vw',
    notice: UIVERSE_NOTICE,
  },
  {
    key: 'uiverse-switches',
    title: '开关',
    desc: '滑杆、拟态、图标切换等开关样式合集，切换动效完整',
    tag: 'UI',
    host: 'uiverse.io',
    url: 'https://uiverse.io/switches',
    icon: SwapOutlined,
    iconFrom: '#be123c',
    iconTo: '#fb7185',
    tagColor: '#be123c',
    modalWidth: '88vw',
    notice: UIVERSE_NOTICE,
  },
  {
    key: 'uiverse-cards',
    title: '卡片样式',
    desc: '悬浮抬升、渐变描边、光晕等卡片样式合集，含 hover 交互',
    tag: 'UI',
    host: 'uiverse.io',
    url: 'https://uiverse.io/cards',
    icon: CreditCardOutlined,
    iconFrom: '#b45309',
    iconTo: '#f59e0b',
    tagColor: '#b45309',
    modalWidth: '88vw',
    notice: UIVERSE_NOTICE,
  },
  {
    key: 'uiverse-inputs',
    title: '输入框',
    desc: '带图标、浮动标签与聚焦动效的输入框样式合集',
    tag: 'UI',
    host: 'uiverse.io',
    url: 'https://uiverse.io/inputs',
    icon: EditOutlined,
    iconFrom: '#0369a1',
    iconTo: '#38bdf8',
    tagColor: '#0369a1',
    modalWidth: '88vw',
    notice: UIVERSE_NOTICE,
  },
  {
    key: 'uiverse-radio-buttons',
    title: '单选按钮',
    desc: '单选按钮美化合集，圆点、卡片、图标等多样选中形态',
    tag: 'UI',
    host: 'uiverse.io',
    url: 'https://uiverse.io/radio-buttons',
    icon: CheckCircleOutlined,
    iconFrom: '#4338ca',
    iconTo: '#818cf8',
    tagColor: '#4338ca',
    modalWidth: '88vw',
    notice: UIVERSE_NOTICE,
  },
  {
    key: 'uiverse-tooltips',
    title: '气泡提示',
    desc: '悬浮提示框样式与入场动效合集，含箭头与渐变描边',
    tag: 'UI',
    host: 'uiverse.io',
    url: 'https://uiverse.io/tooltips',
    icon: QuestionCircleOutlined,
    iconFrom: '#4d7c0f',
    iconTo: '#a3e635',
    tagColor: '#4d7c0f',
    modalWidth: '88vw',
    notice: UIVERSE_NOTICE,
  },
  {
    key: 'neumorphism-shadow',
    title: '盒子阴影',
    desc: '实时调节 Neumorphism 阴影参数，一键导出 CSS box-shadow',
    tag: 'CSS',
    host: 'neumorphism.io',
    url: 'https://neumorphism.io/#ffffff',
    icon: BorderOutlined,
    iconFrom: '#015ca7',
    iconTo: '#2ea5ff',
    tagColor: '#015ca7',
    modalWidth: '88vw',
  },
  {
    key: 'css-gradient',
    title: '渐变背景',
    desc: '可视化调节线性 / 径向 / 圆锥渐变，一键导出 CSS background',
    tag: 'CSS',
    host: 'cssgradient.io',
    url: 'https://cssgradient.io/',
    icon: BgColorsOutlined,
    iconFrom: '#8e2de2',
    iconTo: '#f953c6',
    tagColor: '#8e2de2',
    modalWidth: '88vw',
  },
  {
    key: 'text-shadow',
    title: '文字阴影',
    desc: '可视化调节 text-shadow 参数，一键导出 CSS 文字阴影',
    tag: 'CSS',
    host: 'techbrood.com',
    url: 'https://www.techbrood.com/tool?p=cg-text-shadow',
    icon: HighlightOutlined,
    iconFrom: '#11998e',
    iconTo: '#38ef7d',
    tagColor: '#11998e',
    modalWidth: '88vw',
  },
  {
    key: 'clip-path',
    title: '剪贴路径',
    desc: '可视化绘制 clip-path 多边形，一键导出 CSS 裁剪路径',
    tag: 'CSS',
    host: 'techbrood.com',
    url: 'https://www.techbrood.com/tool?p=css-clip-path',
    icon: ScissorOutlined,
    iconFrom: '#f7971e',
    iconTo: '#ffd200',
    tagColor: '#f7971e',
    modalWidth: '88vw',
  },
  {
    key: 'image-base64',
    title: '图片转 base64',
    desc: '本地图片一键转 base64 编码，生成可内联的 data URI',
    tag: '工具',
    host: 'techbrood.com',
    url: 'https://www.techbrood.com/tool?p=base64-image',
    icon: FileImageOutlined,
    iconFrom: '#e53935',
    iconTo: '#e35d5b',
    tagColor: '#e53935',
    modalWidth: '88vw',
    openType: 'blank',
  },
  {
    key: 'custom-button',
    title: '自定义按钮',
    desc: '可视化调节圆角、边框、阴影与渐变，一键导出按钮 CSS',
    tag: 'CSS',
    host: 'toolv.com',
    url: 'https://toolv.com/zh-CN/app/css-anniu-shengchengqi',
    icon: ControlOutlined,
    iconFrom: '#2193b0',
    iconTo: '#6dd5ed',
    tagColor: '#2193b0',
    modalWidth: '88vw',
    openType: 'blank',
  },
  {
    key: 'css-loading',
    title: 'Loading',
    desc: '在线选择并调节 CSS 加载动画，一键复制样式代码',
    tag: 'CSS',
    host: 'toolv.com',
    url: 'https://toolv.com/zh-CN/app/css-loading-spinner',
    icon: LoadingOutlined,
    iconFrom: '#ee0979',
    iconTo: '#ff6a00',
    tagColor: '#ee0979',
    modalWidth: '88vw',
    openType: 'blank',
  },
  {
    key: 'preset-animation',
    title: '预设动画',
    desc: '内置多种预设 CSS 动画，实时预览并一键导出代码',
    tag: 'CSS',
    host: 'toolv.com',
    url: 'https://toolv.com/zh-CN/app/css-donghua-shengchengqi',
    icon: PlayCircleOutlined,
    iconFrom: '#7f00ff',
    iconTo: '#e100ff',
    tagColor: '#7f00ff',
    modalWidth: '88vw',
    openType: 'blank',
  },
  {
    key: 'animation-generator',
    title: '动画生成器',
    desc: '可视化配置 keyframes 关键帧动画，实时预览并导出 CSS',
    tag: 'CSS',
    host: 'toolszone.net',
    url: 'https://www.toolszone.net/zh/tools/css-animation-generator',
    icon: ThunderboltOutlined,
    iconFrom: '#fc466b',
    iconTo: '#3f5efb',
    tagColor: '#fc466b',
    modalWidth: '88vw',
  },
  {
    key: 'cubic-bezier-editor',
    title: '自定义动画节奏',
    desc: '拖拽调节 cubic-bezier 缓动曲线，一键导出动画缓动函数',
    tag: 'CSS',
    host: '0xelitesystem.github.io',
    url: 'https://0xelitesystem.github.io/cubic-bezier-editor/',
    icon: SlidersOutlined,
    iconFrom: '#f2994a',
    iconTo: '#f2c94c',
    tagColor: '#f2994a',
    modalWidth: '88vw',
  },
  {
    key: 'easing-curve',
    title: '缓动曲线',
    desc: 'cubic-bezier 缓动曲线在线调试，对比多种缓动效果',
    tag: 'CSS',
    host: 'xuanfengge.com',
    url: 'https://xuanfengge.com/easeing/ceaser/',
    icon: LineChartOutlined,
    iconFrom: '#654ea3',
    iconTo: '#eaafc8',
    tagColor: '#654ea3',
    modalWidth: '88vw',
  },
];

const activeTool = ref<ToolItem | null>(null);
const modalOpen = ref(false);

function openTool(tool: ToolItem) {
  if (tool.openType === 'blank') {
    window.open(tool.url, '_blank', 'noopener,noreferrer');
    return;
  }

  activeTool.value = tool;
  modalOpen.value = true;

  if (tool.notice) {
    message.info(tool.notice, 6);
  }
}

function iconStyle(tool: ToolItem) {
  return {
    background: `linear-gradient(135deg, ${tool.iconFrom} 0%, ${tool.iconTo} 100%)`,
  };
}

function tagStyle(tool: ToolItem) {
  return {
    color: tool.tagColor,
    background: `color-mix(in srgb, ${tool.tagColor} 12%, transparent)`,
  };
}
</script>

<style lang="scss" scoped>
.home {
  padding: 8px 4px 24px;
}

.home-header {
  margin-bottom: 32px;
}

.home-eyeb {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 12px;
}

.home-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--ink-color);
  letter-spacing: 1px;
}

.home-sub {
  margin: 0;
  font-size: 14px;
  color: var(--ink-color-3);
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 22px 18px;
  border-radius: 14px;
  background: var(--card-bg);
  border: 1px solid var(--line-color);
  cursor: pointer;
  outline: none;
  transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 200ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 200ms ease;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);

  &:hover,
  &:focus-visible {
    transform: translateY(-4px);
    border-color: var(--primary-color);
    box-shadow: 0 12px 28px rgba(1, 92, 167, 0.14),
      0 2px 6px rgba(15, 23, 42, 0.06);
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 3px;
  }

  &:active {
    transform: translateY(-2px);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 6px 16px rgba(1, 92, 167, 0.28);

    :deep(.anticon) {
      font-size: 22px;
    }
  }

  &__body {
    flex: 1;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--ink-color);
    margin-bottom: 6px;
  }

  &__desc {
    font-size: 13px;
    line-height: 1.6;
    color: var(--ink-color-2);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px dashed var(--line-color);
  }

  &__tag {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }

  &__external {
    font-size: 12px;
    color: var(--ink-color-3);
    font-family: 'JetBrains Mono', Consolas, monospace;
  }
}

/* 弹框内 iframe 全屏铺满，关闭 a-modal 自带 padding */
.tool-modal {
  :deep(.ant-modal-body) {
    padding: 0;
    background: #ffffff;
  }

  &__frame {
    width: 100%;
    height: 76vh;
    border: 0;
    display: block;
    background: #ffffff;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tool-card {
    transition: none;

    &:hover,
    &:focus-visible {
      transform: none;
    }
  }
}
</style>
