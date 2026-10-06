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
