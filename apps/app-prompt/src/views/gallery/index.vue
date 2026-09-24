<template>
  <div class="gallery">
    <!-- OSS 上传 -->
    <a-card class="panel" :bordered="false">
      <template #title>
        <span class="panel-title">
          <span class="panel-bar"></span>OSS上传
        </span>
      </template>
      <template #extra>
        <a-tag color="cyan"
          >默认上传至 <code>{{ uploadPrefix }}</code></a-tag
        >
      </template>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        hidden
        @change="onFileChange"
      />

      <div class="oss-toolbar">
        <a-button type="primary" :loading="uploading" @click="triggerSelect">
          <template #icon><CloudUploadOutlined /></template>
          上传
        </a-button>
        <span class="oss-hint">支持多选,上传后自动同步到「我的图库」</span>
      </div>

      <div v-if="uploadList.length" class="upload-list">
        <div
          v-for="item in uploadList"
          :key="item.key || item.preview"
          class="upload-item"
        >
          <div class="upload-thumb-wrap">
            <a-image
              :src="item.status === 'success' ? item.url : item.preview"
              :preview="item.status === 'success'"
              class="upload-thumb"
            />
          </div>
          <div class="upload-info">
            <div class="upload-head">
              <div class="upload-name" :title="item.name">{{ item.name }}</div>
              <div v-if="item.status === 'uploading'" class="upload-status">
                <a-spin size="small" />
                <span>上传中…</span>
              </div>
              <a-tag
                v-else-if="item.status === 'success'"
                color="success"
                >上传成功</a-tag
              >
              <a-tag v-else color="error">失败:{{ item.error }}</a-tag>
            </div>
            <div v-if="item.status === 'success'" class="upload-success">
              <a-tag class="upload-key">{{ dirOf(item.key) }}</a-tag>
            </div>

            <div
              v-if="item.status === 'success' && item.url"
              class="upload-actions"
            >
              <a-input
                :value="item.url"
                readonly
                size="small"
                class="upload-url"
              />
              <a-button
                size="small"
                class="upload-copy"
                @click="copyUrl(item.url)"
              >
                <template #icon><CopyOutlined /></template>复制
              </a-button>
            </div>
          </div>
        </div>
      </div>
      <a-empty
        v-else
        description="尚未选择文件,点击上方按钮选择图片"
        :image-style="{ height: '80px' }"
      />
    </a-card>

    <!-- 我的图库 -->
    <a-card class="panel" :bordered="false">
      <template #title>
        <span class="panel-title">
          <span class="panel-bar"></span>我的图库
        </span>
      </template>
      <template #extra>
        <a-tag color="blue">{{ ossStore.galleryList.length }} 项</a-tag>
        <a-button size="small" :loading="galleryLoading" @click="loadGallery">
          <template #icon><ReloadOutlined /></template>刷新
        </a-button>
      </template>

      <a-skeleton
        v-if="galleryLoading && !ossStore.galleryList.length"
        active
        :paragraph="{ rows: 4 }"
      />
      <div v-else-if="ossStore.galleryList.length" class="gallery-grid">
        <div
          v-for="item in ossStore.galleryList"
          :key="item.key"
          class="gallery-card"
        >
          <div class="gallery-thumb-wrap">
            <a-image
              v-if="isImage(item)"
              :src="thumbUrl(item.url)"
              :preview="{ src: item.url }"
              class="gallery-thumb"
            />
            <a
              v-else
              :href="item.url"
              target="_blank"
              class="gallery-file"
              :title="item.name"
            >
              <FileOutlined class="gallery-file-icon" />
              <span class="gallery-file-ext">{{ fileExt(item.name) }}</span>
            </a>
            <!-- <div class="gallery-thumb-mask">
              <EyeOutlined v-if="isImage(item)" />
              <ExportOutlined v-else />
              <span>{{ isImage(item) ? '预览' : '打开' }}</span>
            </div> -->
          </div>
          <div class="gallery-body">
            <div class="gallery-name" :title="item.name">{{ item.name }}</div>
            <div class="gallery-meta">
              {{ formatSize(item.size) }} · {{ formatTime(item.uploadTime) }}
            </div>
          </div>
        </div>
      </div>
      <a-empty
        v-else
        description="暂无图片,快去上传吧"
        :image-style="{ height: '80px' }"
      />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  CloudUploadOutlined,
  CopyOutlined,
  ReloadOutlined,
  FileOutlined,
} from '@ant-design/icons-vue';
import { useUserStore } from '@/store/modules/user';
import { useOssStore } from '@/store/modules/oss';
import {
  uploadFile,
  uploadGalleryIndex,
  fetchGalleryIndex,
  type OssGalleryItem,
} from '@/sdk/oss';

const userStore = useUserStore();
const ossStore = useOssStore();

/** 上传默认子目录(含用户名) */
const uploadPrefix = computed(() =>
  userStore.userName
    ? `common/ai-source/${userStore.userName}`
    : 'common/ai-source',
);

interface UploadItem {
  name: string;
  key: string;
  preview: string;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  etag?: string;
  error?: string;
}

const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadList = ref<UploadItem[]>([]);
/** 当前是否有上传请求进行中(控制按钮 loading,不依赖列表状态) */
const uploading = ref(false);
const galleryLoading = ref(false);

