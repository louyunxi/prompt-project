const { sh } = require('tasksfile');
const dedent = require('dedent');
const RobotDing = require('@tnnevol/robot-ding');
const { SEND_CONFIG } = require('../config');
const path = require('path');

/** @type {TaskRegister} */
module.exports = {
  name: 'appDeploy',
  description: '打包工程应用',
  async register(options) {
    const { projectName: PROJECT_NAME, serverConfig } = require(
      path.resolve(process.cwd(), 'deploy.config.js'),
    );
    const { mode } = options;
    const VITE_APP_ENV = process.env.MODE || mode || 'production';

    const ENV_KEY_MAP = {
      development: 'test',
      production: 'prod',
    };
    const serverConfigKey = ENV_KEY_MAP[VITE_APP_ENV];

    const serverName = serverConfig[serverConfigKey].name;

    const ding = new RobotDing(SEND_CONFIG);

    let userName, userEmail;
    try {
      userName = sh('git config --get user.name', {
        silent: true,
      });
    } catch (e) {
      userName = '未配置git用户名';
    }
    try {
      userEmail = sh('git config --get user.email', {
        silent: true,
      });
    } catch (e) {
      userEmail = '未配置git邮箱';
    }

    // 钉钉 通知
    await ding.sendDing({
      content: `部署人：${userName} - ${userEmail}
          ${PROJECT_NAME}: 准备部署到 ${serverName}`,
      isAtAll: false,
    });
    await sh(`deploy publish --env=${serverConfigKey} --unprompt`, {
      async: true,
      nopipe: true,
    });

    // 钉钉 通知
    await ding.sendDing({
      content: `部署人：${userName} - ${userEmail}
          ${PROJECT_NAME}: 已部署至 ${serverName}`,
      isAtAll: true,
    });
  },
  options: {
    env: '打包的服务：test、prod',
  },
  examples: dedent`
    gtask appDeploy
    gtask appDeploy --env=prod
  `,
};
