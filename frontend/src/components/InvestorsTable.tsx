"use client";

import type { Investor } from "../lib/api";

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "--";
  return `¥${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined) return "--";
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export interface InvestorsTableProps {
  investors: Investor[];
  nav?: number;
}

export function InvestorsTable({ investors, nav }: InvestorsTableProps) {
  const totals = investors.reduce(
    (acc, investor) => {
      acc.initial += investor.initial_investment;
      acc.shares += investor.shares;
      acc.current += investor.current_value;
      return acc;
    },
    { initial: 0, shares: 0, current: 0 },
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <h2 className="mb-4 text-center text-lg font-semibold text-slate-100">
        投资人资产概览
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left font-normal">姓名 / ID</th>
              <th className="px-3 py-2 text-right font-normal">初始投资额</th>
              <th className="px-3 py-2 text-right font-normal">份额</th>
              <th className="px-3 py-2 text-right font-normal">当前市值</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {investors.map((investor) => (
              <tr key={investor.id} className="text-slate-200">
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span>{investor.name}</span>
                    {investor.identifier && (
                      <span className="text-xs text-slate-500">
                        {investor.identifier}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(investor.initial_investment)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatNumber(investor.shares)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(investor.current_value)}
                </td>
              </tr>
            ))}
          </tbody>
          {typeof nav === "number" && (
            <tfoot>
              <tr className="text-slate-200">
                <td className="px-3 py-2 text-right font-semibold">合计</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {formatCurrency(totals.initial)}
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {formatNumber(totals.shares)}
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {formatCurrency(totals.current)}
                </td>
              </tr>
              <tr className="text-slate-300">
                <td className="px-3 py-2 text-right" colSpan={4}>
                  当前净值 {nav.toFixed(4)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

