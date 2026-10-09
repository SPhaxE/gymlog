/** 动作要领（P04）的示范与分步（2026-10-09 走查 1 #05：W3 关键帧分步，按 Stitch V1 搭；取代原来的上半屏视频 + 要领抽屉）。
 *  GuideVideo：16:9 完整示范卡（内容宽、圆角、contain 不裁头），署名在右下，底边一条 2 号段落进度线（当前一步那一段 + 段内走到哪）。
 *  GuideSteps：每步一行——左边 16:9 关键帧缩略图（同一段视频定格在这一段的中点，不写编号）、右边文字说明，行高 ≥ 56、细线分隔；
 *  当前一步缩略图骨白描边、文字主色加粗，缩略图下同步走一条细进度线。
 *  播放：每步 = 视频时长 ÷ 步数的一段；没点时整段循环、当前步跟着播放走；点一步 = 循环那一段（再点同一步取消）。
 *  进度线逐帧写在 CSS 变量上（--gt 全片进度、--gs 段内进度，挂在 useGuidePlayer 给的根元素上），不触发重渲染；
 *  离开视野时暂停；减少动态效果时不自动播放、停在段首。 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from './Icon';
import { cx } from './state';
import s from './guide.module.css';

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** 播放状态（页面持有，GuideVideo 与 GuideSteps 共用）：root 挂在两者共同的祖先上，进度变量写在它上面 */
export function useGuidePlayer(n: number) {
  const root = useRef<HTMLDivElement>(null), video = useRef<HTMLVideoElement>(null);
  const [cur, setCur] = useState(0);              // 正在播的那一步
  const [picked, setPicked] = useState<number | null>(null);  // 点选循环的那一步
  const [dur, setDur] = useState(0);
  const pick = useCallback((i: number) => {
    setPicked((p) => (p === i ? null : i));
    setCur(i);
    const v = video.current;
    if (v && v.duration) v.currentTime = (v.duration / n) * i;
  }, [n]);
  return { root, video, cur, setCur, picked, pick, dur, setDur, n };
}
type Player = ReturnType<typeof useGuidePlayer>;

export function GuideVideo({ player, src, label }: { player: Player; src: string | null; label: string }) {
  const { root, video, picked, setCur, setDur, n } = player;
  const [st, setSt] = useState<'loading' | 'ready' | 'missing' | 'error'>(src ? 'loading' : 'missing');
  useEffect(() => setSt(src ? 'loading' : 'missing'), [src]);
  useEffect(() => {
    const v = video.current;
    if (!v || st !== 'ready') return;
    const seg = () => v.duration / n;
    if (reduced()) { v.pause(); v.currentTime = seg() * (picked ?? 0); root.current?.style.setProperty('--gs', '0'); return; }
    let raf = 0, seen = true, last = -1;
    const tick = () => {
      const d = v.duration, t = v.currentTime, len = seg();
      if (picked != null && (t >= len * (picked + 1) || t < len * picked - 0.05)) v.currentTime = len * picked;
      const i = picked ?? Math.min(n - 1, Math.floor(v.currentTime / len));
      if (i !== last) { last = i; setCur(i); }
      root.current?.style.setProperty('--gt', String(t / d));
      root.current?.style.setProperty('--gs', String(Math.max(0, Math.min(1, (v.currentTime - len * i) / len))));
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (seen) { void v.play().catch(() => undefined); raf = requestAnimationFrame(tick); }
      else { v.pause(); v.currentTime = seg() * (picked ?? Math.max(0, last)); }
    });
    io.observe(v);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [st, picked, n, root, video, setCur]);
  const msg = st === 'missing' ? ['info', '暂无示范'] as const : st === 'error' ? ['alert', '示范加载失败'] as const : null;
  return (
    <figure className={s.video}>
      <div className={cx(s.frame, st === 'loading' && s.loading)} aria-busy={st === 'loading' || undefined}>
        {src && !msg && <video ref={video} src={src} muted loop playsInline autoPlay={!reduced()} preload="auto" aria-label={label} className={st === 'ready' ? s.clip : s.clipHidden}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} onLoadedData={() => setSt('ready')} onError={() => setSt('error')} />}
        {msg && <div className={s.msg}><Icon name={msg[0]} /><b className="milo-text-body-strong">{msg[1]}</b><span className="milo-text-caption">按下方文字要领做</span></div>}
        <figcaption className={cx('milo-text-micro', s.credit)}>示范：<a href="https://musclewiki.com" target="_blank" rel="noreferrer">MuscleWiki</a></figcaption>
        {!msg && <span className={s.track} aria-hidden="true" style={{ '--a': player.cur / n, '--w': 1 / n } as CSSProperties}><i /></span>}
      </div>
    </figure>
  );
}

export function GuideSteps({ player, src, steps }: { player: Player; src: string | null; steps: string[] }) {
  const { cur, picked, pick, dur, n } = player;
  return (
    <ol className={s.steps} aria-label="分步（点一步，循环看那一段）">
      {steps.map((t, i) => {
        const on = i === cur;
        return (
          <li key={i}>
            <button type="button" className={cx('milo-press milo-focus', s.step, on && s.stepOn)} aria-current={on ? 'step' : undefined} aria-pressed={picked === i} onClick={() => pick(i)}>
              <span className={s.thumb} aria-hidden="true">
                {src && dur > 0 && <video src={`${src}#t=${((dur / n) * (i + 0.5)).toFixed(2)}`} muted playsInline preload="auto" tabIndex={-1} />}
                {on && <i className={s.thumbBar} />}
              </span>
              <span className={cx('milo-text-body', s.stepText)}>{t}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** 一句话要点：前面一道荧光短竖（全屏唯一的荧光） */
export function GuideCue({ children }: { children: string }) {
  return <p className={cx('milo-text-heading', s.cue)}>{children}</p>;
}
