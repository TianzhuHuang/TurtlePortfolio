"use client";

import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import dayjs from "dayjs";

import type { FundHistory } from "../lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

export interface FundChartProps {
  history: FundHistory[];
}

export function FundChart({ history }: FundChartProps) {
  if (!history.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60">
        <p className="text-sm text-slate-400">暂无净值历史，等待首次更新。</p>
      </div>
    );
  }

  const labels = history.map((item) => dayjs(item.date).format("MM-DD"));

  const dataset = {
    labels,
    datasets: [
      {
        label: "基金净值",
        data: history.map((item) => item.nav),
        tension: 0.35,
        fill: {
          target: "origin",
          above: "rgba(56, 189, 248, 0.25)",
        },
        borderColor: "rgb(56, 189, 248)",
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "rgb(56, 189, 248)",
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <h2 className="mb-4 text-center text-lg font-semibold text-slate-100">
        净值走势
      </h2>
      <div className="relative h-80">
        <Line
          data={dataset}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            scales: {
              y: {
                ticks: {
                  color: "#cbd5f5",
                  callback: (value) => Number(value).toFixed(2),
                },
                grid: {
                  color: "rgba(148, 163, 184, 0.2)",
                },
              },
              x: {
                ticks: {
                  color: "#cbd5f5",
                },
                grid: {
                  color: "rgba(148, 163, 184, 0.12)",
                },
              },
            },
            plugins: {
              legend: {
                labels: { color: "#e2e8f0" },
              },
              tooltip: {
                callbacks: {
                  label: (context) => `净值: ${context.parsed.y?.toFixed(4)}`,
                },
                intersect: false,
              },
            },
          }}
          className="!h-full !w-full"
        />
      </div>
    </div>
  );
}

