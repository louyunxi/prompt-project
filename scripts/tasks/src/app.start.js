const { sh } = require('tasksfile');
const dedent = require('dedent');
const {
  startWxMiniprogram,
  getServerIP,
  appConfigToEvn,
} = require('../helper');
const address = require('address');

/** @type {TaskRegister} */
module.exports = {
  name: 'appStart',
  description: '启动工程应用',
  async register(options) {
    const { mode, doc, plat, forallscreen } = options;
    const appConfigEnv = appConfigToEvn();
    const VITE_APP_ENV = process.env.MODE || mode || 'development';
    const FOR_ALL_SCREEN = process.env.FOR_ALL_SCREEN || false;
    if (plat) {
      await new Promise((resolve) => {
        sh(`uni -p ${plat} -m ${VITE_APP_ENV}`, {
          async: true,
          nopipe: true,
          env: {
            ...process.env,
            NODE_ENV: process.env.NODE_ENV || 'development',
            PRO_DOCS: process.env.PRO_DOCS || Number(doc),
            VITE_APP_ENV: VITE_APP_ENV,
            VITE_FOR_ALL_SCREEN: FOR_ALL_SCREEN || JSON.stringify(forallscreen || 'false'),
            VITE_APP_H5_ADDRESS: `http://${address.ip()}:9100`,
          },
        });
        setTimeout(resolve, 3000);
      });
      await startWxMiniprogram();
    } else {
      await sh(`vite -m ${VITE_APP_ENV}`, {
        async: true,
        nopipe: true,
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'development',
          PRO_DOCS: process.env.PRO_DOCS || String(Number(doc)),
          VITE_FOR_ALL_SCREEN: FOR_ALL_SCREEN || JSON.stringify(forallscreen || 'false'),
          VITE_PRO_NETWORK_HOST: `${getServerIP()}`,
          ...appConfigEnv,
        },
      });
    }
  },
  options: {
    doc: '启动文档',
    plat: '启动的平台，默认无需传入，当前仅支持uniApp %PLATFORM%：https://uniapp.dcloud.net.cn/quickstart-cli.html#%E8%BF%90%E8%A1%8C%E3%80%81%E5%8F%91%E5%B8%83uni-app',
    mode: '启动的服务：development、test、prod',
    forallscreen: 'appH5是否需要兼容双屏',
  },
  examples: dedent`
    gtask appStart
    gtask appStart --doc
    gtask appStart --forallscreen
    gtask appStart --mode=development
    gtask appStart --plat=mp-weixin
    gtask appStart --doc --mode=development
  `,
};
