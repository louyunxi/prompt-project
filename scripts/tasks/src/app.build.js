const { sh } = require('tasksfile');
const dedent = require('dedent');
const {
  startWxMiniprogram,
  getServerIP,
  appConfigToEvn,
  editAppEntryHtml,
} = require('../helper');
const path = require('path');
const appConfig = require('@anhui/app-config').default;
const fs = require('fs-extra');

/** @type {TaskRegister} */
module.exports = {
  name: 'appBuild',
  description: '打包工程应用',
  async register(options) {
    const { mode, doc, plat, projectName, forallscreen } = options;
    const appConfigEnv = appConfigToEvn();
    const VITE_APP_ENV = process.env.MODE || mode || 'production';
    const FOR_ALL_SCREEN = process.env.FOR_ALL_SCREEN || false;
    if (plat) {
      await new Promise((resolve) => {
        sh(`uni build -p ${plat} -m ${VITE_APP_ENV}`, {
          async: true,
          nopipe: true,
          env: {
            NODE_ENV: process.env.NODE_ENV || 'production',
            // @ts-ignore
            PRO_DOCS: process.env.PRO_DOCS || Number(doc),
            VITE_FOR_ALL_SCREEN:
              FOR_ALL_SCREEN || JSON.stringify(forallscreen || 'false'),
            VITE_APP_ENV: VITE_APP_ENV,
          },
        });
        setTimeout(resolve, 3000);
      });
      await startWxMiniprogram();
    } else {
      await sh(`vite build -m ${VITE_APP_ENV}`, {
        async: true,
        nopipe: true,
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production',
          PRO_DOCS: process.env.PRO_DOCS || String(Number(doc)),
          VITE_FOR_ALL_SCREEN:
            FOR_ALL_SCREEN || JSON.stringify(forallscreen || 'false'),
          VITE_PRO_NETWORK_HOST: `${getServerIP()}`,
          ...appConfigEnv,
        },
      });

      if (projectName) {
        const outDir = appConfig[projectName].outDir;
        try {
          // 将项目下的所有文件copy到工程根目录下面
          const destPath = path.join(process.cwd(), `../../${outDir}`);
          fs.copySync(path.join(process.cwd(), `./${outDir}`), destPath, {
            overwrite: true,
          });
        } catch (error) {
          console.log(
            '--projectName 参数不正确，请使用 configs/app/index.js 中的 key',
            error,
          );
        }
      }
    }
  },
  options: {
    doc: '打包文档',
    plat: '打包的平台，默认无需传入，当前仅支持uniApp %PLATFORM%：https://uniapp.dcloud.net.cn/quickstart-cli.html#%E8%BF%90%E8%A1%8C%E3%80%81%E5%8F%91%E5%B8%83uni-app',
    mode: '打包的服务：development、test、prod',
    projectName: '打包的项目名称 appPrompt',
    forallscreen: 'appH5是否需要兼容双屏',
  },
  examples: dedent`
    gtask appBuild
    gtask appBuild --doc
    gtask appBuild --forallscreen
    gtask appBuild --mode=development
    gtask appBuild --doc --mode=development
  `,
};
