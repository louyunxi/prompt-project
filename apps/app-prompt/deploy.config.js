const { cryptoKey, cryptoIv } = require('./.key');
module.exports = {
  projectName: 'anhui-admin',
  cryptoKey,
  cryptoIv,
  serverConfig: {
    test: {
      // 神农口袋 测试环境
      name: 'test',
      script: 'pnpm run build',
      host: '121.41.27.89',
      port: 22,
      username: 'DB9E97F2A9F0959580F8C3A1EC175796',
      password: 'CDC61AB7BFA62582A27704263CF9651E',
      distPath: 'dist/',
      webDir: '/www/ai/wnwt-admin',
      bakDir: '',
      isRemoveRemoteFile: false,
      isRemoveLocalFile: false,
    },
    uat: {
      name: 'uat',
      script: 'pnpm run build',
      host: '121.40.158.242',
      port: 22,
      username: 'DB9E97F2A9F0959580F8C3A1EC175796',
      password:
        '854E8E609E147AFB4C8F911EE07514AA248950585332D557944CB683AB5BF541',
      distPath: 'dist/',
      webDir: '/www/ai/wnwt-admin', // uat 若部署目录不同，请修改
      bakDir: '',
      isRemoveRemoteFile: false,
      isRemoveLocalFile: false,
    },
    prod: {
      name: 'prod',
      script: 'pnpm run build',
      host: '121.41.27.89',
      port: 22,
      username: 'DB9E97F2A9F0959580F8C3A1EC175796',
      password: 'CDC61AB7BFA62582A27704263CF9651E',
      distPath: 'dist/',
      webDir: '/www/ai/wnwt-admin',
      bakDir: '',
      isRemoveRemoteFile: false,
      isRemoveLocalFile: false,
    },
  },
};
