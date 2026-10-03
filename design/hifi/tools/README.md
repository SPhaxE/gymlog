# 高保真工具

- `stitch.py`：Stitch MCP（HTTP JSON-RPC）的最小客户端。密钥从本机 `~/.claude.json` 的 stitch 配置读取，**不进仓库**。`python3 stitch.py list` / `call <tool> '<json>'`。
- `run_round.py`：按 `design/hifi/<页面>/build_stitch_r*.py` 的方向逐个生成。**每个方向单独建一个 Stitch 项目**——同一项目里后生成的会套用第一张的设计系统，方向会趋同（2026-10-03 踩过）。结果存为当前目录的 `r1b.json`。
- `render_stitch.py`：下载 Stitch 生成的 HTML，用 Chromium 按 360×800 @2x 截图（比 Stitch 画布缩略图清楚）。外部资源（Tailwind、Google Fonts）由 Python 代取并照常校验证书，因为沙盒里的 Chromium 不信任代理证书。
- `../board.py`：截图 + `<轮次>-notes.json` → 对比板 `screenshots/hifi/<页面>/<轮次>-board.png`。
