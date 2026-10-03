# 框架层线框（五层模型第 4 层）

灰阶，只比**布局与信息层级**，不代表最终视觉。每页 2–3 个方案，用户选定后才进入表现层（Stitch 多方案 + 高保真）。

- 打开：本地在仓库根目录 `python3 -m http.server 8765`，访问 `http://localhost:8765/design/wireframes/index.html`；Vercel 预览里是 `/design/wireframes/index.html`。
  - `?board=body` 对比板（同一页的方案并排，带 ① 第一优先信息 / ② 主操作 / ③ 导航 标注）
  - `?page=body&v=W1` 单张；`&anno=0` 关掉标注
- 截图：`python3 scripts/shoot_wireframes.py` → `screenshots/wireframes/<页面>/W*.png`、`board.png`
- 数据：`data.json` 是引擎在演示数据上的实算值；身体页读 `design/benchmark/p06.json`。
- 人体：`body-*.svg` 由 `build_assets.py` 从 MuscleWiki 真实路径（`scripts/bodymap.py`）生成；半身裁切在 `wf.js` 里按包围盒中线做，切口贴屏幕左边缘。
