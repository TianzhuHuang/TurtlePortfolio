"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchCashBalance,
  fetchFundHistory,
  fetchFundSummary,
  fetchHoldings,
  fetchInvestors,
  updateCashBalance,
  type FundHistory,
  type FundSummary,
  type HoldingsResponse,
  type Investor,
} from "../lib/api";
import { FundChart } from "../components/FundChart";
import { HoldingsPieChart } from "../components/HoldingsPieChart";
import { HoldingsTable } from "../components/HoldingsTable";
import { InvestorsTable } from "../components/InvestorsTable";
import { SummaryCards } from "../components/SummaryCards";
import { UploadPanel } from "../components/UploadPanel";

export default function HomePage() {
  const [summary, setSummary] = useState<FundSummary | null>(null);
  const [holdings, setHoldings] = useState<HoldingsResponse | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [history, setHistory] = useState<FundHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cash, setCash] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryData, holdingsData, investorsData, historyData, cashData] =
        await Promise.allSettled([
          fetchFundSummary(),
          fetchHoldings(),
          fetchInvestors(),
          fetchFundHistory(),
          fetchCashBalance(),
        ]);

      if (summaryData.status === "fulfilled") {
        setSummary(summaryData.value);
      }
      if (holdingsData.status === "fulfilled") {
        setHoldings(holdingsData.value);
      }
      if (investorsData.status === "fulfilled") {
        setInvestors(investorsData.value ?? []);
      }
      if (historyData.status === "fulfilled") {
        setHistory(historyData.value ?? []);
      }
      if (cashData.status === "fulfilled") {
        setCash(cashData.value.amount);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCashSave = useCallback(
    async (amount: number) => {
      await updateCashBalance(amount);
      await loadData();
    },
    [loadData],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-10">
      <header className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-sky-400/80">
          Turtle Portfolio
        </p>
        <h1 className="text-3xl font-semibold tracking-wide text-slate-100 sm:text-4xl">
          乌龟基金每日净值仪表盘
        </h1>
        <p className="text-sm text-slate-400">
          实时监控基金净值、持仓结构与投资人份额，支持自动同步与截图上传。
        </p>
      </header>

      <SummaryCards
        summary={summary}
        updatedAt={history.at(-1)?.created_at}
      />

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FundChart history={history} />
        </div>
        <div className="lg:col-span-2">
          <HoldingsPieChart holdings={holdings?.holdings ?? []} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <HoldingsTable
          holdings={holdings?.holdings ?? []}
          totalValue={holdings?.total_value}
          cashAmount={cash}
          onSaveCash={handleCashSave}
          totalAssets={summary?.total_value ?? 0}
        />
        <InvestorsTable investors={investors} nav={summary?.nav} />
      </section>

      <section className="space-y-3">
        <UploadPanel onRefresh={loadData} />
        {isLoading && (
          <p className="text-center text-xs text-slate-500">
            正在刷新数据，请稍候...
          </p>
        )}
      </section>

      <footer className="text-center text-xs text-slate-500">
        最近一次更新：
        {summary?.date ?? "未有记录"} ·{" "}
        <button
          type="button"
          onClick={loadData}
          className="underline decoration-dotted decoration-sky-400 underline-offset-4 hover:text-sky-300"
        >
          手动刷新
        </button>
      </footer>
    </div>
  );
}
