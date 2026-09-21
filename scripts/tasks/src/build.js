const dedent = require('dedent');
const { runTask } = require('../helper');

/** @type {TaskRegister} */
module.exports = {
  name: 'build',
  description: '工程打包',
  async register(options) {
    await runTask(options, 'build');
  },
  options: {
    doc: '打包文档',
    mode: '打包的服务：development、production',
    checkedAll: '选中所有应用',
  },
  examples: dedent`
    gtask build
    gtask build --doc
    gtask build --mode=development
    gtask build --doc --mode=development
  `,
};