const triggerSelect = () => {
  fileInputRef.value?.click();
};

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files || !input.files.length) {
    return;
  }
  const files = Array.from(input.files);
  input.value = '';

  const username = userStore.userName;
  let okCount = 0;
  let failCount = 0;

  uploading.value = true;
  try {
    for (const file of files) {
      const item: UploadItem = {
        name: file.name,
        key: '',
        preview: URL.createObjectURL(file),
        status: 'uploading',
      };
      uploadList.value.unshift(item);
      try {
        const result = await uploadFile(file, {
          username: username || undefined,
        });
        item.status = 'success';
        item.key = result.key;
        item.url = result.url;
        item.etag = result.etag;
        okCount += 1;

        if (username) {
          ossStore.addItems([
            {
              key: result.key,
              url: result.url,
              name: file.name,
              size: file.size,
              uploadTime: Date.now(),
              type: file.type || undefined,
            },
          ]);
        }
      } catch (err) {
        item.status = 'error';
        item.error = (err as Error).message || '上传失败';
        failCount += 1;
      }
    }

    if (okCount) {
      message.success(`成功上传 ${okCount} 个文件`);
      if (username) {
        try {
          await uploadGalleryIndex(username, ossStore.galleryList);
        } catch (err) {
          message.warning('图库索引同步失败:' + ((err as Error).message || ''));
        }
      }
    }
    if (failCount) {
      message.error(`${failCount} 个文件上传失败`);
    }
  } finally {
    uploading.value = false;
  }
};

const loadGallery = async () => {
  const username = userStore.userName;
  if (!username) {
    return;
  }
  galleryLoading.value = true;
  try {
    const items = await fetchGalleryIndex(username);
    ossStore.setGallery(items);
  } catch (err) {
    message.warning('图库数据加载失败:' + ((err as Error).message || ''));
  } finally {
    galleryLoading.value = false;
  }
};

const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    message.success('URL 已复制');
  } catch {
    message.warning('复制失败,请手动复制');
  }
};

const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif|ico)$/i;
const isImage = (item: OssGalleryItem): boolean =>
  item.type ? item.type.startsWith('image/') : IMG_EXT.test(item.name);

const fileExt = (name: string): string => {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toUpperCase() : 'FILE';
};

/** 取 key 的目录路径(去掉文件名),如 `a/b/c.png` → `a/b/` */
const dirOf = (key: string): string => {
  const i = key.lastIndexOf('/');
  return i >= 0 ? key.slice(0, i + 1) : '';
};

/**
 * 生成 OSS 缩略图 URL(图库列表用,避免加载原图)。
 * 等比缩放(保持宽高比、完整展示),2x 高清屏取 480 宽。
 */
const thumbUrl = (src: string): string => {
  if (!src || src.indexOf('.aliyuncs.com/') === -1) {
    return src;
  }
  const process = 'image/resize,w_480,m_lfit/auto-orient,1/quality,q_90';
  return `${src}?x-oss-process=${process}`;
};

const formatSize = (n: number) => {
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  const p = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
};

onMounted(loadGallery);
</script>

<style lang="scss" scoped>
$blue: #015ca7;

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

  code {
    background: #f6f9fc;
    padding: 2px 6px;
    border-radius: 4px;
    color: #015ca7;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 12px;
  }
}

/* OSS 上传区 */
.oss-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.oss-hint {
  font-size: 12px;
  color: #5c6b7a;
}

.upload-list {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.upload-item {
  width: calc(33.33vw - 132px);
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #eef2f6;
  background: #fbfdff;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: #cdd9e4;
    box-shadow: 0 4px 16px rgba(22, 34, 46, 0.06);
  }
}

.upload-thumb-wrap {
  position: relative;
  flex-shrink: 0;
  width: 96px;
  height: 96px;
  border-radius: 10px;
  overflow: hidden;
  background: #eef2f6;
  border: 1px solid #eef2f6;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-thumb {
  width: 100%;
  height: 100%;
  display: block;

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  :deep(.ant-image-mask) {
    display: none;
  }
}

.upload-thumb-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(15, 34, 55, 0.45);
  color: #fff;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.upload-thumb-wrap:hover .upload-thumb-mask {
  opacity: 1;
}

.upload-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upload-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.upload-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2d3d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  max-width: 100%;
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #5c6b7a;
}

.upload-success {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.upload-key {
  font-family: 'JetBrains Mono', Consolas, monospace !important;
  font-size: 12px;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.upload-url {
  flex: 1;
  min-width: 0;
  max-width: 460px;

  :deep(input) {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 12px;
    color: #015ca7;
  }
}

.upload-copy {
  flex-shrink: 0;
  white-space: nowrap;
}

/* 我的图库 */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.gallery-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #eef2f6;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(22, 34, 46, 0.1);
    border-color: #cdd9e4;
  }
}

.gallery-thumb-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #f5f7fa;
  overflow: hidden;
}
.gallery-thumb-wrap :deep(.ant-image) {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.gallery-thumb-wrap :deep(.ant-image .ant-image-img) {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

.gallery-thumb {
  width: 100%;
  height: 100%;
  display: block;

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  :deep(.ant-image-mask) {
    display: none;
  }
}

.gallery-file {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #5c6b7a;
  text-decoration: none;

  .gallery-file-icon {
    font-size: 40px;
    color: #9aa7b4;
  }

  .gallery-file-ext {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
    color: #5c6b7a;
  }
}

.gallery-thumb-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(15, 34, 55, 0.45);
  color: #fff;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.gallery-card:hover .gallery-thumb-mask {
  opacity: 1;
}

.gallery-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gallery-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2d3d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-meta {
  font-size: 12px;
  color: #9aa7b4;
}
</style>
