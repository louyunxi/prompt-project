async function buildPreview(options) {
  const Koa = require('koa');
  const chalk = require('chalk');
  const path = require('path');
  const { sh } = require('tasksfile');
  // api
  process.env.VUE_APP_ENV = 'dev';
  process.setMaxListeners(0);

  const config = require('../../vue.config.js');
  const history = require('@tnnevol/koa2-history-api-fallback-async');
  const proxy = require('../server-middleware/koa-http-proxy-middleware');
  const koaStatic = require('koa-static');
  const app = new Koa();
  let rawArgv = [];
  // 合并参数
  for (let key in options) {
    if (Object.hasOwnProperty.call(options, key) && options[key]) {
      rawArgv.push(`--${key}`);
      if (typeof options[key] !== 'boolean') rawArgv.push(options[key]);
    }
  }

  const args = rawArgv.join(' ');
  const port = (config.devServer.port || 9010) + 1;
  const publicPath = config.publicPath;
  const assetsPath = path.join(process.cwd(), './dist');
  const publicPathReg = new RegExp(`${publicPath}.*$`);
  const rePublicPathReg = new RegExp(`^${publicPath}`);
  await sh(`vue-cli-service build ${args}`, {
    async: true,
    nopipe: true,
  });
  // 代理中间件 兼容webpack-dev-server 的proxy
  app.use(
    proxy({
      targets: config.devServer.proxy,
    }),
  );
  // vue history 模式的路由重定向
  app.use(
    history({
      rewrites: [
        {
          from: publicPathReg,
          to({ parsedUrl }) {
            const rePathname = parsedUrl.pathname.replace(rePublicPathReg, '/');
            if (/^\/static\/.*/.test(rePathname)) {
              // 静态资源文件
              return rePathname;
            } else if (/^\/examples[/]?.*/.test(rePathname))
              return '/examples/index.html';
            else if (/^\/404[.]html.*/.test(rePathname)) {
              // 404
              return '/404.html';
            } else if (/^\/report[.]html.*/.test(rePathname)) {
              // report
              return '/report.html';
            }
            return '/index.html';
          },
        },
      ],
    }),
  );
  // 设置静态资源目录
  app.use(koaStatic(assetsPath));
  app.listen(port, function () {
    console.log(
      chalk.green(`> Preview at  http://localhost:${port}${publicPath}`),
    );
    if (options.report) {
      console.log(
        chalk.green(
          `> Report at  http://localhost:${port}${publicPath}report.html`,
        ),
      );
    }
  });
}
module.exports = buildPreview;
