const { cryptoKey, cryptoIv } = require('./.key');
module.exports = {
  projectName: 'anhui-web',
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
      webDir: '/www/ai/wnwt-web',
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
      webDir: '/www/ai/wnwt-web',
      bakDir: '',
      isRemoveRemoteFile: false,
      isRemoveLocalFile: false,
    },
  },
};
