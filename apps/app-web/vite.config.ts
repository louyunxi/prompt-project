import { defineConfig } from 'vite';
import type { ConfigEnv, PluginOption } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import appConfig from '@anhui/app-config';
import mkcert from 'vite-plugin-mkcert';
import qiankun from '@hansonfang/vite-plugin-qiankun-lite';

const APP_NAMES: Record<string, string> = {
  appWeb: 'web端示例项目 Web',
};

const APP_BASE = '/app-web/';
const QIANKUN_APP_NAME = 'app-web';

export default defineConfig(({ mode, command }: ConfigEnv) => {
  const env = { VITE_APP_SERVER: mode === 'production' ? 'prod' : 'test' };
  const isBuild = command === 'build';
  const base = isBuild ? './' : '/';

  const APP_NAME = APP_NAMES.appWeb || 'Web';

  return {
    base,
    define: {
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    },
    plugins: [
      mkcert({
        hosts: ['localhost', '127.0.0.1'],
      }),
      vue(),
      // vite-plugin-qiankun-lite：
      //   - dev 模式（apply: serve）：中间件把 <script type="module" src=...> 改写为
      //     普通 <script>import(...)</script>（让 import-html-entry 的 eval 能解析），
      //     并在 head 注入 __QIANKUN_WINDOW__ 标记、末尾追加 lifecycle 注册逻辑。
      //   - build 模式：保留 main.ts 具名 export，配合主应用 qiankun 加载。
      // sandbox=false 时只替换 window.__POWERED_BY_QIANKUN__ / window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
      // 两个变量，不重写 document/window/globalThis/self（用户已接受 sandbox 失效换取 HMR）。
      qiankun({ name: QIANKUN_APP_NAME, sandbox: false }),
      AutoImport({
        include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/],
        imports: ['vue', 'vue-router'],
        dts: './typings/auto-imports.d.ts',
      }),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false,
          }),
        ],
        dts: './typings/components.d.ts',
      }),
      {
        name: 'print-app-name',
        configureServer(server) {
          server.printUrls = () => {
            const { port, https } = server.config.server;
            const protocol = https ? 'https' : 'http';
            const localUrl = `${protocol}://localhost:${port}/`;
            const networkUrls = Object.values(server.resolvedUrls?.network ?? {});

            console.log(`\n  ${APP_NAME}\n`);
            console.log(`  \x1b[36m➜\x1b[0m  Local:   \x1b[32m${localUrl}\x1b[0m`);
            networkUrls.forEach((url) => {
              console.log(`  \x1b[36m➜\x1b[0m  Network: \x1b[32m${url}\x1b[0m`);
            });
          };
        },
      } as PluginOption,
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: isBuild
      ? {
          outDir: appConfig.appWeb.outDir,
          lib: {
            entry: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
            // IIFE 自包含：不依赖宿主 window.Vue/VueRouter/Pinia 等全局，
            // 整个 Vue + 路由 + antd-vue 等全部内联到一个文件，避免与主应用 ESM 版本冲突。
            // 注意：IIFE 的 `name` 必须是合法 JS 标识符（不能含 `-`），rollup 会生成 `var <name> = (function(){...})()`。
            name: 'appWeb',
            fileName: () => `${QIANKUN_APP_NAME}.iife.js`,
            formats: ['iife'],
          },
          rollupOptions: {
            // 不外置任何依赖：保持子应用自包含
          },
          cssCodeSplit: false,
        }
      : undefined,
    server: {
      host: '0.0.0.0',
      port: appConfig.appWeb.port,
      // 允许主应用 fetch 跨域请求 dev server 的 HTML 与 ESM 资源
      cors: {
        origin: '*',
        methods: 'GET,HEAD,OPTIONS',
        credentials: false,
      },
      // dev 代理：把同源请求转发到第三方生图接口，避开浏览器 CORS。
      //   - 前端调用 baseURL = '/api-proxy'
      //   - 同步接口（images/*）改写为 https://draw.hugusir.top/api/v1/*
      //   - 异步任务接口（ai-jobs/*）改写为 https://draw.hugusir.top/api/*
      //     （无 /v1，见接口文档：异步图生图 base 为 /api）
      //   - changeOrigin: true 让目标站看到正确的 Host 头，便于预检通过
      // 仅 dev 生效；生产环境需自行提供后端转发（同前缀），不要把 Key 留在前端。
      proxy: {
        // 异步任务接口需放在更通用的 '/api-proxy' 之前，优先匹配。
        '/api-proxy/ai-jobs': {
          target: 'https://draw.hugusir.top',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api-proxy/, '/api'),
        },
        '/api-proxy': {
          target: 'https://draw.hugusir.top',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api-proxy/, '/api/v1'),
        },
      },
    },
  };
});