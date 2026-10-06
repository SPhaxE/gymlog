import json
OUT='/home/user/gymlog/design/hifi/log/proto'
data=json.load(open(f'{OUT}/trained.json'))
html = r'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>钢板打孔日历 · 原型（一次性，不进 App）</title>
<link rel="stylesheet" href="../../../tokens/tokens.css">
<style>
  html,body{margin:0;background:var(--milo-color-bg-base);color:var(--milo-color-text-primary);font-family:var(--milo-font-ui)}
  .page{position:fixed;inset:0;max-width:360px;margin:0 auto;overflow:hidden}
  .scroll{height:100%;overflow-y:auto;scrollbar-width:none}
  .scroll::-webkit-scrollbar{display:none}
  header{padding:20px 16px 0}
  header small{color:var(--milo-color-text-secondary);font-size:12px}
  header h1{margin:6px 0 0;font-size:30px;line-height:1.1}
  .lead{margin:14px 16px 10px;font-size:15px;color:var(--milo-color-text-secondary)}
  .lead b{color:var(--milo-color-text-primary);font-size:22px;font-family:var(--milo-font-number)}
  /* 钢板：外框裁圆角；后面一层荧光「灯」，只从孔里透出来 */
  .plateWrap{view-timeline:--plate block;position:relative;margin:0 16px;border-radius:14px;overflow:hidden;background:#000;isolation:isolate}
  .light{position:absolute;z-index:-1;top:-20%;bottom:-20%;left:-60%;width:220%;
    background:
      linear-gradient(rgba(212,255,58,.30),rgba(212,255,58,.30)),
      radial-gradient(34% 62% at 38% 50%, var(--milo-prim-lime-500) 0%, rgba(212,255,58,.55) 38%, transparent 72%),
      radial-gradient(22% 50% at 72% 55%, rgba(212,255,58,.75) 0%, transparent 70%);
    animation:lamp linear both;animation-timeline:--plate;animation-range:cover 0% cover 100%}
  @keyframes lamp{from{transform:translateX(-22%)}to{transform:translateX(22%)}}
  .plate{display:block;width:100%;height:auto}
  .sheen{transform-box:fill-box;transform-origin:center;animation:sweep linear both;animation-timeline:--plate;animation-range:cover 0% cover 100%}
  @keyframes sweep{from{transform:translateX(-62%) skewX(-22deg)}to{transform:translateX(62%) skewX(-22deg)}}
  .hl{animation:hl linear both;animation-timeline:--plate;animation-range:cover 0% cover 100%}
  @keyframes hl{from{transform:translate(1.1px,1.1px)}to{transform:translate(-1.1px,-1.1px)}}
  @media (prefers-reduced-motion:reduce){.light,.sheen,.hl{animation:none}}
  /* 下面的列表只是陪衬 */
  .week{margin:22px 16px 6px;display:flex;justify-content:space-between;font-size:13px;color:var(--milo-color-text-secondary)}
  .row{margin:0 16px;padding:14px 0;border-bottom:1px solid var(--milo-color-line-default);display:grid;gap:4px}
  .row b{font-size:15px}.row span{font-size:12px;color:var(--milo-color-text-secondary)}
</style></head><body>
<div class="page"><div class="scroll" id="sc">
  <header><small>过去每一次练了什么</small><h1>记录</h1></header>
  <p class="lead">近 3 个月练了 <b id="n">0</b> 天</p>
  <figure class="plateWrap" style="margin-bottom:0"><div class="light"></div><svg class="plate" id="plate" xmlns="http://www.w3.org/2000/svg"></svg></figure>
  <div id="rows"></div>
</div></div>
<script>
const DATA=__DATA__, DAY=864e5;
const trained=new Set(DATA.days), today=DATA.today, now=today+DAY/2;
const sod=(t)=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
// ---- 和 src/components/dataviz.tsx 的 dotMonths 同一套规则
function dotMonths(count=3){
  const d=new Date(now),out=[];
  for(let m=count-1;m>=0;m--){
    const first=new Date(d.getFullYear(),d.getMonth()-m,1),last=new Date(d.getFullYear(),d.getMonth()-m+1,0);
    let t=sod(first.getTime()-((first.getDay()+6)%7)*DAY);const weeks=[];
    while(t<=last.getTime()){const col=[];for(let i=0;i<7;i++,t=sod(t+DAY*1.5)){const inM=new Date(t).getMonth()===first.getMonth();
      col.push({t,state:!inM?'out':t===today?'today':t>today?'future':trained.has(t)?'trained':'rest'})}weeks.push(col)}
    out.push({label:(first.getMonth()+1)+'月',weeks})}
  return out}
const months=dotMonths();
document.getElementById('n').textContent=months.flatMap(m=>m.weeks.flat()).filter(x=>x.state==='trained').length;
// ---- 钢板几何
const W=328,PAD=16,TOP=26,GAPW=.7;
const ncol=months.reduce((k,m)=>k+m.weeks.length,0), units=ncol+GAPW*(months.length-1);
const P=(W-PAD*2)/units, R=P*.34, RB=P*.43, H=TOP+7*P+PAD*.9;
const pos=[];let x=PAD+P/2;const labels=[];
months.forEach((m,mi)=>{labels.push({x:x-P/2+2,text:m.label});m.weeks.forEach(col=>{col.forEach((c,r)=>pos.push({...c,x,y:TOP+P/2+r*P}));x+=P});x+=P*GAPW});
const trainedPts=pos.filter(c=>c.state==='trained'||(c.state==='today'&&trained.has(c.t)));
const rest=pos.filter(c=>c.state==='rest'||c.state==='today'&&!trained.has(c.t));
const fut=pos.filter(c=>c.state==='future');
const todayPt=pos.find(c=>c.state==='today');
const u=(id,c)=>`<use href="#${id}" x="${c.x.toFixed(1)}" y="${c.y.toFixed(1)}"/>`;
const css=(v)=>`var(--milo-prim-${v})`;
// 钢印（原型里只画「配重片印」一种）：浮雕 = 一份亮边 + 一份暗边，亮边随滚动微移
const sx=W-PAD-P*2.2,sy=TOP+P*5.2,SR=P*1.7;
const stamp=`<g id="st"><circle r="${SR}" fill="none" stroke-width="1.6"/><circle r="${SR*.72}" fill="none" stroke-width="1"/><circle r="${SR*.22}" fill="none" stroke-width="1.6"/>
  ${Array.from({length:24},(_,i)=>{const a=i/24*Math.PI*2,r0=SR*.8,r1=SR*(i%6?0.9:1.0);return `<line x1="${(Math.sin(a)*r0).toFixed(2)}" y1="${(-Math.cos(a)*r0).toFixed(2)}" x2="${(Math.sin(a)*r1).toFixed(2)}" y2="${(-Math.cos(a)*r1).toFixed(2)}" stroke-width="1"/>`}).join('')}
  <path d="M${-SR*.32} ${SR*.12}L0 ${-SR*.34}L${SR*.32} ${SR*.12}" fill="none" stroke-width="1.6"/></g>`;
document.getElementById('plate').setAttribute('viewBox',`0 0 ${W} ${H.toFixed(1)}`);
document.getElementById('plate').innerHTML=`
<defs>
  <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${css('gray-400')}"/><stop offset=".45" style="stop-color:${css('gray-300')}"/><stop offset="1" style="stop-color:${css('gray-200')}"/></linearGradient>
  <pattern id="brush" width="8" height="3" patternUnits="userSpaceOnUse"><rect width="8" height=".8" fill="#fff" opacity=".045"/><rect y="1.6" width="5" height=".6" fill="#000" opacity=".12"/></pattern>
  <linearGradient id="sheenG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".30"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <radialGradient id="dimple"><stop offset="0" stop-color="#000" stop-opacity=".75"/><stop offset=".62" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></radialGradient>
  <radialGradient id="glowG"><stop offset=".5" stop-color="#D4FF3A" stop-opacity=".2"/><stop offset="1" stop-color="#D4FF3A" stop-opacity="0"/></radialGradient>
  <linearGradient id="bev" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset=".55" stop-color="#000" stop-opacity="0"/></linearGradient>
  <g id="cut"><circle r="${R}" fill="#000"/></g>
  <g id="bevel"><circle r="${(R+RB)/2}" fill="none" stroke="url(#bev)" stroke-width="${RB-R}"/></g>
  <g id="wallS"><circle r="${R-.7}" fill="none" stroke="#000" stroke-opacity=".7" stroke-width="1.7" stroke-dasharray="${(2*Math.PI*(R-.7)*.46).toFixed(2)} 999" transform="rotate(158)"/><circle r="${R+.2}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".8" stroke-dasharray="${(2*Math.PI*(R+.2)*.25).toFixed(2)} 999" transform="rotate(-28)"/></g>
  <g id="dimp"><circle r="${P*.13}" fill="url(#dimple)"/></g>
  <g id="glow"><circle r="${P*.78}" fill="url(#glowG)"/></g>
  <mask id="holes" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${trainedPts.map(c=>u('cut',c)).join('')}</mask>
  <clipPath id="plateClip"><rect width="${W}" height="${H}" rx="14"/></clipPath>
</defs>
<g clip-path="url(#plateClip)">
  <g mask="url(#holes)">
    <rect width="${W}" height="${H}" fill="url(#steel)"/><rect width="${W}" height="${H}" fill="url(#brush)"/>
    <rect class="sheen" x="${W*.1}" y="-10" width="${W*.55}" height="${H+20}" fill="url(#sheenG)" style="mix-blend-mode:soft-light"/>
  </g>
  <rect x=".5" y=".5" width="${W-1}" height="${H-1}" rx="13.5" fill="none" stroke="#fff" stroke-opacity=".16"/>
  <rect x="3" y="3" width="${W-6}" height="${H-6}" rx="11" fill="none" stroke="#000" stroke-opacity=".35"/>
  ${[[10,10],[W-10,10],[10,H-10],[W-10,H-10]].map(([a,b])=>`<g transform="translate(${a} ${b})"><circle r="2.6" fill="${css('gray-500')}" opacity=".7"/><circle r="2.6" fill="none" stroke="#000" stroke-opacity=".6"/><line x1="-1.6" y1="1.6" x2="1.6" y2="-1.6" stroke="#000" stroke-opacity=".7" stroke-width=".9"/></g>`).join('')}
  ${labels.map(l=>`<text x="${l.x+.6}" y="${TOP-8+.6}" font-size="9.5" letter-spacing="1" fill="#fff" fill-opacity=".22">${l.text}</text><text x="${l.x}" y="${TOP-8}" font-size="9.5" letter-spacing="1" fill="#000" fill-opacity=".62">${l.text}</text>`).join('')}
  ${trainedPts.map(c=>u('bevel',c)).join('')}${trainedPts.map(c=>u('wallS',c)).join('')}
  ${rest.map(c=>u('dimp',c)).join('')}
  ${fut.map(c=>`<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${P*.06}" fill="#000" opacity=".28"/>`).join('')}
  ${todayPt?`<circle cx="${todayPt.x.toFixed(1)}" cy="${todayPt.y.toFixed(1)}" r="${RB+1.6}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1"/><circle cx="${todayPt.x.toFixed(1)}" cy="${todayPt.y.toFixed(1)}" r="${RB+2.2}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width=".8"/>`:''}
  <g transform="translate(${sx} ${sy}) rotate(-7)">
    <defs>${stamp}</defs>
    <g fill="none" stroke="#000" stroke-opacity=".6"><use href="#st" transform="translate(-1 -1)"/></g>
    <g class="hl" fill="none" stroke="#fff" stroke-opacity=".34"><use href="#st" transform="translate(1 1)"/></g>
    <g fill="none" stroke="${css('gray-200')}" stroke-opacity=".9"><use href="#st"/></g>
  </g>
  <g style="mix-blend-mode:screen">${trainedPts.map(c=>u('glow',c)).join('')}</g>
</g>`;
// 陪衬列表
const rows=[['本周 · 10月5日–10月11日','1 次 · 14 组'],['上周 · 9月28日–10月4日','4 次 · 62 组']];
document.getElementById('rows').innerHTML=rows.map(([a,b],i)=>`<div class="week"><span>${a}</span><span>${b}</span></div>`+[0,1,2,3].map(k=>`<div class="row"><b>10月${6-i*3-k}日</b><span>下肢 · 背 · 手臂 · 6 个动作 · 14 组 · 52 分钟</span></div>`).join('')).join('')+'<div style="height:200px"></div>';
</script></body></html>'''
open(f'{OUT}/plate.html','w').write(html.replace('__DATA__', json.dumps(data)))
print('ok')
