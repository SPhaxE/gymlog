#!/usr/bin/env python3
"""生成 mock/history.json、mock/profile.json、mock/scenarios.json。

固定随机种子，重复运行得到同样的文件。日期用「几天前」(daysAgo) 表示，演示数据载入时再换算成真实日期，
这样「近 7 天」永远有数据。约定：daysAgo = 0 是「今天」，演示数据按「今天是周二」排布（见 gen_mock.py 里 WEEK_DAYS 的说明）。

用法：python3 scripts/gen_mock.py
"""
import json
import math
import os
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED = int(os.environ.get("SEED", "89"))
random.seed(SEED)

EX = {e["id"]: e for e in json.loads((ROOT / "mock/exercises.json").read_text(encoding="utf-8"))}


def rnd5(x, step=2.5):
    return round(round(x / step) * step, 1)


def e1rm(w, r):
    """预估 1RM = Epley 与 Brzycki 的均值（与 V1 一致）；只在 w>0 且 1<=r<=36 时有意义。"""
    if w <= 0 or r <= 0:
        return 0.0
    epley = w * (1 + r / 30)
    brzycki = w * 36 / (37 - r) if r < 37 else epley
    return (epley + brzycki) / 2


# ---------------------------------------------------------------- 训练模板
# (动作 id, 起始重量 kg, 加重步进 kg, 组数, (次数下限, 次数上限), 首次出现的周序号 w（7=最早, 0=最近）, 末次出现的周序号)
TEMPLATES = {
    "lowerA": [
        ("barbell-squat-8", 80, 5, 3, (6, 8), 7, 0),
        ("barbell-stiff-leg-deadlifts-27", 70, 5, 3, (6, 8), 7, 0),
        ("seated-leg-curl-828", 35, 2.5, 2, (10, 12), 7, 0),
        ("machine-standing-calf-raises-33", 60, 2.5, 2, (10, 12), 7, 0),
        ("cable-rope-kneeling-crunch-1004", 30, 2.5, 2, (10, 12), 7, 0),
    ],
    "push": [
        ("barbell-bench-press-4", 62.5, 2.5, 3, (6, 8), 7, 0),
        ("dumbbell-incline-bench-press-398", 22.5, 2.5, 3, (6, 8), 7, 0),
        ("dumbbell-seated-overhead-press-45", 20, 2.5, 3, (6, 8), 7, 0),
        ("dumbbell-lateral-raise-20", 7.5, 2.5, 2, (10, 12), 7, 0),
        ("cable-rope-pushdown-241", 25, 2.5, 2, (10, 12), 7, 0),
    ],
    "pull": [
        ("machine-pulldown-23", 55, 2.5, 3, (6, 8), 7, 0),
        ("lawnmower-row-561", 20, 2.5, 3, (6, 8), 7, 0),
        ("machine-face-pulls-22", 20, 2.5, 2, (10, 12), 1, 0),  # 只出现 2 次
        ("barbell-curl-1", 30, 2.5, 2, (10, 12), 7, 0),
        ("dumbbell-hammer-curl-3", 12.5, 2.5, 2, (10, 12), 7, 0),
    ],
    "lowerB": [
        ("vertical-leg-press-1690", 120, 5, 3, (6, 8), 7, 0),
        ("machine-hip-thrust-1498", 80, 5, 3, (6, 8), 7, 0),
        ("machine-leg-extension-10", 40, 2.5, 2, (10, 12), 7, 0),
        ("barbell-seated-calf-raise-350", 40, 2.5, 2, (10, 12), 7, 0),
        ("dumbbell-bulgarian-split-squat-317", 16, 2.5, 3, (6, 8), 0, 0),  # 只出现 1 次（新动作）
    ],
}
TITLES = {"lowerA": "下肢 A", "push": "推", "pull": "拉", "lowerB": "下肢 B"}
DURATION = {"lowerA": 65, "push": 60, "pull": 58, "lowerB": 62}
START = {"lowerA": "18:30", "push": "18:45", "pull": "19:00", "lowerB": "18:20"}

