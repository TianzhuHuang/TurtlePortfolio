"use client";

import { Fragment, useRef, useState } from "react";
import dayjs from "dayjs";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import type { AxiosError } from "axios";

import {
  previewScreenshot,
  submitManualHoldings,
  type UploadPreview,
} from "../lib/api";

export interface UploadPanelProps {
  onRefresh?: () => void;
}

export function UploadPanel({ onRefresh }: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const formatPreviewCurrency = (value?: number | null) =>
    typeof value === "number"
      ? `¥${value.toLocaleString("zh-CN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "—";

  const handleUpload = async () => {
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setMessage("请先选择至少一张东方赢家截图文件。");
      return;
    }
    const fileList = Array.from(files);

    setIsUploading(true);
    setStatus("正在解析截图，请稍候...");
    setMessage(null);

    try {
      const data = await previewScreenshot(fileList, date);
      setPreview(data);
      setIsPreviewOpen(true);
      setMessage(null);
    } catch (error) {
      console.error(error);
      const err = error as AxiosError<{ detail?: string }>;
      const detail =
        err.response?.data?.detail ?? "上传失败，请稍后重试或改用手动录入。";
      setMessage(detail);
      setPreview(null);
      setIsPreviewOpen(false);
    } finally {
      setIsUploading(false);
      setStatus(null);
    }
  };

  const handleConfirmPreview = async () => {
    if (!preview) return;
    setIsConfirming(true);
    setStatus("正在写入数据库...");
    try {
      await submitManualHoldings({
        date: preview.date,
        holdings: preview.holdings,
      });
      const assetsText = formatPreviewCurrency(preview.total_assets);
      const navText =
        typeof preview.nav === "number" ? preview.nav.toFixed(4) : "—";
      setMessage(`上传并解析成功，总资产 ${assetsText}，净值 ${navText}。`);
      setPreview(null);
      setIsPreviewOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onRefresh?.();
    } catch (error) {
      console.error(error);
      const err = error as AxiosError<{ detail?: string }>;
      setMessage(err.response?.data?.detail ?? "写入数据库失败，请稍后重试。");
    } finally {
      setIsConfirming(false);
      setStatus(null);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-sky-500/50 bg-slate-900/40 p-6">
      <h2 className="mb-3 text-center text-lg font-semibold text-slate-100">
        数据更新入口
      </h2>
      <p className="mb-5 text-center text-sm text-slate-400">
        支持一次上传多张东方赢家截图，系统会自动合并识别并计算净值。
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="w-full text-sm text-slate-300">
          对应交易日
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex w-full flex-col text-sm text-slate-300">
          东方赢家截图
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            multiple
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-sky-500/20 file:px-3 file:py-1 file:text-sky-300"
          />
        </label>
      </div>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || isConfirming}
          className="flex items-center justify-center gap-2 rounded-full border border-sky-500/50 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
        >
          <CloudArrowUpIcon className="h-5 w-5" />
          上传截图更新
        </button>
      </div>
      {status && (
        <p className="mt-4 text-center text-xs text-sky-300">{status}</p>
      )}
      {message && (
        <p className="mt-4 text-center text-sm text-slate-400">{message}</p>
      )}

      <Transition appear show={isPreviewOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setIsPreviewOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-slate-900 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-slate-100">
                    解析预览（{preview?.holdings.length ?? 0} 条）
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-slate-400">
                    支持多张截图合并识别。请核对明细、持仓/现金/净值数据，确认后写入数据库。
                  </p>
                  <div className="mt-4 grid gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300 sm:grid-cols-2">
                    <p>
                      <span className="text-slate-400">持仓市值：</span>
                      <span className="font-semibold text-sky-300">
                        {formatPreviewCurrency(preview?.holdings_value)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">当前现金：</span>
                      <span className="font-semibold text-amber-300">
                        {formatPreviewCurrency(preview?.cash)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">总资产市值：</span>
                      <span className="font-semibold text-emerald-300">
                        {formatPreviewCurrency(preview?.total_assets)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">预估净值：</span>
                      <span className="font-semibold text-slate-100">
                        {typeof preview?.nav === "number"
                          ? preview.nav.toFixed(4)
                          : "—"}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-slate-800">
                    <table className="min-w-full divide-y divide-slate-800 text-sm">
                      <thead className="bg-slate-900/80 text-slate-300">
                        <tr>
                          <th className="px-3 py-2 text-left font-normal">名称</th>
                          <th className="px-3 py-2 text-right font-normal">数量</th>
                          <th className="px-3 py-2 text-right font-normal">成本价</th>
                          <th className="px-3 py-2 text-right font-normal">市值</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {preview?.holdings.map((item) => (
                          <tr key={`${item.name}-${item.symbol ?? ""}`} className="text-slate-200">
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span>{item.name}</span>
                                {item.symbol && (
                                  <span className="text-xs text-slate-500">{item.symbol}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              {item.quantity?.toLocaleString("zh-CN", {
                                maximumFractionDigits: 2,
                              }) ?? "--"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {item.cost_price !== undefined && item.cost_price !== null
                                ? item.cost_price.toLocaleString("zh-CN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : "--"}
                            </td>
                            <td className="px-3 py-2 text-right text-sky-300">
                              ¥{item.market_value.toLocaleString("zh-CN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-900/80 text-slate-200">
                        <tr>
                          <td className="px-3 py-2 text-right font-semibold" colSpan={3}>
                            合计市值
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-sky-300">
                            {formatPreviewCurrency(preview?.holdings_value)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(false)}
                      className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                      disabled={isConfirming}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPreview}
                      disabled={isConfirming}
                      className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                    >
                      {isConfirming ? "写入中..." : "确认写入数据库"}
                    </button>
                  </div>
                </DialogPanel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

