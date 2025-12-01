"use client";

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { InvestorsAdminPanel } from "../../components/InvestorsAdminPanel";
import { fetchFundSummary } from "../../lib/api";
import { UserMenu } from "../../components/UserMenu";

export const AdminPage = () => {
  const navigate = useNavigate();
  const [totalAssets, setTotalAssets] = useState<number | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summary = await fetchFundSummary();
        setTotalAssets(summary?.total_value ?? null);
      } catch (error) {
        console.error(error);
        setTotalAssets(null);
      }
    };
    loadSummary();
  }, [navigate]);

  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <div className="flex justify-between items-center">
          <div></div>
          <h1 className="text-3xl font-semibold tracking-wide text-slate-100">
            投资人后台管理
          </h1>
          <UserMenu />
        </div>
        <p className="text-sm text-slate-400">
          管理投资人资料、份额及初始投资额。后续可接入鉴权和操作日志。
        </p>
        <Link 
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-500/60 px-4 py-1.5 text-sm text-sky-300 hover:bg-sky-500/10"
        >
          返回净值仪表盘
        </Link>
      </header>
      <InvestorsAdminPanel totalAssets={totalAssets ?? undefined} />
    </div>
  );
};

export default AdminPage;