# (周序号 w, 模板, 距今天数 daysAgo)。今天是周二：上周一 8、上周二 7、上周三 6、上周四 5、上周五 4、上周六 3（再加 7×w）。
# 这样排的原因：引擎规定「同一动作 7 天内不重复」（按日历日算，今天往前 6 天），而示例用户每周把同一套动作练一遍；
# 只有让「今天」落在下一个周期的开头，今日处方里才会有做过的动作（有历史才有建议重量和理由）。
# 同时，周五的下肢 B 才过 4 天，个别肌头还在恢复中，P02 / P06 才有「还没恢复」可看。
WEEK_DAYS = {"mon": 8, "tue": 7, "wed": 6, "thu": 5, "fri": 4, "sat": 3}
SCHEDULE = [
    (7, "lowerA", "tue"), (7, "push", "thu"), (7, "pull", "sat"),
    (6, "lowerA", "mon"), (6, "push", "tue"), (6, "pull", "thu"), (6, "lowerB", "fri"),
    (5, "lowerA", "mon"), (5, "push", "wed"), (5, "pull", "fri"),
    (4, "lowerA", "mon"), (4, "push", "tue"), (4, "pull", "thu"), (4, "lowerB", "fri"),
    (3, "lowerA", "mon"), (3, "push", "tue"), (3, "pull", "thu"),
    (2, "lowerA", "mon"), (2, "push", "tue"), (2, "pull", "thu"), (2, "lowerB", "fri"),
    (1, "lowerA", "mon"), (1, "push", "tue"), (1, "pull", "thu"), (1, "lowerB", "fri"),
    (0, "lowerA", "mon"), (0, "push", "tue"), (0, "pull", "thu"), (0, "lowerB", "fri"),
]
SCHEDULE.sort(key=lambda s: -(7 * s[0] + WEEK_DAYS[s[2]]))  # 最早的在前

# 减量信号：深蹲、直腿硬拉在最近 3 周持续下滑（每次 e1RM 降幅 > 1%）。(周序号 -> (重量增量, 每组次数))
OVERREACH = {
    "barbell-squat-8": {3: (0, [8, 8, 8]), 2: (5, [5, 5, 4]), 1: (5, [4, 4, 3]), 0: (0, [5, 4, 4])},
    "barbell-stiff-leg-deadlifts-27": {3: (0, [8, 8, 7]), 2: (0, [7, 6, 6]), 1: (0, [6, 6, 5]), 0: (0, [5, 5, 4])},
}

state = {}  # 每个动作当前的 {weight, target}
BAD = {i: random.random() < 0.15 for i in range(len(SCHEDULE))}


def make_sets(ex_id, w, session_idx, is_first_compound, week, key):
    spec = next(s for tpl in TEMPLATES.values() for s in tpl if s[0] == ex_id)
    _, w0, step, n_sets, (lo, hi), _, _ = spec
    uni = EX[ex_id]["unilateral"]
    st = state.setdefault(ex_id, {"weight": w0, "target": lo, "w3_weight": None})
    sets = []
    # 热身组：每次训练的第一个复合动作做 2 组
    if is_first_compound:
        for frac, reps in ((0.5, 5), (0.7, 3)):
            sets.append({"type": "warmup", "weightKg": rnd5(st["weight"] * frac), "reps": reps, "rpe": None})
    # 工作组
    if ex_id in OVERREACH and week in OVERREACH[ex_id]:
        base_w = st["weight"] if week == 3 else state[ex_id]["w3_weight"]
        add, reps_list = OVERREACH[ex_id][week]
        weight = base_w + add
        if week == 3:
            state[ex_id]["w3_weight"] = weight
        reps_per_set = reps_list
    else:
        weight = st["weight"]
        reps_per_set = []
        for i in range(n_sets):
            r = st["target"]
            if i == n_sets - 1 and random.random() < 0.2:
                r -= 1
            elif i > 0 and random.random() < 0.05:
                r -= 1
            reps_per_set.append(max(lo - 1, r))
        if BAD.get(session_idx):  # 状态不好的一天：每组少一次，不会触发加重
            reps_per_set = [max(lo - 1, r - 1) for r in reps_per_set]
    st["weight"] = weight
    for i, r in enumerate(reps_per_set):
        rpe = None
        if spec[4][0] == 6 and session_idx % 5 != 0:  # 复合动作大多记 RPE
            rpe = [7.5, 8, 8.5, 9][min(i, 3)]
        if uni:
            right = r if random.random() < 0.6 else max(1, r - 1)
            sets.append({"type": "work", "weightKg": weight, "repsLeft": r, "repsRight": right, "rpe": rpe})
        else:
            sets.append({"type": "work", "weightKg": weight, "reps": r, "rpe": rpe})
    # 双进阶推进
    if not (ex_id in OVERREACH and week in OVERREACH[ex_id]):
        if min(reps_per_set) >= hi:
            st["weight"] = weight + step
            st["target"] = lo
        elif min(reps_per_set) >= st["target"]:
            st["target"] = min(hi, st["target"] + 1)
    return sets


