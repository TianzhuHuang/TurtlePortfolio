"use client";

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import type { Holding } from "../lib/api";

ChartJS.register(ArcElement, Tooltip, Legend);

export interface HoldingsPieChartProps {
  holdings: Holding[];
}

export function HoldingsPieChart({ holdings }: HoldingsPieChartProps) {
  if (!holdings.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60">
        <p className="text-sm text-slate-400">暂无持仓数据。</p>
      </div>
    );
  }

  const colors = [
    "#38bdf8",
    "#22d3ee",
    "#818cf8",
    "#c084fc",
    "#f472b6",
    "#fb7185",
    "#34d399",
    "#fbbf24",
    "#f97316",
  ];

  const labels = holdings.map((item) => item.name);
  const data = holdings.map((item) => {
    if (typeof item.weight === "number") return Number(item.weight * 100);
    return item.market_value;
  });

  const backgroundColors = holdings.map(
    (_item, index) => colors[index % colors.length],
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <h2 className="mb-4 text-center text-lg font-semibold text-slate-100">
        当前持仓占比
      </h2>
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data,
              backgroundColor: backgroundColors,
              borderWidth: 0,
            },
          ],
        }}
        options={{
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#e2e8f0",
                boxWidth: 12,
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label ?? "";
                  const value = context.parsed ?? 0;
                  return `${label}: ${value.toFixed(2)}%`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}

