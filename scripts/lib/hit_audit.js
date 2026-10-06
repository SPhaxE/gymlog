// 命中区审计（DESIGN §9.6）：页面上每个看得见、能点的元素，从中心往上下左右各 23 px 取点（共 48 × 48），
// 这些点 elementFromPoint 都得落回它自己（或它的子元素）——视觉小于 48 的控件要靠 ::after / 内边距把命中区补够。
// 中心点本身被别的东西盖住的（遮罩、上层面板）不算：那一刻它本来就点不到。返回不合格的列表。
() => {
  const SEL = 'button, a[href], [role=button], [role=radio], [role=tab], [role=switch], input:not([type=hidden]), select, textarea';
  const R = 23, out = [];  // 48 × 48 的框，留 1 px 给亚像素取整
  const vis = (el) => { const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05 && !el.closest('[aria-hidden=true], [inert]'); };
  const own = (el, x, y) => { const h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); };
  // 这一点被浮在上面的东西（底部按钮区、导航、悬浮胶囊）盖住了：内容滚到那里本来就点不到，不算命中区不够
  const covered = (el, x, y) => { for (let n = document.elementFromPoint(x, y); n && n !== document.body; n = n.parentElement) { if (n.contains(el)) return false; if (/fixed|absolute|sticky/.test(getComputedStyle(n).position)) return true; } return false; };
  for (const el of document.querySelectorAll(SEL)) {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true' || !vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx - R < 0 || cy - R < 0 || cx + R > innerWidth || cy + R > innerHeight) continue;   // 屏外 / 贴边的不量（滚进来再量）
    if (!own(el, cx, cy)) continue;
    const miss = [[0, -R], [0, R], [-R, 0], [R, 0]].filter(([dx, dy]) => !own(el, cx + dx, cy + dy) && !covered(el, cx + dx, cy + dy));
    if (miss.length) out.push({ el: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height), miss: miss.map(([dx, dy]) => dy < 0 ? '上' : dy > 0 ? '下' : dx < 0 ? '左' : '右').join('') });
  }
  return out;
}
