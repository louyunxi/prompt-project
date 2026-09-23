const https = require('https');
const fs = require('fs');
const cp = require('child_process');
const os = require('os');
const path = require('path');

const u = 'https://registry.npmjs.org/@hansonfang/vite-plugin-qiankun-lite/-/vite-plugin-qiankun-lite-1.0.0.tgz';
const file = path.join(os.tmpdir(), 'vite-plugin-qiankun-lite.tgz');
console.log('downloading to', file);

const req = https.get(u, (r) => {
  const f = fs.createWriteStream(file);
  r.pipe(f);
  f.on('finish', () => {
    f.close();
    console.log('downloaded', fs.statSync(file).size, 'bytes');
    const list = cp.execSync('tar -tzf ' + JSON.stringify(file), { encoding: 'utf8' });
    console.log(list);
  });
});
req.on('error', (e) => console.error('GET error:', e.message));