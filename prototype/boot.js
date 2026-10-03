/* 启动：读取 mock/*.json，恢复上次的状态（没有就载入默认演示场景），渲染当前路由。 */
(async function () {
  'use strict';
  const App = window.App;
  try {
    // 仓库根目录同时是静态站点的根：../mock/ 与 ../public/ 都能直接取到（见 vercel.json）
    App.raw = await MiloData.loadRaw('../mock/', (u) => fetch(u));
    App.raw.muscles.regions.forEach((r) => (App.REGION_NAME[r.id] = r.name));
    App.env = MiloEngine.makeEnv(App.raw.exercises, App.raw.muscles, Date.now());
    App.MEDIA_BASE = '../public';
    const saved = App.load();
    if (saved) { App.S = saved; Object.assign(App.S.inject, { ...App.DEFAULT_INJECT, ...App.S.inject }); }
    else { App.loadScenario('deload-suggested'); }
    App.render();
  } catch (e) {
    console.error(e);
    document.getElementById('screen').innerHTML = `<div class="page"><div class="body"><div class="err">原型没有加载成功：${App.esc(e.message)}。<br>请用 HTTP 服务打开（例如在仓库根目录运行 <span class="mono">python3 -m http.server</span>，再访问 /prototype/），直接双击 html 文件读不到 mock 数据。</div></div></div>`;
  }
})();
