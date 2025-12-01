"use client";

import dayjs from "dayjs";
import type {FundSummary, Investor} from "../lib/api";

export interface SummaryCardsProps {
  summary: FundSummary | null;
  investor: Investor;
  updatedAt?: string;
}

const formatNumber = (value?: number | null, fractionDigits = 2) => {
  if (value === null || value === undefined) return "--";
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

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

export function InvestorSummaryCards({ investor, summary, updatedAt }: SummaryCardsProps) {
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
        <p className="text-sm text-slate-400">总资产</p>
        <p className="mt-2 text-3xl font-semibold text-emerald-400">
          <ColoredNumber prefix={"¥"} value={investor.current_value} />
        </p>
        <p className="mt-2 text-xs text-slate-500">
          总收益 <ColoredNumber prefix={"¥"} value={investor.current_value - investor.initial_investment} />
          <span className="ml-1">
            <ColoredNumber 
              value={investor.initial_investment <= 0 ? 0 : (investor.current_value - investor.initial_investment) / investor.initial_investment * 100} 
              suffix="%" 
            />
          </span>
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <p className="text-sm text-slate-400">今日收益</p>
        <p className="mt-2 text-3xl font-semibold text-sky-300">
          <ColoredNumber prefix={"¥"} value={investor.today_value} />
        </p>
        <p className="mt-2 text-xs text-slate-500">
          涨跌幅 <ColoredNumber value={summary?.change_pct} suffix="%" />
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <p className="text-sm text-slate-400">基金净值</p>
        <p className="mt-2 text-3xl font-semibold text-sky-400">
          <ColoredNumber value={summary?.nav} fractionDigits={4} />
        </p>
        <p className="mt-2 text-xs text-slate-500">
          涨跌幅 <ColoredNumber value={summary?.change_pct} suffix="%" />
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
        <p className="text-sm text-slate-400">份额</p>
        <p className="mt-2 text-3xl font-semibold text-amber-300">
          <ColoredNumber value={investor.shares} />
        </p>
      </div>
    </section>
  );
}

