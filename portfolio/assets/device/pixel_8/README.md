# Pixel 8 样机框

来源：Android Studio 机型素材 `platform/tools/adt/idea` → `artwork/resources/device-art-resources/pixel_8`（AOSP，Apache 2.0），2026-10-11 取。

- `back.webp`：机身，1187 × 2513，屏幕区透明
- `mask.webp`：1080 × 2400，屏幕圆角与挖孔（不透明处盖在屏幕上）
- `layout`：屏幕左上角在机身的 (49, 55)，屏幕 1080 × 2400

合成：截图（1082 × 2402 时左右上下各裁 1 px，或直接按 412 × 915 @2.625 渲染）→ 叠 `mask` → 放到 (49, 55) → 盖上 `back`。
注意挖孔在顶部正中，渲染 App 时要注入顶部安全区，不然会压住页头（2026-10-11 试贴确认）。
