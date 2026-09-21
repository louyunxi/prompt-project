const dedent = require('dedent');
const { runTask } = require('../helper');

/** @type {TaskRegister} */
module.exports = {
  name: 'start',
  description: '工程启动',
  register(options) {
    return runTask(options);
  },
  options: {
    doc: '启动文档',
    mode: '启动的服务：development、production',
    checkedAll: '选中所有应用',
  },
  examples: dedent`
    gtask start
    gtask start --doc
    gtask start --mode=development
    gtask start --doc --mode=development
    gtask start --forallscreen
  `,
};
