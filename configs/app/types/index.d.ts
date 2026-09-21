// h5 应用配置
type H5Config = {
  /** ip*/
  host: string;
  /** 端口*/
  port: number;
  /** 打包输出位置*/
  outDir: string;
  /** 线上地址*/
  serverUrlTest: string;
  serverUrlProd: string;
};

// API 相关配置（各应用统一在此维护）
type ApiConfig = {
  /** Dify 问答服务地址 - 正式服 */
  difyUrlProd: string;
  /** Dify 问答服务地址 - 测试服 */
  difyUrlTest: string;
  /** 气象管理后台服务 - 正式服 */
  weatherAdminUrlProd: string;
  /** 气象管理后台服务 - 测试服 */
  weatherAdminUrlTest: string;

  /** 知识库数据集 API 密钥 - 正式服 */
  datasetKeyProd: string;
  /** 知识库数据集 API 密钥 - 测试服 */
  datasetKeyTest: string;
  /** 主粮作物物候期知识库 ID - 正式服 */
  datasetIdProd: string;
  /** 主粮作物物候期知识库 ID - 测试服 */
  datasetIdTest: string;
};

type Config = {
  appPrompt: H5Config;
  apiConfig: ApiConfig;
};

const config: Config;

export default config;
