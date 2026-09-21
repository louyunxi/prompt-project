const serviceListMap = {
  test: {
    name: 'test服',
    mode: 'development',
    checked: true,
  },
  prod: {
    name: 'prod服',
    mode: 'production',
  },
};

const SEND_CONFIG = {
  webhook:
    'https://oapi.dingtalk.com/robot/send?access_token=b44218945fdf2f73ae6e627153ff5d43be5de941e43307802f1ae0bb59d13426',
  secret: 'SEC7ca641682fced04ca2e60f736febd7f9a601b4291ed6f932f20832147cb71aa0',
};
const IGNORE_WORKSPACE = [
  'packages/*',
  'configs/*',
  'scripts/*',
  'docs/*',
  'internal/*',
];

module.exports = {
  serviceListMap,
  IGNORE_WORKSPACE,
  SEND_CONFIG,
};
