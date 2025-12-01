"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchCashBalance,
  fetchFundHistory,
  fetchFundSummary,
  fetchHoldings,
  fetchInvestors,
  updateCashBalance,
  getCurrentInvestor,
  type FundHistory,
  type FundSummary,
  type HoldingsResponse,
  type Investor,
} from "@/lib/api";
import { UserMenu } from "@/components/UserMenu";
import { FundChart } from "@/components/FundChart";
import { HoldingsPieChart } from "@/components/HoldingsPieChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { InvestorsTable } from "@/components/InvestorsTable";
import { SummaryCards } from "@/components/SummaryCards";
import { UploadPanel } from "@/components/UploadPanel";
import { InvestorSummaryCards } from "@/components/InvestorSummaryCards.tsx";
import dayjs from "dayjs";

export const HomePage = () => {
  const [summary, setSummary] = useState<FundSummary | null>(null);
  const [holdings, setHoldings] = useState<HoldingsResponse | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [history, setHistory] = useState<FundHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cash, setCash] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null); // 添加当前用户状态

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryData, holdingsData, investorsData, historyData, cashData, userData] =
        await Promise.allSettled([
          fetchFundSummary(),
          fetchHoldings(),
          fetchInvestors(),
          fetchFundHistory(),
          fetchCashBalance(),
          getCurrentInvestor(), // 获取当前用户信息
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
      if (userData.status === "fulfilled") {
        setCurrentUser(userData.value); // 设置当前用户
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

  // 判断是否是管理员用户
  const isAdmin = currentUser?.is_admin === true;

  return (
    <div className="space-y-10">
      <header className="space-y-2 text-center">
        <div className="flex justify-between items-start">
          <div></div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-sky-400/80">
              Turtle Portfolio
            </p>
            <h1 className="text-3xl font-semibold tracking-wide text-slate-100 sm:text-4xl">
              乌龟基金每日净值仪表盘
            </h1>
            <p className="text-sm text-slate-500" style={{ marginTop: "0.5rem", fontSize: '15px' }}>
              更新于 {summary?.date ? dayjs(summary.date).format("YYYY/MM/DD") : "--"}
            </p>
          </div>
          <div>
            <UserMenu/>
          </div>
        </div>
      </header>

      {isAdmin ? (<SummaryCards
        summary={summary}
        updatedAt={history.at(-1)?.created_at}
      />) : (<InvestorSummaryCards summary={summary} investor={currentUser || {}}></InvestorSummaryCards>)}

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
        {/* 仅对管理员用户展示 InvestorsTable */}
        {isAdmin && (
          <InvestorsTable investors={investors} nav={summary?.nav} />
        )}
      </section>

      {/* 仅对管理员用户展示 UploadPanel */}
      {isAdmin && (
        <section className="space-y-3">
          <UploadPanel onRefresh={loadData} />
          {isLoading && (
            <p className="text-center text-xs text-slate-500">
              正在刷新数据，请稍候...
            </p>
          )}
        </section>
      )}

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
};

export default HomePage;