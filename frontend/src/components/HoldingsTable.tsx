"use client";

import { useEffect, useState } from "react";

import type { Holding } from "../lib/api";

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "--";
  return `¥${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined) return "--";
  return `${(value * 100).toFixed(2)}%`;
};

export interface HoldingsTableProps {
  holdings: Holding[];
  totalValue?: number;
  cashAmount: number;
  totalAssets: number;
  onSaveCash: (amount: number) => Promise<void>;
}

export function HoldingsTable({
  holdings,
  totalValue,
  cashAmount,
  onSaveCash,
}: HoldingsTableProps) {
  const [cashInput, setCashInput] = useState<number>(cashAmount);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setCashInput(cashAmount);
  }, [cashAmount]);

  const handleSaveCash = async () => {
    if (cashInput === cashAmount || Number.isNaN(cashInput)) {
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      await onSaveCash(cashInput);
      setFeedback("现金余额已更新。");
    } catch (error) {
      console.error(error);
      setFeedback("保存失败，请重试。");
      setCashInput(cashAmount);
    } finally {
      setIsSaving(false);
    }
  };

  const holdingsTotal = totalValue ?? holdings.reduce((sum, item) => sum + item.market_value, 0);
  const totalAssets = holdingsTotal + cashAmount;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <h2 className="mb-4 text-center text-lg font-semibold text-slate-100">
        当日持仓明细
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left font-normal">名称</th>
              <th className="px-3 py-2 text-left font-normal">代码</th>
              <th className="px-3 py-2 text-right font-normal">数量</th>
              <th className="px-3 py-2 text-right font-normal">市值</th>
              <th className="px-3 py-2 text-right font-normal">仓位占比</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {holdings.map((holding) => (
              <tr key={`${holding.symbol}-${holding.id}`} className="text-slate-200">
                <td className="px-3 py-2">{holding.name}</td>
                <td className="px-3 py-2">{holding.symbol ?? "--"}</td>
                <td className="px-3 py-2 text-right">
                  {holding.quantity?.toLocaleString("zh-CN", {
                    maximumFractionDigits: 2,
                  }) ?? "--"}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(holding.market_value)}
                </td>
                <td className="px-3 py-2 text-right">
                  {typeof holding.weight === "number"
                    ? formatPercent(holding.weight)
                    : "--"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-slate-300">
              <td colSpan={3} className="px-3 py-2 text-right text-sm font-semibold">
                持仓总计（不含现金）
              </td>
              <td className="px-3 py-2 text-right text-sm font-semibold text-sky-300">
                {formatCurrency(holdingsTotal)}
              </td>
              <td className="px-3 py-2" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-300">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex flex-col text-sm text-slate-200 sm:w-1/2">
            现金（可用金额）
            <input
              type="number"
              step="0.01"
              value={Number.isFinite(cashInput) ? cashInput : 0}
              onChange={(event) => setCashInput(Number(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSaveCash();
                }
              }}
              className="mt-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
              disabled={isSaving}
            />
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              持仓合计（不含现金）：{formatCurrency(holdingsTotal)}
            </span>
            <button
              type="button"
              onClick={handleSaveCash}
              disabled={isSaving}
              className="rounded-full bg-sky-500 px-4 py-2 text-xs font-medium text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {isSaving ? "保存中..." : "保存现金"}
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          总资产（持仓 + 现金）：<span className="text-emerald-300">{formatCurrency(totalAssets)}</span>
        </div>
        {feedback && <p className="text-xs text-sky-300">{feedback}</p>}
      </div>
    </div>
  );
}

