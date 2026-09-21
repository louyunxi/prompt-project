const config = {
  appPrompt: {
    host: '0.0.0.0',
    port: 8888,
    outDir: 'dist/',
    // 在线地址
    serverUrlTest: 'https://wnwt.snkoudai.com/admin/',
    serverUrlProd: 'https://wnwt.ahnw.cn/admin/',
  },
  appWeb: {
    host: '0.0.0.0',
    port: 8889,
    outDir: 'dist/',
    // 在线地址
    serverUrlTest: 'https://wnwt.snkoudai.com/web/',
    serverUrlProd: 'https://wnwt.ahnw.cn/web/',
  },
};

// API 相关配置（各应用统一在此维护）
const apiConfig = {
  // Dify 问答服务地址
  difyUrlProd: 'https://multiapi.ahnw.cc',
  difyUrlTest: 'https://dify.snkoudai.com',
  // 气象管理后台服务
  weatherAdminUrlProd: 'https://qxhn.ahnw.cn',
  weatherAdminUrlTest: 'https://wnwt.snkoudai.com',

  // appPrompt - 知识库数据集 API 密钥
  datasetKeyProd: 'dataset-ba77m29x9GCp3V1lZKlcrlZd',
  datasetKeyTest: 'dataset-mYfoC6ujfYQ62QsdXYgd0X1u',
  // appPrompt - 主粮作物物候期知识库 ID
  datasetIdProd: 'e8e122ca-e3c2-4685-8062-fb0ff8fb91a1',
  datasetIdTest: 'b95b013e-d6b9-4c5e-86d5-9a310cedb12c',
};

config.apiConfig = apiConfig;

export default config;
