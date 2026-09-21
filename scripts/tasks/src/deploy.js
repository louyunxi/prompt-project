const dedent = require('dedent');
const { runTask } = require('../helper');

/** @type {TaskRegister} */
module.exports = {
  name: 'deploy',
  description: '工程部署',
  register(options) {
    return runTask(options, 'deploy');
  },
  options: {
    doc: '部署文档',
    mode: '部署的服务：development、test、prod',
  },
  examples: dedent`
    gtask deploy
    gtask deploy --doc
    gtask deploy --mode=development
    gtask deploy --doc --mode=development
  `,
};
