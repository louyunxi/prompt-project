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
      host: '47.110.59.117',
      port: 22,
      username: 'DB9E97F2A9F0959580F8C3A1EC175796',
      password: '9DAB84D7C278D8B109EB9E03EEEC068A',
      distPath: 'dist/',
      webDir: '/www/consume/h5/ai',
      bakDir: '',
      isRemoveRemoteFile: false,
      isRemoveLocalFile: false,
    },
    prod: {
      // 神农口袋 uat
      name: 'prod',
      script: 'pnpm run build',
      host: '121.40.158.242',
      port: 22,
      username: 'DB9E97F2A9F0959580F8C3A1EC175796',
      password:
        '854E8E609E147AFB4C8F911EE07514AA248950585332D557944CB683AB5BF541',
      distPath: 'dist/',
      webDir: '/www/consume/h5/ai',
      bakDir: '',
      isRemoveRemoteFile: false,
      isRemoveLocalFile: false,
    },
  },
};
