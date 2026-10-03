// 由 scripts/build_tokens.py 从 design/tokens/tokens.json 生成，勿手改。改值请改 tokens.json 再重新生成。
/* 慢牛 Milo · Foundations 导入插件（源码）
 * 运行一次 = 用仓库里的 tokens.json 覆盖 Figma 文件里的：
 *   变量集合「Milo · Primitives」「Milo · Tokens」、文字样式、效果样式、填充样式，
 *   以及当前页上的说明分区「Foundations · 配重片」。
 * 只动带上述名字的东西；同名的会被更新，仓库里已删除的会被移除。别的图层不碰。
 * 仓库是唯一源头：在 Figma 里手改的值，下次运行会被覆盖。 */
const DATA = {"tokens": {"meta": {"name": "慢牛 Milo · Foundations", "direction": "B 配重片（吸收 A 刻度），初版只有深色", "source": "本文件是视觉规范的唯一源头。改值只改这里，再跑 python3 scripts/build_tokens.py 生成 Figma 插件与 CSS；Figma 里手改的值会在下次运行插件时被覆盖。", "mode": "Dark"}, "primitives": {"color": {"gray-0": {"value": "#0A0A0B", "desc": "近黑底"}, "gray-50": {"value": "#111113"}, "gray-100": {"value": "#161618", "desc": "卡片面"}, "gray-150": {"value": "#1B1B1E"}, "gray-200": {"value": "#232326"}, "gray-300": {"value": "#2A2A2E", "desc": "分割线 / 轨道"}, "gray-400": {"value": "#3A3A3F"}, "gray-500": {"value": "#6E6E6A", "desc": "禁用文字下限"}, "gray-600": {"value": "#8A8A86", "desc": "次要文字"}, "gray-800": {"value": "#C9C8C3"}, "gray-900": {"value": "#F3F2EE", "desc": "暖白：正文、主按钮"}, "lime-300": {"value": "#EFFF9A"}, "lime-500": {"value": "#D4FF3A", "desc": "唯一强调色"}, "lime-700": {"value": "#9FD11A"}, "lime-900": {"value": "#3A4614"}, "lime-ink": {"value": "#2C3A00", "desc": "荧光底上的次要文字"}, "red-400": {"value": "#FF6B5E", "desc": "仅用于错误 / 失败，不是品牌色"}, "lime-500-a33": {"value": "#D4FF3A54", "desc": "光晕"}, "lime-500-a13": {"value": "#D4FF3A21"}, "black-a66": {"value": "#000000A8", "desc": "遮罩"}, "black-a80": {"value": "#000000CC"}, "gray-150-a94": {"value": "#1B1B1EF0", "desc": "导航底（浮层）"}}}, "semantic": {"color": {"bg/base": {"ref": "gray-0", "scopes": ["FRAME_FILL", "SHAPE_FILL"], "desc": "页面底"}, "bg/raised": {"ref": "gray-100", "scopes": ["FRAME_FILL", "SHAPE_FILL"], "desc": "卡片、胶囊、列表项"}, "bg/raised-2": {"ref": "gray-150", "scopes": ["FRAME_FILL", "SHAPE_FILL"], "desc": "分段控件选中、按下态"}, "bg/sheet": {"ref": "gray-100", "scopes": ["FRAME_FILL", "SHAPE_FILL"], "desc": "底部面板"}, "bg/scrim": {"ref": "black-a66", "scopes": ["FRAME_FILL", "SHAPE_FILL"], "desc": "面板背后的遮罩"}, "line/default": {"ref": "gray-300", "scopes": ["STROKE_COLOR"], "desc": "分割线、描边"}, "line/strong": {"ref": "gray-400", "scopes": ["STROKE_COLOR"]}, "text/primary": {"ref": "gray-900", "scopes": ["TEXT_FILL", "SHAPE_FILL"], "desc": "正文、数字"}, "text/secondary": {"ref": "gray-600", "scopes": ["TEXT_FILL", "SHAPE_FILL"], "desc": "说明、单位、标签"}, "text/disabled": {"ref": "gray-500", "scopes": ["TEXT_FILL", "SHAPE_FILL"], "desc": "禁用；已完成的行用 opacity/done-row 压暗，不用这个色"}, "text/on-accent": {"ref": "gray-0", "scopes": ["TEXT_FILL", "SHAPE_FILL"], "desc": "荧光底上的文字与图标"}, "text/on-accent-secondary": {"ref": "lime-ink", "scopes": ["TEXT_FILL"]}, "accent/default": {"ref": "lime-500", "scopes": ["ALL_FILLS", "STROKE_COLOR"], "desc": "只给三类：当前主角、导航选中项、进度（DESIGN.md §2）"}, "accent/glow": {"ref": "lime-500-a33", "scopes": ["EFFECT_COLOR"], "desc": "每屏最多一处"}, "accent/glow-ring": {"ref": "lime-500-a13", "scopes": ["EFFECT_COLOR"]}, "action/primary": {"ref": "gray-900", "scopes": ["ALL_FILLS"], "desc": "主按钮是暖白，不是荧光"}, "action/primary-ink": {"ref": "gray-0", "scopes": ["TEXT_FILL", "SHAPE_FILL"]}, "feedback/danger": {"ref": "red-400", "scopes": ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"], "desc": "错误、保存失败、删除确认"}, "data/track": {"ref": "gray-300", "scopes": ["SHAPE_FILL", "STROKE_COLOR"], "desc": "刻度条、进度条的空槽（装饰性）"}, "data/fill": {"ref": "gray-900", "scopes": ["SHAPE_FILL"], "desc": "刻度条的已填部分"}, "data/tick": {"ref": "gray-900", "scopes": ["SHAPE_FILL", "STROKE_COLOR"], "desc": "三条地标刻度线"}, "data/tier-none": {"ref": "gray-200", "scopes": ["SHAPE_FILL"], "desc": "容量：未练（填充）"}, "data/tier-none-edge": {"ref": "gray-500", "scopes": ["STROKE_COLOR"], "desc": "容量：未练（轮廓，保证肌肉形状可见）"}, "data/tier-low": {"ref": "lime-900", "scopes": ["SHAPE_FILL"], "desc": "容量：不足（底色，叠 Data/Tier-Low 点阵）"}, "data/tier-low-dot": {"ref": "lime-500", "scopes": ["SHAPE_FILL"]}, "data/tier-ok": {"ref": "lime-500", "scopes": ["SHAPE_FILL"], "desc": "容量：达标"}, "data/tier-over": {"ref": "gray-900", "scopes": ["SHAPE_FILL"], "desc": "容量：超量（白底，叠 Data/Tier-Over 黑斜纹；不许用荧光）"}, "data/tier-over-stripe": {"ref": "gray-0", "scopes": ["SHAPE_FILL"]}, "data/body": {"ref": "gray-150", "scopes": ["SHAPE_FILL"], "desc": "人体示意图的轮廓填充"}, "data/leader": {"ref": "gray-300", "scopes": ["STROKE_COLOR"], "desc": "引线（静止）"}, "nav/bg": {"ref": "gray-150-a94", "scopes": ["FRAME_FILL", "SHAPE_FILL"]}, "nav/ink": {"ref": "gray-600", "scopes": ["TEXT_FILL", "SHAPE_FILL"], "desc": "未选中项的图标"}, "nav/pill": {"ref": "lime-500", "scopes": ["SHAPE_FILL"], "desc": "选中的小胶囊"}, "nav/pill-ink": {"ref": "gray-0", "scopes": ["TEXT_FILL", "SHAPE_FILL"]}, "nav/track": {"ref": "gray-300", "scopes": ["STROKE_COLOR"], "desc": "外圈轨道（装饰性，见 DESIGN.md §5）"}, "nav/progress": {"ref": "lime-500", "scopes": ["STROKE_COLOR"], "desc": "外圈：今日进度，实线"}, "nav/rest": {"ref": "gray-900", "scopes": ["STROKE_COLOR", "SHAPE_FILL"], "desc": "小胶囊：休息倒计时，虚线 + 端点圆点"}, "shadow/float": {"ref": "black-a80", "scopes": ["EFFECT_COLOR"]}}}, "number": {"radius/xs": {"value": 4, "scopes": ["CORNER_RADIUS"], "desc": "小标签、刻度条"}, "radius/s": {"value": 8, "scopes": ["CORNER_RADIUS"]}, "radius/m": {"value": 14, "scopes": ["CORNER_RADIUS"]}, "radius/l": {"value": 22, "scopes": ["CORNER_RADIUS"], "desc": "卡片"}, "radius/xl": {"value": 26, "scopes": ["CORNER_RADIUS"], "desc": "底部面板顶角"}, "radius/pill": {"value": 999, "scopes": ["CORNER_RADIUS"], "desc": "胶囊、按钮、导航"}, "space/2xs": {"value": 2, "scopes": ["GAP", "WIDTH_HEIGHT"]}, "space/xs": {"value": 4, "scopes": ["GAP", "WIDTH_HEIGHT"]}, "space/s": {"value": 8, "scopes": ["GAP", "WIDTH_HEIGHT"]}, "space/m": {"value": 12, "scopes": ["GAP", "WIDTH_HEIGHT"]}, "space/l": {"value": 16, "scopes": ["GAP", "WIDTH_HEIGHT"], "desc": "页面左右边距"}, "space/xl": {"value": 20, "scopes": ["GAP", "WIDTH_HEIGHT"]}, "space/2xl": {"value": 24, "scopes": ["GAP", "WIDTH_HEIGHT"]}, "space/3xl": {"value": 32, "scopes": ["GAP", "WIDTH_HEIGHT"]}, "space/4xl": {"value": 40, "scopes": ["GAP", "WIDTH_HEIGHT"]}, "space/5xl": {"value": 48, "scopes": ["GAP", "WIDTH_HEIGHT"]}, "size/screen-w": {"value": 360, "scopes": ["WIDTH_HEIGHT"], "desc": "设计基准宽度（覆盖 360–430）"}, "size/screen-h": {"value": 800, "scopes": ["WIDTH_HEIGHT"]}, "size/gutter": {"value": 16, "scopes": ["GAP", "WIDTH_HEIGHT"]}, "size/hit-min": {"value": 48, "scopes": ["WIDTH_HEIGHT"], "desc": "最小触控区"}, "size/button-h": {"value": 52, "scopes": ["WIDTH_HEIGHT"]}, "size/button-h-s": {"value": 44, "scopes": ["WIDTH_HEIGHT"]}, "size/nav-w": {"value": 220, "scopes": ["WIDTH_HEIGHT"]}, "size/nav-h": {"value": 56, "scopes": ["WIDTH_HEIGHT"]}, "size/nav-bottom": {"value": 18, "scopes": ["GAP"], "desc": "导航离屏幕底边"}, "size/nav-pill-h": {"value": 44, "scopes": ["WIDTH_HEIGHT"]}, "size/nav-pill-w": {"value": 104, "scopes": ["WIDTH_HEIGHT"], "desc": "选中项宽度；「Tab 名 + 剩余时间」时待验（ia §1.12）"}, "size/capsule-h": {"value": 22, "scopes": ["WIDTH_HEIGHT"], "desc": "胶囊静止高度（命中区另按轨道均分，ia §1.10）"}, "size/capsule-w": {"value": 150, "scopes": ["WIDTH_HEIGHT"]}, "size/capsule-mag-h": {"value": 42, "scopes": ["WIDTH_HEIGHT"], "desc": "放大镜中心胶囊额外增加的高度"}, "size/capsule-mag-w": {"value": 26, "scopes": ["WIDTH_HEIGHT"], "desc": "放大镜中心胶囊额外增加的宽度"}, "size/hero-max-h": {"value": 160, "scopes": ["WIDTH_HEIGHT"], "desc": "P01 今日处方卡高度上限：首个建议重量必须在首屏（references §9.3）"}, "stroke/hairline": {"value": 1, "scopes": ["STROKE_FLOAT"]}, "stroke/focus": {"value": 1.6, "scopes": ["STROKE_FLOAT"]}, "stroke/ring-track": {"value": 1.2, "scopes": ["STROKE_FLOAT"]}, "stroke/ring-progress": {"value": 3, "scopes": ["STROKE_FLOAT"]}, "stroke/ring-rest": {"value": 2.5, "scopes": ["STROKE_FLOAT"]}, "stroke/ring-gap": {"value": 3, "scopes": ["GAP"], "desc": "休息描边与小胶囊之间的深色缝"}, "stroke/ring-rest-dash": {"value": 5, "scopes": ["STROKE_FLOAT"], "desc": "休息描边虚线：线段长"}, "stroke/ring-rest-gapdash": {"value": 3, "scopes": ["STROKE_FLOAT"], "desc": "休息描边虚线：间隔"}, "opacity/done-row": {"value": 45, "scopes": ["OPACITY"], "desc": "已完成的动作行"}, "opacity/grain": {"value": 22, "scopes": ["OPACITY"], "desc": "噪点（叠加模式），只用于主角卡和底部面板"}, "opacity/trace-min": {"value": 30, "scopes": ["OPACITY"], "desc": "进度环渐变尾巴的最低不透明度"}, "font-size/hero": {"value": 64, "scopes": ["FONT_SIZE"]}, "font-size/xl": {"value": 40, "scopes": ["FONT_SIZE"]}, "font-size/l": {"value": 30, "scopes": ["FONT_SIZE"]}, "font-size/title": {"value": 26, "scopes": ["FONT_SIZE"]}, "font-size/m": {"value": 22, "scopes": ["FONT_SIZE"]}, "font-size/heading": {"value": 17, "scopes": ["FONT_SIZE"]}, "font-size/body": {"value": 15, "scopes": ["FONT_SIZE"]}, "font-size/label": {"value": 13, "scopes": ["FONT_SIZE"]}, "font-size/caption": {"value": 12, "scopes": ["FONT_SIZE"]}, "font-size/min": {"value": 11, "scopes": ["FONT_SIZE"], "desc": "全产品字号下限（V1 正文 10 px 的教训）"}, "motion/press": {"value": 100, "scopes": [], "desc": "按下反馈起效（ms）"}, "motion/fast": {"value": 150, "scopes": [], "desc": "降级转场、面板滑入（ms）"}, "motion/base": {"value": 250, "scopes": [], "desc": "P03 上的形变上限（ms）"}, "motion/slow": {"value": 350, "scopes": [], "desc": "单次转场上限（ms）"}, "motion/stagger": {"value": 80, "scopes": [], "desc": "级联入场间隔（ms）"}, "motion/list-max": {"value": 300, "scopes": [], "desc": "列表入场总时长上限（ms）"}, "motion/long-press": {"value": 150, "scopes": [], "desc": "放大镜长按进入（ms，ia §1.10）"}, "motion/drag-slop": {"value": 8, "scopes": [], "desc": "进入放大镜前移动超过即视为滚动（px）"}, "motion/magnifier-radius": {"value": 3, "scopes": [], "desc": "放大镜余弦衰减半径（胶囊个数）"}, "motion/press-scale": {"value": 96, "scopes": [], "desc": "按下缩放（%）"}, "motion/press-overshoot": {"value": 100.3, "scopes": [], "desc": "松手过冲（%）"}}, "string": {"font/number": {"value": "Space Grotesk", "scopes": ["FONT_FAMILY"], "desc": "数字与拉丁字母"}, "font/ui": {"value": "Noto Sans SC", "scopes": ["FONT_FAMILY"], "desc": "中文界面文字"}, "font/mono": {"value": "JetBrains Mono", "scopes": ["FONT_FAMILY"], "desc": "刻度读数（借自方向 A），防数字跳动"}, "motion/ease-standard": {"value": "cubic-bezier(0.2, 0, 0, 1)", "scopes": []}, "motion/ease-decelerate": {"value": "cubic-bezier(0, 0, 0, 1)", "scopes": []}, "motion/spring": {"value": "stiffness 420, damping 32", "scopes": [], "desc": "底部面板与小胶囊滑动"}}, "textStyles": [{"name": "Number/Hero", "family": "font/number", "style": "Bold", "size": "font-size/hero", "lineHeight": 58, "letterSpacing": -4, "desc": "P01 今日处方卡的 8/14"}, {"name": "Number/XL", "family": "font/number", "style": "Bold", "size": "font-size/xl", "lineHeight": 40, "letterSpacing": -2, "desc": "详情面板的恢复度、组数"}, {"name": "Number/L", "family": "font/number", "style": "Bold", "size": "font-size/l", "lineHeight": 34, "letterSpacing": -1, "desc": "摘要第一项"}, {"name": "Number/M", "family": "font/number", "style": "Bold", "size": "font-size/m", "lineHeight": 26, "letterSpacing": -1, "desc": "摘要、建议重量"}, {"name": "Number/S", "family": "font/number", "style": "SemiBold", "size": "font-size/body", "lineHeight": 18, "letterSpacing": 0, "desc": "胶囊里的组数"}, {"name": "Readout/M", "family": "font/mono", "style": "SemiBold", "size": "font-size/label", "lineHeight": 16, "letterSpacing": 0, "desc": "刻度读数、计时 1:35"}, {"name": "Readout/S", "family": "font/mono", "style": "SemiBold", "size": "font-size/min", "lineHeight": 14, "letterSpacing": 0, "desc": "刻度下的地标数字"}, {"name": "Title/L", "family": "font/ui", "style": "Black", "size": "font-size/title", "lineHeight": 34, "letterSpacing": 2, "desc": "页面标题"}, {"name": "Title/M", "family": "font/ui", "style": "Black", "size": "font-size/m", "lineHeight": 30, "letterSpacing": 0, "desc": "卡片标题、面板标题"}, {"name": "Heading", "family": "font/ui", "style": "Bold", "size": "font-size/heading", "lineHeight": 24, "letterSpacing": 0}, {"name": "Body/Strong", "family": "font/ui", "style": "Bold", "size": "font-size/body", "lineHeight": 22, "letterSpacing": 0, "desc": "动作名、按钮"}, {"name": "Body", "family": "font/ui", "style": "Regular", "size": "font-size/body", "lineHeight": 22, "letterSpacing": 0}, {"name": "Label", "family": "font/ui", "style": "Bold", "size": "font-size/label", "lineHeight": 18, "letterSpacing": 0, "desc": "分段控件、导航文字"}, {"name": "Caption", "family": "font/ui", "style": "Regular", "size": "font-size/caption", "lineHeight": 17, "letterSpacing": 0, "desc": "说明、组 × 次"}, {"name": "Micro", "family": "font/ui", "style": "Medium", "size": "font-size/min", "lineHeight": 15, "letterSpacing": 0, "desc": "胶囊名称（静止）、图例；全产品最小字号"}], "effectStyles": [{"name": "Elevation/Float", "desc": "浮动导航", "effects": [{"type": "DROP_SHADOW", "color": "shadow/float", "x": 0, "y": 10, "radius": 30, "spread": -8}]}, {"name": "Elevation/Sheet", "desc": "底部面板", "effects": [{"type": "DROP_SHADOW", "color": "shadow/float", "x": 0, "y": -8, "radius": 24, "spread": -4}]}, {"name": "Glow/Focus", "desc": "当前主角的光晕：每屏最多一处", "effects": [{"type": "DROP_SHADOW", "color": "accent/glow-ring", "x": 0, "y": 0, "radius": 0, "spread": 4}, {"type": "DROP_SHADOW", "color": "accent/glow", "x": 0, "y": 0, "radius": 34, "spread": 2}]}], "paintStyles": [{"name": "Hero/Lime", "type": "GRADIENT_RADIAL", "desc": "P01 今日处方卡（荧光主角卡）", "stops": [["lime-300", 0], ["lime-500", 0.38], ["lime-700", 1]], "center": [0.85, 0.0], "size": [1.2, 1.4]}, {"name": "Texture/Grain", "type": "IMAGE", "image": "grain", "opacity": "opacity/grain", "blend": "OVERLAY", "desc": "叠在主角卡与底部面板上"}, {"name": "Data/Tier-Low", "type": "IMAGE", "image": "tier-low", "desc": "容量「不足」：暗荧光底 + 荧光点阵"}, {"name": "Data/Tier-Over", "type": "IMAGE", "image": "tier-over", "desc": "容量「超量」：白底 + 黑斜纹"}, {"name": "Data/Untrained", "type": "IMAGE", "image": "untrained", "desc": "近 7 天 0 组的胶囊：斜纹压暗（ia §1.10）"}], "contrast": [["text/primary", "bg/base", 4.5, "正文"], ["text/primary", "bg/raised", 4.5, "卡片上的正文"], ["text/secondary", "bg/base", 4.5, "次要文字"], ["text/secondary", "bg/raised", 4.5, "卡片上的次要文字"], ["text/secondary", "bg/raised-2", 4.5, "选中分段上的次要文字"], ["text/disabled", "bg/base", 3.0, "禁用（WCAG 豁免，仍要求 3:1 可辨）"], ["text/on-accent", "accent/default", 4.5, "荧光底上的文字"], ["text/on-accent-secondary", "accent/default", 4.5, "荧光底上的次要文字"], ["action/primary-ink", "action/primary", 4.5, "主按钮文字"], ["feedback/danger", "bg/base", 4.5, "错误文字"], ["feedback/danger", "bg/raised", 4.5, "卡片上的错误文字"], ["accent/default", "bg/base", 3.0, "强调色作图形（1.4.11）"], ["nav/progress", "nav/bg", 3.0, "导航外圈进度"], ["nav/rest", "nav/bg", 3.0, "小胶囊休息描边（与胶囊之间有 stroke/ring-gap 深色缝）"], ["nav/ink", "nav/bg", 3.0, "未选中图标"], ["nav/pill-ink", "nav/pill", 4.5, "选中项文字"], ["data/tier-none-edge", "data/body", 3.0, "「未练」肌肉轮廓"], ["data/tier-ok", "data/body", 3.0, "「达标」肌肉"], ["data/tier-over", "data/body", 3.0, "「超量」肌肉"], ["data/fill", "data/track", 3.0, "刻度条已填 vs 空槽"], ["data/tick", "bg/raised", 3.0, "地标刻度线"]]}, "contrast": [["text/primary", "bg/base", 17.67, 4.5, "正文"], ["text/primary", "bg/raised", 16.13, 4.5, "卡片上的正文"], ["text/secondary", "bg/base", 5.71, 4.5, "次要文字"], ["text/secondary", "bg/raised", 5.22, 4.5, "卡片上的次要文字"], ["text/secondary", "bg/raised-2", 4.96, 4.5, "选中分段上的次要文字"], ["text/disabled", "bg/base", 3.87, 3.0, "禁用（WCAG 豁免，仍要求 3:1 可辨）"], ["text/on-accent", "accent/default", 17.12, 4.5, "荧光底上的文字"], ["text/on-accent-secondary", "accent/default", 10.61, 4.5, "荧光底上的次要文字"], ["action/primary-ink", "action/primary", 17.67, 4.5, "主按钮文字"], ["feedback/danger", "bg/base", 7.08, 4.5, "错误文字"], ["feedback/danger", "bg/raised", 6.47, 4.5, "卡片上的错误文字"], ["accent/default", "bg/base", 17.12, 3.0, "强调色作图形（1.4.11）"], ["nav/progress", "nav/bg", 15.02, 3.0, "导航外圈进度"], ["nav/rest", "nav/bg", 15.5, 3.0, "小胶囊休息描边（与胶囊之间有 stroke/ring-gap 深色缝）"], ["nav/ink", "nav/bg", 5.01, 3.0, "未选中图标"], ["nav/pill-ink", "nav/pill", 17.12, 4.5, "选中项文字"], ["data/tier-none-edge", "data/body", 3.36, 3.0, "「未练」肌肉轮廓"], ["data/tier-ok", "data/body", 14.86, 3.0, "「达标」肌肉"], ["data/tier-over", "data/body", 15.34, 3.0, "「超量」肌肉"], ["data/fill", "data/track", 12.76, 3.0, "刻度条已填 vs 空槽"], ["data/tick", "bg/raised", 16.13, 3.0, "地标刻度线"]], "images": {"grain": "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAABksUlEQVR42k3dCdR2U/3G8VOSpJmiQYgypElFI0pKStFAqDRSKtFcSmkWTTSXZk0yFVI0aBIVmtCoQvM8me3/+9lrff/rfdd61vO8933O3r/huq7fb5/73Pssm2666Xjta187HvKQh4zjjz9+bLDBBuPhD3/4+MlPfjKOPvro8axnPWu8973vnX9vvPHGY7fddht///vfx7Wuda3xvOc9b+y4447jL3/5y7j1rW89jjrqqHHnO995bLTRRuNHP/rR+Pe//z0222yzcc4554y3vOUtc4wHP/jBY5VVVhnXv/7157nPf/7zx13ucpf593HHHTff+9znPjd22WWX8aEPfWg87nGPG5dddtn47ne/O/75z3/OY4444ojxzGc+c77/spe9bJx88snjwgsvHG94wxvGYx7zmPH+979/HHjggeO0004ba6+99vjd7343HvSgB40PfvCD433ve9945zvfOTbccMPx85//fDzpSU8av/rVr8avf/3rsc4664xtt912vPSlL51j//Wvfx3Xvva1x3rrrTd++9vfjv32228cfPDB4+tf//r49Kc/PV9/zWteM+53v/uNH//4x9P2e97znuNrX/vauOUtbzk233zz6e8jHvGIcdhhh40b3ehG085Xv/rV4xWveMXYd999p12OXXPNNcfqq68+3vzmN49PfvKT4zvf+c74wQ9+MN7xjndMO//xj3+M3/zmN+OBD3zgtO2CCy4Ya6211jx2iy22GOedd974z3/+M/7whz+MRz3qUeO5z33ueMITnjC222678brXvW7G8dxzzx0vfOELx7IsM7/itHCE05/61KfG+eefP1784hePs846aybx0EMPnYH+2c9+Nm51q1uN73//+zPJV1xxxTQaOH7xi1+Mpz/96XOyrbbaanzrW9+aAeecJDz1qU+dgHriE584x/rKV74yttlmm3HllVfO1w455JDx2Mc+drzxjW+cCfzhD384vvjFL84g7rPPPuMZz3jGHFtyPvzhD08bb3CDG4w3velN0+Gzzz57vPKVr5zHsefEE08cd7/73cell146dt1113HVVVfNYL71rW+dwBKEBzzgAWP33XcfJ5xwwkzsjW9845mALbfccgL2jDPOmIGWkJvc5CZzDscfc8wx49vf/va0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", "tier-low": "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAJUlEQVR42mOwchP5TwxmoL3CK/+twBivQpgibIrJU0i01fQNHgDkk68Zzwh1WgAAAABJRU5ErkJggg==", "tier-over": "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAOklEQVR42mPg4uL+D8OfP73DiRmIUQSSZyBGEVghMYrwKkR3OwMxirAqxBUKDMQoQlFIKDwZiFEEwgDcWi0AD9VlCgAAAABJRU5ErkJggg==", "untrained": "iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAATUlEQVR42mNQVlb7j4zFxCTwYgYQQYomBhiDWE0MyBxiNDGgCxDSxIDNFHyaGHC5FZcmBnwhgk0TA6FwR9fEQExkYWggRRMDKckCpAYAkny9Md6dSAgAAAAASUVORK5CYII="}, "build": {"commit": "bec5585", "date": "2026-10-03"}};
const T = DATA.tokens;
const PRIM_COLLECTION = 'Milo · Primitives';
const TOKEN_COLLECTION = 'Milo · Tokens';
const SECTION_NAME = 'Foundations · 配重片（插件生成，勿手改）';
const STYLE_PREFIX = 'Milo/';
const report = { created: 0, updated: 0, removed: 0, warnings: [] };
const warn = (m) => { report.warnings.push(m); console.warn('[milo] ' + m); };

// ---------------------------------------------------------------- 工具
function rgba(hex) {
  const h = hex.replace('#', '');
  const c = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: c(0), g: c(2), b: c(4), a: h.length === 8 ? c(6) : 1 };
}
const cssName = (prefix, name) => 'var(--milo-' + prefix + name.replace(/\//g, '-') + ')';

async function collection(name, hidden) {
  const all = await figma.variables.getLocalVariableCollectionsAsync();
  let c = all.find((x) => x.name === name);
  if (!c) c = figma.variables.createVariableCollection(name);
  if (c.modes[0].name !== T.meta.mode) c.renameMode(c.modes[0].modeId, T.meta.mode);
  if (hidden) { try { c.hiddenFromPublishing = true; } catch (e) { /* 旧版本没有这个属性 */ } }
  return c;
}

// defs: [{ name, type, value, desc, scopes, css }]，value 可以是别名
async function upsertVariables(coll, defs) {
  const all = await figma.variables.getLocalVariablesAsync();
  const byName = new Map(all.filter((v) => v.variableCollectionId === coll.id).map((v) => [v.name, v]));
  const modeId = coll.modes[0].modeId;
  const out = {};
  for (const d of defs) {
    let v = byName.get(d.name);
    if (v && v.resolvedType !== d.type) { v.remove(); v = null; }
    if (!v) { v = figma.variables.createVariable(d.name, coll, d.type); report.created++; } else report.updated++;
    byName.delete(d.name);
    v.setValueForMode(modeId, d.value);
    v.description = d.desc || '';
    try { v.scopes = d.scopes; } catch (e) { warn('变量 ' + d.name + ' 的 scopes 设置失败：' + e.message); }
    try { v.setVariableCodeSyntax('WEB', d.css); } catch (e) { /* 可选 */ }
    out[d.name] = v;
  }
  for (const v of byName.values()) { v.remove(); report.removed++; }
  return out;
}

const boundPaint = (v) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v);

// 字体：先试要求的字重，再试同族 Bold / Regular，最后退到 Inter
const fontCache = {};
async function font(family, style) {
  const key = family + '|' + style;
  if (fontCache[key]) return fontCache[key];
  const tries = [[family, style], [family, style === 'Black' ? 'Bold' : 'Regular'], ['Inter', style === 'Regular' ? 'Regular' : 'Bold'], ['Inter', 'Regular']];
  for (const [f, s] of tries) {
    try {
      await figma.loadFontAsync({ family: f, style: s });
      if (f !== family || s !== style) warn('字体 ' + family + ' ' + style + ' 不可用，暂用 ' + f + ' ' + s + '（装上该字体后重新运行插件即可）');
      fontCache[key] = { family: f, style: s };
      return fontCache[key];
    } catch (e) { /* 下一个 */ }
  }
  throw new Error('连 Inter Regular 都加载不了');
}

async function upsertStyle(kind, name) {
  const full = STYLE_PREFIX + name;
  const list = kind === 'text' ? await figma.getLocalTextStylesAsync() : kind === 'effect' ? await figma.getLocalEffectStylesAsync() : await figma.getLocalPaintStylesAsync();
  let s = list.find((x) => x.name === full);
  if (!s) { s = kind === 'text' ? figma.createTextStyle() : kind === 'effect' ? figma.createEffectStyle() : figma.createPaintStyle(); s.name = full; report.created++; } else report.updated++;
  return s;
}

// 仓库里删掉的样式，从 Figma 里也删掉（只删 Milo/ 前缀下的）
async function pruneStyles(kind, keep) {
  const list = kind === 'text' ? await figma.getLocalTextStylesAsync() : kind === 'effect' ? await figma.getLocalEffectStylesAsync() : await figma.getLocalPaintStylesAsync();
  for (const s of list) if (s.name.indexOf(STYLE_PREFIX) === 0 && keep.indexOf(s.name) < 0) { s.remove(); report.removed++; }
}

// ---------------------------------------------------------------- 变量
async function importVariables() {
  const primColl = await collection(PRIM_COLLECTION, true);
  const prim = await upsertVariables(primColl, Object.keys(T.primitives.color).map((k) => ({
    name: 'color/' + k, type: 'COLOR', value: rgba(T.primitives.color[k].value), desc: T.primitives.color[k].desc || '', scopes: [], css: cssName('prim-', k),
  })));
  const defs = [];
  for (const k of Object.keys(T.semantic.color)) {
    const d = T.semantic.color[k];
    defs.push({ name: 'color/' + k, type: 'COLOR', value: figma.variables.createVariableAlias(prim['color/' + d.ref]), desc: (d.desc ? d.desc + ' · ' : '') + '= ' + d.ref, scopes: d.scopes, css: cssName('color-', k) });
  }
  for (const k of Object.keys(T.number)) {
    const d = T.number[k];
    defs.push({ name: k, type: 'FLOAT', value: d.value, desc: d.desc || '', scopes: d.scopes, css: cssName('', k) });
  }
  for (const k of Object.keys(T.string)) {
    const d = T.string[k];
    defs.push({ name: k, type: 'STRING', value: d.value, desc: d.desc || '', scopes: d.scopes, css: cssName('', k) });
  }
  const tok = await upsertVariables(await collection(TOKEN_COLLECTION, false), defs);
  return { prim, tok };
}

// ---------------------------------------------------------------- 样式
async function importStyles(V) {
  const text = {};
  for (const d of T.textStyles) {
    const fam = T.string[d.family].value;
    const f = await font(fam, d.style);
    const s = await upsertStyle('text', d.name);
    s.description = d.desc || '';
    s.fontName = f;
    s.fontSize = T.number[d.size].value;
    s.lineHeight = { unit: 'PIXELS', value: d.lineHeight };
    s.letterSpacing = { unit: 'PERCENT', value: d.letterSpacing };
    try { s.setBoundVariable('fontSize', V.tok[d.size]); } catch (e) { warn('文字样式 ' + d.name + ' 绑定字号变量失败：' + e.message); }
    if (f.family === fam) { try { s.setBoundVariable('fontFamily', V.tok[d.family]); } catch (e) { /* 旧版本不支持绑定字体族 */ } }
    text[d.name] = s;
  }
  await pruneStyles('text', T.textStyles.map((d) => STYLE_PREFIX + d.name));

  const effect = {};
  for (const d of T.effectStyles) {
    const s = await upsertStyle('effect', d.name);
    s.description = d.desc || '';
    s.effects = d.effects.map((e) => {
      const c = rgba(T.primitives.color[T.semantic.color[e.color].ref].value);
      const fx = { type: e.type, color: c, offset: { x: e.x, y: e.y }, radius: e.radius, spread: e.spread, visible: true, blendMode: 'NORMAL', showShadowBehindNode: false };
      try { return figma.variables.setBoundVariableForEffect(fx, 'color', V.tok['color/' + e.color]); } catch (err) { return fx; }
    });
    effect[d.name] = s;
  }
  await pruneStyles('effect', T.effectStyles.map((d) => STYLE_PREFIX + d.name));

  const paint = {};
  for (const d of T.paintStyles) {
    const s = await upsertStyle('paint', d.name);
    s.description = d.desc || '';
    if (d.type === 'GRADIENT_RADIAL') {
      // 归一化坐标：中心 (cx, cy)、半径 (rx, ry) → Figma 的 gradientTransform（节点空间 → 渐变空间）
      const cx = d.center[0], cy = d.center[1], rx = d.size[0], ry = d.size[1];
      s.paints = [{ type: 'GRADIENT_RADIAL', gradientTransform: [[1 / (2 * rx), 0, 0.5 - cx / (2 * rx)], [0, 1 / (2 * ry), 0.5 - cy / (2 * ry)]],
        gradientStops: d.stops.map((st) => ({ position: st[1], color: rgba(T.primitives.color[st[0]].value) })) }];
    } else {
      const img = figma.createImage(figma.base64Decode(DATA.images[d.image]));
      const p = { type: 'IMAGE', scaleMode: 'TILE', imageHash: img.hash, scalingFactor: 0.5 };
      if (d.opacity) p.opacity = T.number[d.opacity].value / 100;
      if (d.blend) p.blendMode = d.blend;
      s.paints = [p];
    }
    paint[d.name] = s;
  }
  await pruneStyles('paint', T.paintStyles.map((d) => STYLE_PREFIX + d.name));
  return { text, effect, paint };
}

// ---------------------------------------------------------------- 说明分区
function frame(name, dir, gap) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = dir;
  f.itemSpacing = gap;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [];
  f.clipsContent = false;
  return f;
}
async function label(parent, chars, style, color, width) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(style.id);
  t.characters = chars;
  t.fills = [boundPaint(color)];
  // 先定宽再设「自动高度」：resize() 会把文字改成固定尺寸
  if (width) { t.resize(width, Math.max(1, t.height)); t.textAutoResize = 'HEIGHT'; }
  parent.appendChild(t);
  return t;
}
function bindRadius(node, v) { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) node.setBoundVariable(k, v); }

async function buildDocs(V, S) {
  const page = figma.currentPage;
  const old = page.findAll((n) => n.type === 'SECTION' && n.name === SECTION_NAME);
  let x0 = 0, y0 = 0;
  if (old.length) { x0 = old[0].x; y0 = old[0].y; old.forEach((n) => n.remove()); }
  else {
    for (const n of page.children) x0 = Math.max(x0, n.x + n.width);
    if (page.children.length) x0 += 400;
  }
  const C = (k) => V.tok['color/' + k];
  const ts = S.text;

  const root = frame('Foundations', 'VERTICAL', 56);
  root.paddingLeft = root.paddingRight = root.paddingTop = root.paddingBottom = 56;
  root.fills = [boundPaint(C('bg/base'))];
  // resize() 会把自动布局的两个方向都改成固定尺寸，所以要在 resize 之后再把高度设回「随内容」
  root.resize(1440, 100);
  root.counterAxisSizingMode = 'FIXED';
  root.primaryAxisSizingMode = 'AUTO';

  await label(root, T.meta.name, ts['Title/L'], C('text/primary'));
  await label(root, '方向：' + T.meta.direction + '。\n' + T.meta.source + '\n生成自仓库提交 ' + DATA.build.commit + ' · ' + DATA.build.date, ts['Body'], C('text/secondary'), 1100);

  // 颜色
  await label(root, '颜色 · 语义变量（集合「' + TOKEN_COLLECTION + '」；原始色在「' + PRIM_COLLECTION + '」，不直接用）', ts['Heading'], C('text/primary'));
  const grid = frame('Colors', 'HORIZONTAL', 16);
  grid.layoutWrap = 'WRAP';
  grid.counterAxisSpacing = 20;
  root.appendChild(grid);
  grid.layoutSizingHorizontal = 'FILL';
  for (const k of Object.keys(T.semantic.color)) {
    const d = T.semantic.color[k];
    const card = frame(k, 'VERTICAL', 4);
    grid.appendChild(card);
    const sw = figma.createRectangle();
    sw.resize(152, 56);
    sw.fills = [boundPaint(C(k))];
    sw.strokes = [boundPaint(C('line/default'))];
    sw.strokeWeight = 1;
    bindRadius(sw, V.tok['radius/s']);
    card.appendChild(sw);
    await label(card, k, ts['Label'], C('text/primary'), 152);
    await label(card, d.ref + ' · ' + T.primitives.color[d.ref].value, ts['Readout/S'], C('text/secondary'), 152);
    if (d.desc) await label(card, d.desc, ts['Micro'], C('text/secondary'), 152);
  }

  // 对比度
  await label(root, '对比度（构建时校验，不达标就不出插件）', ts['Heading'], C('text/primary'));
  const ctab = frame('Contrast', 'VERTICAL', 6);
  root.appendChild(ctab);
  for (const r of DATA.contrast) await label(ctab, (r[2] >= r[3] ? '✓ ' : '✗ ') + r[2].toFixed(2) + ':1 ≥ ' + r[3] + '   ' + r[0] + ' on ' + r[1] + '   · ' + r[4], ts['Caption'], C(r[2] >= r[3] ? 'text/primary' : 'feedback/danger'));

  // 文字
  await label(root, '文字样式（数字 Space Grotesk · 中文 Noto Sans SC · 刻度读数 JetBrains Mono；字号下限 ' + T.number['font-size/min'].value + '）', ts['Heading'], C('text/primary'));
  const sample = { Number: '13,854', Readout: '8 · 16 · 22 · 1:35' }; // JetBrains Mono 没有中文字形，样例只放数字
  for (const d of T.textStyles) {
    const row = frame(d.name, 'HORIZONTAL', 24);
    row.counterAxisAlignItems = 'CENTER';
    root.appendChild(row);
    await label(row, d.name + '\n' + T.string[d.family].value + ' ' + d.style + ' ' + T.number[d.size].value + '/' + d.lineHeight, ts['Readout/S'], C('text/secondary'), 220);
    await label(row, sample[d.name.split('/')[0]] || '今天练 7 块肌肉 · 14 组 · 中下胸 恢复 3%', ts[d.name], C('text/primary'));
  }

  // 圆角、间距、描边
  await label(root, '圆角 · 间距 · 描边', ts['Heading'], C('text/primary'));
  const shapes = frame('Radius', 'HORIZONTAL', 24);
  root.appendChild(shapes);
  for (const k of Object.keys(T.number).filter((n) => n.indexOf('radius/') === 0)) {
    const cell = frame(k, 'VERTICAL', 6);
    shapes.appendChild(cell);
    const r = figma.createRectangle();
    r.resize(96, 56);
    r.fills = [boundPaint(C('bg/raised'))];
    r.strokes = [boundPaint(C('line/strong'))];
    r.strokeWeight = 1;
    bindRadius(r, V.tok[k]);
    cell.appendChild(r);
    await label(cell, k + ' · ' + T.number[k].value, ts['Readout/S'], C('text/secondary'));
  }
  const spaces = frame('Spacing', 'VERTICAL', 8);
  root.appendChild(spaces);
  for (const k of Object.keys(T.number).filter((n) => n.indexOf('space/') === 0)) {
    const row = frame(k, 'HORIZONTAL', 12);
    row.counterAxisAlignItems = 'CENTER';
    spaces.appendChild(row);
    await label(row, k, ts['Readout/S'], C('text/secondary'), 90);
    const bar = figma.createRectangle();
    bar.resize(T.number[k].value, 12);
    bar.setBoundVariable('width', V.tok[k]);
    bar.fills = [boundPaint(C('accent/default'))];
    row.appendChild(bar);
    await label(row, String(T.number[k].value), ts['Readout/S'], C('text/secondary'));
  }

  // 效果、填充、容量四档
  await label(root, '效果与填充样式 · 容量四档（明暗 + 纹理，不只靠色相）', ts['Heading'], C('text/primary'));
  const fx = frame('Effects', 'HORIZONTAL', 32);
  fx.paddingTop = fx.paddingBottom = 24;
  root.appendChild(fx);
  async function chip(name, w, h, apply) {
    const cell = frame(name, 'VERTICAL', 10);
    fx.appendChild(cell);
    const r = figma.createRectangle();
    r.resize(w, h);
    bindRadius(r, V.tok['radius/l']);
    r.fills = [boundPaint(C('bg/raised'))];
    await apply(r);
    cell.appendChild(r);
    await label(cell, name, ts['Micro'], C('text/secondary'), Math.max(w, 120));
  }
  for (const d of T.effectStyles) await chip('Milo/' + d.name, 140, 72, (r) => r.setEffectStyleIdAsync(S.effect[d.name].id));
  for (const d of T.paintStyles) await chip('Milo/' + d.name, d.name === 'Hero/Lime' ? 200 : 120, 72, async (r) => {
    if (d.name === 'Texture/Grain') r.fills = [boundPaint(C('accent/default'))].concat(S.paint[d.name].paints);
    else await r.setFillStyleIdAsync(S.paint[d.name].id);
  });
  const tiers = [['未练', (r) => { r.fills = [boundPaint(C('data/tier-none'))]; r.strokes = [boundPaint(C('data/tier-none-edge'))]; r.strokeWeight = 1; }],
    ['不足', (r) => r.setFillStyleIdAsync(S.paint['Data/Tier-Low'].id)],
    ['达标', (r) => { r.fills = [boundPaint(C('data/tier-ok'))]; }],
    ['超量', (r) => r.setFillStyleIdAsync(S.paint['Data/Tier-Over'].id)]];
  for (const t of tiers) await chip('容量 · ' + t[0], 72, 40, async (r) => { bindRadius(r, V.tok['radius/pill']); await t[1](r); });

  // 规则摘要
  await label(root, '使用规则（全文见仓库 docs/DESIGN.md）', ts['Heading'], C('text/primary'));
  await label(root, [
    '1. 荧光色只给三类：当前主角（放大的胶囊、今日处方卡）、导航选中项、进度。正文、图标、分割线、按钮一律不用。',
    '2. 光晕（Glow/Focus）每屏最多一处；导航选中项是实心填充，不发光。',
    '3. 「超量」用白底黑斜纹，绝不用荧光；错误只用 feedback/danger。',
    '4. 主按钮是暖白（action/primary），不是荧光。',
    '5. 页面里只用变量和样式，不写散落的数值；改值改仓库 tokens.json 再重跑插件。',
  ].join('\n'), ts['Body'], C('text/secondary'), 1200);

  const section = figma.createSection();
  section.name = SECTION_NAME;
  section.x = x0;
  section.y = y0;
  section.appendChild(root);
  root.x = 40;
  root.y = 40;
  section.resizeWithoutConstraints(root.width + 80, root.height + 80);
  figma.viewport.scrollAndZoomIntoView([section]);
  return section;
}

// ---------------------------------------------------------------- 入口
(async function main() {
  try {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    const V = await importVariables();
    const S = await importStyles(V);
    await buildDocs(V, S);
    const msg = '慢牛 Milo Foundations 已导入：新建 ' + report.created + '、更新 ' + report.updated + '、移除 ' + report.removed + (report.warnings.length ? '；' + report.warnings.length + ' 条提醒（见控制台）' : '');
    figma.closePlugin(msg);
  } catch (e) {
    console.error(e);
    figma.closePlugin('导入失败：' + (e && e.message ? e.message : e));
  }
})();
