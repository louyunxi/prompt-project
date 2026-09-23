const https = require('https');
function fetchUrl(url, opts = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { rejectUnauthorized: false, ...opts }, (r) => {
        let body = '';
        r.on('data', (chunk) => (body += chunk));
        r.on('end', () => resolve({ status: r.statusCode, headers: r.headers, body }));
      })
      .on('error', reject);
  });
}
(async () => {
  const targets = [
    'https://localhost:8889/',
    'https://localhost:8889/src/main.ts',
    'https://localhost:8888/',
  ];
  for (const url of targets) {
    try {
      const t0 = Date.now();
      const { status, headers, body } = await fetchUrl(url);
      const ms = Date.now() - t0;
      console.log(`\n===== ${url}  HTTP ${status}  (${ms}ms) =====`);
      console.log('content-type:', headers['content-type'] || '');
      console.log('--- body (first 600 chars) ---');
      console.log(body.slice(0, 600));
      console.log('--- body length:', body.length, '---');
    } catch (e) {
      console.error(`\n===== ${url}  ERROR: ${e.message} =====`);
    }
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});