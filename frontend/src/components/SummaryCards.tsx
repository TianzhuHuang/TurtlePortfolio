"use client";

import dayjs from "dayjs";
import type { FundSummary } from "../lib/api";

export interface SummaryCardsProps {
  summary: FundSummary | null;
  updatedAt?: string;
}

const ColoredNumber = ({ 
  value, 
  fractionDigits = 2,
  prefix = "",
  suffix = ""
}: { 
  value?: number | null; 
  fractionDigits?: number;
  prefix?: string;
  suffix?: string;
}) => {
  if (value === null || value === undefined) return <span className="text-slate-500">--</span>;
  
  const formatted = value.toLocaleString("zh-CN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  let colorClass = "text-slate-500"; // 默认灰色
  if (value > 0) {
    colorClass = "text-red-500"; // 正数红色
  } else if (value < 0) {
    colorClass = "text-green-500"; // 负数绿色
  }

  return (
    <span className={colorClass}>
      {prefix}{formatted}{suffix}
    </span>
  );
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
          <ColoredNumber value={summary?.nav} fractionDigits={4} />
        </p>
        <p className="mt-2 text-xs text-slate-500">
          更新于 {summary?.date ? dayjs(summary.date).format("YYYY/MM/DD") : "--"}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <p className="text-sm text-slate-400">今日总资产</p>
        <p className="mt-2 text-3xl font-semibold text-emerald-400">
          <ColoredNumber prefix={"¥"} value={totalAssets} />
        </p>
        <p className="mt-2 text-xs text-slate-500">
          涨跌幅 <ColoredNumber value={summary?.change_pct} suffix="%" /> · 变动额 ¥
          <ColoredNumber value={summary?.change_value} />
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <p className="text-sm text-slate-400">持仓市值</p>
        <p className="mt-2 text-3xl font-semibold text-sky-300">
          <ColoredNumber prefix={"¥"} value={holdingsValue} />
        </p>
        <p className="mt-2 text-xs text-slate-500">不含现金的股票/基金市值合计</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <p className="text-sm text-slate-400">现金（可用金额）</p>
        <p className="mt-2 text-3xl font-semibold text-amber-300">
          <ColoredNumber prefix={"¥"} value={cashAmount} />
        </p>
        <p className="mt-2 text-xs text-slate-500">
          上次更新 {updatedAt ? dayjs(updatedAt).format("HH:mm") : "--"}
        </p>
      </div>
    </section>
  );
}

