"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InvestorsAdminPanel } from "../../components/InvestorsAdminPanel";
import { fetchFundSummary } from "../../lib/api";

export default function AdminPage() {
  const router = useRouter();
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
  }, [router]);

  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-wide text-slate-100">
          投资人后台管理
        </h1>
        <p className="text-sm text-slate-400">
          管理投资人资料、份额及初始投资额。后续可接入鉴权和操作日志。
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-500/60 px-4 py-1.5 text-sm text-sky-300 hover:bg-sky-500/10"
        >
          返回净值仪表盘
        </Link>
      </header>
      <InvestorsAdminPanel totalAssets={totalAssets ?? undefined} />
    </div>
  );
}

