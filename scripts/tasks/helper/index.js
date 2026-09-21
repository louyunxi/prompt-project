const {
  readFile,
  outputFileSync,
  readFileSync,
  removeSync,
} = require('fs-extra');
const { load: yamlLoad } = require('js-yaml');
const path = require('path');
const { sh } = require('tasksfile');
const inquirer = require('inquirer');
const { IGNORE_WORKSPACE, serviceListMap } = require('../config');
const automator = require('miniprogram-automator');
const fs = require('fs');
const os = require('os');
const archiver = require('archiver');
const chokidar = require('chokidar');
const appConfig = require('@anhui/app-config').default;
const decamelizeKeysDeep = require('decamelize-keys-deep');

/**
 * @description Read Workspace
 * @returns {Promise<string[]>}
 */
async function readWorkspace() {
  const workspace = yamlLoad(
    await readFile(path.resolve(process.cwd(), './pnpm-workspace.yaml'), {
      encoding: 'utf8',
    }),
    {
      json: true,
    },
  );
  return workspace.packages;
}

// 过滤得到所有项目
async function filterWorkspace() {
  // eslint-disable-next-line no-useless-catch
  try {
    const filterArgv = (await readWorkspace()).filter(
      (wr) => !IGNORE_WORKSPACE.includes(wr),
    );
    return filterArgv
      .map((argv) => ['--filter', `./"${argv}"`])
      .flatMap((argv) => argv);
  } catch (e) {
    throw e;
  }
}
async function getWorkspacePackages(filterArgv = []) {
  const stdout = await sh(
    `pnpm ls -r --depth -1 --json ${filterArgv.join(' ')}`,
    {
      async: true,
      nopipe: false,
      silent: true,
    },
  );
  if (!stdout) {
    return [];
  }
  return JSON.parse(stdout);
}

/**
 * @description 运行任务
 * @param options {object}
 * @param [command=start] {string} - start ｜ build ｜deploy
 * @returns {Promise<void>}
 */
async function runTask(options, command = 'start') {
  let { mode, doc, checkedAll } = options;
  const questions = [];
  // 是否部署文档
  if (!doc) {
    questions.push({
      type: 'confirm',
      name: 'isDoc',
      message: '是否启动文档',
      default: false,
    });
  }
  // 选择运行的服务端
  if (!mode) {
    questions.push({
      type: 'list',
      name: 'devService',
      message: '开发服务器节点',
      choices: Object.values(serviceListMap).map((option) => ({
        name: option.name,
        value: option.mode,
        checked: option.checked,
      })),
    });
  }

  const filterArgv = (await filterWorkspace()) || [];
  const workspacePackages = await getWorkspacePackages(filterArgv);
  // 多个应用项目
  if (workspacePackages.length > 1) {
    const choices = workspacePackages.map((item) => ({
      title: item.name,
      value: item.name,
      checked: !!checkedAll,
    }));
    questions.push({
      type: 'checkbox',
      message: `选择要运行的包 ${command} 脚本: `,
      name: 'packages',
      choices,
      validate: function (val) {
        if (val && val.length) {
          return true;
        }
        return '请至少选择一个: ';
      },
    });
  } else if (workspacePackages.length === 0) {
    return console.log(`暂无项目可${command}`);
  }

  const { devService, isDoc, packages } = await inquirer.prompt(questions);
  const appPackages =
    packages || workspacePackages.map((workspace) => workspace.name);
  mode = mode || devService;
  doc = !!doc || isDoc;
  const scriptArgv = appPackages
    .map((packageName) => ['--filter', packageName])
    .flatMap((argvItem) => argvItem);
  if (command !== 'start') {
    // 删除 widget.zip
    removeSync(path.join(process.cwd(), 'widget.zip'));
    // 删除 widget 目录
    removeSync(path.join(process.cwd(), 'widget'));
  }
  // 执行 应用下的所有命令
  await sh(`pnpm -w run turbo:${command} ${scriptArgv.join(' ')}`, {
    async: true,
    nopipe: true,
    env: {
      ...process.env,
      MODE: mode,
      NODE_ENV: command === 'start' ? 'development' : 'production',
      PRO_DOCS: `${Number(doc)}`,
      FOR_ALL_SCREEN: 'false',
      ZA_APP_COMMAND: command,
    },
  });
}

