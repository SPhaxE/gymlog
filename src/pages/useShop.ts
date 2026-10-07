/** 钱包与商城各页共用的数据（6f）：训练历史（真存储 / 演示场景）+ 钱包动作 → 成长引擎算出的牛劲余额与流水、我的卡券、触发了的知识卡。 */
import { useMemo } from 'react';
import { knowledgeHits } from '../data/knowledge';
import { growthOf } from '../data/me';
import { useSource } from '../data/useSource';
import { proPeriods, usePro } from '../data/pro';
import { couponsOf, useWallet } from '../data/wallet';

export function useShop(scenario: string | undefined, now: number) {
  const { src } = useSource(scenario, now);
  const [wallet, update] = useWallet(scenario, now);
  const [pro] = usePro(scenario);
  const g = useMemo(() => growthOf({ ...src, wallet, pro: proPeriods(pro) }, now), [src, wallet, pro, now]);
  const coupons = useMemo(() => couponsOf(wallet, now), [wallet, now]);
  const hits = useMemo(() => knowledgeHits(src, now), [src, now]);
  return { src, wallet, update, g, balance: g.niujin.balance, coupons, hits };
}

/** 牛劲能抵多少元（会员价 × 20% 与余额取小） */
export const offOf = (member: number, balance: number) => Math.max(0, Math.min(Math.floor(member * 0.2), Math.floor(balance / 100)));

/** 带着调试参数（?scenario= / ?now=）跳页，去掉下单用的 item / size */
export function keepQuery(search: string): string {
  const q = new URLSearchParams(search);
  q.delete('item'); q.delete('size');
  const out = q.toString();
  return out ? `?${out}` : '';
}
