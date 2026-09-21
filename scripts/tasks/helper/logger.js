const log4js = require('log4js');
const path = require('path');

const outFilename = path.join(__dirname, '../../../logs/app.log');

log4js.configure({
  appenders: {
    console: { type: 'console' },
    cheese: {
      // 设置类型为 dateFile
      type: 'dateFile',
      // 配置文件名
      filename: outFilename,
      // 指定编码格式为 utf-8
      encoding: 'utf-8',
      // 配置 layout，此处使用自定义模式 pattern
      // layout: 'basic',
      // 日志文件按日期（天）切割
      pattern: 'yyyy-MM-dd',
      // 回滚旧的日志文件时，保证以 .log 结尾 （只有在 alwaysIncludePattern 为 false 生效）
      keepFileExt: true,
      // 输出的日志文件名是都始终包含 pattern 日期结尾
      alwaysIncludePattern: true,
    },
  },
  categories: {
    // 设置默认的 categories
    default: { appenders: ['console', 'cheese'], level: 'info' },
  },
});
module.exports = log4js.getLogger();