// 启动开发者小程序
async function startWxMiniprogram() {
  // 默认macos 开发者小程序安装路径
  let cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
  const isDev = process.env.NODE_ENV === 'development';
  const projectPath = isDev ? './dist/dev/mp-weixin' : './dist/build/mp-weixin';

  if (process.platform === 'win32') {
    const winPathList = process.env.Path.split(';');
    const wx = winPathList
      .filter((envPath) => envPath.indexOf('\\dll') !== -1)
      .filter((path) => {
        return fs.existsSync(path.replace('\\dll', '\\微信开发者工具.exe'));
      })
      .map((path) => {
        return path.replace('\\dll', '\\cli.bat');
      });
    cliPath = wx?.[0];
    if (!cliPath) {
      return;
    }
  }
  const miniProgram = await automator.launch({
    cliPath, // 工具 cli 位置，如果你没有更改过默认安装位置，可以忽略此项
    projectPath, // 开发中/打包后 项目文件地址
  });
  const page = await miniProgram.reLaunch('/pages/index/index');
  await page.waitFor(500);
}

function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    for (const alias of iface) {
      if (
        alias.family === 'IPv4' &&
        !alias.internal &&
        alias.address.indexOf('192.168') !== -1
      ) {
        return alias.address;
      }
    }
  }
  return '0.0.0.0';
}

/**
 * 将指定文件夹或文件压缩成 ZIP 文件
 * @param {string} sourcePath - 要压缩的文件夹或文件的路径
 * @param {string} outputDir - 输出压缩包的目录
 * @param {string} zipName - 压缩包的名称（包括 .zip 扩展名）
 * @return {Promise}
 */
function compressToZip(sourcePath, outputDir, zipName) {
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  // 指定输出的压缩包路径
  const outputZipPath = path.resolve(outputDir, zipName);

  // 创建一个输出流
  const output = fs.createWriteStream(outputZipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // 设置压缩级别
  });

  // 监听输出流的关闭事件
  output.on('close', () => {
    console.log(`压缩完成: ${archive.pointer()} 字节`);
  });

  // 监听输出流的错误事件
  output.on('error', (err) => {
    throw err;
  });

  // 将输出流管道到压缩流
  archive.pipe(output);

  // 检查源路径是文件还是文件夹
  const stats = fs.lstatSync(sourcePath);
  if (stats.isDirectory()) {
    // 如果是文件夹，添加文件夹中的所有内容到压缩包
    archive.directory(sourcePath, path.basename(sourcePath));
  } else if (stats.isFile()) {
    // 如果是文件，添加文件到压缩包
    archive.file(sourcePath, { name: path.basename(sourcePath) });
  } else {
    throw new Error('源路径既不是文件也不是文件夹');
  }

  // 完成压缩
  return archive.finalize();
}

/**
 * 监听指定文件夹及其子文件夹的变化
 * @param {string} dirPath - 要监听的文件夹路径
 * @param {function} task - 检测到变化时要执行的任务函数
 */
async function watchDirectory(dirPath, task) {
  // 创建一个 chokidar 监听器
  const watcher = chokidar.watch(dirPath, {
    ignored: /(^|[\/\\])\../, // 忽略以 . 开头的文件和文件夹
    persistent: true,
  });

  // 监听所有变化事件
  watcher
    .on('add', (path) => {
      console.log(`文件添加: ${path}`);
      task(path, 'add');
    })
    .on('change', (path) => {
      console.log(`文件更改: ${path}`);
      task(path, 'change');
    })
    .on('unlink', (path) => {
      console.log(`文件删除: ${path}`);
      task(path, 'unlink');
    })
    .on('addDir', (path) => {
      console.log(`文件夹添加: ${path}`);
      task(path, 'addDir');
    })
    .on('unlinkDir', (path) => {
      console.log(`文件夹删除: ${path}`);
      task(path, 'unlinkDir');
    })
    .on('error', (error) => {
      console.error(`监听错误: ${error}`);
    })
    .on('ready', () => {
      console.log(`初始扫描完成，正在监听 ${dirPath}`);
    });
}

