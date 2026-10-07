/* 慢牛 Milo · 框架层线框。
 *   index.html                 总览
 *   index.html?board=body      同一页的几个方案并排（对比板）
 *   index.html?page=body&v=W1  单张（截图用）；&anno=0 关掉标注；&hit=0 关掉手指热区
 * 手指热区（2026-10-07 用户：低保真线框要带手指点击热区）：屏幕底下铺拇指可达区（右手单手：易 / 够得着 / 难），
 * 每个可点元素（data-hit，或 .btn / .nav .it）画出实际命中区——不足 48 的按 48 补齐、居中；命中区互相重叠的标红，
 * 主操作（data-a="2"）落在「难」区的标红。
 * 数据：data.json（引擎实算值）、../benchmark/p06.json（身体页）、../../mock/muscles.json（肌头 → 部位）。
 * 人体：body-*.svg 是 MuscleWiki 真实路径（build_assets.py 生成），这里按包围盒中线裁成半身。 */
(function () {
  const Q = new URLSearchParams(location.search);
  const ANNO = Q.get('anno') !== '0';
  const HIT = Q.get('hit') !== '0';
  const HIT_MIN = 48;
  let D, P06, EX = [], REGION = {}, RNAME = {}, HNAME = {}, SVG = {};
  const j = (u) => fetch(u).then((r) => r.json());
  const t = (u) => fetch(u).then((r) => r.text());
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // ---------- 公共件 ----------
  const TABS = [['home', '首页'], ['body', '身体'], ['gains', '增量'], ['log', '记录'], ['me', '我的']];
  const nav = (sel) => `<div class="fade"></div><div class="nav" data-a="3">${TABS.map(([k, n]) =>
    `<div class="it${k === sel ? ' on' : ''}"><i class="ico ${k}"></i>${k === sel ? n : ''}</div>`).join('')}</div>`;
  const status = '<div class="status">18:00</div>';
  const spark = (v, w = 56, h = 20) => {
    const lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1;
    const pts = v.map((y, i) => `${(i / (v.length - 1 || 1)) * w},${h - 2 - ((y - lo) / r) * (h - 4)}`).join(' ');
    return `<svg width="${w}" height="${h}"><polyline points="${pts}" fill="none" stroke="#5a5a57" stroke-width="1.5"/><circle cx="${w}" cy="${pts.split(' ').pop().split(',')[1]}" r="2.5" fill="#1d1d1b"/></svg>`;
  };
  const delta = (d) => d > 0 ? `▲ ${d.toFixed(1)}` : d < 0 ? `▼ ${Math.abs(d).toFixed(1)}` : '— 持平';
  const kg = (k, big = 't-l') => k == null ? '<span class="t-h muted">首次</span>' : `<span class="${big}">${k}</span><span class="t-s"> kg</span>`;

  // ---------- 身体页：半身 + 胶囊 ----------
  const PHASE = { repair: '修复期', recovering: '恢复中', golden: '黄金窗', decayed: '已回落', untrained: '未练过' };
  const LEVEL_FILL = { none: '#ECECE9', low: '#C4C4C0', ok: '#8E8E8A', over: '#4a4a47' };
  const FOCUS = () => P06.focus;
  const head = (id) => P06.done.heads[id];

  function mountFigure(screen, o) {
    const host = screen.querySelector('[data-fig]');
    host.innerHTML = SVG.front;
    const svg = host.querySelector('svg');
    svg.setAttribute('width', 676); svg.setAttribute('height', 1203);
    const bb = svg.getBBox(), cx = bb.x + bb.width / 2;
    const vb = [cx, bb.y - 4, bb.x + bb.width - cx + 4, bb.height + 8];
    svg.setAttribute('viewBox', vb.join(' '));
    svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    svg.setAttribute('height', o.h); svg.setAttribute('width', (o.h * vb[2]) / vb[3]);
    Object.assign(host.style, { left: o.x + 'px', top: o.y + 'px', opacity: o.dim || 1 });
    // 按容量档着色（灰阶），焦点描黑
    for (const g of svg.querySelectorAll('g[id^="muscle--"]')) {
      const id = g.id.slice(8), hd = head(id);
      if (!hd) continue;
      for (const p of g.querySelectorAll('path')) {
        p.setAttribute('fill', LEVEL_FILL[hd.level]);
        if (id === FOCUS()) { p.setAttribute('stroke', '#111'); p.setAttribute('stroke-width', '5'); }
      }
    }
    // 锚点：可见半边里面积最大的那一块的中心 → 屏幕坐标
    const sr = screen.getBoundingClientRect(), ctm = svg.getScreenCTM(), A = {};
    for (const g of svg.querySelectorAll('g[id^="muscle--"]')) {
      const id = g.id.slice(8);
      if (!head(id)) continue;
      let best = null;
      for (const p of g.querySelectorAll('path')) {
        // 只取可见半边：跨中线的块（腹肌）取它露出来的那一段
        const b = p.getBBox(), l = Math.max(b.x, cx), r = b.x + b.width;
        if (r < cx + 6) continue;
        const area = (r - l) * b.height;
        if (!best || area > best.a) best = { a: area, x: (l + r) / 2, y: b.y + b.height / 2 };
      }
      if (!best) continue;
      const pt = svg.createSVGPoint(); pt.x = best.x; pt.y = best.y;
      const q = pt.matrixTransform(ctm);
      A[id] = [q.x - sr.left, q.y - sr.top];
    }
    return A;
  }

  function capHtml(id, cls, x, y, w, h) {
    const hd = head(id), none = !(hd.sets > 0);
    const fill = Math.min(1, hd.sets / (hd.mrv * 1.1)) * 100;
    const l2 = cls === 'focus' ? `<div class="l2">恢复 ${Math.round(hd.rec * 100)}% · ${PHASE[hd.phase]} · 还需 ${Math.round(hd.left)} 小时</div>` : '';
    return `<div class="cap ${cls}${none && cls === '' ? ' none hatch' : ''}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" data-id="${id}">
      <div class="l1"><span class="n">${hd.name}</span><span class="v">${hd.sets}/${hd.mav}</span></div>${cls === 'focus' ? l2 : ''}<div class="bar"><i style="width:${fill}%"></i></div></div>`;
  }

  // 一列胶囊：放大镜在焦点处，邻居按余弦衰减；返回每个胶囊的位置
  function capColumn(ids, o) {
    const n = ids.length, fi = ids.indexOf(FOCUS()), g = 3;
    const H = { focus: 60, near: 36 };
    const base = Math.min(30, (o.bottom - o.top - H.focus - 2 * H.near - g * (n - 1)) / (n - 3));
    let y = o.top; const out = [];
    ids.forEach((id, i) => {
      const d = Math.abs(i - fi), cls = d === 0 ? 'focus' : d === 1 ? 'near' : '';
      const h = cls ? H[cls] : base, grow = cls === 'focus' ? 26 : cls === 'near' ? 10 : 0;
      out.push({ id, cls, x: o.x - grow, y, w: o.w + grow, h });
      y += h + g;
    });
    return out;
  }

  function leadersSvg(caps, A, o = {}) {
    const lines = caps.map((c, k) => {
      const a = A[c.id]; if (!a) return '';
      const cy = c.y + c.h / 2, ex = (o.elbow ?? c.x - 8) - (k % 4) * 3, on = c.cls === 'focus';
      return `<polyline points="${a[0]},${a[1]} ${ex},${a[1]} ${ex},${cy} ${c.x},${cy}" fill="none" stroke="${on ? '#111' : '#A9A9A5'}" stroke-width="${on ? 1.6 : 0.8}"/>
        <circle cx="${a[0]}" cy="${a[1]}" r="${on ? 4 : 2.2}" fill="${on ? '#111' : '#8E8E8A'}"/>`;
    }).join('');
    return `<svg class="leaders" width="360" height="800">${lines}</svg>`;
  }

  const legend = `<div class="legend"><span><i style="background:${LEVEL_FILL.none}" class="hatch"></i>未练</span><span><i style="background:${LEVEL_FILL.low}"></i>不足</span><span><i style="background:${LEVEL_FILL.ok}"></i>达标</span><span><i style="background:${LEVEL_FILL.over}"></i>超量</span></div>`;
  const toggles = '<span class="seg"><span class="on">正面</span><span>背面</span></span> <span class="seg"><span class="on">男</span><span>女</span></span>';
  const kpi = () => { const k = P06.done.kpi; return `近 7 天 · <b class="t-num">${k[0]}</b> kg · <b class="t-num">${k[1]}</b> 组 · <b class="t-num">${k[2]}</b> 天`; };
  const sortByAnchor = (A) => Object.keys(A).sort((a, b) => A[a][1] - A[b][1] || A[a][0] - A[b][0]);

  const BODY = {
    W1: {
      title: '半身贴边 + 宽胶囊列',
      note: '<em>最接近 V1 的取舍</em>：半身贴左边约 35%，胶囊列约 65%，引线一一对应。标题、正背、男女收进一行，摘要和图例各占一条细行。胶囊全部一屏放下，不用下翻；代价是静止胶囊较矮（约 22 px），名称只能用小字。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="row"><div class="t-title">身体</div><div class="sp"></div>${toggles}</div>
        <div class="t-s" style="margin-top:8px" data-a="1x">${kpi()}</div><div style="margin-top:6px">${legend}</div></div>
        <div class="fig" data-fig></div><div data-layer></div>${nav('body')}`,
      post(s) {
        const A = mountFigure(s, { x: 0, y: 128, h: 570 });
        const caps = capColumn(sortByAnchor(A), { x: 162, w: 182, top: 122, bottom: 712 });
        s.querySelector('[data-layer]').innerHTML = leadersSvg(caps, A) + caps.map((c) => capHtml(c.id, c.cls, c.x, c.y, c.w, c.h)).join('');
        const f = caps.find((c) => c.cls === 'focus');
        s.querySelector('[data-layer]').insertAdjacentHTML('beforeend', `<div class="touch" style="left:${344 - 12}px;top:${f.y + f.h / 2 - 23}px"></div>
          <div data-a="1" class="abs" style="left:${f.x - 4}px;top:122px;width:${344 - f.x + 8}px;height:590px"></div>
          <div data-a="2" class="abs" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px"></div>`);
      },
    },
    W2: {
      title: '胶囊为主 + 半身索引',
      note: '<em>数据最大化</em>：胶囊按部位分组、两列铺满，名称和数字最大；左侧一条窄半身只做索引，跟随手指高亮。代价：没有引线，「哪块肌肉在哪」要靠索引高亮；放大镜在两列网格里变成「就地展开」，要重新验证手感。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="row"><div class="t-title">身体</div><div class="sp"></div>${toggles}</div>
        <div class="row" style="margin-top:8px"><div class="t-s">${kpi()}</div></div><div style="margin-top:6px">${legend}</div></div>
        <div class="fig" data-fig></div><div data-layer></div>${nav('body')}`,
      post(s) {
        const A = mountFigure(s, { x: 0, y: 128, h: 330 });
        const order = ['shoulders', 'chest', 'arms', 'core', 'back', 'lower'];
        const ids = sortByAnchor(A);
        let y = 124, html = '';
        const X = 96, W = 248, cw = (W - 6) / 2;
        for (const r of order) {
          const g = ids.filter((id) => REGION[id] === r);
          if (!g.length) continue;
          html += `<div class="t-s abs" style="left:${X}px;top:${y}px;font-weight:700;color:#444">${RNAME[r]}</div>`; y += 18;
          let col = 0;
          for (const id of g) {
            if (id === FOCUS()) {
              if (col) { y += 33; col = 0; }
              html += capHtml(id, 'focus', X, y, W, 58) + `<div class="touch" style="left:${344 - 12}px;top:${y + 6}px"></div><div data-a="2" class="abs" style="left:${X}px;top:${y}px;width:${W}px;height:58px"></div>`;
              y += 62; continue;
            }
            html += capHtml(id, '', X + col * (cw + 6), y, cw, 30);
            col = 1 - col; if (!col) y += 33;
          }
          if (col) y += 33;
          y += 4;
        }
        html += `<div data-a="1" class="abs" style="left:${X - 4}px;top:122px;width:${W + 8}px;height:${y - 122}px"></div>`;
        s.querySelector('[data-layer]').innerHTML = html;
      },
    },
    W3: {
      title: '大幅半身作背景',
      note: '<em>氛围最强</em>：半身放大、压暗作背景，胶囊叠在右侧，摘要浮在左上。整页最像「标志性视觉页」。代价：人体和胶囊重叠，胶囊要有底色才读得清；人体抢眼程度最高，需要在表现层把它压得足够暗。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="row"><div class="t-title">身体</div><div class="sp"></div>${toggles}</div></div>
        <div class="fig" data-fig></div>
        <div class="abs" style="left:16px;top:80px;width:120px" data-a="1x"><div class="t-s">近 7 天</div><div class="t-l">${P06.done.kpi[1]}<span class="t-s"> 组</span></div><div class="t-s" style="margin-top:2px">${P06.done.kpi[0]} kg · ${P06.done.kpi[2]} 天</div></div>
        <div data-layer></div><div class="abs" style="left:16px;bottom:94px">${legend}</div>${nav('body')}`,
      post(s) {
        const A = mountFigure(s, { x: 0, y: 70, h: 660, dim: 0.45 });
        const caps = capColumn(sortByAnchor(A), { x: 168, w: 176, top: 140, bottom: 664 });
        s.querySelector('[data-layer]').innerHTML = leadersSvg(caps, A) + caps.map((c) => capHtml(c.id, c.cls, c.x, c.y, c.w, c.h)).join('');
        const f = caps.find((c) => c.cls === 'focus');
        s.querySelector('[data-layer]').insertAdjacentHTML('beforeend', `<div class="touch" style="left:${344 - 12}px;top:${f.y + f.h / 2 - 23}px"></div>
          <div data-a="1" class="abs" style="left:${f.x - 4}px;top:138px;width:${344 - f.x + 8}px;height:530px"></div>
          <div data-a="2" class="abs" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px"></div>`);
      },
    },
  };

  // ---------- 首页 ----------
  const H = () => D.home;
  const homeHead = () => `<div class="t-s">${H().date}</div><div class="row" style="margin-top:2px"><div class="t-title">今日处方</div><div class="sp"></div><span class="t-s" style="text-decoration:underline">为什么是这些</span></div>`;
  const stateSlot = (h = 34) => `<div class="slot" style="height:${h}px;margin-top:10px">状态条位置：建议减量 / 减量周 · 还剩 N 天；恢复日、动作池不足时整块替换下面的清单</div>`;
  const startBtn = '<div class="abs" style="left:16px;right:16px;bottom:94px;z-index:5" data-a="2"><div class="btn">开始训练</div></div>';
  const allItems = () => H().groups.flatMap((g) => g.items.map((it) => ({ ...it, region: g.region })));
  const HOME = {
    W1: {
      title: '清单优先',
      note: '<em>最稳妥</em>：按部位分组的完整清单，每行一眼看到「动作 · 组次 · 建议重量 · 理由」，开始按钮固定在底部。5 个动作一屏放得下；动作多（高阶 9 个）时要下翻。',
      html: () => `${status}<div class="pad" style="padding-top:10px">${homeHead()}<div class="t-b" style="margin-top:6px">${H().summary} — ${H().count}</div>${stateSlot()}
        <div data-a="1" style="margin-top:10px">${H().groups.map((g) => `<div class="t-s" style="margin:8px 0 4px;font-weight:700">${g.region}</div>${g.items.map((it) => `
          <div class="box row" style="padding:8px 12px;margin-bottom:6px;min-height:56px"><div style="flex:1;min-width:0"><div class="t-h">${it.name}</div><div class="t-s">${it.plan} · ${it.why}</div></div><div>${kg(it.kg, 't-l')}</div></div>`).join('')}`).join('')}</div></div>
        ${startBtn}${nav('home')}`,
    },
    W2: {
      title: '第一个动作做主角',
      note: '<em>开练导向</em>：第一个动作做成大卡（重量最大字号），其余压成紧凑清单，摘要变成三个小标签。打开就知道「先做什么、用多重」。代价：整体结构（几块肌肉、总量）退到次要位置。',
      html: () => {
        const [first, ...rest] = allItems();
        return `${status}<div class="pad" style="padding-top:10px">${homeHead()}
          <div class="row" style="margin-top:8px;flex-wrap:wrap"><span class="chip">5 个动作</span><span class="chip">13 组</span><span class="chip">${H().summary}</span></div>${stateSlot()}
          <div class="dark" style="margin-top:10px;padding:16px" data-a="1"><div class="t-s" style="color:#bbb">第 1 个 · ${first.region}</div><div class="t-h" style="font-size:18px;margin-top:2px">${first.name}</div>
            <div class="row" style="margin-top:10px;align-items:baseline"><span class="t-xl">${first.kg}</span><span class="t-b"> kg</span><div class="sp"></div><span class="t-h">${first.plan}</span></div><div class="t-s" style="color:#bbb;margin-top:8px">${first.why}</div></div>
          <div class="t-s" style="margin:12px 0 4px;font-weight:700">接下来</div>
          ${rest.map((it) => `<div class="row" style="height:44px;border-bottom:1px solid #DEDED9"><div style="flex:1"><div class="t-b" style="font-weight:700">${it.name}</div><div class="t-s">${it.region} · ${it.plan}</div></div>${kg(it.kg, 't-h')}</div>`).join('')}</div>
          ${startBtn}${nav('home')}`;
      },
    },
    W3: {
      title: '今日总量 + 时间线',
      note: '<em>总量可视化</em>：顶部把 13 组画成 13 个格子（按动作分段），和导航外圈的进度同一个口径；下面是竖向时间线。代价：建议重量不是最大的视觉，理由要点开动作才看到。',
      html: () => {
        const it = allItems();
        return `${status}<div class="pad" style="padding-top:10px">${homeHead()}
          <div class="row" style="margin-top:10px;align-items:baseline" data-a="1x"><span class="t-xl">13</span><span class="t-b">组</span><span class="t-s" style="margin-left:8px">${H().summary} · 5 个动作</span></div>
          <div class="row" style="margin-top:10px;gap:10px">${it.map((x) => `<span style="display:inline-flex;gap:3px">${'<i class="sq"></i>'.repeat(x.sets)}</span>`).join('')}</div>${stateSlot(30)}
          <div data-a="1" style="margin-top:12px;position:relative;padding-left:22px"><div style="position:absolute;left:6px;top:8px;bottom:22px;width:2px;background:#D3D3CF"></div>
          ${it.map((x, i) => `<div style="position:relative;margin-bottom:12px"><i style="position:absolute;left:-21px;top:5px;width:12px;height:12px;border-radius:50%;background:${i ? '#FAFAF8' : '#2b2b29'};border:2px solid #2b2b29"></i>
            <div class="row"><div class="t-h">${x.name}</div><div class="sp"></div>${kg(x.kg, 't-h')}</div><div class="t-s">${x.region} · ${x.plan}</div></div>`).join('')}</div></div>
          ${startBtn}${nav('home')}`;
      },
    },
  };

  // ---------- 增量 ----------
  const G = () => D.gains;
  const gainsRow = (r, big = false) => `<div class="row" style="height:${big ? 52 : 50}px;border-bottom:1px solid #DEDED9">
      <div style="flex:1;min-width:0"><div class="row" style="gap:6px"><span class="t-b" style="font-weight:700">${r.name}</span>${r.pr ? '<span class="badge">PR</span>' : ''}</div><div class="t-s">预估 1RM ${r.e1rm} kg · ${delta(r.delta)}</div></div>
      ${spark(r.spark, 44)}<div style="width:112px;text-align:right"><div class="t-s">下次</div><div class="t-b t-num">${r.next}</div></div></div>`;
  const chips = () => `<div class="row" style="gap:6px;overflow:hidden">${['全部', '下肢', '背', '胸', '肩', '手臂', '核心'].map((c, i) => `<span class="chip${i ? '' : ' on'}">${c}</span>`).join('')}</div>`;
  const deloadSlot = () => `<div class="slot" style="height:30px;margin-top:10px">${G().deload} · 建议减量时变成可点的提示条（同首页的减量面板）</div>`;
  const GAINS = {
    W1: {
      title: '英雄数字 + 列表',
      note: '<em>常规且清楚</em>：近 4 周 PR 次数做主角，旁边是上升 / 持平 / 下降；下面每个动作一行：预估 1RM、变化、迷你曲线、下次目标。筛选按部位。代价：「下一步该做什么」散在每一行右侧，不够突出。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="t-title">增量</div>
        <div class="row" style="margin-top:10px;align-items:flex-end" data-a="1x"><div><div class="t-s">近 4 周</div><div class="row" style="align-items:baseline;gap:4px"><span class="t-xl">${G().pr28}</span><span class="t-b">次 PR</span></div></div><div class="sp"></div>
          <div class="t-s" style="text-align:right;line-height:1.7">上升 <b class="t-num">${G().up}</b><br>持平 <b class="t-num">${G().flat}</b><br>下降 <b class="t-num">${G().down}</b></div></div>
        ${deloadSlot()}<div style="margin-top:10px">${chips()}</div><div data-a="1" style="margin-top:6px">${G().rows.map((r) => gainsRow(r)).join('')}</div></div>${nav('gains')}`,
    },
    W2: {
      title: '按引擎结论分组',
      note: '<em>最贴「增量引擎」</em>：按下次建议分成「该加重 / 保持 / 该减重」三组（就是引擎 suggest 的 add / hold / cut），每行把下次目标做成最显眼的数字。一眼知道这周哪些动作要上重量。代价：同一部位的动作被拆散到不同组。',
      html: () => {
        const grp = [['add', '该加重'], ['hold', '保持，次数 +1'], ['cut', '该减重']];
        return `${status}<div class="pad" style="padding-top:10px"><div class="t-title">增量</div>
          <div class="t-s" style="margin-top:6px">近 4 周 PR <b class="t-num">${G().pr28}</b> 次 · 上升 ${G().up} · 持平 ${G().flat} · 下降 ${G().down}</div>${deloadSlot()}
          <div data-a="1">${grp.map(([k, n]) => { const rs = G().rows.filter((r) => r.kind === k); return `<div class="row" style="margin:14px 0 4px"><span class="t-h">${n}</span><span class="t-s">· ${rs.length}</span></div>
            ${rs.map((r) => `<div class="box row" style="padding:8px 12px;margin-bottom:6px"><div style="flex:1"><div class="row" style="gap:6px"><span class="t-b" style="font-weight:700">${r.name}</span>${r.pr ? '<span class="badge">PR</span>' : ''}</div><div class="t-s">预估 1RM ${r.e1rm} kg · ${delta(r.delta)}</div></div><div style="text-align:right"><div class="t-s">下次</div><div class="t-h t-num">${r.next}</div></div></div>`).join('')}`; }).join('')}</div></div>${nav('gains')}`;
      },
    },
    W3: {
      title: '两列卡片 + 曲线',
      note: '<em>趋势最直观</em>：三块摘要格子 + 两列卡片，每张卡有一条较大的曲线。适合「看走势」；代价：一屏只放得下 6–8 个动作，动作多时要下翻，「下次目标」退到卡片底部。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="t-title">增量</div>
        <div class="row" style="margin-top:10px;gap:8px" data-a="1x">${[['近 4 周 PR', G().pr28], ['上升', G().up], ['下降', G().down]].map(([a, b]) => `<div class="fill" style="flex:1;padding:8px 10px"><div class="t-s">${a}</div><div class="t-l">${b}</div></div>`).join('')}</div>
        ${deloadSlot()}<div style="margin-top:10px">${chips()}</div>
        <div data-a="1" style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px">${G().rows.slice(0, 6).map((r) => `<div class="box" style="padding:8px 10px;height:104px">
          <div class="row" style="gap:4px"><span class="t-b" style="font-weight:700;white-space:nowrap;overflow:hidden">${r.name}</span>${r.pr ? '<span class="badge">PR</span>' : ''}</div>
          <div class="row" style="align-items:baseline;gap:6px"><span class="t-h t-num">${r.e1rm}</span><span class="t-s">${delta(r.delta)}</span></div>${spark(r.spark, 140, 24)}<div class="t-s">下次 ${r.next}</div></div>`).join('')}</div></div>${nav('gains')}`,
    },
  };

  // ---------- 记录 ----------
  const logRow = (r) => `<div class="box row" style="padding:8px 12px;margin-bottom:6px;min-height:54px"><div style="flex:1"><div class="row" style="gap:6px"><span class="t-b" style="font-weight:700">${r.date}</span><span class="t-s">${r.regions}</span></div><div class="t-s">${r.meta}</div></div>
    <div style="text-align:right"><div class="t-b t-num">${r.load}</div>${r.pr ? `<span class="badge">PR ×${r.pr}</span>` : ''}</div></div>`;
  const LOG = {
    W1: {
      title: '按周分组 + 每周合计',
      note: '<em>和「近 7 天」口径对齐</em>：按周分组，每周标题右侧是合计（次数 · 组数 · 总负荷），回答「这周练得怎么样」。代价：按周分组在记录很少时显得空。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="t-title">记录</div><div data-a="1">
        ${D.log.weeks.map((w) => `<div class="row" style="margin:12px 0 6px"><span class="t-s" style="font-weight:700;color:#444">${w.label}</span><div class="sp"></div><span class="t-s">${w.total}</span></div>${w.rows.map(logRow).join('')}`).join('')}</div></div>${nav('log')}`,
    },
    W2: {
      title: '本周周历 + 列表',
      note: '<em>一眼看出勤</em>：顶部一条本周 7 天的周历（练过的日子打点），下面是时间倒序的列表。注意：完整的出勤热力图属于 P1，这里只是一条周历。代价：周历只覆盖本周。',
      html: () => {
        const days = ['一', '二', '三', '四', '五', '六', '日'], dates = [28, 29, 30, 1, 2, 3, 4];
        return `${status}<div class="pad" style="padding-top:10px"><div class="t-title">记录</div>
          <div class="box" style="margin-top:10px;padding:10px 8px" data-a="1x"><div class="row" style="justify-content:space-between">${days.map((d, i) => `<div style="width:38px;text-align:center"><div class="t-s">${d}</div>
            <div style="margin:4px auto 0;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;${i < 2 ? 'background:#2b2b29;color:#FAFAF8;font-weight:700' : i === 5 ? 'border:1.5px solid #2b2b29' : 'color:#8a8a86'}">${dates[i]}</div></div>`).join('')}</div>
            <div class="t-s" style="margin-top:8px;text-align:center">本周 ${D.log.weeks[0].total}</div></div>
          <div data-a="1" style="margin-top:10px">${D.log.weeks.flatMap((w) => w.rows).map(logRow).join('')}</div></div>${nav('log')}`;
      },
    },
  };

  // ---------- 我的 ----------
  const meRows = (groups) => groups.map((g) => `<div class="t-s" style="margin:12px 0 4px;font-weight:700">${g.title}</div><div class="box">${g.rows.map(([a, b], i) => `<div class="row" style="height:38px;padding:0 12px;${i ? 'border-top:1px solid #EEE' : ''}"><span class="t-b"${a === '清除全部数据' ? ' style="color:#b03"' : ''}>${a}</span><div class="sp"></div><span class="t-s" style="max-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b}</span><span class="t-s">›</span></div>`).join('')}</div>`).join('');
  const ME = {
    W1: {
      title: '档案卡 + 分组列表',
      note: '<em>主流设置页</em>：顶部档案卡一句话说清当前档案，下面分组列表（档案 / 导航 / 数据 / 关于）。最熟悉、最省心；代价：视觉上最平淡，档案卡和下面「档案」分组有重复。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="t-title">我的</div>
        <div class="box row" style="margin-top:10px;padding:12px" data-a="1"><div style="width:44px;height:44px;border-radius:50%;background:#D3D3CF"></div><div><div class="t-h">进阶 · 60 分钟 · 6 类器械 · 男</div><div class="t-s">慢慢变牛。</div></div></div>
        <div data-a="2">${meRows(D.me.groups)}</div></div>${nav('me')}`,
    },
    W2: {
      title: '档案四格 + 列表',
      note: '<em>档案即入口</em>：四项档案做成 2×2 大格子，点哪格改哪项（底部面板）；下面只剩导航、数据、关于三组。少一层重复，改档案最快；代价：器械那格只能写「6 类」，详情要点进去看。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="t-title">我的</div>
        <div data-a="1" style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px">${D.me.facts.map(([a, b]) => `<div class="box" style="padding:12px;height:76px"><div class="t-s">${a}</div><div class="t-l" style="font-size:22px;margin-top:6px">${b}</div></div>`).join('')}</div>
        <div data-a="2">${meRows(D.me.groups.slice(1))}</div></div>${nav('me')}`,
    },
  };

  // ---------- 我的 v1.4：并入成长层（P11）+ 牛龄页（P13），阶段 6d ----------
  // 数字取自成长引擎的演示用户形状（壮牛 2 级、连胜 9 周……）；线框只比布局。
  // 离下一级用「再涨 X kg」这种可行动的说法，不写抽象经验值（ia §1.14）。
  const GROW = {
    stage: '壮牛', sub: 2, pct: 62, lift: '再涨 3 kg 杠铃卧推的预估 1RM', cycle: '或再完成 1 个训练周期',
    streak: 9, done: 2, target: 4, freeze: 1, niujin: '6,060',
    weeks: ['kept', 'kept', 'deload', 'kept', 'kept', 'kept', 'missed', 'frozen', 'kept', 'kept', 'kept', 'open'],
    log: [['10/2', '升级：壮牛 2 级', '+100'], ['9/28', '连胜 8 周', '+100'], ['9/22', 'PR：杠铃深蹲 142 → 145 kg', '+30'], ['9/14', '完成第 5 个训练周期', '+200'], ['9/8', '守约周（减量周）', '+50']],
  };
  const cow = (w, h, o = {}) => `<div class="slot" style="width:${w}px;height:${h}px;flex:none;padding:0;${o.round === false ? '' : 'border-radius:50%;'}${o.dark ? 'color:#BDBDB9;border-color:#777;' : ''}">小牛</div>`;
  const wk = (st) => {
    const css = {
      kept: 'background:#2b2b29', deload: 'background:#8E8E8A',
      frozen: 'background-color:#D3D3CF;background-image:repeating-linear-gradient(135deg,#8E8E8A 0 2px,transparent 2px 6px)',
      missed: 'border:1.5px dashed #A9A9A5', open: 'border:2px solid #2b2b29;background:#EFEFEC',
    }[st];
    return `<i style="width:20px;height:20px;border-radius:5px;display:inline-block;flex:none;${css}"></i>`;
  };
  const wkStrip = () => `<div class="row" style="gap:6px">${GROW.weeks.map(wk).join('')}</div>
    <div class="t-s" style="margin-top:6px">实心 = 守约 · 灰 = 减量周 · 斜纹 = 冻结卡抵掉 · 虚线 = 没守约 · 粗框 = 本周</div>`;
  const me2Groups = (noBalance) => [
    { title: '钱包与会员', rows: [['钱包 · 商城', noBalance ? '' : `${GROW.niujin} 牛劲`], ['会员', '未开通'], ['消息', '3 条新']] },
    { title: '导航', rows: [['显示今日进度环', '开'], ['显示休息倒计时描边', '开'], ['休息结束提示', '描边 + 振动']] },
    { title: '数据', rows: [['载入示例数据', ''], ['导出 CSV', ''], ['演示：会员状态', '非会员'], ['清除全部数据', '']] },
    { title: '关于', rows: [['人体图与动作示范', 'MuscleWiki'], ['版本', '0.1.0']] },
  ];
  const tile = (a, b, h) => `<div class="box" style="padding:10px 12px;height:${h}px"><div class="t-s">${a}</div><div class="t-l" style="font-size:20px;margin-top:6px">${b}</div></div>`;
  const tiles = (h) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${[['训练经验', '进阶'], ['单次时长', '60 分钟'], ['可用器械', '6 类'], ['体型示意', '男 · 72 kg']].map(([a, b]) => tile(a, b, h)).join('')}</div>`;
  const ME2 = {
    W1: {
      title: '牛龄行置顶 + 档案四格',
      note: '<em>牛龄行置顶（最稳）</em>：在你选的「档案四格」上面加一条牛龄行——小牛头像 + 壮牛 2 级 + 进度条 + 连胜 9 周，点进牛龄页；下面是原来的四格和分组列表（钱包与会员 / 导航 / 数据 / 关于）。改动最小，你选过的结构不变。代价：成长只占一行，存在感弱。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="t-title">我的</div>
        <div class="box row" style="margin-top:10px;padding:10px 12px;gap:12px" data-a="1">${cow(48, 48)}<div style="flex:1;min-width:0"><div class="row"><span class="t-h">${GROW.stage} · ${GROW.sub} 级</span><div class="sp"></div><span class="t-b t-num">连胜 ${GROW.streak} 周</span></div><div class="bar" style="margin-top:8px"><i style="width:${GROW.pct}%"></i></div><div class="t-s" style="margin-top:4px">${GROW.lift}，升 1 小级</div></div><span class="t-s">›</span></div>
        <div data-a="2" style="margin-top:10px">${tiles(68)}</div>
        ${meRows(me2Groups(false))}</div>${nav('me')}`,
    },
    W2: {
      title: '成长卡做主角',
      note: '<em>成长最显眼</em>：顶部一张深色大卡——小牛、牛龄、进度条、「再涨 3 kg…」，下面三个数（连胜 · 本周 · 牛劲），点整张进牛龄页；档案四格缩矮放在下面。小牛是产品的情感点，这版把它放到最大。代价：档案被挤到第一屏下半，改档案要多滑一下。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="t-title">我的</div>
        <div class="dark" style="margin-top:10px;padding:14px" data-a="1"><div class="row" style="gap:12px">${cow(56, 56, { dark: true })}<div style="flex:1"><div class="t-h" style="color:#FAFAF8;font-size:17px">${GROW.stage} · ${GROW.sub} 级</div><div class="bar" style="margin-top:8px;background:#555"><i style="width:${GROW.pct}%;background:#FAFAF8"></i></div></div></div>
          <div class="t-s" style="margin-top:8px;color:#D3D3CF">${GROW.lift}，升 1 小级</div>
          <div style="height:1px;background:#4a4a47;margin:12px 0"></div>
          <div class="row" style="justify-content:space-between">${[[GROW.streak, ' 周', '连胜'], [`${GROW.done} / ${GROW.target}`, ' 次', '本周'], [GROW.niujin, '', '牛劲']].map(([n, u, l]) => `<div><div class="t-l" style="font-size:22px;color:#FAFAF8">${n}<span class="t-b">${u}</span></div><div class="t-s" style="color:#BDBDB9;margin-top:2px">${l}</div></div>`).join('')}<span class="t-s" style="color:#BDBDB9">›</span></div></div>
        <div class="t-s" style="margin:14px 0 6px;font-weight:700">档案</div><div data-a="2">${tiles(64)}</div>
        ${meRows(me2Groups(true))}</div>${nav('me')}`,
    },
    W3: {
      title: '档案四格在上 + 成长横带',
      note: '<em>档案仍是第一入口</em>：你选定的「档案四格」原样放最上，下面夹一条成长横带（小牛头像 · 壮牛 2 级 | 连胜 9 周 | 牛劲 6,060），整条可点进牛龄页；列表往上提。成长比 W1 更有分量，又不抢档案。代价：成长在第一屏中部，不如 W2 抢眼。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="t-title">我的</div>
        <div data-a="1" style="margin-top:10px">${tiles(76)}</div>
        <div class="box row" style="margin-top:10px;padding:8px 12px;gap:10px;height:56px" data-a="2">${cow(36, 36)}<div><div class="t-h">${GROW.stage} · ${GROW.sub} 级</div><div class="t-s">连胜 ${GROW.streak} 周</div></div><div class="sp"></div><div style="text-align:right"><div class="t-h t-num">${GROW.niujin}</div><div class="t-s">牛劲</div></div><span class="t-s">›</span></div>
        ${meRows(me2Groups(true))}</div>${nav('me')}`,
    },
  };

  const subTop = (t) => `<div class="row pad" style="height:44px;gap:10px"><span class="t-l" style="font-size:22px">‹</span><span class="t-h">${t}</span></div>`;
  const statRow = (items) => `<div class="row" style="justify-content:space-around;text-align:center">${items.map(([n, u, l]) => `<div><div class="t-l" style="font-size:24px">${n}<span class="t-b">${u}</span></div><div class="t-s" style="margin-top:2px">${l}</div></div>`).join('')}</div>`;
  const logRows = (n) => GROW.log.slice(0, n).map(([d, t, v], i) => `<div class="row" style="height:40px;${i ? 'border-top:1px solid #EEE' : ''}"><span class="t-s" style="width:34px">${d}</span><span class="t-b">${t}</span><div class="sp"></div><span class="t-s t-num">${v}</span></div>`).join('');
  const delNote = '<div class="t-s" style="margin-top:10px;line-height:1.5">删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。</div>';
  const STEPS = [[GROW.streak, ' 周', '连胜'], [`${GROW.done} / ${GROW.target}`, ' 次', '本周'], [GROW.freeze, ' 张', '冻结卡']];
  const LEVEL = {
    W1: {
      title: '小牛为主角（纵向叙事）',
      note: '<em>像读一页「小牛成长日记」</em>：上面一块大舞台——小牛、壮牛 2 级、进度条、「再涨 3 kg 杠铃卧推的预估 1RM」；下面依次是连胜三格、最近 12 周点阵、成长记录。代价：长期成长和短期连胜是上下关系，连胜被压在第二屏。',
      html: () => `${status}${subTop('牛龄')}<div class="pad">
        <div class="fill" style="padding:14px 16px 16px;text-align:center" data-a="1"><div class="slot" style="width:160px;height:120px;margin:0 auto">小牛 PNG（${GROW.stage}）</div>
          <div class="t-title" style="margin-top:10px">${GROW.stage} · ${GROW.sub} 级</div><div class="bar" style="margin-top:10px;height:6px"><i style="width:${GROW.pct}%"></i></div>
          <div class="t-b" style="margin-top:10px">${GROW.lift}，升 1 小级</div><div class="t-s" style="margin-top:2px">${GROW.cycle}</div></div>
        <div class="box" style="margin-top:12px;padding:12px">${statRow(STEPS)}</div>
        <div class="t-s" style="margin:14px 0 6px;font-weight:700">最近 12 周</div>${wkStrip()}
        <div class="t-s" style="margin:14px 0 2px;font-weight:700">成长记录</div>${logRows(4)}${delNote}</div>`,
    },
    W2: {
      title: '双轨并列',
      note: '<em>牛龄（长期）和连胜（短期）左右等权</em>：一眼看到两条线；下面一条「下一级」目标，再往下是成长记录（可按 全部 / 守约周 / 升级 筛）。对应产品里「牛龄 = 等级、连胜 = 粘性」的双轨设计。代价：小牛变小了，情感冲击弱。',
      html: () => `${status}${subTop('牛龄')}<div class="pad">
        <div class="row" style="gap:8px;align-items:stretch" data-a="1">
          <div class="box" style="flex:1;padding:12px;text-align:center;display:flex;flex-direction:column;align-items:center">${cow(64, 64)}<div class="t-h" style="margin-top:8px">${GROW.stage} · ${GROW.sub} 级</div><div class="bar" style="margin-top:8px;width:100%"><i style="width:${GROW.pct}%"></i></div><div class="t-s" style="margin-top:6px">牛龄 · 长期</div></div>
          <div class="box" style="flex:1;padding:12px;text-align:center"><div class="t-xl" style="margin-top:6px">${GROW.streak}<span class="t-b"> 周</span></div><div class="t-s" style="margin-top:8px">连胜 · 本周 ${GROW.done} / ${GROW.target} 次</div>
            <div class="row" style="justify-content:center;gap:4px;margin-top:10px">${[1, 1, 0, 0].map((f) => `<i style="width:14px;height:14px;border-radius:50%;display:inline-block;${f ? 'background:#2b2b29' : 'border:1.5px solid #A9A9A5'}"></i>`).join('')}</div><div class="t-s" style="margin-top:8px">冻结卡 ${GROW.freeze} 张</div></div></div>
        <div class="fill" style="margin-top:10px;padding:10px 12px"><div class="t-b"><b>下一级</b>：${GROW.lift}</div><div class="t-s" style="margin-top:2px">${GROW.cycle}</div></div>
        <div class="row" style="margin:14px 0 6px"><span class="t-s" style="font-weight:700">成长记录</span><div class="sp"></div><div class="seg"><span class="on">全部</span><span>守约周</span><span>升级</span></div></div>
        ${logRows(5)}${delNote}</div>`,
    },
    W3: {
      title: '阶梯路线图',
      note: '<em>强调「还能长到哪儿」</em>：把 5 段 × 3 小级画成一座竖梯，你站在「壮牛 2 级」上，上面是还没到的公牛 / Milo（灰），下面是已走过的（✓）；连胜压成顶部一条。代价：梯子占地方，周点阵和记录被压到下半屏；5 段名字要一眼认得出。',
      html: () => {
        const names = ['Milo', '公牛', '壮牛', '小牛', '牛犊'], cur = 2;
        const pip = (on, now) => `<i style="width:14px;height:14px;border-radius:4px;display:inline-block;${now ? 'background:#2b2b29;box-shadow:0 0 0 3px #C9C9C5' : on ? 'background:#2b2b29' : 'border:1.5px solid #A9A9A5'}"></i>`;
        const ladder = names.map((n, k) => {
          const lv = 4 - k, done = lv < cur, isCur = lv === cur;
          const pips = [1, 2, 3].map((s) => pip(done || (isCur && s <= GROW.sub), isCur && s === GROW.sub)).join('');
          return `<div class="row" style="height:${isCur ? 84 : 52}px;padding:0 12px;gap:12px;${k ? 'border-top:1px solid #EEE;' : ''}${isCur ? 'background:#EFEFEC;' : ''}${!done && !isCur ? 'color:#8a8a86;' : ''}">
            ${isCur ? cow(48, 48) : `<span class="t-h" style="width:48px;text-align:center">${done ? '✓' : ''}</span>`}
            <div style="flex:1"><div class="t-h">${n}</div>${isCur ? `<div class="t-s">${GROW.lift}，升 1 小级</div>` : ''}</div><div class="row" style="gap:4px">${pips}</div></div>`;
        }).join('');
        return `${status}${subTop('牛龄')}<div class="pad">
          <div class="box" style="padding:10px 12px">${statRow(STEPS)}</div>
          <div class="box" style="margin-top:10px;overflow:hidden" data-a="1">${ladder}</div>
          <div class="t-s" style="margin:14px 0 6px;font-weight:700">最近 12 周</div>${wkStrip()}
          <div class="t-s" style="margin:14px 0 2px;font-weight:700">成长记录</div>${logRows(2)}${delNote}</div>`;
      },
    },
  };

  // ---------- 训练进行中（无导航） ----------
  const S = () => D.session;
  const restBar = (top) => `<div class="dark abs row" style="left:16px;right:16px;${top}height:52px;padding:0 14px;border-radius:26px" data-a="1x"><span class="t-s" style="color:#ccc">休息</span><span class="t-l" style="color:#FAFAF8">${S().rest}</span><div class="sp"></div><span class="chip" style="background:none;color:#eee;border-color:#666">−15 秒</span><span class="chip" style="background:none;color:#eee;border-color:#666">+15 秒</span><span class="chip" style="background:none;color:#eee;border-color:#666">跳过</span></div>`;
  const sessHead = () => `<div class="row pad" style="height:44px"><span class="t-b">暂停</span><div class="sp"></div><span class="t-h t-num">${S().progress}</span><div class="sp"></div><span class="t-b">完成训练</span></div>
    <div class="pad row" style="gap:3px">${Array.from({ length: 13 }, (_, i) => `<i class="sq${i < 1 ? ' on' : ''}" style="flex:1;height:5px;border-radius:2px"></i>`).join('')}</div>`;
  const SESSION = {
    W1: {
      title: '当前组大卡',
      note: '<em>单手最快</em>：当前这一组做成大卡，重量和次数是全屏最大的数字，点一下就改；「完成这一组」在拇指区。休息条悬浮在底部。代价：同一动作的其他组只剩一行小字。',
      html: () => `${status}${sessHead()}<div class="pad" style="padding-top:10px"><div class="row"><div class="t-title">${S().name}</div><div class="sp"></div><span class="t-s" style="text-decoration:underline">要领</span></div><div class="t-s">${S().plan}</div>
        <div class="row t-s" style="margin-top:10px;height:28px">第 1 组 · 85 kg × 6 ✓</div>
        <div class="box" style="padding:14px;margin-top:4px" data-a="1"><div class="t-s">第 2 组</div><div class="row" style="margin-top:6px;gap:12px"><div class="fill" style="flex:1;padding:10px 12px"><span class="t-xl">85</span><span class="t-b"> kg</span></div><div class="fill" style="flex:1;padding:10px 12px"><span class="t-xl">6</span><span class="t-b"> 次</span></div></div></div>
        <div class="row t-s" style="height:28px;margin-top:4px">第 3 组 · 85 kg × 6</div>
        <div class="btn" style="margin-top:10px" data-a="2">完成这一组</div>
        <div class="t-s" style="margin:16px 0 4px;font-weight:700">接下来</div>${S().next.map((n) => `<div class="t-s" style="height:30px;border-bottom:1px solid #DEDED9;display:flex;align-items:center">${n}</div>`).join('')}</div>
        ${restBar('bottom:20px;')}`,
    },
    W2: {
      title: '组表格 + 行内键盘',
      note: '<em>全局可控</em>：整个动作的组排成表格（组 / 重量 / 次数 / 完成），当前行高亮；底部常驻行内数字键盘，改数字不弹窗。休息条在顶部。代价：数字没有 W1 大，键盘占掉下半屏。',
      html: () => `${status}${sessHead()}${restBar('top:84px;')}<div class="pad" style="padding-top:70px"><div class="row"><div class="t-title">${S().name}</div><div class="sp"></div><span class="t-s" style="text-decoration:underline">要领</span></div><div class="t-s">${S().plan}</div>
        <div class="box" style="margin-top:10px" data-a="1"><div class="row t-s" style="height:30px;padding:0 12px"><span style="width:40px">组</span><span style="flex:1">重量</span><span style="flex:1">次数</span><span>完成</span></div>
          ${S().sets.map((x) => `<div class="row" style="height:46px;padding:0 12px;border-top:1px solid #EEE;${x.active ? 'background:#EFEFEC' : ''}"><span class="t-h" style="width:40px">${x.n}</span><span class="t-l" style="flex:1;font-size:22px">${x.kg}<span class="t-s"> kg</span></span><span class="t-l" style="flex:1;font-size:22px">${x.reps}</span><span class="t-h">${x.done ? '✓' : '○'}</span></div>`).join('')}</div>
        <div class="btn" style="margin-top:10px" data-a="2">完成这一组</div></div>
        <div class="slot abs" style="left:16px;right:16px;bottom:20px;height:220px">行内数字键盘（0–9、小数点、±2.5 kg 步进），改重量 / 次数不弹窗</div>`,
    },
  };

  // ---------- 首页即打卡（2026-10-06 用户：取消独立训练页，首页就是打卡载体） ----------
  // 状态：已开始，第 1 个动作做完 2 组、正在休息；今日 13 组完成 2 组 → 导航外圈走 2/13，选中胶囊写「首页 1:35」带休息描边
  const DONE = 2, TOTAL = 13;
  const navRing = () => `<div class="fade"></div><div class="nav" data-a="3" style="border-color:#D3D3CF">${TABS.map(([k, n]) =>
      `<div class="it${k === 'home' ? ' on' : ''}" ${k === 'home' ? 'style="box-shadow:inset 0 0 0 3px #8E8E8A"' : ''}><i class="ico ${k}"></i>${k === 'home' ? '首页 1:35' : ''}</div>`).join('')}</div>
    <svg class="abs" style="left:16px;bottom:18px;z-index:7;pointer-events:none" width="328" height="60"><rect x="1" y="1" width="326" height="58" rx="29" fill="none" stroke="#1d1d1b" stroke-width="3" pathLength="100" stroke-dasharray="${(DONE / TOTAL) * 100} 100"/></svg>`;
  const ckHead = () => `<div class="t-s">${H().date} · 训练中 18 分钟</div><div class="row" style="margin-top:2px"><div class="t-title">今日处方</div><div class="sp"></div><span class="t-s" style="text-decoration:underline">结束训练</span></div>`;
  const setLine = (n, kgv, reps, st) => `<div class="row" style="height:44px;gap:10px;${st === 'cur' ? 'background:#FFF;border-radius:10px;padding:0 8px;margin:0 -8px;box-shadow:0 0 0 1.5px #2b2b29' : ''}">
      <span class="t-h" style="width:22px;color:${st === 'done' ? '#8a8a86' : '#1d1d1b'}">${n}</span>
      <span style="flex:1"><span class="t-l" style="font-size:22px;${st === 'done' ? 'color:#8a8a86' : ''};${st === 'cur' ? 'text-decoration:underline dotted;text-underline-offset:4px' : ''}">${kgv}</span><span class="t-s"> kg × </span><span class="t-l" style="font-size:22px;${st === 'done' ? 'color:#8a8a86' : ''}">${reps}</span></span>
      ${st === 'done' ? '<span class="t-h">✓</span>' : st === 'cur' ? '<span class="chip on" style="height:32px;padding:0 14px;font-size:13px;font-weight:700">打卡</span>' : '<span class="t-s">○</span>'}</div>`;
  const CHECKIN = {
    W1: {
      title: '主角卡就地打卡',
      note: '<em>改动最小</em>：首页结构不变（第一个动作做主角），开始后主角卡就地展开成组行，当前组一个「打卡」；底部大按钮变成「打卡第 3 组」，和卡里的打卡是同一件事（拇指区）。这个动作打完，下一个动作滑上来当主角。休息只在导航选中胶囊里走（「首页 1:35」+ 描边），外圈 2/13。点数字才弹键盘。代价：同时只看得到一个动作的组。',
      html: () => {
        const [first, ...rest] = allItems();
        return `${status}<div class="pad" style="padding-top:10px">${ckHead()}
          <div class="row" style="margin-top:8px;gap:3px">${Array.from({ length: TOTAL }, (_, i) => `<i class="sq${i < DONE ? ' on' : ''}" style="flex:1;height:5px;border-radius:2px"></i>`).join('')}</div>
          <div class="fill" style="margin-top:10px;padding:12px 14px" data-a="1"><div class="row"><div><div class="t-s">第 1 个 · ${first.region} · 2 / 3 组</div><div class="t-h" style="font-size:18px;margin-top:2px">${first.name}</div></div><div class="sp"></div><span class="t-s" style="text-decoration:underline">要领</span></div>
            <div style="margin-top:8px">${setLine(1, first.kg, 7, 'done')}${setLine(2, first.kg, 6, 'done')}${setLine(3, first.kg, 6, 'cur')}</div>
            <div class="t-s" style="margin-top:6px">点重量或次数改数 · 改完收起键盘</div></div>
          <div class="t-s" style="margin:12px 0 4px;font-weight:700">接下来</div>
          ${rest.slice(0, 3).map((it) => `<div class="row" style="height:44px;border-bottom:1px solid #DEDED9"><div style="flex:1"><div class="t-b" style="font-weight:700">${it.name}</div><div class="t-s">${it.region} · ${it.plan}</div></div>${kg(it.kg, 't-h')}</div>`).join('')}</div>
          <div class="abs" style="left:16px;right:16px;bottom:94px;z-index:5" data-a="2"><div class="btn">打卡第 3 组 · ${first.kg} kg × 6</div></div>${navRing()}`;
      },
    },
    W2: {
      title: '清单即打卡（全部展开）',
      note: '<em>全局一眼看完</em>：不分主角，5 个动作排成一列，每个动作一行组格子（○ 待做 / ● 已打卡），当前动作展开显示组行。点格子 = 打这一组（按预填的建议值），点数字才弹键盘；可以跳着练、换顺序。底部大按钮「打卡 · 当前动作 第 3 组」。代价：主角不突出，「今天先做什么」要看高亮行。',
      html: () => {
        const it = allItems();
        const dots = (n, d) => Array.from({ length: n }, (_, i) => `<i style="display:inline-block;width:16px;height:16px;border-radius:50%;margin-left:5px;${i < d ? 'background:#2b2b29' : 'border:1.5px solid #8E8E8A'}"></i>`).join('');
        return `${status}<div class="pad" style="padding-top:10px">${ckHead()}
          <div class="row" style="margin-top:8px;align-items:baseline"><span class="t-l">${DONE}</span><span class="t-b"> / ${TOTAL} 组</span><span class="t-s" style="margin-left:8px">${H().summary}</span></div>
          <div data-a="1" style="margin-top:8px">
            <div class="fill" style="padding:10px 12px;margin:0 -4px"><div class="row"><div style="flex:1"><div class="t-h">${it[0].name}</div><div class="t-s">${it[0].region} · ${it[0].plan}</div></div>${dots(3, 2)}</div>
              <div style="margin-top:6px">${setLine(3, it[0].kg, 6, 'cur')}</div></div>
            ${it.slice(1).map((x) => `<div class="row" style="height:52px;border-bottom:1px solid #DEDED9"><div style="flex:1"><div class="t-b" style="font-weight:700">${x.name}</div><div class="t-s">${x.region} · ${x.plan} · ${x.kg ? x.kg + ' kg' : '首次'}</div></div>${dots(x.sets, 0)}</div>`).join('')}</div></div>
          <div class="abs" style="left:16px;right:16px;bottom:94px;z-index:5" data-a="2"><div class="btn">打卡 · ${it[0].name} 第 3 组</div></div>${navRing()}`;
      },
    },
    W3: {
      title: '共用：点数字才弹键盘（W1 / W2 都用）',
      note: '两个方案共用。<em>平时没有键盘</em>：组行预填建议值，绝大多数组只点「打卡」。点重量或次数 → 底部面板弹出键盘（盖住导航），第一下覆盖、±2.5 kg、「好了」收起；首次动作的空重量在面板里先给提示，不在页面上预先报红。',
      html: () => {
        const [first] = allItems();
        return `${status}<div class="pad" style="padding-top:10px;opacity:.35">${ckHead()}<div class="fill" style="height:240px;margin-top:20px"></div></div>
          <div class="abs" style="inset:0;background:rgba(0,0,0,.28)"></div>
          <div class="abs box" style="left:0;right:0;bottom:0;border-radius:18px 18px 0 0;padding:14px 16px 18px" data-a="2">
            <div class="row"><div class="t-s">${first.name} · 第 3 组</div><div class="sp"></div><span class="t-h">好了</span></div>
            <div class="row" style="margin-top:8px;gap:10px"><div class="fill" style="flex:1;padding:10px 12px;box-shadow:0 0 0 2px #2b2b29"><span class="t-xl" style="font-size:34px">${first.kg}</span><span class="t-b"> kg</span></div><div class="fill" style="flex:1;padding:10px 12px"><span class="t-xl" style="font-size:34px">6</span><span class="t-b"> 次</span></div></div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px">${['1', '2', '3', '−2.5', '4', '5', '6', '+2.5', '7', '8', '9', '⌫', '.', '0', '', ''].map((k) => k ? `<div class="fill" style="height:44px;display:flex;align-items:center;justify-content:center" class="t-h">${k}</div>` : '<div></div>').join('')}</div></div>`;
      },
    },
  };

  // ---------- 肌头详情面板 ----------
  const focusHead = () => head(P06.focus);
  const behind = () => `${status}<div class="pad" style="padding-top:10px;opacity:.35"><div class="row"><div class="t-title">身体</div><div class="sp"></div>${toggles}</div><div class="fill" style="height:600px;margin-top:12px"></div></div><div class="abs" style="inset:0;background:rgba(0,0,0,.35)"></div>`;
  const phaseBar = (cur) => `<div class="row" style="gap:3px;margin-top:8px">${['repair', 'recovering', 'golden', 'decayed'].map((p) => `<div style="flex:1"><div style="height:8px;border-radius:4px;background:${p === cur ? '#2b2b29' : '#D3D3CF'}"></div><div class="t-s" style="margin-top:4px;${p === cur ? 'color:#1d1d1b;font-weight:700' : ''}">${PHASE[p]}</div></div>`).join('')}</div>`;
  const ruler = (h) => { const W = 100, x = (v) => (v / h.mrv) * 0.88 * W; return `<div style="position:relative;height:40px;margin-top:6px"><div style="position:absolute;left:0;right:0;top:12px;height:6px;border-radius:3px;background:#E0E0DC"></div>
    <div style="position:absolute;left:0;width:${x(h.sets)}%;top:12px;height:6px;border-radius:3px;background:#2b2b29"></div>
    ${[['最低', h.mev], ['适宜', h.mav], ['上限', h.mrv]].map(([n, v]) => `<div style="position:absolute;left:${x(v)}%;top:6px;height:18px;border-left:1.5px solid #6b6b67"></div><div class="t-s" style="position:absolute;left:${x(v)}%;top:24px;transform:translateX(-50%);white-space:nowrap">${n} ${v}</div>`).join('')}</div>`; };
  const SHEET = {
    W1: {
      title: '恢复在上、容量在下',
      note: '<em>先回答「能不能练」</em>：恢复块在上（时相条 + 恢复度 + 还需几小时），容量块在下（近 7 天组数对照三条地标的刻度尺）。阅读顺序和处方逻辑一致（规则 1：先看恢复，再看容量）。',
      html: () => { const h = focusHead(); return `${behind()}<div class="abs box" style="left:0;right:0;bottom:0;height:470px;border-radius:22px 22px 0 0;padding:10px 20px">
        <div style="width:40px;height:4px;border-radius:2px;background:#C9C9C5;margin:0 auto 12px"></div><div class="row"><div class="t-title">${h.name}</div><span class="t-s" style="margin-left:8px">胸 · 大肌群</span><div class="sp"></div><span class="t-h">×</span></div>
        <div data-a="1" style="margin-top:14px"><div class="t-s" style="font-weight:700">恢复</div><div class="row" style="align-items:baseline;gap:10px;margin-top:4px"><span class="t-xl">${Math.round(h.rec * 100)}%</span><span class="t-b">还需 ${Math.round(h.left)} 小时</span></div>${phaseBar(h.phase)}</div>
        <div class="hr" style="margin:18px 0 14px"></div><div class="t-s" style="font-weight:700">近 7 天容量</div><div class="row" style="align-items:baseline;gap:6px;margin-top:4px"><span class="t-l">${h.sets}</span><span class="t-b">组</span></div>${ruler(h)}
        <div class="t-s" style="margin-top:14px">最近一次：约 ${Math.round(h.since)} 小时前 · ${h.lastSets} 组</div></div>`; },
    },
    W2: {
      title: '恢复与容量左右并列',
      note: '<em>一屏对照</em>：恢复和容量并排成两块，各自一个大数字；时相条和刻度尺放在下面整行。面板更矮（约 360 px），背后的人体露得更多。代价：两个大数字并列，主次不如 W1 明确。',
      html: () => { const h = focusHead(); return `${behind()}<div class="abs box" style="left:0;right:0;bottom:0;height:380px;border-radius:22px 22px 0 0;padding:10px 20px">
        <div style="width:40px;height:4px;border-radius:2px;background:#C9C9C5;margin:0 auto 12px"></div><div class="row"><div class="t-title">${h.name}</div><span class="t-s" style="margin-left:8px">胸 · 大肌群</span><div class="sp"></div><span class="t-h">×</span></div>
        <div class="row" style="gap:10px;margin-top:12px" data-a="1"><div class="fill" style="flex:1;padding:12px"><div class="t-s">恢复</div><div class="t-xl" style="margin-top:4px">${Math.round(h.rec * 100)}%</div><div class="t-s" style="margin-top:4px">还需 ${Math.round(h.left)} 小时</div></div>
          <div class="fill" style="flex:1;padding:12px"><div class="t-s">近 7 天</div><div class="t-xl" style="margin-top:4px">${h.sets}<span class="t-b"> 组</span></div><div class="t-s" style="margin-top:4px">适宜 ${h.mav} 组</div></div></div>
        ${phaseBar(h.phase)}${ruler(h)}<div class="t-s" style="margin-top:6px">最近一次：约 ${Math.round(h.since)} 小时前 · ${h.lastSets} 组</div></div>`; },
    },
  };

  // ---------- 故事引导（P12 前 3 屏，阶段 6a） ----------
  // 文案按 ia §1.13；插画只用现有小牛 PNG（不画人），这里是灰阶占位
  const STORY = [
    ['米洛（Milo）每天扛起一头小牛', '古希腊的大力士，每天扛着同一头小牛走一圈。'],
    ['小牛长大，他也变强', '小牛每天只重一点点，他每天也只多扛一点点。'],
    ['Milo 告诉你：下一组，该加多少', '每次只多一点，慢慢变牛。这就是渐进超负荷。'],
  ];
  const skip = '<div class="row pad" style="height:40px"><div class="sp"></div><span class="t-b">跳过</span></div>';
  const dots = (i) => `<div class="row" style="justify-content:center;gap:6px">${[0, 1, 2].map((k) => `<i style="width:${k === i ? 18 : 6}px;height:6px;border-radius:3px;background:${k === i ? '#2b2b29' : '#C9C9C5'}"></i>`).join('')}</div>`;
  const AGE = ['牛犊', '壮牛', '公牛'], AGE_H = [90, 150, 200];
  const presc = '<div class="box" style="padding:12px 14px;margin:0 22px"><div class="t-s">下一组 · 杠铃卧推</div><div class="row" style="align-items:baseline;gap:6px;margin-top:4px"><span class="t-xl">85</span><span class="t-b">kg</span><span class="sp"></span><span class="t-h">+2.5</span></div><div class="t-s" style="margin-top:6px">上次 82.5 kg × 8 / 8 / 8，全部做到上限</div></div>';
  const storyA = (i) => ({
    title: `A · 三幕插画 · 第 ${i + 1} 屏`,
    note: i === 0 ? '<em>一屏一幕</em>：上半是大舞台，小牛按牛龄长大（牛犊 → 壮牛 → 公牛）；下半一句大标题 + 一行解释 + 进度点；按钮固定在拇指区，第 3 屏变成「开始建档」，舞台换成一张真实的处方卡（85 kg，+2.5）。代价：三屏结构相同，节奏平。' : i === 2 ? '第 3 屏把故事落到产品：处方卡 = 「下一组该加多少」。' : '',
    html: () => `${status}${skip}<div class="fill" style="margin:6px 16px 0;height:${i === 2 ? 330 : 380}px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding-bottom:18px" data-a="1">
      ${i === 2 ? `<div class="slot" style="width:120px;height:90px;margin-bottom:14px">小牛（公牛 · 开心）</div>${presc}` : `<div class="slot" style="width:${AGE_H[i] * 1.3}px;height:${AGE_H[i]}px">小牛 PNG（${AGE[i]}）</div><div style="width:80%;height:2px;background:#BDBDB9;margin-top:4px"></div>`}</div>
      <div class="pad" style="margin-top:22px"><div class="t-title" style="font-size:26px;line-height:1.25">${STORY[i][0]}</div><div class="t-b" style="margin-top:10px;color:#555;line-height:1.6">${STORY[i][1]}</div></div>
      <div class="abs" style="left:0;right:0;bottom:104px">${dots(i)}</div>
      <div class="btn abs" style="left:16px;right:16px;bottom:30px" data-a="2">${i === 2 ? '开始建档' : '下一步'}</div>`,
  });
  const storyB = (i) => ({
    title: `B · 一条成长线 · 第 ${i + 1} 屏`,
    note: i === 0 ? '<em>一个连续场景</em>：三屏是同一条地面线往右走，小牛走着走着长大；舞台底下是一把 kg 刻度尺，每屏只多一格（60 → 62.5 → 65），就是「每次只多一点」的图解。文字压在下方左对齐、字更大；点屏幕任意处前进，第 3 屏才出现按钮。代价：插画和刻度要做连续动效，工作量大一些。' : i === 2 ? '第 3 屏刻度尺停在荧光的「+2.5」，接上按钮「开始建档」。' : '',
    html: () => `${status}${skip}<div style="position:relative;height:420px;margin-top:6px" data-a="1">
      <div class="abs" style="left:0;right:0;top:300px;height:2px;background:#BDBDB9"></div>
      ${[0, 1, 2].map((k) => `<div class="slot abs" style="left:${(k - i) * 300 + 120 - AGE_H[k] * 0.4}px;top:${300 - AGE_H[k]}px;width:${AGE_H[k] * 1.3}px;height:${AGE_H[k]}px;opacity:${k === i ? 1 : 0.35}">小牛（${AGE[k]}）</div>`).join('')}
      <div class="abs row" style="left:0;right:0;top:330px;gap:0;padding:0 16px">${Array.from({ length: 13 }, (_, k) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center"><i style="width:1.5px;height:${k % 2 ? 8 : 14}px;background:${k === 4 + 2 * i ? '#1d1d1b' : '#A9A9A5'}"></i>${k % 2 ? '' : `<span class="t-s" style="margin-top:2px;${k === 4 + 2 * i ? 'color:#1d1d1b;font-weight:700' : ''}">${55 + k * 1.25}</span>`}</div>`).join('')}</div>
      <div class="abs t-h" style="left:${16 + (4 + 2 * i + 0.5) * 25.2}px;top:372px;transform:translateX(-50%)">${['60 kg', '+2.5', '+2.5'][i]}</div></div>
      <div class="pad" style="margin-top:6px"><div class="t-title" style="font-size:30px;line-height:1.2">${STORY[i][0]}</div><div class="t-b" style="margin-top:12px;color:#555;line-height:1.6">${STORY[i][1]}</div></div>
      <div class="abs" style="left:16px;bottom:${i === 2 ? 104 : 40}px">${dots(i)}</div>
      ${i === 2 ? '<div class="btn abs" style="left:16px;right:16px;bottom:30px" data-a="2">开始建档</div>' : '<div class="abs t-s" style="right:16px;bottom:38px" data-a="2">点任意处继续 →</div>'}`,
  });
  const STORYV = { W1: storyA(0), W2: storyA(1), W3: storyA(2), W4: storyB(0), W5: storyB(1), W6: storyB(2) };


  // ---------- 6e 首页补全（2026-10-07）：P04 动作要领 / 替换动作 / 热身组 / 暂停确认 ----------
  // 数据：杠铃深蹲（演示用户 85 kg × 3 × 6–8）；要领文案、肌头取自 mock/exercises.json 的同一个动作
  const SQ = { name: '杠铃深蹲', kg: 85, plan: '3 × 6–8', cue: '核心收紧，蹲到大腿平行或略低，膝盖朝脚尖方向', steps: ['杠铃放上斜方肌，脚略宽于肩、脚尖外八', '吸气屏住，屈髋屈膝同时下蹲', '蹲到大腿平行，脚掌全踩发力站起'], heads: ['股四头肌', '臀大肌', '大腿内收肌'], e1rm: 102 };
  const back = (title, right = '') => `<div class="row" style="height:48px;padding:0 4px 0 0" data-a="3"><div data-hit style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:20px">‹</div><div class="t-h" style="font-size:16px">${title}</div><div class="sp"></div>${right}</div>`;
  const restLine = '<div class="row" style="height:32px;margin:0 16px;padding:0 12px;border-radius:16px;background:#EFEFEC"><span class="t-s">组间休息还在走</span><div class="sp"></div><span class="t-num t-b">1:35</span></div>';
  const video = (h, extra = '') => `<div class="dark" style="height:${h}px;position:relative;display:flex;align-items:center;justify-content:center;border-radius:${extra.includes('bleed') ? 0 : 14}px">
      <span style="font-size:11px;color:#bbb">MuscleWiki 示范视频 · 循环</span>
      <div class="seg" style="position:absolute;left:12px;bottom:12px;background:#FFF;color:#1d1d1b;height:32px" data-hit><span class="on">正面</span><span>侧面</span></div>
      <span style="position:absolute;right:10px;top:8px;font-size:9px;color:#aaa">© MuscleWiki</span></div>`;
  const steps = () => SQ.steps.map((s, i) => `<div class="row" style="align-items:flex-start;gap:10px;margin-top:8px"><span class="t-h" style="width:18px">${i + 1}</span><span class="t-b" style="line-height:1.5">${s}</span></div>`).join('');
  const headsRow = () => `<div class="row" style="gap:12px;margin-top:8px"><div class="slot" style="width:92px;height:120px">半身人体<br>只亮这 3 块<br>（F1 金属渐变）</div><div style="flex:1">${SQ.heads.map((h, i) => `<div class="row" style="height:28px"><i class="sq${i < 2 ? ' on' : ''}" style="width:10px;height:10px"></i><span class="t-b">${h}</span><div class="sp"></div><span class="t-s">${i < 2 ? '主练' : '协同'}</span></div>`).join('')}</div></div>`;
  const progressRow = () => `<div class="box row" style="height:56px;padding:0 14px;margin-top:12px" data-hit><div style="flex:1"><div class="t-s">我的进步 · 预估 1RM</div><div class="row" style="gap:6px"><span class="t-h">${SQ.e1rm} kg</span><span class="t-s">近 8 次 ▲ 4.5</span></div></div>${spark([94, 95, 95, 97, 98, 98, 100, 102])}<span class="t-s" style="margin-left:6px">›</span></div>`;

  const P04 = {
    W1: {
      title: '视频在上，往下读',
      note: '<em>最常见、最好懂</em>：示范视频占上方（正面 / 侧面切换在视频左下角，拇指够得着），下面一句话要点用大字，再 3 步、练到的肌头（半身人体只亮这几块，复用容量页的金属渐变）、「我的进步」一行进曲线页。训练中顶部多一行休息提示。代价：肌头和进步要往下滑才看到；视频滚走后对照着做要滑回来。',
      html: () => `${status}${back('杠铃深蹲')}${restLine}<div class="pad" style="padding-top:10px">${video(210)}
        <div data-a="1" style="margin-top:12px"><div class="t-h" style="font-size:17px;line-height:1.45">${SQ.cue}</div></div>
        <div style="margin-top:6px">${steps()}</div>
        <div class="t-s" style="margin-top:14px;font-weight:700">练到的肌头</div>${headsRow()}
        <div data-a="2">${progressRow()}</div></div>`,
    },
    W2: {
      title: '视频钉住，下面三个分段',
      note: '<em>视频一直在眼前</em>：视频钉在顶部不滚走（边看边对照做），下面一个分段 要领 / 肌肉 / 我的进步，切换只换下半屏；分段在屏幕中部，单手够得着。代价：多一层分段，信息被藏起来两份；视频占的高度固定，矮屏上下半屏偏挤。',
      html: () => `${status}${back('杠铃深蹲')}${restLine}<div class="pad" style="padding-top:10px">${video(230)}
        <div class="seg" style="margin-top:12px;width:100%;height:44px;font-size:13px" data-hit><span class="on" style="flex:1;justify-content:center">要领</span><span style="flex:1;justify-content:center">肌肉</span><span style="flex:1;justify-content:center">我的进步</span></div>
        <div data-a="1" style="margin-top:12px"><div class="t-h" style="font-size:17px;line-height:1.45">${SQ.cue}</div></div>
        <div style="margin-top:6px">${steps()}</div></div>
        <div class="abs t-s" style="left:16px;right:16px;bottom:24px;text-align:center">分段切到「我的进步」= 预估 1RM 曲线缩略 + 「看完整曲线」进 P10</div>`,
    },
    W3: {
      title: '全屏示范 + 底部要领抽屉',
      note: '<em>最有沉浸感</em>：示范视频铺满全屏（深底），返回和正面 / 侧面在顶部；要领是一个底部抽屉，常态露出一句话要点和 3 步（全在拇指区），往上拉出肌头和我的进步（M05 阻尼抽屉）。代价：抽屉手势要学一下；视频被抽屉盖住一部分；文字压在视频上要保证对比度。',
      html: () => `<div class="dark" style="position:absolute;inset:0;border-radius:0;display:flex;align-items:center;justify-content:center"><span style="font-size:11px;color:#bbb;margin-top:-180px">示范视频铺满 · 循环 · © MuscleWiki</span></div>
        <div style="position:relative;color:#FAFAF8">${status.replace('class="status"', 'class="status" style="color:#bbb"')}<div class="row" style="height:48px" data-a="3"><div data-hit style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:20px">‹</div><div class="t-h" style="font-size:16px">杠铃深蹲</div><div class="sp"></div><div class="seg" style="margin-right:12px;background:#FFF;color:#1d1d1b;height:32px" data-hit><span class="on">正面</span><span>侧面</span></div></div>
        <div class="row" style="height:28px;margin:4px 16px;padding:0 12px;border-radius:14px;background:rgba(255,255,255,.14)"><span class="t-s" style="color:#ddd">组间休息还在走</span><div class="sp"></div><span class="t-b">1:35</span></div></div>
        <div class="abs box" style="left:0;right:0;bottom:0;height:330px;border-radius:20px 20px 0 0;padding:8px 16px 16px">
          <div data-hit style="height:24px;display:flex;justify-content:center;align-items:center;margin:0 120px"><i style="width:40px;height:4px;border-radius:2px;background:#C9C9C5"></i></div>
          <div data-a="1"><div class="t-h" style="font-size:17px;line-height:1.45">${SQ.cue}</div></div>${steps()}
          <div class="row" style="margin-top:14px"><span class="t-s">往上拉：练到的肌头 · 我的进步</span><div class="sp"></div><span class="t-s">⌃</span></div></div>`,
    },
  };

  const cand = [['器械站姿深蹲', '固定器械', '股四头肌 · 臀大肌', '70 kg', 1], ['哑铃高脚杯深蹲', '哑铃', '股四头肌 · 臀大肌', '首次', 0], ['杠铃前蹲', '杠铃', '股四头肌', '首次', 0], ['腿举', '固定器械', '股四头肌 · 臀大肌', '120 kg', 0]];
  const dim = (h = 260) => `${status}<div class="pad" style="padding-top:10px;opacity:.35">${ckHead()}<div class="fill" style="height:${h}px;margin-top:16px"></div></div><div class="abs" style="inset:0;background:rgba(0,0,0,.3)"></div>`;
  const SWAP = {
    W1: {
      title: '底部面板 · 候选列表',
      note: '<em>一眼比完</em>：主角卡「换一个」（或组行左滑）拉出底部面板：同肌群候选按「同器械 → 练过的 → 首次」排，每行写器械、练到的肌头、我上次的重量；点一行选中，底部「换成 器械站姿深蹲」。只换今天，已打的组保留在原动作下；面板外点一下就收。代价：只看名字和文字，不熟的动作要再点进要领。',
      html: () => `${dim()}<div class="abs box" style="left:0;right:0;bottom:0;border-radius:20px 20px 0 0;padding:14px 16px 18px">
          <div data-a="1"><div class="t-h" style="font-size:17px">换掉 杠铃深蹲</div><div class="t-s" style="margin-top:2px">同练股四头 · 同器械优先 · 只换今天</div></div>
          <div style="margin-top:8px">${cand.map(([n, e, h, k, on]) => `<div class="row" data-hit style="height:60px;border-bottom:1px solid #EEE;gap:10px"><i style="width:18px;height:18px;border-radius:50%;${on ? 'border:6px solid #2b2b29' : 'border:1.5px solid #8E8E8A'}"></i><div style="flex:1"><div class="t-b" style="font-weight:700">${n}</div><div class="t-s">${e} · ${h}</div></div><span class="t-s">${k}</span></div>`).join('')}</div>
          <div class="btn" style="margin-top:14px" data-a="2">换成 器械站姿深蹲</div></div>`,
    },
    W2: {
      title: '底部面板 · 横滑示范卡',
      note: '<em>看得到动作长什么样</em>：面板里候选做成横滑卡片，每张上半是示范视频（静音循环）、下半名字 + 器械 + 我上次的重量，左右滑吸附到一张，底部「换成这个」跟着当前卡变。代价：一次只看清一张，比较要来回滑；视频多，流量和电量更费。',
      html: () => `${dim()}<div class="abs box" style="left:0;right:0;bottom:0;border-radius:20px 20px 0 0;padding:14px 0 18px">
          <div class="pad"><div class="t-h" style="font-size:17px">换掉 杠铃深蹲</div><div class="t-s" style="margin-top:2px">同练股四头 · 左右滑看候选 · 只换今天</div></div>
          <div class="row" style="gap:10px;margin-top:12px;padding-left:16px;overflow:hidden" data-a="1">${cand.slice(0, 3).map(([n, e, h, k], i) => `<div class="box" data-hit style="flex:0 0 ${i ? 230 : 250}px;${i ? 'opacity:.6' : ''}"><div class="dark" style="height:150px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center"><span style="font-size:10px;color:#bbb">示范 · 静音循环</span></div><div style="padding:10px 12px"><div class="t-b" style="font-weight:700">${n}</div><div class="t-s">${e} · 上次 ${k}</div></div></div>`).join('')}</div>
          <div class="row" style="justify-content:center;gap:6px;margin-top:10px">${[1, 0, 0, 0].map((x) => `<i style="width:${x ? 16 : 6}px;height:6px;border-radius:3px;background:${x ? '#2b2b29' : '#C9C9C5'}"></i>`).join('')}</div>
          <div class="pad"><div class="btn" style="margin-top:12px" data-a="2">换成 器械站姿深蹲</div></div></div>`,
    },
  };

  const wLine = (label, kgv, reps, st) => `<div class="row" style="height:44px;gap:10px;color:#8a8a86;${st === 'cur' ? 'background:#FFF;border-radius:10px;padding:0 8px;margin:0 -8px;box-shadow:0 0 0 1.5px #8E8E8A;color:#1d1d1b' : ''}"><span class="t-b" style="width:22px">${label}</span><span style="flex:1"><span class="t-h">${kgv}</span><span class="t-s"> kg × </span><span class="t-h">${reps}</span></span><span class="badge" style="border-color:#B9B9B5;color:#8a8a86;font-weight:400">不计入</span>${st === 'done' ? '<span class="t-h" style="margin-left:8px">✓</span>' : '<span style="width:20px"></span>'}</div>`;
  const heroTop = (sub) => `<div class="row"><div><div class="t-s">第 1 个 · 下肢 · ${sub}</div><div class="t-h" style="font-size:18px;margin-top:2px">${SQ.name}</div></div><div class="sp"></div><span class="t-s" data-hit style="text-decoration:underline;padding:0 4px">要领</span><span class="t-s" data-hit style="text-decoration:underline;padding:0 4px;margin-left:16px">换一个</span></div>`;
  const WARM = {
    W1: {
      title: '热身组排在正式组上面',
      note: '<em>最直白</em>：开始训练后，主角卡在正式组上方多出 3 行热身（40% × 8 → 60% × 5 → 80% × 3，按 2.5 kg 取整），浅色 + 「不计入」；底部大按钮按顺序走，先「打卡热身 2 · 50 kg × 5」，热身打完自动接正式组。热身打完后 3 行折成一行「热身 3 组 ✓」。代价：卡片变长，正式组被挤到下面。',
      html: () => `${status}<div class="pad" style="padding-top:10px">${ckHead()}
        <div class="fill" style="margin-top:12px;padding:12px 14px" data-a="1">${heroTop('热身 1 / 3')}
          <div style="margin-top:8px">${wLine('热', 35, 8, 'done')}${wLine('热', 50, 5, 'cur')}${wLine('热', 67.5, 3, '')}</div>
          <div class="hr" style="margin:6px 0"></div>${setLine(1, SQ.kg, 7, '')}${setLine(2, SQ.kg, 7, '')}${setLine(3, SQ.kg, 7, '')}</div></div>
        <div class="abs" style="left:16px;right:16px;bottom:94px;z-index:5" data-a="2"><div class="btn">打卡热身 2 · 50 kg × 5</div></div>${navRing()}`,
    },
    W2: {
      title: '热身折成一条进度',
      note: '<em>不抢正式组</em>：热身折成卡片顶部一条「热身 35 · 50 · 67.5 kg」，每个数字是一颗可点的小胶囊（命中区 48），点了就算做完；底部大按钮直接是「打卡第 1 组」，不想热身就不管它。第一组正式组打卡后热身条自动收起。代价：热身的次数不显眼；点小胶囊和大按钮是两套动作。',
      html: () => `${status}<div class="pad" style="padding-top:10px">${ckHead()}
        <div class="fill" style="margin-top:12px;padding:12px 14px" data-a="1">${heroTop('0 / 3 组')}
          <div class="row" style="margin-top:10px;gap:8px"><span class="t-s" style="width:30px">热身</span>${[[35, 8, 1], [50, 5, 0], [67.5, 3, 0]].map(([k, r, d]) => `<span class="chip${d ? ' on' : ''}" data-hit style="height:32px;flex:1;justify-content:center">${d ? '✓ ' : ''}${k}×${r}</span>`).join('')}</div>
          <div class="t-s" style="margin-top:4px">不计入容量和新纪录 · 点一颗算做完一组</div>
          <div class="hr" style="margin:8px 0"></div>${setLine(1, SQ.kg, 7, 'cur')}${setLine(2, SQ.kg, 7, '')}${setLine(3, SQ.kg, 7, '')}</div></div>
        <div class="abs" style="left:16px;right:16px;bottom:94px;z-index:5" data-a="2"><div class="btn">打卡第 1 组 · ${SQ.kg} kg × 7</div></div>${navRing()}`,
    },
  };

  const PAUSE = {
    W1: {
      title: '居中对话框',
      note: '<em>和删除确认同一套</em>：训练中在首页按系统返回键（或手势返回），弹出居中对话框「暂停训练？」，写清已记几组都在、回来从哪接着练；三个出口：暂停（主，骨白）· 结束并结算 · 继续练（文字）。代价：按钮在屏幕中部，单手要伸一下拇指。',
      html: () => `${dim(420)}<div class="abs box" style="left:28px;right:28px;top:250px;padding:20px 18px 14px;border-radius:20px">
          <div data-a="1"><div class="t-h" style="font-size:18px">暂停训练？</div><div class="t-b" style="margin-top:8px;line-height:1.55;color:#555">已记的 6 组都在。回来从「杠铃硬拉 第 1 组」接着练，休息计时也会停。</div></div>
          <div class="btn" style="margin-top:16px;height:48px" data-a="2">暂停</div>
          <div class="btn ghost" style="margin-top:8px;height:48px">结束并结算</div>
          <div data-hit style="height:48px;display:flex;align-items:center;justify-content:center" class="t-b">继续练</div></div>`,
    },
    W2: {
      title: '底部面板（拇指区）',
      note: '<em>单手最顺</em>：同样的内容放进底部面板，三个按钮全在拇指区；面板外点一下 = 继续练（不用专门的按钮）。和替换动作、改数面板同一种容器。代价：和「删除训练」的居中对话框不是一套样式，要在规范里说明：可撤销的走面板，不可撤销的走对话框。',
      html: () => `${dim(420)}<div class="abs box" style="left:0;right:0;bottom:0;border-radius:20px 20px 0 0;padding:18px 16px 22px">
          <div data-a="1"><div class="t-h" style="font-size:18px">暂停训练？</div><div class="t-b" style="margin-top:8px;line-height:1.55;color:#555">已记的 6 组都在。回来从「杠铃硬拉 第 1 组」接着练，休息计时也会停。点面板外面 = 继续练。</div></div>
          <div class="btn" style="margin-top:18px" data-a="2">暂停</div>
          <div class="btn ghost" style="margin-top:10px">结束并结算</div></div>`,
    },
    W3: {
      title: '共用：暂停后的首页',
      note: '两个方案共用。暂停后回到首页（未开始的样子），主角卡位置变成「已暂停 · 12 分钟前」+ 已记 6 / 13 组的进度，底部大按钮「继续训练」（拇指区）；导航外圈保留 6/13，但不画休息描边。超过 12 小时没继续，下次打开问一次「结束并结算这次？」。',
      html: () => `${status}<div class="pad" style="padding-top:10px"><div class="t-title">今日处方</div><div class="t-s" style="margin-top:4px">${H().date} · 5 个动作 · 13 组</div>
        <div class="fill" style="margin-top:14px;padding:14px" data-a="1"><div class="t-s">已暂停 · 12 分钟前</div><div class="row" style="align-items:baseline;margin-top:4px"><span class="t-xl">6</span><span class="t-b"> / 13 组</span></div>
          <div class="row" style="margin-top:8px;gap:3px">${Array.from({ length: 13 }, (_, i) => `<i class="sq${i < 6 ? ' on' : ''}" style="flex:1;height:5px;border-radius:2px"></i>`).join('')}</div>
          <div class="t-b" style="margin-top:10px">下一组：杠铃硬拉 第 1 组 · 首次</div></div>
        <div class="t-s" style="margin:14px 0 4px;font-weight:700">已做完</div>
        ${['杠铃深蹲 · 3 组', '器械站姿提踵 · 2 组', '窄握下拉 · 1 / 3 组'].map((x) => `<div class="row" style="height:44px;border-bottom:1px solid #DEDED9"><span class="t-b">${x}</span><div class="sp"></div><span class="t-s">✓</span></div>`).join('')}</div>
        <div class="abs" style="left:16px;right:16px;bottom:94px;z-index:5" data-a="2"><div class="btn">继续训练</div></div>${navRing().replace('首页 1:35', '首页').replace('box-shadow:inset 0 0 0 3px #8E8E8A', '')}`,
    },
  };
  const LAYERS = {
    p04: ['战略：练到一半不确定动作做没做对，3 秒内看到示范和要点，看完回去接着打卡（T5）', '范围：示范视频（正 / 侧，按档案体型）· 一句话要点 + 3 步 · 练到的肌头 · 我的进步入口；无示范 / 加载失败只留文字，不拿相近动作顶替；MuscleWiki 署名', '结构：子页 /exercise/:id，无 Tab；入口 主角卡「要领」· 处方行 · 训练详情动作行 · 进步曲线；返回来源页；训练中顶部保留一行休息', '框架：第一优先 = 示范 + 一句话要点；没有主操作（看完就返回），次要 = 进曲线页；返回在左上（导航，不在拇指区可接受：系统返回键 / 边缘手势是主路径）', '表现：示范深底；肌头图复用容量页 O2 + F1；进场 M03 共享元素（主角卡里的动作名飞成标题）'],
    swap: ['战略：器械被占 / 没有 / 不舒服时，不用退出训练就换一个能练到同样肌肉的动作', '范围：候选 = 同主练肌头、档案里有的器械；排序 同器械 → 练过 → 首次；只换今天；已打的组留在原动作下；换过的动作下次处方照常由引擎排', '结构：主角卡「换一个」→ 底部面板 → 选一个 → 主角卡换成新动作（重量按新动作的建议 / 首次填重量）；面板外点一下收起', '框架：第一优先 = 候选列表；主操作 = 「换成 X」整宽、拇指区；行高 60', '表现：面板 M05；换完主角卡 M02 形变（旧名淡出、新名弹入）'],
    warm: ['战略：大重量复合动作先热身不受伤，又不让热身干扰打卡节奏、不污染数据', '范围：只给当天第一个用到这块肌肉的复合动作排热身，正式重量 ≥ 40 kg 才排；40% × 8 → 60% × 5 → 80% × 3（2.5 kg 取整）；不计入容量 / 趋势 / 新纪录 / 导航外圈', '结构：开始训练后出现在主角卡里；可以整组跳过；打完正式组第 1 组后收起', '框架：第一优先仍是当前组；主操作仍是底部大按钮（W1 按顺序带上热身 / W2 只管正式组）', '表现：热身行浅色 + 「不计入」标签（已有 SetRow warmup 态）'],
    pause: ['战略：训练中误触返回 / 被打断时，进度一组不丢，回来能接着练', '范围：返回键 / 返回手势触发；三出口 暂停 · 结束并结算 · 继续练；暂停后计时停、训练保留；12 小时没回来下次问要不要结算', '结构：首页训练中（根页）的系统返回 → 确认 → 暂停后回到首页的「已暂停」态 → 继续训练', '框架：第一优先 = 「已记的都在」这句话；主操作 = 暂停（骨白）；结束并结算是次要（描边），继续练最轻', '表现：W1 居中对话框（同删除确认） / W2 底部面板（同替换动作）'],
  };

  // ---------- 6e 追加（2026-10-07 用户）：点选肌头检索动作（V1 动作库的核心交互，brief P1「动作库浏览与搜索、添加到今日训练」一直没排进 Milo） ----------
  const PEC = [['杠铃卧推', '杠铃', '主练', '80 kg', 1], ['哑铃卧推', '哑铃', '主练', '30 kg', 1], ['双杠臂屈伸', '自重', '主练', '首次', 1], ['器械推胸', '固定器械', '主练', '55 kg', 1], ['绳索夹胸', '绳索', '主练', '首次', 0], ['上斜哑铃卧推', '哑铃', '协同', '26 kg', 1]];
  const exRow = ([n, e, role, k, ok], add) => `<div class="row" data-hit style="height:56px;border-bottom:1px solid #EEE;gap:10px;${ok ? '' : 'opacity:.45'}"><div style="flex:1"><div class="row" style="gap:6px"><span class="t-b" style="font-weight:700">${n}</span>${role === '协同' ? '<span class="badge" style="font-weight:400;border-color:#B9B9B5">协同</span>' : ''}</div><div class="t-s">${e}${ok ? '' : ' · 你的器械里没有'} · ${k === '首次' ? '首次' : '上次 ' + k}</div></div>${add && ok ? '<span class="chip" data-hit style="height:32px;width:32px;justify-content:center;padding:0;font-size:16px">＋</span>' : '<span class="t-s">›</span>'}</div>`;
  const FIND = {
    W1: {
      title: '藏在容量页的肌头面板里',
      note: '<em>不加新页面</em>：容量页点胶囊或点人体上的肌肉 → 已有的肌头面板（恢复、近 7 天容量）下面加一段「练这块的动作」：主练在前、协同在后，写器械和我上次的重量，你的器械里没有的变灰。点一行进要领 P04，在要领页「加到今天」。<b>闭环</b>：看到这块练少了 → 找动作 → 加到今天 → 打卡 → 容量更新。代价：只能从容量页进，训练中想加动作要切 Tab。',
      html: () => `${dim(300).replace(ckHead(), '<div class="t-title" style="margin-top:16px">容量</div>')}<div class="abs box" style="left:0;right:0;bottom:0;height:610px;border-radius:20px 20px 0 0;padding:14px 16px 18px">
          <div class="row"><div><div class="t-h" style="font-size:18px">中下胸</div><div class="t-s">胸 · 大肌群</div></div><div class="sp"></div><span class="t-s">✕</span></div>
          <div class="row" style="gap:10px;margin-top:10px"><div class="fill" style="flex:1;padding:8px 10px"><div class="t-s">恢复</div><div class="t-h">92% · 黄金窗</div></div><div class="fill" style="flex:1;padding:8px 10px"><div class="t-s">近 7 天容量</div><div class="t-h">4.5 / 16 组</div></div></div>
          <div class="row" style="margin-top:14px" data-a="1"><span class="t-h">练这块的 6 个动作</span><div class="sp"></div><span class="t-s">主练在前</span></div>
          <div data-a="2">${PEC.map((r) => exRow(r)).join('')}</div>
          <div class="t-s" style="margin-top:8px">点一行 → 动作要领（那里有「加到今天」）</div></div>`,
    },
    W2: {
      title: '检索面板：点人体筛动作（V1 那套）',
      note: '<em>保留初版的签名交互</em>：一个整高的底部面板，上半是半身人体（复用容量页的人体与 O2 + F1 视效），点哪块肌肉就筛哪块（肌肉小于 48 的用放大镜同一套命中放大），正 / 背切换；下面器械筛选 + 结果列表，每行右边「＋」直接加到今天、点名字进要领。入口两个：首页处方末尾「＋ 加一个动作」、容量页肌头面板「找动作」。替换动作就是它的一个预设（锁定同肌头）。代价：人体占了半屏，列表短；点小肌肉要靠放大镜。',
      html: () => `${dim(120)}<div class="abs box" style="left:0;right:0;bottom:0;height:720px;border-radius:20px 20px 0 0;padding:12px 16px 18px">
          <div class="row"><div class="t-h" style="font-size:17px">找动作</div><div class="sp"></div><div class="seg" data-hit style="height:32px"><span class="on">正面</span><span>背面</span></div><span class="t-s" data-hit style="margin-left:12px">✕</span></div>
          <div class="row" style="gap:12px;margin-top:10px"><div class="slot" data-a="1" style="width:140px;height:230px">半身人体<br>点肌肉 = 筛选<br>选中的亮（F1）</div>
            <div style="flex:1"><div class="t-s">已选</div><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:4px"><span class="chip on" data-hit style="height:32px">中下胸 ✕</span></div><div class="t-s" style="margin-top:12px;line-height:1.6">再点一块 = 多选<br>主练在前，协同在后</div></div></div>
          <div class="row" style="gap:6px;margin-top:10px;overflow:hidden">${['全部器械', '杠铃', '哑铃', '固定器械', '绳索'].map((c, i) => `<span class="chip${i ? '' : ' on'}" data-hit style="height:32px">${c}</span>`).join('')}</div>
          <div class="t-s" style="margin-top:8px">6 个动作</div>
          <div data-a="2">${PEC.slice(0, 5).map((r) => exRow(r, true)).join('')}</div></div>`,
    },
    W3: {
      title: '搜索框 + 部位分级',
      note: '<em>最快找到已知名字的动作</em>：顶部搜索框（点了才弹键盘）+ 部位分段（胸 / 背 / 肩 / 手臂 / 核心 / 下肢）+ 肌头小胶囊，结果列表同 W2；人体只做小图反馈（选了哪块亮哪块），不用来点。代价：丢掉了「点人体」这个最有辨识度的交互；32 个肌头的名字用户未必认得。',
      html: () => `${dim(120)}<div class="abs box" style="left:0;right:0;bottom:0;height:720px;border-radius:20px 20px 0 0;padding:12px 16px 18px">
          <div class="row"><div class="t-h" style="font-size:17px">找动作</div><div class="sp"></div><span class="t-s" data-hit>✕</span></div>
          <div class="fill row" data-hit style="height:44px;margin-top:22px;padding:0 12px"><span class="t-s">⌕ 搜动作名，如「卧推」</span></div>
          <div class="seg" data-hit style="margin-top:10px;width:100%;height:36px">${['胸', '背', '肩', '手臂', '核心', '下肢'].map((x, i) => `<span class="${i ? '' : 'on'}" style="flex:1;justify-content:center">${x}</span>`).join('')}</div>
          <div class="row" style="gap:8px;margin-top:10px" data-a="1"><span class="chip" data-hit style="height:32px">上胸</span><span class="chip on" data-hit style="height:32px">中下胸</span><div class="sp"></div><div class="slot" style="width:56px;height:72px;font-size:9px">小人体<br>反馈</div></div>
          <div class="t-s" style="margin-top:6px">6 个动作</div>
          <div data-a="2">${PEC.slice(0, 6).map((r) => exRow(r, true)).join('')}</div></div>`,
    },
  };
  LAYERS.find = ['战略：想加练或换练某块肌肉时，按肌肉找到能练它、我又有器械的动作；也是 V1 用户最熟的「点人体找动作」（初版签名交互），作品集里展示 154 动作 × 32 肌头的数据模型', '范围：按肌头筛（主练 / 协同）、按器械筛、可选搜名字；每个结果写器械和我上次的重量，器械没有的变灰不隐藏；结果 → 要领 P04；「加到今天」把动作加到今日处方末尾（引擎按它出建议重量，没有历史就「首次：填重量」）；自定义动作不做（素材只用 MuscleWiki，非目标）', '结构：一个检索面板，三个入口——容量页肌头面板「找动作」（带上这块肌头）· 首页处方末尾「＋ 加一个动作」· 替换动作（锁定同肌头的预设）；不新增 Tab、不新增页面', '框架：第一优先 = 选中的肌肉 + 结果列表；主操作 = 结果行（点名字进要领 / 「＋」加到今天）；关闭在右上，面板外点一下也收', '表现：人体复用容量页 BodyFigure（O2 + F1，选中的亮）；面板 M05；加到今天时那一行 M02 飞进首页处方末尾'];

  // ---------- 检索面板定稿线框（2026-10-07 用户选 W2，并改：不用容量页视效，可读性优先；人体放右边，方便手指点） ----------
  // 布局思路：像键盘一样「输入在下、结果在上」——手在右下角点人体，眼睛看左边列表跟着变，手指不挡结果。
  // 人体：右栏，半身（中线贴左栏），整体往下放，胸肩落在「够得着」、腿在「易」；正 / 背切换在人体正下方（易）。
  // 命中区：点在肌肉之间的缝里也算离得最近的那块（最近吸附），每块的实际命中区 = 它周围的一片；这里用真实路径算出来画给你看。
  // 点人体按「整块肌肉」选（同一块肌肉的几个头合并成一个命中目标），左栏再细分到肌头。
  // 原因：真实路径算出来，半身人体上逐个肌头点，正 / 背各有 9 块的命中区 < 48（三角肌前束只有 24）。
  const FAM = { '三角肌': ['anterior-deltoid', 'lateral-deltoid', 'posterior-deltoid'], '胸': ['upper-pectoralis', 'mid-lower-pectoralis'], '肱二头肌': ['long-head-bicep', 'short-head-bicep'],
    '肱三头肌': ['lateral-head-triceps', 'long-head-triceps', 'medial-head-triceps'], '前臂': ['wrist-extensors', 'wrist-flexors'], '腹直肌': ['upper-abdominals', 'lower-abdominals'], '腹斜肌': ['obliques'],
    '斜方肌': ['upper-trapezius', 'traps-middle', 'lower-trapezius'], '背阔肌': ['lats'], '下背': ['lowerback'], '臀': ['gluteus-maximus', 'gluteus-medius'], '股四头肌': ['inner-quadricep', 'outer-quadricep', 'rectus-femoris'],
    '腘绳肌': ['lateral-hamstrings', 'medial-hamstrings'], '大腿内收肌': ['inner-thigh'], '小腿': ['gastrocnemius', 'soleus', 'tibialis'] };
  const FAM_OF = {}; for (const [f, hs] of Object.entries(FAM)) for (const h of hs) FAM_OF[h] = f;
  // 某一面上太小、另一面上够大的肌头，在这一面不当目标（它的地方归给旁边的肌肉）：大腿内收肌在背面只露一条
  const SKIP = { back: ['inner-thigh'], front: ['upper-trapezius'] };   // 斜方肌在正面只露肩上一条（46 px），去背面点
  const OWNED = ['barbell', 'dumbbell', 'machine', 'bodyweight'];
  const EQN = { barbell: '杠铃', dumbbell: '哑铃', machine: '固定器械', bodyweight: '自重', cable: '绳索', smith: '史密斯' };
  const LAST = { '杠铃卧推': '80 kg', '哑铃卧推': '30 kg', '坐姿推胸机': '55 kg', '上斜哑铃卧推': '26 kg', '哑铃飞鸟': '14 kg' };
  const exFor = (sel) => {
    const rows = EX.filter((e) => sel.some((h) => e.primaryHeads.includes(h) || e.secondaryHeads.includes(h)))
      .map((e) => ({ e, prim: sel.some((h) => e.primaryHeads.includes(h)), own: OWNED.includes(e.equipmentType) }));
    return rows.sort((a, b) => (b.own - a.own) || (b.prim - a.prim) || (!!LAST[b.e.name] - !!LAST[a.e.name]));
  };
  const fRow = ({ e, prim, own }, i, a, cover) => `<div ${cover ? '' : 'data-hit'} style="padding:9px 0;border-bottom:1px solid #E6E6E2;${own ? '' : 'opacity:.42'}">
      <div class="t-b" style="font-weight:700;font-size:14px;line-height:1.3">${e.name}</div>
      <div class="t-s" style="margin-top:2px">${EQN[e.equipmentType]}${prim ? '' : ' · 协同'} · ${own ? (LAST[e.name] ? '上次 ' + LAST[e.name] : '首次') : '没有这个器械'}</div></div>`;
  // 右栏人体：平涂、选中的深色，没选的浅灰 + 白缝；返回肌肉 → 屏幕坐标里的格子（命中区）
  function mountPick(screen, side, sel, o) {
    const host = screen.querySelector('[data-pick]');
    host.innerHTML = SVG[side];
    const svg = host.querySelector('svg');
    svg.setAttribute('width', 676); svg.setAttribute('height', 1203);
    const bb = svg.getBBox(), cx = bb.x + bb.width / 2;
    const vb = [cx, bb.y - 4, bb.x + bb.width - cx + 4, bb.height + 8];
    svg.setAttribute('viewBox', vb.join(' ')); svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    const h = Math.min(o.h, (o.w * vb[3]) / vb[2]), w = (h * vb[2]) / vb[3];
    svg.setAttribute('height', h); svg.setAttribute('width', w);
    Object.assign(host.style, { left: o.x + 'px', top: o.y + o.h - h + 'px' });
    const groups = [...svg.querySelectorAll('g[id^="muscle--"]')];
    for (const g of groups) for (const p of g.querySelectorAll('path')) {
      const on = sel.includes(g.id.slice(8)) || sel.includes(FAM_OF[g.id.slice(8)]);
      p.setAttribute('fill', on ? '#2b2b29' : '#DADAD6'); p.setAttribute('stroke', '#FAFAF8'); p.setAttribute('stroke-width', '3');
    }
    return { svg, groups, rect: { x: o.x, y: o.y + o.h - h, w, h } };
  }
  // 最近吸附的命中区：3 px 网格采样，肌肉内部直接归属，缝里和剪影外 24 px 以内归给最近的肌肉（多源 BFS ≈ Voronoi）
  function hitCells(screen, pick, side) {
    const { svg, rect } = pick, groups = pick.groups.filter((g) => !SKIP[side].includes(g.id.slice(8))), S = 3, cols = Math.ceil(rect.w / S) + 16, rows = Math.ceil(rect.h / S) + 16, ox = rect.x - 24, oy = rect.y - 24;
    const sr = screen.getBoundingClientRect(), inv = svg.getScreenCTM().inverse();
    const lab = new Int16Array(cols * rows).fill(-1), q = [];
    const boxes = groups.map((g) => g.getBBox());
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const pt = new DOMPoint(sr.left + ox + c * S, sr.top + oy + r * S).matrixTransform(inv);
      for (let i = 0; i < groups.length; i++) {
        const b = boxes[i]; if (pt.x < b.x || pt.x > b.x + b.width || pt.y < b.y || pt.y > b.y + b.height) continue;
        if ([...groups[i].querySelectorAll('path')].some((p) => p.isPointInFill(pt))) { lab[r * cols + c] = i; q.push(r * cols + c); break; }
      }
    }
    for (let k = 0, depth = new Int16Array(cols * rows); k < q.length; k++) {
      const v = q[k], r = (v / cols) | 0, c = v % cols;
      if (depth[v] >= 8) continue;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
        const u = rr * cols + cc; if (lab[u] !== -1) continue;
        lab[u] = lab[v]; depth[u] = depth[v] + 1; q.push(u);
      }
    }
    // 按整块肌肉合并
    const famKeys = [...new Set(groups.map((g) => FAM_OF[g.id.slice(8)] || g.id.slice(8)))];
    const fi = groups.map((g) => famKeys.indexOf(FAM_OF[g.id.slice(8)] || g.id.slice(8)));
    for (let v = 0; v < lab.length; v++) if (lab[v] >= 0) lab[v] = fi[lab[v]];
    const cells = famKeys.map((f) => ({ id: f, n: 0, sx: 0, sy: 0 }));
    for (let v = 0; v < lab.length; v++) if (lab[v] >= 0) { const m = cells[lab[v]]; m.n++; m.sx += v % cols; m.sy += (v / cols) | 0; }
    return { lab, cols, rows, S, ox, oy, cells: cells.filter((m) => m.n).map((m) => ({ ...m, size: Math.sqrt(m.n) * S, cx: ox + (m.sx / m.n) * S, cy: oy + (m.sy / m.n) * S })) };
  }
  function drawCells(screen, hc) {
    const cv = document.createElement('canvas'), W = 360, H = 800;
    cv.width = W * 2; cv.height = H * 2; Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', zIndex: 30, pointerEvents: 'none' });
    const x = cv.getContext('2d'); x.scale(2, 2);
    const hue = (i) => `hsla(${(i * 67) % 360}, 70%, 55%, .28)`;
    for (let v = 0; v < hc.lab.length; v++) { const l = hc.lab[v]; if (l < 0) continue; x.fillStyle = hue(l); x.fillRect(hc.ox + (v % hc.cols) * hc.S, hc.oy + ((v / hc.cols) | 0) * hc.S, hc.S, hc.S); }
    screen.appendChild(cv);
    for (const m of hc.cells) {
      const d = document.createElement('div');
      d.className = 'cellLab' + (m.size < HIT_MIN ? ' bad' : '');
      Object.assign(d.style, { left: m.cx + 'px', top: m.cy + 'px' });
      d.textContent = `${HNAME[m.id] || m.id} ${Math.round(m.size)}`;
      screen.appendChild(d);
    }
    const small = hc.cells.filter((m) => m.size < HIT_MIN);
    screen.dataset.cellBad = String(small.length);
    return small;
  }

  const finderHtml = ({ fam, sub = null, from, side = 'front', menu = false }) => {
    const heads = sub ? [sub] : FAM[fam], list = exFor(heads);
    const subs = FAM[fam].length > 1 ? `<div class="row" style="flex-wrap:wrap;gap:0 6px;margin-top:2px">${['全部', ...FAM[fam]].map((h) => `<span class="chip${(h === '全部' ? !sub : sub === h) ? ' on' : ''}" data-hit style="height:28px;font-size:12px;margin:10px 0">${h === '全部' ? '全部' : HNAME[h]}</span>`).join('')}</div>` : '';
    return `${status}<div class="pad" style="padding-top:10px;opacity:.35"><div class="t-title">${from === 'body' ? '容量' : '今日处方'}</div></div><div class="abs" style="inset:0;background:rgba(0,0,0,.3)"></div>
      <div class="abs box" style="left:0;right:0;top:64px;bottom:0;border-radius:20px 20px 0 0">
        <div style="display:flex;justify-content:center;padding-top:6px"><i style="width:40px;height:4px;border-radius:2px;background:#C9C9C5"></i></div>
        <div class="row" style="padding:2px 4px 0 16px"><div style="flex:1"><div class="t-h" style="font-size:18px">找动作</div><div class="t-s">${from === 'body' ? '从容量页「中下胸」进来' : '先替你选了本周还差最多的：' + fam}</div></div><div data-hit style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:18px">✕</div></div>
      </div>
      <div class="abs" style="left:16px;top:132px;width:156px;bottom:0;overflow:hidden" data-a="1">
        <div class="row"><span class="t-h" style="font-size:20px">${fam}</span><span class="t-s" style="margin-left:6px">${list.length} 个动作</span></div>
        ${subs}
        <div class="row" style="height:48px"><span class="t-s">${menu ? '' : '只看我有的器械'}</span><div class="sp"></div><span class="chip" data-hit style="height:30px;font-size:12px">器械 ▾</span></div>
        ${menu ? `<div class="box" style="position:absolute;left:6px;top:${subs ? 184 : 136}px;width:150px;z-index:8;padding:4px 0;box-shadow:0 6px 20px rgba(0,0,0,.18)">${['全部器械', '杠铃', '哑铃', '固定器械', '自重', '只看我有的'].map((x, i) => `<div data-hit class="t-b" style="height:48px;display:flex;align-items:center;padding:0 12px;${i === 5 ? 'font-weight:700' : ''}">${i === 5 ? '✓ ' : ''}${x}</div>`).join('')}</div>` : ''}
        <div>${list.slice(0, 9).map((r, i) => fRow(r, i, null, menu)).join('')}</div>
        <div class="fade" style="height:60px;background:linear-gradient(rgba(255,255,255,0),#FFF)"></div></div>
      <div class="abs t-s" style="left:186px;top:136px;width:160px;line-height:1.5">点一块肌肉 = 选它<br>左边再细分到肌头</div>
      <div class="abs fig" data-pick data-a="2"></div>
      <div class="abs seg" data-hit style="right:16px;bottom:20px;height:36px;font-size:12px"><span class="${side === 'front' ? 'on' : ''}" style="padding:0 14px">正面</span><span class="${side === 'back' ? 'on' : ''}" style="padding:0 14px">背面</span></div>`;
  };
  const FIG = { x: 180, y: 182, w: 172, h: 556 };
  const FINDER = {
    W1: {
      title: '从首页进：先替你选好本周还差最多的',
      note: '<em>输入在下、结果在上</em>：右手拇指在右侧点人体，左栏结果跟着变，手指不挡结果。<b>点一下选整块肌肉</b>（胸、三角肌、肱三头肌……），左栏标题就是它，下面一排小胶囊再细分到肌头（全部 / 上胸 / 中下胸）。从首页「＋ 加一个动作」进来，先替你选好本周容量还差最多的那块，一进来就有结果。列表只写三样：动作名、器械、上次重量；你没有的器械变灰排后。点一行进要领，在那里「加到今天」。平涂、高对比，不用容量页视效。',
      html: () => finderHtml({ fam: '胸', from: 'home' }),
      post: (s) => { mountPick(s, 'front', ['胸'], FIG); },
    },
    W2: {
      title: '从容量页进（细分到中下胸）+ 器械菜单',
      note: '从容量页肌头面板「找动作」进来：选中整块「胸」、细分自动落在你点的「中下胸」上。「器械 ▾」是一个小菜单（左栏窄，一排胶囊放不下），默认「只看我有的」；菜单点别处就收。',
      html: () => finderHtml({ fam: '胸', sub: 'mid-lower-pectoralis', from: 'body', menu: true }),
      post: (s) => { mountPick(s, 'front', ['mid-lower-pectoralis'], FIG); },
    },
    W3: {
      title: '命中区验证 · 正面（整块肌肉）',
      note: '用真实路径算每块肌肉的<b>实际命中区</b>：点在缝里或剪影边上 24 px 以内都归最近的那块；数字 = 折算成方块的边长（px），红 = 小于 48。逐个肌头点时正面有 9 块不到 48（三角肌前束 24、上胸 30），按整块肌肉合并后全部 ≥ 48。',
      html: () => finderHtml({ fam: '胸', from: 'home' }),
      post: (s) => { const pk = mountPick(s, 'front', ['胸'], FIG); drawCells(s, hitCells(s, pk, 'front')); },
    },
    W4: {
      title: '命中区验证 · 背面（整块肌肉）',
      note: '背面同样算。<b>规则：每块肌肉至少在一面上 ≥ 48</b>；在某一面只露一条的不当目标，去另一面点——大腿内收肌背面只有 27（正面 69），斜方肌正面只有 46（背面大）。',
      html: () => finderHtml({ fam: '背阔肌', from: 'home', side: 'back' }),
      post: (s) => { const pk = mountPick(s, 'back', ['背阔肌'], FIG); drawCells(s, hitCells(s, pk, 'back')); },
    },
  };
  LAYERS.finder = ['战略：同 find——按肌肉找到能练它、我有器械的动作；用户 2026-10-07 选 W2（点人体筛），并要求：只是检索器，可读性优先，不用容量页视效；人体放右边方便手指点', '范围：点人体选整块肌肉（同一块肌肉的几个头合并成一个目标，逐个肌头点时正背各有 9 块命中区 < 48），左栏小胶囊细分到肌头 · 器械菜单（只看我有的）· 列表三样（名字 / 器械 / 上次重量）· 结果进要领再「加到今天」；从首页进默认选本周还差最多的肌头，从容量页进带上那一块', '结构：底部面板（整高），入口 首页「＋ 加一个动作」/ 容量页肌头面板「找动作」/ 替换动作（锁定同肌头）；点一行进 P04，返回回到面板原状态', '框架：左栏 = 已选 + 数量 + 器械 + 结果（第一优先，眼睛看）；右栏 = 人体（主操作，拇指点，往下放）；正 / 背在人体正下方；关闭右上 + 下拉 + 点面板外', '表现：平涂高对比——没选的浅灰、选中的深色（高保真里是骨白或荧光其一）、白缝分块；不加发光、扫描、流动'];

  // ---------- 6f 钱包与商城（2026-10-07）：P14 钱包 / P15 商城 / P16 知识卡 / P17 商品详情 / P18 下单确认 / P19 订单完成 ----------
  // 数据：演示用户 6,060 牛劲；商品 5 款（src/data/growth.ts PRODUCTS），状态按 HANDOFF：蛋白粉热销、腰带折扣、肌酸新品、护膝缺货、助力带常规
  const NJ = 6060;
  const PROD = [
    { id: 'belt', name: '杠铃腰带 10 毫米', m: '铁砧运动', spec: '牛皮 · 单齿扣 · M 码', p: 329, was: 399, mem: 296, tag: '折扣', k: '腰带' },
    { id: 'whey', name: '乳清蛋白 2 磅', m: '慢火补给', spec: '原味 · 约 30 份', p: 259, mem: 233, tag: '热销', k: '恢复' },
    { id: 'creatine', name: '一水肌酸 300 克', m: '慢火补给', spec: '无味 · 约 60 份', p: 119, mem: 107, tag: '新品', k: '肌酸' },
    { id: 'knee', name: '7 毫米护膝', m: '山羊护具', spec: '氯丁橡胶 · 一对 · M 码', p: 199, mem: 179, tag: '缺货', k: '护膝' },
    { id: 'straps', name: '8 字助力带', m: '铁砧运动', spec: '棉 + 硅胶防滑 · 一对', p: 69, mem: 62, tag: '', k: '助力带' },
  ];
  const off = (p) => Math.min(Math.floor(NJ / 100), Math.floor(p * 0.2));
  const pic = (h, label = '商品图') => `<div class="fill" style="height:${h}px;display:flex;align-items:center;justify-content:center"><span class="t-s">${label}</span></div>`;
  const badge = (tag) => tag ? `<span class="badge"${tag === '缺货' ? ' style="border-style:dashed;color:#8a8a86"' : ''}>${tag}</span>` : '';
  const price = (x, big = 't-h') => `<span class="${big}">¥${x.p}</span>${x.was ? `<span class="t-s" style="text-decoration:line-through;margin-left:4px">¥${x.was}</span>` : ''}`;
  const card2 = (x) => `<div class="box" data-hit style="padding:8px;${x.tag === '缺货' ? 'opacity:.6' : ''}">${pic(96)}<div class="row" style="margin-top:6px;gap:4px">${badge(x.tag)}</div><div class="t-b" style="font-weight:700;margin-top:4px">${x.name}</div><div class="row" style="margin-top:2px">${price(x)}</div><div class="t-s">会员 ¥${x.mem} · 牛劲抵 ¥${off(x.p)}</div></div>`;
  const tipK = (t, why) => `<div class="fill" data-hit style="padding:12px 14px"><div class="row"><span class="badge">知识卡</span><span class="t-s" style="margin-left:6px">按你的训练数据</span></div><div class="t-h" style="margin-top:6px">${t}</div><div class="t-s" style="margin-top:2px">${why}</div></div>`;
  const ledger = [['完成训练', '10月6日', '+10'], ['守约周 · 第 21 周', '10月5日', '+50'], ['PR：杠铃深蹲 145 kg', '10月3日', '+30'], ['兑换：连胜冻结卡', '9月20日', '−800'], ['升一小级：壮牛 2 级', '9月14日', '+100']];
  const ledgerRows = (n = 5) => ledger.slice(0, n).map(([a, d, v]) => `<div class="row" style="height:48px;border-bottom:1px solid #EEE"><div style="flex:1"><div class="t-b">${a}</div><div class="t-s">${d}</div></div><span class="t-h"${v[0] === '−' ? ' style="color:#8a8a86"' : ''}>${v}</span></div>`).join('');
  const coupon = (t, d, st) => `<div class="box row" data-hit style="height:64px;padding:0 12px;gap:10px${st === 'used' ? ';opacity:.5' : ''}"><div class="fill" style="width:40px;height:40px;border-radius:10px"></div><div style="flex:1"><div class="t-b" style="font-weight:700">${t}</div><div class="t-s">${d}</div></div><span class="t-s">${st === 'use' ? '去用 ›' : st === 'used' ? '已用' : st}</span></div>`;

  const WALLET = {
    W1: {
      title: '余额在上，明细 / 卡券两个分段',
      note: '<em>最常见</em>：顶部一个大数「6,060 牛劲」+ 一行「可抵 ¥60 · 100 牛劲 = 1 元」；下面分段 明细 / 卡券（默认明细，按时间倒序，支出变灰）。「兑换卡券」是次要按钮。代价：「用掉牛劲」的两条路（商城抵扣、兑换卡券）不显眼；页面像账本，缺少「接下来做什么」。',
      html: () => `${status}${back('钱包')}<div class="pad" style="padding-top:6px"><div data-a="1"><div class="row" style="align-items:baseline;gap:6px"><span class="t-xl">6,060</span><span class="t-b">牛劲</span></div><div class="t-s" style="margin-top:4px">商城最多抵 20% · 100 牛劲 = 1 元 · 会员获得 ×1.5</div></div>
        <div class="seg" data-hit style="margin-top:14px;width:100%;height:40px"><span class="on" style="flex:1;justify-content:center">明细</span><span style="flex:1;justify-content:center">卡券 2</span></div>
        <div style="margin-top:6px">${ledgerRows()}</div></div>
        <div class="abs" style="left:16px;right:16px;bottom:30px" data-a="2"><div class="btn ghost">兑换卡券</div></div>`,
    },
    W2: {
      title: '「用掉它」两个出口做主角（在拇指区）',
      note: '<em>告诉你牛劲能干什么</em>：底部拇指区并排两个大按钮——「去商城抵扣（最多抵 20%）」「兑换卡券（冻结卡 800 起）」，两个出口就是这一屏的操作；上面是余额、我的卡券（可用的在前）和最近明细 3 条 + 「全部明细 ›」。代价：两个并列的主操作分走注意力；明细被压到第二屏。',
      html: () => `${status}${back('钱包')}<div class="pad" style="padding-top:6px"><div data-a="1"><div class="row" style="align-items:baseline;gap:6px"><span class="t-xl">6,060</span><span class="t-b">牛劲</span><div class="sp"></div><span class="t-s">≈ ¥60</span></div></div>
        <div class="t-s" style="margin:14px 0 6px;font-weight:700">我的卡券 · 2 张可用</div>
        <div style="display:grid;gap:8px">${coupon('连胜冻结卡', '断档时周一自动使用', '可用')}${coupon('免邮券', '商城任意订单 · 10月31日前', 'use')}</div>
        <div class="row" style="margin:20px 0 2px;height:48px"><span class="t-s" style="font-weight:700">最近</span><div class="sp"></div><span class="t-s" data-hit style="padding:0 4px">全部明细 ›</span></div>${ledgerRows(3)}</div>
        <div class="abs row" style="left:16px;right:16px;bottom:24px;gap:10px" data-a="2"><div class="btn" style="flex:1;height:64px;flex-direction:column;font-size:15px">去商城抵扣<span style="font-size:11px;font-weight:400;opacity:.8">每单最多抵 20%</span></div><div class="btn ghost" style="flex:1;height:64px;flex-direction:column;font-size:15px">兑换卡券<span style="font-size:11px;font-weight:400">冻结卡 800 起</span></div></div>`,
    },
    W3: {
      title: '牛劲像配重片一样「攒」',
      note: '<em>有品牌感</em>：余额画成一摞配重片（每 1,000 牛劲一片，6 片 + 一片的 6%），下面写「离下一张冻结卡 / 免邮券还差」——把余额变成目标。明细和卡券放分段。代价：视觉占了大半屏，信息密度低；配重片的隐喻要讲一次才懂。',
      html: () => `${status}${back('钱包')}<div class="pad" style="padding-top:6px"><div class="fill" data-a="1" style="height:200px;display:flex;align-items:flex-end;justify-content:center;gap:4px;padding-bottom:16px">${[1, 1, 1, 1, 1, 1, 0.06].map((x) => `<i style="display:block;width:22px;height:${Math.max(8, 120 * Math.min(1, x))}px;border-radius:6px;background:#2b2b29;opacity:${x < 1 ? 0.35 : 1}"></i>`).join('')}</div>
        <div class="row" style="align-items:baseline;gap:6px;margin-top:10px"><span class="t-l">6,060</span><span class="t-b">牛劲</span><div class="sp"></div><span class="t-s">≈ ¥60</span></div>
        <div class="t-s">再攒 1,940 → 体验 Milo Pro 7 天 · 已够：冻结卡、免邮券</div>
        <div class="seg" data-hit style="margin-top:12px;width:100%;height:40px"><span class="on" style="flex:1;justify-content:center">兑换</span><span style="flex:1;justify-content:center">卡券 2</span><span style="flex:1;justify-content:center">明细</span></div>
        <div style="display:grid;gap:8px;margin-top:8px" data-a="2">${coupon('连胜冻结卡', '800 牛劲', '兑换')}${coupon('免邮券', '300 牛劲', '兑换')}</div></div>`,
    },
  };

  const SHOP = {
    W1: {
      title: '为你推荐在顶（知识卡驱动）+ 两列商品',
      note: '<em>先讲为什么，再卖</em>：顶部一张「为你推荐」大卡——知识卡的理由（「你的深蹲已到体重 1.5 倍」）+ 对应商品；下面品类分段 全部 / 护具 / 补给，两列商品卡（状态标：折扣 / 热销 / 新品 / 缺货，会员价、牛劲可抵）。右上角钱包余额。代价：两列卡在 360 宽下名字只能两行。',
      html: () => `${status}${back('商城', '<span class="t-s" data-hit style="padding:0 12px">6,060 牛劲</span>')}<div class="pad" style="padding-top:6px"><div data-a="1">${tipK('腰带：什么时候该系', '你的深蹲预估 1RM 已到体重的 1.5 倍 → 杠铃腰带 10 毫米 ¥329')}</div>
        <div class="seg" data-hit style="margin-top:12px;height:34px"><span class="on">全部</span><span>护具</span><span>补给</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px" data-a="2">${PROD.slice(0, 4).map(card2).join('')}</div></div>`,
    },
    W2: {
      title: '一张知识卡一组商品（读起来像杂志）',
      note: '<em>知识卡是主角</em>：页面是一串知识卡，每张写一句「为什么现在该看」+ 下面挂 1–2 个商品行；按触发了没有排序（被你的数据触发的在前、标「按你的数据」，其余是通用入门）。代价：没有被触发时整页像文章，逛起来慢；商品状态被挤成小字。',
      html: () => `${status}${back('商城')}<div class="pad" style="padding-top:6px;display:grid;gap:12px">
        <div data-a="1">${tipK('腰带：什么时候该系', '你的深蹲预估 1RM 已到体重的 1.5 倍')}<div class="row" data-hit style="height:56px;border-bottom:1px solid #EEE;gap:10px">${pic(40, '')}<div style="flex:1"><div class="t-b" style="font-weight:700">杠铃腰带 10 毫米 ${badge('折扣')}</div><div class="t-s">铁砧运动 · 会员 ¥296</div></div>${price(PROD[0])}</div></div>
        ${tipK('肌酸：研究最充分的补剂', '你近 4 周训练量持续上升')}<div class="row" data-hit style="height:56px;gap:10px">${pic(40, '')}<div style="flex:1"><div class="t-b" style="font-weight:700">一水肌酸 300 克 ${badge('新品')}</div><div class="t-s">慢火补给 · 会员 ¥107</div></div>${price(PROD[2])}</div>
        <div data-a="2" class="t-s" style="text-align:center">往下：恢复 · 护膝 · 助力带（通用）</div></div>`,
    },
    W3: {
      title: '列表行（状态最清楚）',
      note: '<em>逛得快</em>：推荐压成一行横幅（点开知识卡），下面品类分段 + 一行一个商品：左图右文，名字 / 商家 / 价格（划线价）/ 会员价 · 牛劲抵 / 状态标；缺货行右边是「到货提醒」，已下架不出现在列表。代价：图小，不够「好逛」。',
      html: () => `${status}${back('商城', '<span class="t-s" data-hit style="padding:0 12px">6,060 牛劲</span>')}<div class="pad" style="padding-top:6px"><div class="fill row" data-hit data-a="1" style="height:52px;padding:0 12px;gap:8px"><span class="badge">知识卡</span><span class="t-b" style="flex:1">深蹲已到体重 1.5 倍：该了解腰带了</span><span class="t-s">›</span></div>
        <div class="seg" data-hit style="margin-top:12px;height:34px"><span class="on">全部</span><span>护具</span><span>补给</span></div>
        <div style="margin-top:12px" data-a="2">${PROD.map((x) => `<div class="row" data-hit style="height:88px;border-bottom:1px solid #EEE;gap:12px;${x.tag === '缺货' ? 'opacity:.75' : ''}">${pic(64, '')}<div style="flex:1"><div class="row" style="gap:6px"><span class="t-b" style="font-weight:700">${x.name}</span>${badge(x.tag)}</div><div class="t-s">${x.m}</div><div class="row" style="gap:6px;margin-top:2px">${price(x)}<span class="t-s">会员 ¥${x.mem}</span></div></div>${x.tag === '缺货' ? '<span class="chip" data-hit style="height:32px">到货提醒</span>' : '<span class="t-s">›</span>'}</div>`).join('')}</div></div>`,
    },
  };

  const GUIDE = {
    W1: {
      title: '文章式：为什么 / 什么时候 / 怎么用',
      note: '<em>像一页好读的说明</em>：标题 + 「按你的数据」的理由一行（带一个小数字图：深蹲 1.52 × 体重）；三段：为什么、什么时候用、怎么用（3 条）；末尾「不构成医疗建议」；底部 2 个相关商品横滑 + 「不再提示这一类」文字链。代价：商品在最后，要滑到底才看到。',
      html: () => `${status}${back('知识卡')}<div class="pad" style="padding-top:6px"><div data-a="1"><div class="t-title" style="font-size:20px">腰带：什么时候该系</div><div class="fill row" style="margin-top:10px;padding:10px 12px;gap:10px"><span class="t-l">1.52</span><span class="t-s">× 体重 · 你的深蹲预估 1RM 142 kg / 体重 93 kg</span></div></div>
        ${[['为什么', '腹压更稳，接近极限时脊柱更安全'], ['什么时候用', '大重量复合动作（深蹲、硬拉）的顶组'], ['怎么用', '只在接近极限的组里系 · 系在肚脐上下 · 不能代替核心力量']].map(([h, b]) => `<div style="margin-top:12px"><div class="t-h">${h}</div><div class="t-b" style="margin-top:4px;line-height:1.6">${b}</div></div>`).join('')}
        <div class="t-s" style="margin-top:10px">不构成医疗建议</div>
        <div class="row" style="gap:10px;margin-top:12px;overflow:hidden" data-a="2">${[PROD[0], PROD[4]].map((x) => `<div class="box" data-hit style="flex:0 0 200px;padding:8px">${pic(60)}<div class="t-b" style="font-weight:700;margin-top:4px">${x.name}</div>${price(x)}</div>`).join('')}</div>
        <div class="t-s" data-hit style="margin-top:24px;text-decoration:underline;display:inline-block">不再提示这一类</div></div>`,
    },
    W2: {
      title: '数据证据在顶 + 商品就在下面',
      note: '<em>先给证据</em>：顶部一条小曲线「深蹲预估 1RM ÷ 体重」，越过 1.5 那天点亮——一眼看到为什么现在该看；下面要点三条（折叠的「为什么」可展开），紧接着相关商品 2 行（状态、会员价、牛劲抵）；底部主按钮「看杠铃腰带」。代价：曲线要额外算一份数据；「为什么」被折叠。',
      html: () => `${status}${back('知识卡')}<div class="pad" style="padding-top:6px"><div class="t-title" style="font-size:20px">腰带：什么时候该系</div>
        <div class="fill" data-a="1" style="margin-top:10px;height:120px;padding:10px 12px;position:relative"><span class="t-s">深蹲预估 1RM ÷ 体重</span><svg width="300" height="80" style="position:absolute;left:12px;bottom:8px"><line x1="0" x2="300" y1="30" y2="30" stroke="#8E8E8A" stroke-dasharray="4 4"/><polyline points="0,70 60,62 120,50 180,40 240,31 290,24" fill="none" stroke="#2b2b29" stroke-width="2"/><circle cx="290" cy="24" r="4" fill="#2b2b29"/><text x="4" y="26" font-size="9" fill="#6b6b67">1.5 ×</text></svg></div>
        <div style="margin-top:12px">${['只在接近极限的组里系，热身不系', '系在肚脐上下，吸气顶住腰带', '不能代替核心力量'].map((x, i) => `<div class="row" style="gap:10px;margin-top:6px;align-items:flex-start"><span class="t-h">${i + 1}</span><span class="t-b">${x}</span></div>`).join('')}<div class="t-s" data-hit style="margin-top:8px;display:inline-block">为什么 ⌄</div><span class="t-s"> · 不构成医疗建议</span></div>
        <div style="margin-top:22px">${[PROD[0], PROD[4]].map((x) => `<div class="row" data-hit style="height:64px;border-bottom:1px solid #EEE;gap:10px">${pic(48, '')}<div style="flex:1"><div class="t-b" style="font-weight:700">${x.name} ${badge(x.tag)}</div><div class="t-s">会员 ¥${x.mem} · 牛劲抵 ¥${off(x.p)}</div></div>${price(x)}</div>`).join('')}</div></div>
        <div class="abs" style="left:16px;right:16px;bottom:30px" data-a="2"><div class="btn">看杠铃腰带</div></div>`,
    },
  };

  const itemBody = (x, st) => `${status}${back('', '<span class="t-s" data-hit style="padding:0 12px">分享</span>')}${pic(300, '商品图 · 横滑多张')}<div class="pad" style="padding-top:10px"><div data-a="1"><div class="row" style="gap:6px">${badge(st === 'off' ? '已下架' : x.tag)}<span class="t-s">${x.m}</span></div><div class="t-title" style="font-size:20px;margin-top:4px">${x.name}</div>
    <div class="row" style="align-items:baseline;gap:8px;margin-top:6px">${price(x, 't-l')}<span class="t-b">会员 ¥${x.mem}</span></div></div>
    <div class="fill row" style="margin-top:10px;padding:10px 12px;gap:8px"><span class="t-b" style="flex:1">牛劲可抵 ¥${off(x.p)}</span><span class="t-s">余额 6,060 · 每单最多 20%</span></div>
    <div class="t-s" style="margin-top:12px;font-weight:700">规格</div><div class="row" style="gap:8px;margin-top:6px">${['S', 'M', 'L'].map((z) => `<span class="chip${z === 'M' ? ' on' : ''}" data-hit style="height:32px;min-width:56px;justify-content:center">${z}</span>`).join('')}</div>
    <div class="row" data-hit style="height:48px;margin-top:8px;border-top:1px solid #EEE"><span class="t-b" style="flex:1">相关知识卡：腰带什么时候该系</span><span class="t-s">›</span></div></div>`;
  const ITEM = {
    W1: {
      title: '正常（折扣）· 底部购买',
      note: '<em>标准电商详情</em>：大图横滑 → 状态标 + 商家 → 名字 → 价格（现价大、划线价、会员价）→ 牛劲可抵一行 → 规格胶囊 → 相关知识卡；底部固定一个主按钮「购买 · ¥329」（拇指区）。代价：首屏被大图占一半，价格信息要往下看。',
      html: () => `${itemBody(PROD[0])}<div class="abs" style="left:16px;right:16px;bottom:30px" data-a="2"><div class="btn">购买 · ¥329</div></div>`,
    },
    W2: {
      title: '缺货 · 到货提醒（状态示意）',
      note: '<em>状态都有出口，不给死路</em>：缺货时主按钮变成「到货提醒」（点了写进提醒、按钮变「已设提醒 ✓」），上方一行「预计 10 月中到货」；已下架时整页置灰、按钮换成「回商城看看别的」（ia：下架提示并回 P15）；牛劲不足时抵扣行写「还差 N 牛劲」、开关不可用。代价：要为每种状态写文案。',
      html: () => `${itemBody(PROD[3])}<div class="abs t-s" style="left:16px;right:16px;bottom:92px;text-align:center">缺货 · 预计 10 月中到货</div><div class="abs" style="left:16px;right:16px;bottom:30px" data-a="2"><div class="btn ghost">到货提醒</div></div>`,
    },
  };

  const ORDER = {
    W1: {
      title: '下单确认（P18）',
      note: '<em>一屏算清楚</em>：顶部「演示模式 · 不收集任何支付信息」横幅；商品行（图、名字、规格、单价）；卡券行（「满 200 减 30」已选 ›）；牛劲抵扣开关（「用 5,900 牛劲抵 ¥59」：按会员价的 20% 封顶；不足时写还差多少、开关禁用）；合计（原价、会员价、券、牛劲）；底部主按钮「提交订单 · ¥207」，提交中按钮禁用防重复点。',
      html: () => `${status}${back('确认订单')}<div class="pad" style="padding-top:6px"><div class="fill" style="padding:8px 12px"><span class="t-s">演示模式 · 不收集任何支付信息，提交即成功</span></div>
        <div class="row" style="height:80px;gap:10px;border-bottom:1px solid #EEE" data-a="1">${pic(56, '')}<div style="flex:1"><div class="t-b" style="font-weight:700">杠铃腰带 10 毫米</div><div class="t-s">M 码 · 铁砧运动</div></div><span class="t-h">¥296</span></div>
        <div class="row" data-hit style="height:52px;border-bottom:1px solid #EEE"><span class="t-b" style="flex:1">卡券</span><span class="t-s">铁砧运动 满 200 减 30 ›</span></div>
        <div class="row" style="height:56px;border-bottom:1px solid #EEE"><div style="flex:1"><div class="t-b">牛劲抵扣</div><div class="t-s">用 5,900 牛劲抵 ¥59（最多 20%）</div></div><span class="chip on" data-hit style="height:28px;width:48px;justify-content:flex-end;padding:0 4px"><i style="width:20px;height:20px;border-radius:50%;background:#FAFAF8"></i></span></div>
        <div style="margin-top:10px">${[['商品', '¥329'], ['会员价', '−¥33'], ['卡券', '−¥30'], ['牛劲', '−¥59']].map(([a, b]) => `<div class="row" style="height:26px"><span class="t-s" style="flex:1">${a}</span><span class="t-b">${b}</span></div>`).join('')}<div class="row" style="height:36px;border-top:1px solid #DEDED9;margin-top:4px"><span class="t-h" style="flex:1">合计</span><span class="t-l">¥207</span></div></div></div>
        <div class="abs" style="left:16px;right:16px;bottom:30px" data-a="2"><div class="btn">提交订单 · ¥207</div></div>`,
    },
    W2: {
      title: '订单完成（P19）',
      note: '<em>收得住</em>：小牛开心状态 + 「下单成功（演示订单）」；订单号、明细（商品、实付、用掉的牛劲与卡券）；「牛劲余额 6,060 → 160」一行。底部主按钮「回商城」（替换历史，返回不回到确认页）；次要「查看钱包」。代价：要处理「返回」不回下单页的路由。',
      html: () => `${status}<div class="pad" style="padding-top:40px;text-align:center"><div class="slot" style="width:120px;height:110px;margin:0 auto">小牛 · 开心</div><div class="t-title" style="margin-top:14px" data-a="1">下单成功</div><div class="t-s" style="margin-top:4px">演示订单 MILO-20261007-0412 · 不会真的发货</div></div>
        <div class="pad" style="margin-top:16px">${[['杠铃腰带 10 毫米 · M', '¥329'], ['实付', '¥207'], ['用掉', '5,900 牛劲 · 满 200 减 30 券'], ['牛劲余额', '6,060 → 160']].map(([a, b]) => `<div class="row" style="height:40px;border-bottom:1px solid #EEE"><span class="t-s" style="flex:1">${a}</span><span class="t-b">${b}</span></div>`).join('')}</div>
        <div class="abs t-b" data-hit style="left:16px;right:16px;bottom:94px;height:48px;display:flex;align-items:center;justify-content:center;text-decoration:underline">查看钱包</div>
        <div class="abs" style="left:16px;right:16px;bottom:30px" data-a="2"><div class="btn">回商城</div></div>`,
    },
  };
  // ---------- 6f 追加：知识卡提示放在哪（容量页 P06 / 增量页 P09，ia §1.16：一屏最多一条、可关闭、可「不再提示这一类」、训练流程里不出现） ----------
  const capStub = (top, n = 18) => `<div class="abs" style="left:216px;right:16px;top:${top}px;display:grid;gap:4px">${Array.from({ length: n }, (_, i) => `<div class="box" style="height:20px;opacity:${i % 3 ? 1 : 0.6}"></div>`).join('')}</div>`;
  const capHead = `${status}<div class="pad" style="padding-top:10px"><div class="row"><div class="t-title">容量</div><div class="sp"></div>${toggles}</div><div class="t-s" style="margin-top:8px">近 7 天 · <b class="t-num">12,504</b> kg · <b class="t-num">38</b> 组 · <b class="t-num">3</b> 天</div></div>`;
  const tipRow = (why, title, extra = '') => `<div class="fill row" style="padding:0 0 0 12px;gap:8px;min-height:56px;${extra}" data-a="1"><span class="badge">i</span><div style="flex:1;padding:6px 0" data-hit><div class="t-s">${why}</div><div class="t-b" style="font-weight:700">${title} ›</div></div><span class="t-s" data-hit style="width:48px;height:48px;display:flex;align-items:center;justify-content:center">✕</span></div>`;
  const gainsHead = `${status}<div class="pad" style="padding-top:10px"><div class="t-title">增量</div><div class="t-h" style="margin-top:6px">近 4 周练了 15 个动作</div><div class="fill" style="height:56px;margin-top:8px"></div><div class="row" style="align-items:baseline;gap:6px;margin-top:10px"><span class="t-xl">26</span><span class="t-b">次破纪录</span></div></div>`;
  const gChips = `<div class="row" data-hit style="gap:6px;margin-top:10px">${['全部', '下肢', '背', '胸', '肩'].map((x, i) => `<span class="chip${i ? '' : ' on'}" style="height:32px">${x}</span>`).join('')}</div>`;
  const gRow = (n, next, tip) => `<div class="row" data-hit style="height:64px;border-bottom:1px solid #EEE;gap:10px"><div style="flex:1"><div class="t-b" style="font-weight:700">${n}</div><div class="t-s">下次 ${next}</div></div>${spark([1, 2, 2, 3, 4, 5])}<span class="t-h t-num">142</span></div>${tip || ''}`;
  const TIPS = {
    W1: {
      title: '容量 · 摘要下一条细横幅',
      note: '<em>离它解释的数据最近</em>：「近 7 天」摘要下面插一条 56 高的横幅（恢复慢 → 蛋白质与睡眠；深蹲量高 → 护膝），点主体进知识卡，右边 ✕ 收起；收起后人体回到原高度（高度弹簧，提示本身不顶歪别的组件）。「不再提示这一类」放进知识卡页底部，不在横幅上挤第三个命中区。代价：人体和胶囊列下移 64，最下一个胶囊贴近导航。',
      html: () => `${capHead}<div class="pad" style="margin-top:10px">${tipRow('你的胸部恢复比预期窗口慢约 20%', '恢复：蛋白质与睡眠比补剂更重要')}</div><div class="slot abs" style="left:16px;top:200px;width:180px;height:500px">半身人体</div>${capStub(200)}${nav('body')}`,
    },
    W2: {
      title: '容量 · 底部浮条（拇指区）',
      note: '<em>不动版式、最好点</em>：横幅浮在导航上方，盖住人体脚踝一段；进页 600 ms 后从下滑入，✕ 或往下滑收起。代价：盖住最下面两颗胶囊（胫骨前肌、比目鱼肌）的命中区——要么胶囊列整体上移、要么浮条在时这两颗点不到，违反「不给死路」；容量页本来就是满屏的图，浮层会被当成广告。',
      html: () => `${capHead}<div class="slot abs" style="left:16px;top:136px;width:180px;height:560px">半身人体</div>${capStub(136, 22)}<div class="abs" style="left:16px;right:16px;bottom:96px">${tipRow('你的深蹲量高，膝部动作多', '护膝：保暖支撑，不是「借力」', 'background:#DEDED9')}</div>${nav('body')}`,
    },
    W3: {
      title: '增量 · 首屏下、筛选上',
      note: '<em>和容量页同一个位置规律</em>：页头首屏（涨 / 平 / 退 + 破纪录）下面、部位筛选上面一条横幅（深蹲预估 1RM 到体重 1.5 倍 → 腰带；近 4 周训练量持续上升 → 肌酸）。滑过去就跟着页头滑走，不贴顶。代价：和具体是哪个动作的证据隔开了，要靠文案写清「深蹲」。',
      html: () => `${gainsHead}<div class="pad" style="margin-top:12px">${tipRow('你的深蹲预估 1RM 已到体重的 1.5 倍', '腰带：什么时候该系')}${gChips}<div class="fill" style="height:44px;margin-top:10px"></div>${gRow('上斜哑铃卧推', '27.5 kg × 6')}${gRow('杠铃深蹲', '85 kg × 6')}</div>${nav('gains')}`,
    },
    W4: {
      title: '增量 · 挂在证据那一行下面',
      note: '<em>最贴数据</em>：提示长在触发它的动作行下（杠铃深蹲行下面一条缩进的细行「已到体重 1.52 倍 · 腰带什么时候该系 ›」）。代价：那一行在收起的分组里、或被部位筛选掉时提示就看不到；肌酸 / 蛋白质这类不对应单个动作的没地方挂，两页规则不一致。',
      html: () => `${gainsHead}<div class="pad" style="margin-top:12px">${gChips}<div class="fill" style="height:44px;margin-top:10px"></div>${gRow('上斜哑铃卧推', '27.5 kg × 6')}${gRow('杠铃深蹲', '85 kg × 6', `<div class="row" data-a="1" style="gap:8px;padding-left:16px;min-height:48px;border-bottom:1px solid #EEE"><span class="badge">i</span><span class="t-s" style="flex:1" data-hit>已到体重 1.52 倍 · 腰带什么时候该系 ›</span><span class="t-s" data-hit style="width:48px;height:48px;display:flex;align-items:center;justify-content:center">✕</span></div>`)}</div>${nav('gains')}`,
    },
  };
  LAYERS.tips = ['战略：在数据说明「需要」的那一刻给一张知识卡，而不是做广告（T16）；商城的主要入口', '范围：容量页（恢复慢 → 蛋白质与睡眠、深蹲量高 → 护膝）· 增量页（e1RM ÷ 体重 ≥ 1.5 → 腰带、近 4 周量上升 → 肌酸）；一屏最多一条，按优先级取第一张；✕ 本次收起、知识卡页底「不再提示这一类」永久静音这一类；训练中的首页不出', '结构：提示 → P16 知识卡（返回回原页原滚动位置）；静音记在本机', '框架：提示是辅助信息，不抢页面主角（人体 / 增量列表）；主体 + ✕ 两个命中区，各 ≥ 48', '表现：深灰底 + 「i」标；不用荧光（荧光留给页面唯一焦点）；进场 M03 高度弹簧，收起反向'];
  // ---------- 6g 会员（P20 付费墙 / P21 会员中心，ia §1.17：演示不拦截，支付走假成功，标「演示模式」） ----------
  const perkRows = [['处方 · 记录 · 容量 · 增量', '✓', '✓'], ['周期计划自动编排', '—', '✓'], ['高级分析', '—', '✓'], ['牛劲', '×1', '×1.5'], ['连胜冻结卡', '兑换', '每月 2 张'], ['商城会员价 · 免邮券', '—', '✓'], ['数据导出', '—', '✓']];
  const perkTable = (n = 7) => `<div class="box" style="padding:4px 12px">${perkRows.slice(0, n).map(([a, f, p], i) => `<div class="row" style="height:34px;${i ? 'border-top:1px solid #EEE' : ''}"><span class="t-s" style="flex:1">${a}</span><span class="t-s" style="width:44px;text-align:center">${f}</span><span class="t-b" style="width:64px;text-align:center;font-weight:700">${p}</span></div>`).join('')}</div>`;
  const plan = (n, p, sub, on, tag) => `<div class="box" data-hit style="flex:1;padding:10px;${on ? 'border:2px solid #1d1d1b' : ''};position:relative">${tag ? `<span class="badge" style="position:absolute;top:-9px;left:8px;background:#fff">${tag}</span>` : ''}<div class="t-s">${n}</div><div class="t-h">${p}</div><div class="t-s">${sub}</div></div>`;
  const demoBar = '<div class="fill" style="padding:6px 12px"><span class="t-s">演示模式 · 不收集支付信息，不扣费</span></div>';
  const PRO = {
    W1: {
      title: '对比表在上，方案在拇指区',
      note: '<em>最常见、最诚实</em>：顶部一句「练得更聪明一点」+ 免费 vs Pro 对比表（7 行）；底部拇指区三张方案卡（月 ¥18 / 年 ¥128 默认选中 · 省 40% / 试用 7 天）+ 主按钮「开始 7 天试用」。代价：对比表是一堵字墙，权益「为什么对我有用」看不出来。',
      html: () => `${status}${back('Milo Pro')}<div class="pad" style="padding-top:6px;display:grid;gap:10px">${demoBar}<div data-a="1"><div class="t-title" style="font-size:20px">练得更聪明一点</div><div class="t-s" style="margin:4px 0 8px">免费版保留处方、记录、容量、增量的完整闭环</div>${perkTable()}</div></div>
        <div class="abs" style="left:16px;right:16px;bottom:30px;display:grid;gap:10px" data-a="2"><div class="row" style="gap:8px">${plan('月度', '¥18', '/ 月')}${plan('年度', '¥128', '≈ ¥10.7 / 月', 1, '省 40%')}${plan('试用', '7 天', '不自动扣费')}</div><div class="btn">开始 7 天试用</div></div>`,
    },
    W2: {
      title: '用你的数据讲权益（个性化）',
      note: '<em>不是广告，是账单</em>：每条权益配一句「按你的数据」——「过去 30 天你会多拿 525 牛劲（×1.5）」「上次断档时冻结卡能保住连胜 21 周」「你买腰带会员价省 ¥33」；方案压成一行分段（月 / 年 / 试用），主按钮在拇指区。代价：要从引擎多算几个数；没有历史的新用户只能退回 W1 的通用说法。',
      html: () => `${status}${back('Milo Pro')}<div class="pad" style="padding-top:6px;display:grid;gap:8px">${demoBar}<div class="t-title" style="font-size:20px" data-a="1">这 30 天，Pro 会多给你</div>
        ${[['+525 牛劲', '你这 30 天拿了 1,050，Pro ×1.5'], ['2 张冻结卡 / 月', '9 月那次断档能保住连胜 21 周'], ['会员价省 ¥33', '杠铃腰带 ¥329 → ¥296'], ['周期自动编排', '减量周到点自动插进处方']].map(([a, b]) => `<div class="box row" style="height:56px;padding:0 12px;gap:10px"><span class="t-h" style="width:112px">${a}</span><span class="t-s" style="flex:1">${b}</span></div>`).join('')}
        <div class="t-s" data-hit style="text-align:center;padding:12px 0">看完整对比 ›</div></div>
        <div class="abs" style="left:16px;right:16px;bottom:30px;display:grid;gap:10px" data-a="2"><div class="seg" data-hit style="height:40px;width:100%"><span style="flex:1;justify-content:center">月 ¥18</span><span class="on" style="flex:1;justify-content:center">年 ¥128</span><span style="flex:1;justify-content:center">试用 7 天</span></div><div class="btn">开通年度（演示，不扣费）</div></div>`,
    },
    W3: {
      title: '开通成功（品牌时刻）',
      note: '<em>收得住</em>：全屏 Milo 庆祝（IP 品牌位置）+ 「欢迎加入 Milo Pro」+ 刚到手的三样东西（本月 2 张冻结卡已放进钱包 · 牛劲 ×1.5 从下一次训练起 · 会员价已生效）；主按钮「开始用」回到来源页。',
      html: () => `${status}<div class="pad" style="padding-top:50px;text-align:center">${demoBar}<div class="slot" style="width:150px;height:150px;margin:24px auto 0">Milo · 庆祝</div><div class="t-title" style="margin-top:14px" data-a="1">欢迎加入 Milo Pro</div><div class="t-s" style="margin-top:4px">年度会员 · 2027 年 10 月 7 日到期</div></div>
        <div class="pad" style="margin-top:14px">${[['冻结卡 ×2', '已放进钱包'], ['牛劲 ×1.5', '从下一次训练起'], ['会员价', '商城已生效']].map(([a, b]) => `<div class="row" style="height:40px;border-bottom:1px solid #EEE"><span class="t-b" style="flex:1;font-weight:700">${a}</span><span class="t-s">${b}</span></div>`).join('')}</div>
        <div class="abs" style="left:16px;right:16px;bottom:30px" data-a="2"><div class="btn">开始用</div></div>`,
    },
  };
  const PROHUB = {
    W1: {
      title: '会员中心：到期 + 这个月用了什么',
      note: '<em>让会员看见值不值</em>：顶部会员卡（年度 · 到期日 · 试用中写剩几天）；「这个月 Pro 给了你」三格：多拿的牛劲 · 冻结卡已领 / 已用 · 会员价省下；下面权益列表（每行可点进对应页面）；最底「管理订阅」（演示：切回免费 → 二次确认 → 回到未开通，已得的牛劲与卡券不收回）。没有主操作。',
      html: () => `${status}${back('会员中心')}<div class="pad" style="padding-top:6px;display:grid;gap:10px">${demoBar}<div class="fill" data-a="1" style="padding:14px"><div class="row"><span class="t-h" style="flex:1">Milo Pro · 年度</span><span class="badge">已开通</span></div><div class="t-s" style="margin-top:4px">2027 年 10 月 7 日到期</div></div>
        <div class="t-s" style="font-weight:700">这个月 Pro 给了你</div><div class="row" style="gap:8px">${[['+525', '牛劲'], ['2 / 0', '冻结卡 领 / 用'], ['¥33', '会员价省']].map(([a, b]) => `<div class="box" style="flex:1;padding:10px;text-align:center"><div class="t-h">${a}</div><div class="t-s">${b}</div></div>`).join('')}</div>
        ${['周期计划自动编排 ›', '高级分析 ›', '钱包（冻结卡） ›', '商城（会员价） ›'].map((x) => `<div class="row" data-hit style="height:48px;border-bottom:1px solid #EEE"><span class="t-b">${x}</span></div>`).join('')}
        <div class="t-s" data-hit style="text-align:center;padding:14px 0;text-decoration:underline">管理订阅（演示：切回免费）</div></div>`,
    },
    W2: {
      title: '「我的」里的会员行（入口三态）',
      note: '<em>入口不放死路</em>：未开通 = 「Milo Pro · 7 天试用」→ P20；试用中 = 「试用中 · 还剩 5 天」→ P21；已开通 = 「Pro · 2027-10-07 到期」→ P21。另外三处入口：高级分析的 Pro 标记、连胜快断时的冻结卡提示、商品详情会员价旁的「Pro」小标——都进 P20（已开通进 P21）。',
      html: () => `${status}${back('我的（会员行示意）')}<div class="pad" style="padding-top:6px;display:grid;gap:12px" data-a="1">${[['未开通', 'Milo Pro', '7 天免费试用 ›'], ['试用中', 'Milo Pro · 试用中', '还剩 5 天 ›'], ['已开通', 'Milo Pro', '2027-10-07 到期 ›']].map(([a, b, c]) => `<div><div class="t-s" style="margin-bottom:4px">${a}</div><div class="box row" data-hit style="height:56px;padding:0 12px"><span class="t-b" style="flex:1;font-weight:700">${b}</span><span class="t-s">${c}</span></div></div>`).join('')}
        <div class="t-s" style="margin-top:6px">其余入口：高级分析 Pro 标 · 冻结卡提示 · 会员价旁 Pro 小标</div></div>`,
    },
  };
  // ---------- 6g 补：两处「Pro 入口」的落点（高级分析 Pro 标 · 连胜快断时的冻结卡提示）——先有真内容，再挂 Pro ----------
  const proTag = (on) => `<span class="badge" data-hit style="${on ? 'background:#2b2b29;color:#FAFAF8' : ''}">Pro ›</span>`;
  const bars8 = (vals, lo, hi) => `<div style="position:relative;height:84px;margin-top:6px"><div class="abs" style="left:0;right:0;bottom:${lo}px;height:${hi - lo}px;background:#EDEDE8;border-radius:4px"></div><div class="row" style="position:absolute;inset:0;align-items:flex-end;gap:6px">${vals.map((v, i) => `<i style="flex:1;height:${v}px;background:${i === vals.length - 1 ? '#2b2b29' : '#A9A9A5'};border-radius:3px 3px 0 0"></i>`).join('')}</div></div>`;
  const panel = (inner) => `${status}<div class="pad" style="padding-top:10px;opacity:.35"><div class="t-title">容量</div><div class="fill" style="height:620px;margin-top:12px"></div></div><div class="abs" style="inset:0;background:rgba(0,0,0,.3)"></div>
    <div class="abs box" style="left:0;right:0;bottom:0;border-radius:18px 18px 0 0;padding:14px 16px 24px" data-a="1">${inner}</div>`;
  const riskRow = (body, acts = '') => `<div class="fill" style="padding:10px 12px" data-a="2"><div class="row" style="gap:8px"><span class="badge">!</span><span class="t-b" style="font-weight:700">这周快断了：还差 2 次，只剩 1 天</span></div><div class="t-s" style="margin-top:4px">${body}</div>${acts}</div>`;
  const PROENTRY = {
    W1: {
      title: '高级分析 ① 肌群容量趋势：肌头面板里加「近 8 周」',
      note: '<em>Pro 标挂在真内容上</em>：现在「高级分析」这项权益在 App 里没有对应的东西，Pro 标点了也没处可去。最小的真内容放在数据已经在的地方——容量页点一颗胶囊弹出的肌头面板，在「近 7 天容量」下面加一块「近 8 周 · 每周组数」（8 根柱 + 有效区间底带，本周深色）。块标题右边一个「Pro ›」：未开通进付费墙，已开通进会员中心（实底）。演示不拦截，所以图照常显示，Pro 标只是告诉你「这是 Pro 的」。会员中心「高级分析」那一行直接打开这里（练得最多的那块肌肉）。',
      html: () => panel(`<div class="row"><span class="t-h">股四头肌 · 外侧头</span><div class="sp"></div><span class="t-s">下肢 · 达标</span></div>
        <div class="t-s" style="margin-top:10px;font-weight:700">恢复</div><div class="bar" style="margin-top:6px"><i style="width:72%"></i></div>
        <div class="t-s" style="margin-top:12px;font-weight:700">近 7 天容量</div><div class="t-b" style="margin-top:2px"><b class="t-num">11</b> 组 · 有效 8–16</div>
        <div class="row" style="margin-top:14px"><span class="t-s" style="font-weight:700">近 8 周 · 每周组数</span><div class="sp"></div>${proTag(false)}</div>${bars8([30, 44, 52, 40, 58, 62, 22, 48], 26, 66)}
        <div class="row t-s" style="justify-content:space-between;margin-top:4px"><span>8 周前</span><span>本周</span></div>
        <div class="btn" style="margin-top:16px;background:#FAFAF8;color:#1d1d1b;box-shadow:inset 0 0 0 1.5px #2b2b29">找练这块的动作</div>`),
    },
    W2: {
      title: '高级分析 ② 动作对比：进步曲线页叠一条',
      note: '<em>第二个真内容</em>：进步曲线页（P10）在大数字下面一行「对比 ＋ 选一个动作」，点开底部面板列出同部位、练过的动作（可撤销 → 面板），选了就把它的曲线以虚线叠上来，图例两行；再点 ✕ 取消对比。行尾同样一个「Pro ›」。代价：比 W1 多一个面板和一条线的交互；曲线页本来就有拖动游标，叠线时游标同时读两条。',
      html: () => `${status}${subTop('杠铃深蹲')}<div class="pad"><div class="t-xl">142.5<span class="t-b"> kg 预估 1RM</span></div>
        <div class="row" style="margin-top:10px;gap:8px" data-a="1"><span class="chip" data-hit>对比 ＋ 选一个动作</span><div class="sp"></div>${proTag(false)}</div>
        <div class="fill" style="height:220px;margin-top:10px;position:relative"><svg viewBox="0 0 320 220" style="position:absolute;inset:0;width:100%;height:100%"><polyline points="10,190 60,170 110,150 160,140 210,110 260,95 310,70" fill="none" stroke="#2b2b29" stroke-width="3"/><polyline points="10,200 60,185 110,180 160,160 210,150 260,140 310,120" fill="none" stroke="#7a7a76" stroke-width="2.5" stroke-dasharray="6 5"/></svg></div>
        <div class="row t-s" style="gap:14px;margin-top:8px"><span>━ 杠铃深蹲</span><span>┅ 前蹲（对比）✕</span></div>
        <div class="t-s" style="margin-top:14px;font-weight:700">最近 8 次</div><div class="box" style="height:200px;margin-top:6px"></div></div>`,
    },
    W3: {
      title: '冻结卡提示 ① 牛龄页 · 快断了、手上没有冻结卡',
      note: '<em>引擎已经会判「快断」</em>（这周还差的次数 > 剩下的天数），但 App 里没地方显示。落在牛龄页三格下面一行（它就是讲连胜的页）；手上没有冻结卡时给两个出口：「兑一张冻结卡 · 800 牛劲」直接打开钱包的兑换面板（只放这一种）；「Pro 每月送 2 张 ›」文字链进付费墙。「我的」成长卡上那句话这周换成「这周快断了 ›」，点卡照常进牛龄页。演示要看得到：/demo 加一步，把时间调到周六（还差 2 次）。',
      html: () => `${status}${subTop('牛龄')}<div class="pad"><div class="fill" style="height:200px;display:flex;align-items:center;justify-content:center"><span class="t-s">小牛 · 段名小级 · 离下一级</span></div>
        <div class="box" style="margin-top:12px;padding:12px">${statRow([[21, ' 周', '连胜'], ['1 / 3', ' 次', '本周'], [0, ' 张', '冻结卡']])}</div>
        <div style="margin-top:10px">${riskRow('断了连胜从 0 开始。冻结卡会在没练够的那周自动用掉一张。', `<div class="row" style="gap:8px;margin-top:10px"><div class="btn" style="flex:1;height:48px;font-size:14px;background:#FAFAF8;color:#1d1d1b;box-shadow:inset 0 0 0 1.5px #2b2b29">兑一张冻结卡 · 800 牛劲</div></div><div class="t-s" data-hit style="display:flex;align-items:center;justify-content:center;height:48px;margin-top:8px">Pro 每月送 2 张 ›</div>`)}</div>
        <div class="t-s" style="margin:14px 0 6px;font-weight:700">最近 12 周</div>${wkStrip()}</div>`,
    },
    W4: {
      title: '冻结卡提示 ② 有冻结卡 / 已是会员',
      note: '<em>有卡就不打扰</em>：手上有冻结卡时同一行只说结果——「有 1 张冻结卡，这周没练够会自动用掉，连胜保住」，没有按钮（没什么要做的）。已是 Pro、这个月的 2 张也用完了：只给「兑一张冻结卡」，不再推 Pro。三种情况都不进训练流程、不弹窗。',
      html: () => `${status}${subTop('牛龄')}<div class="pad"><div class="fill" style="height:200px;display:flex;align-items:center;justify-content:center"><span class="t-s">小牛 · 段名小级 · 离下一级</span></div>
        <div class="box" style="margin-top:12px;padding:12px">${statRow([[21, ' 周', '连胜'], ['1 / 3', ' 次', '本周'], [1, ' 张', '冻结卡']])}</div>
        <div style="margin-top:10px">${riskRow('有 1 张冻结卡：这周没练够会自动用掉，连胜保住。')}</div>
        <div class="t-s" style="margin:18px 0 6px;font-weight:700">会员、本月 2 张已用完</div>${riskRow('这个月 Pro 送的 2 张已经用了。', '<div class="btn" style="margin-top:10px;height:48px;font-size:14px;background:#FAFAF8;color:#1d1d1b;box-shadow:inset 0 0 0 1.5px #2b2b29">兑一张冻结卡 · 800 牛劲</div>')}</div>`,
    },
  };
  LAYERS.proentry = ['战略：「Pro 标」和「冻结卡提示」是付费墙的入口，但入口要落在真东西上——标在哪，那项权益就在哪看得见；不为了导流造一个空页', '范围：高级分析 = 肌群容量趋势（肌头面板「近 8 周」）+ 动作对比（曲线页叠一条）；冻结卡提示 = 引擎「快断」（还差次数 > 剩下天数）时牛龄页一行，按有没有卡 / 是不是会员给不同出口', '结构：Pro 标 → 未开通 /pro、已开通 /me/pro；会员中心「高级分析」→ 容量页打开练得最多那块的面板；快断行「兑一张」→ 钱包兑换面板（只放冻结卡）、「Pro 每月送 2 张」→ /pro', '框架：Pro 标是块标题旁的小标，不是主操作；快断行是辅助信息，按钮最多一个（描边），Pro 是文字链；有卡时不放按钮', '表现：Pro 标描边 / 已开通骨白实底，不用荧光；快断行用「!」标 + 深灰底，不用危险红（不是错误）'];
  LAYERS.pro = ['战略：完整展示会员商业链路（作品集），但不误导、不拦截——演示模式下全部功能照常可用（T18）', '范围：免费 vs Pro 对比 · 月 ¥18 / 年 ¥128（默认）/ 试用 7 天 · 假成功开通 · 开通成功（Milo 庆祝）· 已开通转 P21；不收集任何支付信息', '结构：P20 /pro；入口 我的「会员」行、高级分析 Pro 标、冻结卡提示、会员价；开通成功 → 回来源页', '框架：第一优先 = 对我有什么用（W1 对比表 / W2 用我的数据）；主操作 = 拇指区「开始 7 天试用 / 开通」；方案选择紧贴主按钮上方', '表现：荧光只给主按钮；年度「省 40%」是骨白标；开通成功是品牌位置，放 Milo'];
  LAYERS.prohub = ['战略：开通以后看得见「值不值」，也能退得出去（切回免费不收回已得的东西）', '范围：会员卡（方案 · 到期 / 试用剩几天）· 本月 Pro 给了你什么（多拿的牛劲 · 冻结卡领 / 用 · 会员价省下）· 权益入口 · 管理订阅（演示切回免费，二次确认）', '结构：P21 /me/pro；入口 开通成功、我的「会员」行（已开通 / 试用中）', '框架：第一优先 = 到期日 + 本月得到的；没有主操作（不制造「再买点」的压力）；危险操作（切回免费）沉底、先确认', '表现：数字窄体；不放荧光块'];
  Object.assign(LAYERS, {
    wallet: ['战略：知道自己攒了多少牛劲、能换什么，并且把它用掉（T15 / T17）；钱包是「增长闭环后半段」的落点', '范围：余额（≈ 元）、明细（获得 / 支出，会员 ×1.5）、卡券（可用 / 已用 / 过期）、兑换卡券（冻结卡 800 · 免邮 300 · 商家券 1,500 · Pro 体验 2,000）、去商城抵扣', '结构：P14 /me/wallet；入口 我的「钱包 · 商城」、奖励弹窗「去钱包」；兑换走底部面板（可撤销 → 面板），兑换成功轻提示', '框架：第一优先 = 余额；主操作因方案而异（W1 兑换卡券 / W2 两个出口 / W3 兑换列表）；返回左上', '表现：余额用窄体大数；支出灰；牛劲图标用 PropGlyph；不加荧光（荧光留给奖励时刻）'],
    shop: ['战略：在训练数据说明「需要」的时候，弄懂补给 / 护具该不该用，并能直接买到（T16）；不做成一般电商', '范围：为你推荐（知识卡驱动，没有触发时是通用入门卡）· 品类 全部 / 护具 / 补给 · 5 款商品 × 状态（热销 / 折扣 / 新品 / 缺货 / 已下架）× 会员价 · 牛劲可抵 / 不足；商家与品牌虚构', '结构：P15 /shop；入口 我的「钱包 · 商城」、钱包；→ 知识卡 P16、商品 P17', '框架：第一优先 = 为你推荐的理由；主操作 = 点商品；钱包余额在右上（可点进钱包）', '表现：状态标用形状 + 文字（缺货虚线）；价格窄体；划线价灰；会员价骨白'],
    guide: ['战略：先讲清楚为什么、什么时候用、怎么用，再给商品（知识卡是商城主要入口）', '范围：理由（按你的数据，带一个数）· 为什么 / 什么时候 / 怎么用 · 不构成医疗建议 · 2–3 个相关商品 · 不再提示这一类', '结构：P16 /shop/guide/:id；入口 容量页 / 增量页的知识卡提示（一屏最多一条）、商城推荐', '框架：第一优先 = 你的数据证据；主操作 = 看商品（W2 底部按钮 / W1 底部横滑）', '表现：证据小图复用 Sparkline / 刻度尺；补剂不做疗效承诺'],
    item: ['战略：看清价格（会员价、牛劲能抵多少）和状态，决定买不买', '范围：图、商家、名字、规格、价格 / 划线价 / 会员价、牛劲可抵 / 不足、状态（缺货 → 到货提醒，下架 → 回商城）、相关知识卡', '结构：P17 /shop/item/:id；→ 下单确认 P18', '框架：第一优先 = 价格区；主操作 = 底部「购买 · ¥」（缺货时「到货提醒」，下架「回商城」），永远有出口', '表现：现价窄体大字、划线价灰；状态标形状 + 文字'],
    order: ['战略：演示一笔完整下单，展示卡券和牛劲怎么抵，同时不误导（演示模式）', '范围：P18 商品 · 卡券 · 牛劲抵扣开关（最多 20%，不足写还差多少）· 合计 · 提交（提交中禁用）；P19 演示订单号 · 明细 · 牛劲 / 卡券扣减 · 回商城（替换历史）', '结构：P17 → P18 → P19 → P15（返回不回 P18）', '框架：P18 第一优先 = 商品 + 合计，主操作「提交订单 · ¥」；P19 第一优先 = 成功 + 余额变化，主操作「回商城」', '表现：P19 小牛开心状态（Mascot happy）；不放支付相关输入'],
  });

  const PAGES = {
    body: { title: '身体 · 容量与恢复（P06）', sub: '放大镜按住「中下胸」· 数据 design/benchmark/p06.json', v: BODY },
    home: { title: '首页 · 今日处方（P01）', sub: '有处方、还没开始 · 演示场景 plain-prescription', v: HOME },
    gains: { title: '增量 · 增量总览（P09）', sub: '渐进超负荷的全局视图', v: GAINS },
    log: { title: '记录 · 训练记录（P07）', sub: '时间倒序', v: LOG },
    me: { title: '我的（P11）', sub: '档案与设置', v: ME },
    me2: { title: '我的（P11 · 并入成长层，阶段 6d）', sub: '在已选的 W2「档案四格」上加牛龄行 / 钱包 · 商城 / 会员 / 消息 / 导出 CSV · 数字取自演示用户的形状', v: ME2 },
    level: { title: '牛龄（P13）', sub: '「我的」顶部牛龄行进入 · 子页，无导航 · 壮牛 2 级 / 连胜 9 周为示意', v: LEVEL },
    session: { title: '训练进行中（P03）', sub: '第 1 个动作做完 1 组，正在休息 · 无导航（2026-10-06 作废：打卡并入首页，见 checkin）', v: SESSION },
    checkin: { title: '首页即打卡（P01 + 原 P03）', sub: '已开始：第 1 个动作做完 2 组、正在休息 · 导航外圈 2/13 · 选中胶囊「首页 1:35」', v: CHECKIN },
    sheet: { title: '肌头详情面板（身体页）', sub: '松手后打开「中下胸」', v: SHEET },
    story: { title: '故事引导（P12 前 3 屏）', sub: 'A = 三幕插画，B = 一条成长线；各 3 屏', v: STORYV },
    p04: { title: '6e · 动作要领（P04）', sub: '杠铃深蹲 · 训练中从主角卡「要领」进入（顶部保留休息提示）', v: P04, layers: LAYERS.p04 },
    swap: { title: '6e · 替换动作（底部面板）', sub: '训练中，主角卡「换一个」· 杠铃深蹲 → 同练股四头', v: SWAP, layers: LAYERS.swap },
    warm: { title: '6e · 热身组', sub: '开始训练后的主角卡 · 杠铃深蹲正式重量 85 kg', v: WARM, layers: LAYERS.warm },
    find: { title: '6e · 点选肌头检索动作', sub: '容量页点「中下胸」/ 首页「＋ 加一个动作」· 演示用户器械：杠铃 / 哑铃 / 固定器械 / 自重（没有绳索）', v: FIND, layers: LAYERS.find },
    finder: { title: '6e · 检索面板（选定 W2 后重排）', sub: '人体在右（拇指区），列表在左（眼睛看）· 数据：mock/exercises.json 实际动作 · 演示器械：杠铃 / 哑铃 / 固定器械 / 自重', v: FINDER, layers: LAYERS.finder },
    wallet: { title: '6f · 钱包（P14）', sub: '「我的 → 钱包 · 商城」进入 · 演示用户 6,060 牛劲、2 张可用卡券', v: WALLET, layers: LAYERS.wallet },
    shop: { title: '6f · 商城（P15）', sub: '5 款商品：腰带折扣 · 蛋白粉热销 · 肌酸新品 · 护膝缺货 · 助力带常规；被数据触发的知识卡：腰带', v: SHOP, layers: LAYERS.shop },
    guide: { title: '6f · 知识卡（P16）', sub: '腰带：深蹲预估 1RM 142 kg ÷ 体重 93 kg = 1.52', v: GUIDE, layers: LAYERS.guide },
    item: { title: '6f · 商品详情（P17）', sub: '杠铃腰带（折扣）· 7 毫米护膝（缺货）', v: ITEM, layers: LAYERS.item },
    order: { title: '6f · 下单确认（P18）与订单完成（P19）', sub: '腰带 M 码 · 会员价 · 满 200 减 30 · 牛劲抵 ¥59', v: ORDER, layers: LAYERS.order },
    tips: { title: '6f · 知识卡提示放在哪（容量 P06 / 增量 P09）', sub: '演示用户：胸部恢复慢 → 蛋白质与睡眠；深蹲 142 kg ÷ 93 kg = 1.52 → 腰带', v: TIPS, layers: LAYERS.tips },
    pro: { title: '6g · 会员 · 付费墙（P20）', sub: '演示用户：进阶、连胜 21 周、这 30 天拿了 1,050 牛劲 · 演示模式全部权益不拦截', v: PRO, layers: LAYERS.pro },
    prohub: { title: '6g · 会员中心（P21）与「我的」会员行', sub: '已开通 / 试用中 / 未开通三态', v: PROHUB, layers: LAYERS.prohub },
    proentry: { title: '6g 补 · Pro 标与冻结卡提示的落点', sub: '演示用户：股四头肌外侧头近 7 天 11 组；连胜 21 周、本周 1 / 3、周六', v: PROENTRY, layers: LAYERS.proentry },
    pause: { title: '6e · 暂停训练确认', sub: '训练中在首页按系统返回 · 已记 6 / 13 组', v: PAUSE, layers: LAYERS.pause },
  };

  // ---------- 标注 ----------
  function annotate(screen) {
    if (!ANNO) return;
    const sr = screen.getBoundingClientRect();
    for (const el of screen.querySelectorAll('[data-a]')) {
      const n = el.dataset.a; if (!/^[123]$/.test(n)) continue;
      const r = el.getBoundingClientRect();
      const a = document.createElement('div');
      a.className = 'anno a' + n;
      Object.assign(a.style, { left: r.left - sr.left - 3 + 'px', top: r.top - sr.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px' });
      a.innerHTML = `<b>${'①②③'[n - 1]}</b>`;
      screen.appendChild(a);
    }
  }

  // ---------- 手指热区 ----------
  // 拇指可达区：以右下角外侧为圆心的两道弧（Hoober 单手握持图的简化），半径按 360 × 800 屏取
  const ZONE = { cx: 330, cy: 860, easy: 380, ok: 560 };
  const zoneOf = (x, y) => { const d = Math.hypot(x - ZONE.cx, y - ZONE.cy); return d <= ZONE.easy ? '易' : d <= ZONE.ok ? '够得着' : '难'; };
  function hitmap(screen) {
    if (!HIT) return;
    const sr = screen.getBoundingClientRect(), W = sr.width, H = sr.height;
    const z = document.createElement('div');
    z.className = 'zones';
    z.innerHTML = `<svg width="${W}" height="${H}"><circle cx="${ZONE.cx}" cy="${ZONE.cy}" r="${ZONE.ok}" class="z-ok"/><circle cx="${ZONE.cx}" cy="${ZONE.cy}" r="${ZONE.easy}" class="z-easy"/>
      <text x="12" y="${H - 300}" class="z-t">够得着</text><text x="${W - 40}" y="${H - 150}" class="z-t">易</text><text x="12" y="70" class="z-t">难</text></svg>`;
    screen.insertBefore(z, screen.firstChild);
    const els = [...screen.querySelectorAll('[data-hit], .btn, .nav .it')].filter((e) => e.dataset.hit !== 'no');
    const boxes = els.map((e) => {
      const r = e.getBoundingClientRect();
      const w = Math.max(r.width, HIT_MIN), h = Math.max(r.height, HIT_MIN);
      const x = r.left - sr.left + r.width / 2 - w / 2, y = r.top - sr.top + r.height / 2 - h / 2;
      return { e, x, y, w, h, grown: r.width < HIT_MIN || r.height < HIT_MIN };
    });
    const overlap = (a, b) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
    boxes.forEach((b, i) => {
      // 父子关系不算重叠（整行可点、里面还有一个按钮的情况，线框里不该出现；出现了照样标）
      const bad = boxes.some((o, j) => j !== i && !o.e.contains(b.e) && !b.e.contains(o.e) && overlap(b, o));
      // 只查单个主按钮：② 区域里只有一个可点的东西时才算「主操作」；可滚动的列表（商品、结果行）滑一下就到拇指区，不查
      const reg = b.e.closest('[data-a="2"]');
      const primary = reg && reg.querySelectorAll('[data-hit], .btn').length <= 1 && zoneOf(b.x + b.w / 2, b.y + b.h / 2) === '难';
      const d = document.createElement('div');
      d.className = 'hitbox' + (bad || primary ? ' bad' : '') + (b.grown ? ' grown' : '');
      Object.assign(d.style, { left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px' });
      d.innerHTML = `<i>${Math.round(b.w)}×${Math.round(b.h)}${bad ? ' 重叠' : ''}${primary ? ' 主操作在难区' : ''}</i>`;
      screen.appendChild(d);
    });
    screen.dataset.hitBad = String(screen.querySelectorAll('.hitbox.bad').length);
  }

  function mount(host, page, key) {
    const v = PAGES[page].v[key];
    const s = document.createElement('div');
    s.className = 'screen';
    s.innerHTML = v.html();
    host.appendChild(s);
    if (v.post) v.post(s);
    annotate(s);
    hitmap(s);
    return s;
  }

  async function boot() {
    [D, P06] = await Promise.all([j('data.json'), j('../benchmark/p06.json')]);
    const M = await j('../../mock/muscles.json');
    for (const h of M.heads) REGION[h.id] = h.region;
    for (const r of M.regions) RNAME[r.id] = r.name;
    SVG.front = await t('body-male-front.svg');
    SVG.back = await t('body-male-back.svg');
    EX = await j('../../mock/exercises.json'); for (const h of M.heads) HNAME[h.id] = h.name;
    try { await document.fonts.ready; } catch (e) { /* 字体没到就用系统字体 */ }
    const app = document.getElementById('app');
    const page = Q.get('page'), board = Q.get('board');
    if (page && PAGES[page]) {
      document.body.classList.add('single');
      mount(app, page, Q.get('v') || 'W1');
    } else if (board && PAGES[board]) {
      const P = PAGES[board];
      const b = document.createElement('section');
      b.className = 'board';
      b.innerHTML = `<h1>${P.title}<small>${P.sub}</small></h1><div class="legend-anno"><span class="a1">① 第一优先信息</span><span class="a2">② 主操作</span><span class="a3">③ 导航</span>${HIT ? '<span class="hz">手指热区：底色 = 拇指可达（易 / 够得着 / 难），虚框 = 命中区（不足 48 补到 48），红 = 重叠或主操作在难区</span>' : ''}</div>${P.layers ? `<ol class="layers">${P.layers.map((l) => `<li>${l.replace(/^([^：]+)：/, '<b>$1</b>')}</li>`).join('')}</ol>` : ''}<div class="board-row"></div>`;
      app.appendChild(b);
      for (const k of Object.keys(P.v)) {
        const c = document.createElement('div');
        c.className = 'col';
        c.innerHTML = `<h2><b>${k}</b>${P.v[k].title}</h2>`;
        b.querySelector('.board-row').appendChild(c);
        mount(c, board, k);
        c.insertAdjacentHTML('beforeend', `<div class="note">${P.v[k].note}</div>`);
      }
    } else {
      app.innerHTML = `<div class="index"><h1>慢牛 Milo · 框架层线框</h1><p>灰阶，只比布局与信息层级。每页 2–3 个方案，选定后才进入表现层（Stitch 多方案 + 高保真）。人体是 MuscleWiki 真实路径的半身裁切。</p><ul>${Object.entries(PAGES).map(([k, p]) => `<li><a href="?board=${k}">${p.title}</a> <span class="t-s">${Object.keys(p.v).length} 个方案</span></li>`).join('')}</ul></div>`;
    }
    document.body.dataset.ready = '1';
  }
  boot().catch((e) => { document.body.innerHTML = '<pre>' + esc(e.stack || e) + '</pre>'; document.body.dataset.ready = 'err'; });
})();
