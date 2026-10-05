# 高保真工具

一轮 Stitch 的完整流程（在仓库根目录）：

```
python3 design/hifi/build_stitch_r2.py              # 生成提示词（r1 是 design/hifi/<页面>/build_stitch_r1.py）
python3 design/hifi/tools/run_round.py body r2      # 逐个生成，每个方案单独一个 Stitch 项目
python3 design/hifi/tools/render_stitch.py body r2  # 下载 HTML，按 360×800 @2x 截图
python3 design/hifi/board.py body r2                # 截图 + design/hifi/body/r2-notes.json → 对比板
```

- `stitch.py`：Stitch MCP（HTTP JSON-RPC）的最小客户端。密钥先读环境变量 `STITCH_API_KEY`，没有再找本机 `~/.claude.json` 里名为 stitch 的 MCP 配置，**不进仓库、不打印**。`python3 stitch.py list` / `call <tool> '<json>'`。
- `run_round.py`：每个方案单独建一个 Stitch 项目。同一项目里后生成的会套用第一张的设计系统，方向会趋同（2026-10-03 踩过）。结果写入 `design/hifi/<页面>/.<轮次>-results.json`（不入库），可以断点续跑。
- `render_stitch.py`：外部资源（Tailwind、Google Fonts）由 Python 代取并照常校验证书，因为沙盒里的 Chromium 不信任代理证书。
- `../board.py`：对比板；`../refs_board.py`：Nano Banana 参考图的元素提取板。