function appConfigToEvn() {
  return Object.entries(decamelizeKeysDeep(appConfig)).reduce(
    (acc, [key, value]) => {
      Object.entries(value).forEach(([inKey, inValue]) => {
        acc[`VITE_${key.toUpperCase()}_${inKey.toUpperCase()}`] = inValue;
      });
      return acc;
    },
    {},
  );
}

// 根据任务配置修改根页面访问地址  start => http://192.168.0.105:8185/#/   build => index.html
function editRootHtml(isForAllScreen, targetPath, rootUrl) {
  try {
    let scriptContent = getRootScriptTmp(isForAllScreen, rootUrl);
    const fullTargetPath = path.resolve(__dirname, targetPath);
    let htmlContent = fs.readFileSync(fullTargetPath, 'utf-8');
    const modifiedScript = `<script>\n${scriptContent}\n</script>`;
    htmlContent = htmlContent.replace(
      /<\/body>/i,
      `${modifiedScript}\n</body>`,
    );
    fs.writeFileSync(fullTargetPath, htmlContent);
  } catch (error) {
    console.error('root.html 修改出错:', error);
  }
}
function getRootScriptTmp(isForAllScreen, rootUrl) {
  // 单屏
  //0.45857 0.448504983388704 0.4498525 0.56221889  0.69463

  // 双屏
  // 0.89389 0.887 0.918 0.891
  // 华为 0.6226415094339623

  // 三折叠 2232x3184
  // 0.70  w707 h496
  const allScreenScriptTel = `
    var indexUrl = "${rootUrl}";
    function apiready() {
      const whb = api.screenWidth / api.screenHeight;
      const isSingleScreen = Boolean(whb > 0.4 && whb < 0.6);
      var whbili = 0.4615384615384615;
      let w = parseInt(api.winHeight * whbili);
      w = w > api.winWidth ? api.winWidth : w;
      let x = parseInt((api.winWidth - w) * 0.5);
      x = x < 0 ? 0 : x;
      var option = {
        name: 'appH5',
        url: indexUrl,
      }
      if(!isSingleScreen){
        option.rect = {
          x: x,
          y: 0,
          w: w,
          h: 'auto',
        }
      }
      api.openFrame(option);
      document.getElementById('page').style='background-size: auto '+api.winHeight+'px!important;'
    }
  `;
  // 只考虑单屏幕页面
  const singleScreenScriptTel = `
    var indexUrl = "${rootUrl}";
    function apiready() {
      api.openWin({
        name: 'appH5',
        url: indexUrl
      });
      document.getElementById('page').style='background-size: auto '+api.winHeight+'px!important;'
    }
  `;
  return isForAllScreen ? allScreenScriptTel : singleScreenScriptTel;
}

// 使用低版本兼容，去除 script type=module
function openNoModule(html) {
  const moduleScriptBlock = /<script.*type="module".*>.*<\/script>/g;
  const noModuleScriptBlock = /(<script.*?)nomodule(.*>?)/g;

  return html
    .replace(moduleScriptBlock, '')
    .replace(noModuleScriptBlock, '$1$2')
    .replace('data-src=', 'src=');
}

function editAppEntryHtml(projectName) {
  const outDir = appConfig[projectName].outDir;
  const htmlPath = path.join(process.cwd(), `../../${outDir}/index.html`);
  const htmlContent = readFileSync(htmlPath, 'utf-8');

  // 输出 config.xml
  outputFileSync(htmlPath, openNoModule(htmlContent));
}

module.exports = {
  filterWorkspace,
  getWorkspacePackages,
  runTask,
  startWxMiniprogram,
  compressToZip,
  watchDirectory,
  getServerIP,
  appConfigToEvn,
  editRootHtml,
  getRootScriptTmp,
  editAppEntryHtml,
};
