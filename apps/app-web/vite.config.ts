import { defineConfig } from 'vite';
import type { ConfigEnv, PluginOption } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import appConfig from '@anhui/app-config';
import mkcert from 'vite-plugin-mkcert';
import qiankun from '@xunv/vite-plugin-qiankun-lite';

// 子应用名称映射
const APP_NAMES: Record<string, string> = {
  appWeb: 'web端示例项目 Web',
};

export default defineConfig(({ mode }: ConfigEnv) => {
  const env = { VITE_APP_SERVER: mode === 'production' ? 'prod' : 'test' };
  const COMMAND = process.env.ZA_APP_COMMAND;

  let base = '/';
  if (COMMAND === 'deploy' || COMMAND === 'build') {
    base = './';
  }

  const APP_NAME = APP_NAMES.appWeb || 'Web';

  return {
    base,
    plugins: [
      mkcert({
        hosts: ['localhost', '127.0.0.1'],
      }),
      vue(),
      // qiankun 子应用接入：名称需与主应用 apps/app-prompt/src/micro/index.ts 中注册的 name 一致
      qiankun({
        name: 'app-web',
        sandbox: true,
      }),
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
    build: {
      outDir: appConfig.appWeb.outDir,
    },
    server: {
      host: '0.0.0.0',
      port: appConfig.appWeb.port,
      // qiankun 主应用可能通过局域网 IP（如 https://192.168.0.12:8888）访问，
      // 需放行其 origin 跨域获取子应用 entry 与模块，否则容器空白
      cors: { origin: true },
    },
  };
});
