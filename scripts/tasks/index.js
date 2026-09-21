#!/usr/bin/env node

/**
 * @typedef {Object} TaskRegisterOptions
 */

/**
 * @typedef {Object} TaskRegister
 * @property {string} name - 任务名。
 * @property {string} description - 任务的简要描述。
 * @property {function(TaskRegisterOptions): Promise<void>} register - 注册任务并使用给定的选项运行它的函数。
 * @property {Object} [options] - 描述任务可用选项的对象。
 * @property {string} [examples] - 任务的使用示例。
 */

// 任务执行器
const { cli, help } = require('tasksfile');
const appStart = require('./src/app.start');
const appBuild = require('./src/app.build');
const appDeploy = require('./src/app.deploy');
const start = require('./src/start');
const build = require('./src/build');
const deploy = require('./src/deploy');

/**
 * @description 注册 help
 * @param tasks {TaskRegister[]}
 */
function registerTask(tasks) {
  tasks.forEach((task) => {
    help(task.register, task.description, {
      options: task.options,
      examples: task.examples,
    });
  });
  cli(
    tasks.reduce((cliOptions, task) => {
      cliOptions[task.name] = task.register;
      return cliOptions;
    }, {}),
  );
}

registerTask([
  start,
  build,
  deploy,
  appStart,
  appBuild,
  appDeploy,
]);
