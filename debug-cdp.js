const http = require('http');

const CDP_PORT = 9222;
const TARGET_URL = 'https://localhost:4173/#/prompt/pc/layout';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  // Get pages list
  const pagesJson = await httpGet(`http://localhost:${CDP_PORT}/json`);
  const pages = JSON.parse(pagesJson);
  const page = pages.find((p) => p.type === 'page');
  if (!page) throw new Error('No page found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const messages = [];
  let id = 0;

  function send(method, params = {}) {
    const msg = { id: ++id, method, params };
    ws.send(JSON.stringify(msg));
    return new Promise((resolve) => {
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === msg.id) {
          ws.removeEventListener('message', handler);
          resolve(data);
        }
      };
      ws.addEventListener('message', handler);
    });
  }

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.method) {
      messages.push(data);
    }
  });

  await new Promise((resolve) => ws.addEventListener('open', resolve));

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');

  // First load a same-origin page so localStorage is scoped correctly
  await send('Page.navigate', { url: 'https://localhost:4173/' });
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate logged-in state
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('admin-user', JSON.stringify({ userName: 'admin' }))`,
    returnByValue: true,
  });
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Now navigate to the target route
  await send('Page.navigate', { url: TARGET_URL });
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Wait for load and a bit more
  await new Promise((resolve) => setTimeout(resolve, 4000));

  const evalResult = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      url: location.href,
      title: document.title,
      appHtml: document.querySelector('#app')?.innerHTML || 'NO_APP',
      bodyHtml: document.body.innerHTML
    })`,
    returnByValue: true,
  });

  console.log('--- RAW EVAL RESULT ---');
  console.log(JSON.stringify(evalResult, null, 2));

  const value = evalResult?.result?.value;
  const info = value ? JSON.parse(value) : { url: 'N/A', title: 'N/A', appHtml: 'N/A', bodyHtml: 'N/A' };

  console.log('--- PAGE INFO ---');
  console.log('URL:', info.url);
  console.log('Title:', info.title);
  console.log('#app innerHTML length:', info.appHtml.length);
  console.log('#app innerHTML:', info.appHtml.slice(0, 1000));

  console.log('--- CDP MESSAGES ---');
  messages.forEach((m) => {
    if (m.method === 'Runtime.consoleAPICalled' || m.method === 'Log.entryAdded' || m.method === 'Runtime.exceptionThrown') {
      console.log(JSON.stringify(m, null, 2));
    }
  });

  ws.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