sessions = []
for idx, (week, key, day) in enumerate(SCHEDULE):
    days_ago = 7 * week + WEEK_DAYS[day]
    exercises = []
    first_compound_done = False
    for spec in TEMPLATES[key]:
        ex_id, _, _, _, (lo, hi), first_w, last_w = spec
        if not (last_w <= week <= first_w):
            continue
        is_comp = lo == 6
        sets = make_sets(ex_id, week, idx, is_comp and not first_compound_done, week, key)
        if is_comp:
            first_compound_done = True
        exercises.append({"exerciseId": ex_id, "skipped": False, "sets": sets})
    # 场景：第 4 周的卧推末尾加一组递减组
    if week == 4 and key == "push":
        bench = exercises[0]["sets"]
        last_w_kg = bench[-1]["weightKg"]
        bench.append({"type": "drop", "weightKg": rnd5(last_w_kg * 0.8), "reps": 10, "rpe": None})
    # 场景：第 3 周的拉训练最后一个动作没做
    if week == 3 and key == "pull":
        exercises[-1]["skipped"] = True
        exercises[-1]["sets"] = []
    exertion = random.choice([7, 8, 8, 9])
    if key.startswith("lower") and week in (2, 1):
        exertion = 9
    if key == "lowerA" and week == 0:
        exertion = 10
    if week == 5 and key == "pull":
        exertion = None  # 跳过了力竭度
    sessions.append({
        "id": f"demo-w{week}-{key}",
        "daysAgo": days_ago,
        "startTime": START[key],
        "durationMin": DURATION[key] + random.choice([-6, -3, 0, 3, 6]),
        "exertion": exertion,
        "exercises": exercises,
    })


# ---------------------------------------------------------------- 自检：派生统计
def best_e1rm(ex_record):
    best = 0.0
    for s in ex_record["sets"]:
        if s["type"] == "warmup":
            continue
        reps = s["reps"] if "reps" in s else max(s["repsLeft"], s["repsRight"])
        best = max(best, e1rm(s["weightKg"], reps))
    return best


history = {}  # ex_id -> [(session_id, e1rm)] 时间正序
for s in sessions:
    for ex in s["exercises"]:
        if ex["skipped"] or not ex["sets"]:
            continue
        history.setdefault(ex["exerciseId"], []).append((s["id"], best_e1rm(ex)))

prs = {}
for ex_id, recs in history.items():
    top = recs[0][1]
    for sid, v in recs[1:]:
        if v - top >= 0.05:  # PR 门槛：比此前最好成绩至少高 0.05 kg（与 prototype/engine.js 的 PR_MIN 一致）
            prs.setdefault(sid, []).append(ex_id)
        top = max(top, v)

# 减量信号：最近 3 次记录里 e1RM 连续两次下降且每次 > 1%
deload = []
for ex_id, recs in history.items():
    if len(recs) >= 3:
        a, b, c = (r[1] for r in recs[-3:])
        if b < a * 0.99 and c < b * 0.99:
            deload.append(ex_id)

latest = sessions[-1]
_share = len(prs) / len(sessions)
if not (0.35 <= _share <= 0.6):
    sys.exit(f"SEED {SEED}: PR 占比 {_share:.2f} 不在 35%–60%")
