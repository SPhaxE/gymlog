#!/usr/bin/env python3
"""Stitch · 阶段 6f（钱包与商城）：按 2026-10-07 线框倾向（用户「继续」= 按倾向）出视觉参考。
  钱包 P14 = 线框 wallet W2（两个出口在拇指区）；商城 P15 = shop W1（为你推荐 + 两列商品）；知识卡 P16 = guide W2（数据证据在顶）；
  商品详情 P17 = item W1（正常 · 折扣）+ W2（缺货 · 到货提醒）；下单确认 P18 / 订单完成 P19 = order W1 / W2。
    python3 design/hifi/tools/run_round.py f6 f6
商家与品牌全部虚构；商品图只要求中性占位（不画真实品牌包装）；小牛是占位圆。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('r2', os.path.join(HERE, 'build_stitch_r2.py'))
r2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(r2)
INTENSITY = {k: t for k, _, t in r2.INTENSITY}
COMMON = r2.COMMON.replace('首页 / 身体 / 增量 / 记录 / 我的', '首页 / 容量 / 增量 / 记录 / 我的')
SUB = "This is a sub-page with NO bottom navigation; top bar = back arrow + title. "
IMG = "product images are NEUTRAL PLACEHOLDERS (a plain dark-gray rounded tile with a faint outline of the object, no brand logo, no text on packaging)"

WALLET = ("SCREEN: 钱包 (wallet, P14). " + SUB + "\n"
  "- Top: a very large condensed number 6,060 with the unit 牛劲, and on the right a small caption ≈ ¥60.\n"
  "- Section caption 我的卡券 · 2 张可用, then two coupon rows (each 64 px tall, a small square glyph on the left): 连胜冻结卡 / 断档时周一自动使用 / right: 可用; 免邮券 / 商城任意订单 · 10月31日前 / right: 去用 ›.\n"
  "- A row: caption 最近 on the left and a text link 全部明细 › on the right; then three ledger rows (title + date on the left, amount on the right in condensed numerals): 完成训练 10月6日 +10; 守约周 · 第 21 周 10月5日 +50; PR：杠铃深蹲 145 kg 10月3日 +30.\n"
  "- BOTTOM (thumb zone): two big side-by-side buttons, each 64 px tall with a title and a small second line: LEFT (the single LIME element) 去商城抵扣 / 每单最多抵 20%; RIGHT outlined 兑换卡券 / 冻结卡 800 起.")
SHOP = ("SCREEN: 商城 (shop, P15). " + SUB + "The top bar also shows a small chip 6,060 牛劲 on the right.\n"
  "- A recommendation card at the top (the focal element): small tag 知识卡 and caption 按你的训练数据; heading 腰带：什么时候该系; caption 你的深蹲预估 1RM 已到体重的 1.5 倍 → 杠铃腰带 10 毫米 ¥329; a chevron.\n"
  "- A three-segment control 全部 | 护具 | 补给 (全部 selected, bone).\n"
  "- A two-column grid of product cards (" + IMG + "): each card: image tile, a small status tag, name, price in condensed numerals, and a caption with member price and how much 牛劲 can offset. Cards: 杠铃腰带 10 毫米 tag 折扣, ¥329 with a struck-through ¥399, 会员 ¥296 · 牛劲抵 ¥60; 乳清蛋白 2 磅 tag 热销, ¥259, 会员 ¥233 · 牛劲抵 ¥51; 一水肌酸 300 克 tag 新品, ¥119, 会员 ¥107 · 牛劲抵 ¥23; 7 毫米护膝 tag 缺货 (dashed outline tag, the whole card dimmed), ¥199, 会员 ¥179.\n"
  "- Exactly ONE lime element: the 知识卡 tag on the recommendation card. Merchants are fictional (铁砧运动, 慢火补给, 山羊护具).")
GUIDE = ("SCREEN: 知识卡 (knowledge card, P16). " + SUB + "\n"
  "- Heading 腰带：什么时候该系.\n"
  "- An evidence panel (the focal element): caption 深蹲预估 1RM ÷ 体重; a small line chart rising over time crossing a dashed threshold line labeled 1.5 ×, the last point highlighted; next to it the big condensed value 1.52 and caption 142 kg / 93 kg.\n"
  "- Three numbered points: 1 只在接近极限的组里系，热身不系; 2 系在肚脐上下，吸气顶住腰带; 3 不能代替核心力量. Then a small text row 为什么 ⌄ · 不构成医疗建议.\n"
  "- Two product rows (" + IMG + "): 杠铃腰带 10 毫米 tag 折扣 / 会员 ¥296 · 牛劲抵 ¥60 / ¥329 with struck ¥399; 8 字助力带 / 会员 ¥62 · 牛劲抵 ¥13 / ¥69.\n"
  "- Bottom primary button 看杠铃腰带 (the single LIME element).")
ITEM = ("SCREEN: 商品详情 (product detail, P17) for 杠铃腰带 10 毫米. " + SUB + "A small 分享 text at the top right.\n"
  "- A large image area (" + IMG + ") taking the top ~38% with small pager dots.\n"
  "- Tag 折扣 and merchant 铁砧运动; name 杠铃腰带 10 毫米; price row: very large condensed ¥329, struck-through ¥399, and 会员 ¥296.\n"
  "- A filled row: 牛劲可抵 ¥60 on the left, caption 余额 6,060 · 每单最多 20% on the right.\n"
  "- Caption 规格 and three size chips S / M / L (M selected, bone).\n"
  "- A row 相关知识卡：腰带什么时候该系 with a chevron.\n"
  "- Bottom primary button 购买 · ¥329 (the single LIME element).")
ITEM_OOS = ("SCREEN: 商品详情 (product detail, P17) for 7 毫米护膝 — OUT OF STOCK state. " + SUB + "\n"
  "- Large image area (" + IMG + "), slightly dimmed.\n"
  "- A dashed-outline tag 缺货 and merchant 山羊护具; name 7 毫米护膝; price ¥199 and 会员 ¥179 (muted).\n"
  "- A filled row 牛劲可抵 ¥39 · 余额 6,060.\n"
  "- Size chips S / M / L (M selected).\n"
  "- Above the bottom button a caption 缺货 · 预计 10 月中到货.\n"
  "- Bottom button 到货提醒, OUTLINED (bone outline, not lime): out of stock never shows a lime buy button. No lime element on this screen.")
CHECKOUT = ("SCREEN: 确认订单 (checkout, P18). " + SUB + "\n"
  "- A slim banner at the top: 演示模式 · 不收集任何支付信息，提交即成功.\n"
  "- An item row (image placeholder, 杠铃腰带 10 毫米, M 码 · 铁砧运动, ¥296).\n"
  "- A row 卡券 with value 铁砧运动 满 200 减 30 ›.\n"
  "- A row 牛劲抵扣 with caption 用 5,900 牛劲抵 ¥59（最多 20%） and a switch ON (bone).\n"
  "- A summary block: 商品 ¥329; 会员价 −¥33; 卡券 −¥30; 牛劲 −¥59; a divider; 合计 with a very large condensed ¥207.\n"
  "- NO payment fields, no card numbers. Bottom primary button 提交订单 · ¥207 (the single LIME element).")
DONE = ("SCREEN: 订单完成 (order complete, P19). NO bottom navigation, no back arrow.\n"
  "- Centered: a round mascot PLACEHOLDER (plain dark-gray disc with a thin bone outline), heading 下单成功, caption 演示订单 MILO-20261007-0412 · 不会真的发货.\n"
  "- A detail list: 杠铃腰带 10 毫米 · M ¥329; 实付 ¥207; 用掉 5,900 牛劲 · 满 200 减 30 券; 牛劲余额 6,060 → 160 (condensed numerals).\n"
  "- Bottom: a text link 查看钱包 above a primary button 回商城 (the single LIME element).")

SCREENS = [('wallet', '钱包 P14', WALLET, ('V1', 'V2')), ('shop', '商城 P15', SHOP, ('V1', 'V2')), ('guide', '知识卡 P16', GUIDE, ('V1', 'V2')),
           ('item', '商品详情 P17 正常', ITEM, ('V1', 'V2')), ('oos', '商品详情 P17 缺货', ITEM_OOS, ('V2',)),
           ('checkout', '确认订单 P18', CHECKOUT, ('V2',)), ('done', '订单完成 P19', DONE, ('V2',))]
PAGES = {'f6': [(f'{k}-{v.lower()}', f'{n} · {v}', COMMON + "\n\n" + body + "\n\n" + INTENSITY[v]) for k, n, body, vs in SCREENS for v in vs]}

if __name__ == '__main__':
    out = os.path.join(HERE, 'f6', 'stitch-f6.md')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('# 6f · Stitch（钱包 / 商城 / 知识卡 / 商品详情 / 下单 / 完成）\n\n> 由 `design/hifi/build_stitch_f6.py` 生成。\n\n')
        for key, name, prompt in PAGES['f6']:
            f.write(f'## {key} · {name}\n\n```text\n{prompt}\n```\n\n')
    print('写入', os.path.relpath(out), len(PAGES['f6']), '个提示词')
