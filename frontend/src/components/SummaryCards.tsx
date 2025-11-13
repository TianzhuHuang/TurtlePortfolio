"use client";

import dayjs from "dayjs";
import type { FundSummary } from "../lib/api";

export interface SummaryCardsProps {
  summary: FundSummary | null;
  updatedAt?: string;
}

const formatNumber = (value?: number | null, fractionDigits = 2) => {
  if (value === null || value === undefined) return "--";
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

export function SummaryCards({ summary, updatedAt }: SummaryCardsProps) {
  const totalAssets =
    summary && typeof summary.total_value === "number"
      ? summary.total_value
      : undefined;
  const cashAmount = summary?.cash ?? 0;
  const holdingsValue =
    typeof totalAssets === "number" ? totalAssets - cashAmount : undefined;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <p className="text-sm text-slate-400">当日净值</p>
        <p className="mt-2 text-3xl font-semibold text-sky-400">
          {formatNumber(summary?.nav, 4)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          更新于 {summary?.date ? dayjs(summary.date).format("YYYY/MM/DD") : "--"}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <p className="text-sm text-slate-400">今日总资产</p>
        <p className="mt-2 text-3xl font-semibold text-emerald-400">
          ¥{formatNumber(totalAssets)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          涨跌幅 {formatNumber(summary?.change_pct, 2)}% · 变动额 ¥
          {formatNumber(summary?.change_value)}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <p className="text-sm text-slate-400">持仓市值</p>
        <p className="mt-2 text-3xl font-semibold text-sky-300">
          ¥{formatNumber(holdingsValue)}
        </p>
        <p className="mt-2 text-xs text-slate-500">不含现金的股票/基金市值合计</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <p className="text-sm text-slate-400">现金（可用金额）</p>
        <p className="mt-2 text-3xl font-semibold text-amber-300">
          ¥{formatNumber(cashAmount)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          上次更新 {updatedAt ? dayjs(updatedAt).format("HH:mm") : "--"}
        </p>
      </div>
    </section>
  );
}