assert set(deload) == {"barbell-squat-8", "barbell-stiff-leg-deadlifts-27"}, deload
bench = history["barbell-bench-press-4"]
assert bench[-1][1] == max(v for _, v in bench), "最近一次卧推应是 e1RM 新高（PR）"
assert len(history["dumbbell-bulgarian-split-squat-317"]) == 1
assert len(history["machine-face-pulls-22"]) == 2
no_pr_sessions = [s["id"] for s in sessions if s["id"] not in prs and s["id"] != sessions[0]["id"]]
assert no_pr_sessions, "需要至少一次没有 PR 的训练"

weeks = {}
for s in sessions:
    wk = s["id"].split("-")[1]
    weeks[wk] = weeks.get(wk, 0) + 1

latest_pr = min(prs, key=lambda k: next(x for x in sessions if x["id"] == k)["daysAgo"])
assert "barbell-bench-press-4" in prs.get("demo-w0-push", []), "本周推训练里卧推应是 PR"
meta = {
    "说明": "示例训练历史。日期用 daysAgo（0=今天），按「今天是周二」排布（见 gen_mock.py 里 WEEK_DAYS 的说明）；载入演示数据时换算成真实日期。",
    "字段": {
        "sets[].type": "warmup 热身组（不计入容量、趋势、PR）/ work 工作组 / drop 递减组（计入工作组）",
        "sets[].reps": "双侧动作的次数；单侧动作（exercise.unilateral = true）改用 repsLeft / repsRight",
        "exertion": "用户自评力竭度 1–10；null = 跳过",
        "exercises[].skipped": "true = 处方里有但没做，不计入任何统计",
        "rpe": "1–10，步进 0.5；null = 没记",
    },
    "期望": {
        "减量信号动作": sorted(deload),
        "最近一次 PR": {"sessionId": latest_pr, "exerciseIds": prs[latest_pr]},
        "只有 1 次记录的动作（新动作）": "dumbbell-bulgarian-split-squat-317",
        "只有 2 次记录的动作": "machine-face-pulls-22",
        "有未做动作的训练": {"sessionId": "demo-w3-pull", "exerciseId": "dumbbell-hammer-curl-3"},
        "首次训练（基线）": sessions[0]["id"],
        "没有 PR 的训练": no_pr_sessions,
        "每周训练次数（w=周序号，0=本周）": weeks,
    },
}
(ROOT / "mock/history.json").write_text(
    json.dumps({"_meta": meta, "sessions": sessions}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

# ---------------------------------------------------------------- 档案
EQUIP = [
    {"id": "barbell", "name": "杠铃", "default": True, "inPool": True},
    {"id": "dumbbell", "name": "哑铃", "default": True, "inPool": True},
    {"id": "machine", "name": "固定器械", "default": True, "inPool": True},
    {"id": "cable", "name": "绳索", "default": True, "inPool": True},
    {"id": "smith", "name": "史密斯机", "default": True, "inPool": True},
    {"id": "bodyweight", "name": "自重 / 负重", "default": True, "inPool": True},
    {"id": "kettlebell", "name": "壶铃", "default": False, "inPool": False},
    {"id": "band", "name": "弹力带", "default": False, "inPool": False},
    {"id": "plate", "name": "杠铃片", "default": False, "inPool": False},
]


def derive(minutes):
    sets_per_day = math.floor(minutes * 14 / 60 + 0.5)
    ex_per_day = max(3, math.floor(sets_per_day / 2.3 + 0.5))
    return {"setsPerDay": sets_per_day, "exercisesPerDay": ex_per_day}


core = [e["id"] for e in EQUIP if e["default"]]
profiles = [
    {"id": "default", "label": "默认档案（进阶）", "experience": "intermediate", "equipment": core,
     "sessionMinutes": 60, "sex": "male", "unit": "kg", "derived": derive(60)},
    {"id": "advanced", "label": "高阶档案", "experience": "advanced", "equipment": core,
     "sessionMinutes": 90, "sex": "female", "unit": "kg", "derived": derive(90)},
]
(ROOT / "mock/profile.json").write_text(json.dumps({
    "_meta": {"说明": "示例档案。derived 由单次训练时长换算（ia §1.1）：setsPerDay = round(分钟×14/60)，exercisesPerDay = max(3, round(setsPerDay/2.3))。",
              "experience": "novice 新手 / intermediate 进阶 / advanced 高阶",
              "equipment 扩展项": "壶铃、弹力带、杠铃片在 MVP 动作库里没有动作（inPool=false），勾选不会改变处方；界面上是否展示在阶段 3 决定"},
    "equipmentCatalog": EQUIP, "profiles": profiles}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

# ---------------------------------------------------------------- 场景：用来构造各页面状态
heads_by_ex = {i: e["primaryHeads"] for i, e in EX.items()}
all_heads = {h for hs in heads_by_ex.values() for h in hs}
uncovered = set(all_heads)
cover = []
while uncovered:
    best = max(EX, key=lambda i: len(uncovered & set(heads_by_ex[i])))
    gain = uncovered & set(heads_by_ex[best])
    if not gain:
        break
    cover.append(best)
    uncovered -= gain

fatigue = {
    "id": "scn-fatigue-all", "daysAgo": 0, "startTime": "08:00", "durationMin": 140, "exertion": 10,
    "exercises": [{"exerciseId": i, "skipped": False,
                   "sets": [{"type": "work", "weightKg": 20, "reps": 8, "rpe": 9} for _ in range(4)]}
                  for i in cover],
}
bench_w = state["barbell-bench-press-4"]["weight"]
done_today = {
    "id": "scn-today-push", "daysAgo": 0, "startTime": "09:10", "durationMin": 48, "exertion": 8,
    "exercises": [
        {"exerciseId": "barbell-bench-press-4", "skipped": False, "sets": [
            {"type": "work", "weightKg": bench_w, "reps": 6, "rpe": 8} for _ in range(3)]},
        {"exerciseId": "dumbbell-lateral-raise-20", "skipped": False, "sets": [
            {"type": "work", "weightKg": 7.5, "reps": 12, "rpe": None} for _ in range(2)]},
    ],
}
in_progress = {
    "status": "in_progress", "restEndsInSeconds": 95, "currentExerciseIndex": 1,
    "session": {
        "id": "scn-in-progress", "daysAgo": 0, "startTime": "18:30",
        "exercises": [
            {"exerciseId": "barbell-bench-press-4", "skipped": False, "sets": [
                {"type": "warmup", "weightKg": 30, "reps": 5, "rpe": None},
                {"type": "work", "weightKg": bench_w, "reps": 6, "rpe": 8},
                {"type": "work", "weightKg": bench_w, "reps": 6, "rpe": 8.5},
                {"type": "work", "weightKg": bench_w, "reps": 5, "rpe": 9}]},
            {"exerciseId": "dumbbell-incline-bench-press-398", "skipped": False, "sets": [
                {"type": "work", "weightKg": 30, "reps": 7, "rpe": 8}]},
        ],
    },
}
smith_ids = sorted(i for i, e in EX.items() if e["equipmentType"] == "smith")
smith_week = {
    "id": "scn-smith-week", "daysAgo": 2, "startTime": "18:00", "durationMin": 45, "exertion": 8,
    "exercises": [{"exerciseId": i, "skipped": False,
                   "sets": [{"type": "work", "weightKg": 20, "reps": 10, "rpe": None} for _ in range(2)]}
                  for i in smith_ids],
}
scenarios = {
    "_meta": {
        "说明": "各页面状态的构造方法。base 为 profile.json 的 default + history.json 全量；history.remove 按 session id 删除，history.append 追加。",
        "appState 字段": "暂定，字段名在阶段 5 与 store 一起定，不要在页面里硬编码。",
    },
    "scenarios": [
        {"id": "deload-suggested", "title": "有减量建议（默认演示）", "profile": "default", "history": {},
         "covers": ["P01 有处方", "P01 有减量建议", "P02 有历史", "P06 有数据", "P07 很多条"]},
        {"id": "plain-prescription", "title": "有处方，没有减量建议", "profile": "default",
         "history": {"remove": ["demo-w2-lowerA", "demo-w1-lowerA", "demo-w0-lowerA"]},
         "covers": ["P01 有处方（无减量）"]},
        {"id": "deload-adopted", "title": "已采纳减量", "profile": "default", "history": {},
         "appState": {"deload": {"status": "adopted", "daysLeft": 6}}, "covers": ["P01 减量周", "P02 减量周"]},
        {"id": "deload-dismissed", "title": "选了「这次不减」", "profile": "default", "history": {},
         "appState": {"deload": {"status": "dismissed", "dismissedDaysAgo": 0}}, "covers": ["P01 6 天内小字提示"]},
        {"id": "rest-day", "title": "恢复日（所有候选肌头都在修复期）", "profile": "default",
         "history": {"append": [fatigue]}, "covers": ["P01 恢复日", "P02 恢复日说明"],
         "note": "一次覆盖全部有动作的肌头的高强度训练（力竭度 10），今天刚练完；预期各肌头恢复度 < 50%。具体数字以引擎为准，阶段 5 用测试固定。"},
        {"id": "pool-exhausted", "title": "动作池不足", "profile": "default",
         "profilePatch": {"equipment": ["smith"]}, "history": {"append": [smith_week]},
         "covers": ["P01 动作池不足"],
         "note": "器械只剩史密斯机，MVP 动作库里只有 5 个史密斯机动作，且都在 2 天前练过（7 天内不重复）；其余肌头仍是候选，但排不出动作。"},
        {"id": "done-today", "title": "今天已练完", "profile": "default", "history": {"append": [done_today]},
         "covers": ["P01 今天已练完", "P05（今天的训练）"]},
        {"id": "in-progress", "title": "有进行中训练", "profile": "default", "history": {},
         "inProgress": in_progress, "covers": ["P01 有进行中训练", "P03 进行中", "P03 休息中"]},
        {"id": "fresh-install", "title": "全新安装（还没建档）", "profile": None, "history": {"replaceWith": []},
         "covers": ["P12 默认", "F1 起点"], "note": "没有档案，任何路由都重定向到建档；建档完成后就是「冷启动」。"},
        {"id": "cold-start", "title": "冷启动（已建档，没有历史）", "profile": "default", "history": {"replaceWith": []},
         "covers": ["P01 冷启动", "P02 首次记录", "P06 空", "P07 空", "P09 空"]},
        {"id": "advanced-profile", "title": "高阶档案", "profile": "advanced", "history": {},
         "covers": ["P11 高阶档案", "处方预算 9 个动作 / 21 组"]},
        {"id": "engine-error", "title": "引擎错误（测试注入）", "profile": "default", "history": {},
         "inject": "engine.throw", "covers": ["P01 引擎错误"]},
    ],
    "pageStates": {
        "P05 有 PR": "demo-w0-push（卧推创新高）",
        "P05 无 PR": no_pr_sessions[0],
        "P05 首次训练（基线）": sessions[0]["id"],
        "P05 部分动作未做": "demo-w3-pull",
        "P08 正常": "任意 session id",
        "P10 少于 2 次": "dumbbell-bulgarian-split-squat-317",
        "P10 只有 2 次": "machine-face-pulls-22",
        "P10 正常": "barbell-bench-press-4",
        "P10 下滑中": "barbell-squat-8",
        "P08 单侧动作": "demo-w0-pull（割草机划船分左右）",
    },
}
(ROOT / "mock/scenarios.json").write_text(json.dumps(scenarios, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

# ---------------------------------------------------------------- 打印摘要
print("sessions:", len(sessions), "weeks:", dict(sorted(weeks.items())))
print("PR sessions:", {k: len(v) for k, v in prs.items()})
print("deload:", deload)
print("squat e1RM:", [round(v, 1) for _, v in history["barbell-squat-8"]])
print("SLDL  e1RM:", [round(v, 1) for _, v in history["barbell-stiff-leg-deadlifts-27"]])
print("bench e1RM:", [round(v, 1) for _, v in history["barbell-bench-press-4"]])
print("fatigue cover size:", len(cover), "uncovered:", sorted(uncovered))
print("no-PR sessions:", no_pr_sessions)
