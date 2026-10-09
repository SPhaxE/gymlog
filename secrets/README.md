# secrets/（临时）

- `stitch.env`：Stitch MCP 的密钥（`STITCH_API_KEY`）。用户 2026-10-09 给的，说明：仓库是私密的，直接放在这里，每次换窗口交接时告诉新窗口在这里，**以后不要再向用户要 Stitch 密钥**；项目做完用户会自己删掉这个文件。
- 读法：`design/hifi/tools/stitch.py` 取密钥的顺序是 环境变量 `STITCH_API_KEY` → `~/.claude.json` 里名为 stitch 的 MCP → 这里的 `stitch.env`。
- 不要在命令输出、日志、截图、提交说明里打印密钥本身。
- 这个目录在仓库根，**不会**被 `scripts/copy_static.mjs` 拷进 `dist/`（只拷 `prototype/` `mock/` `design/`），所以不会上 Vercel 的公开网站。不要把密钥挪到 `design/` `mock/` `prototype/` `public/` 下面。
