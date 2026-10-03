/* 慢牛 Milo · 框架层线框。
 *   index.html                 总览
 *   index.html?board=body      同一页的几个方案并排（对比板）
 *   index.html?page=body&v=W1  单张（截图用）；&anno=0 关掉标注
 * 数据：data.json（引擎实算值）、../benchmark/p06.json（身体页）、../../mock/muscles.json（肌头 → 部位）。
 * 人体：body-*.svg 是 MuscleWiki 真实路径（build_assets.py 生成），这里按包围盒中线裁成半身。 */
(function () {
  const Q = new URLSearchParams(location.search);
  const ANNO = Q.get('anno') !== '0';
  let D, P06, REGION = {}, RNAME = {}, SVG = {};
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

  const PAGES = {
    body: { title: '身体 · 容量与恢复（P06）', sub: '放大镜按住「中下胸」· 数据 design/benchmark/p06.json', v: BODY },
    home: { title: '首页 · 今日处方（P01）', sub: '有处方、还没开始 · 演示场景 plain-prescription', v: HOME },
    gains: { title: '增量 · 增量总览（P09）', sub: '渐进超负荷的全局视图', v: GAINS },
    log: { title: '记录 · 训练记录（P07）', sub: '时间倒序', v: LOG },
    me: { title: '我的（P11）', sub: '档案与设置', v: ME },
    session: { title: '训练进行中（P03）', sub: '第 1 个动作做完 1 组，正在休息 · 无导航', v: SESSION },
    sheet: { title: '肌头详情面板（身体页）', sub: '松手后打开「中下胸」', v: SHEET },
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

  function mount(host, page, key) {
    const v = PAGES[page].v[key];
    const s = document.createElement('div');
    s.className = 'screen';
    s.innerHTML = v.html();
    host.appendChild(s);
    if (v.post) v.post(s);
    annotate(s);
    return s;
  }

  async function boot() {
    [D, P06] = await Promise.all([j('data.json'), j('../benchmark/p06.json')]);
    const M = await j('../../mock/muscles.json');
    for (const h of M.heads) REGION[h.id] = h.region;
    for (const r of M.regions) RNAME[r.id] = r.name;
    SVG.front = await t('body-male-front.svg');
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
      b.innerHTML = `<h1>${P.title}<small>${P.sub}</small></h1><div class="legend-anno"><span class="a1">① 第一优先信息</span><span class="a2">② 主操作</span><span class="a3">③ 导航</span></div><div class="board-row"></div>`;
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
