"use client";

import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";

import {
  apiClient,
  fetchInvestors,
  type Investor,
} from "../lib/api";

interface InvestorFormState {
  id?: number;
  name: string;
  identifier?: string;
  initial_investment?: number;
  shares?: number;
  is_admin: boolean;
  password?: string;
}

const defaultFormState: InvestorFormState = {
  name: "",
  identifier: "",
  // initial_investment: 0,
  // shares: 0,
  is_admin: false,
  password: "",
};

export function InvestorsAdminPanel({
  loadOnMount = true,
  totalAssets,
}: {
  loadOnMount?: boolean;
  totalAssets?: number | null;
}) {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<InvestorFormState>(defaultFormState);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInvestors();
      setInvestors(data);
    } catch (err) {
      console.error(err);
      setError("获取投资人数据失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loadOnMount) {
      loadData();
    }
  }, [loadOnMount]);

  const openCreateDialog = () => {
    setFormState(defaultFormState);
    setIsDialogOpen(true);
  };

  const openEditDialog = (investor: Investor) => {
    setFormState({
      id: investor.id,
      name: investor.name,
      identifier: investor.identifier ?? "",
      initial_investment: investor.initial_investment,
      shares: investor.shares,
      is_admin: investor.is_admin || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该投资人吗？此操作不可恢复。")) return;
    try {
      await apiClient.delete(`/investors/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      setError("删除失败，请稍后重试。");
    }
  };

  const handleSubmit = async () => {
    try {
      const name = formState.name.trim();
      if (!name) {
        setError("请填写投资人姓名。");
        return;
      }
      
      const payload: any = {
        name,
        identifier: formState.identifier?.trim() || undefined,
        initial_investment: formState.initial_investment,
        shares: formState.shares,
        is_admin: formState.is_admin,
      };
      
      // 如果是创建新用户或者设置了新密码，则包含密码字段
      if (!formState.id && formState.password) {
        payload.password = formState.password;
      }

      if (formState.id) {
        await apiClient.put(`/investors/${formState.id}`, payload);
      } else {
        if (!formState.password) {
          setError("请设置密码。");
          return;
        }
        await apiClient.post("/investors", payload);
      }
      setIsDialogOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setError("保存失败，请确认输入后重试。");
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-center text-lg font-semibold text-slate-100 md:text-left">
            投资人管理
          </h2>
          <p className="text-center text-sm text-slate-400 md:text-left">
            支持新增、编辑和删除投资人份额信息。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={loadData}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
          >
            同步最新数据
          </button>
          <button
            type="button"
            onClick={openCreateDialog}
            className="rounded-full border border-sky-500/60 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/10"
          >
            新增投资人
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left font-normal">姓名</th>
              <th className="px-3 py-2 text-right font-normal">初始投资</th>
              <th className="px-3 py-2 text-right font-normal">份额</th>
              <th className="px-3 py-2 text-right font-normal">当前市值</th>
              <th className="px-3 py-2 text-right font-normal">管理员</th>
              <th className="px-3 py-2 text-right font-normal">操作</th>
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
                  ¥{investor.initial_investment.toLocaleString("zh-CN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3 py-2 text-right">
                  {investor.shares.toLocaleString("zh-CN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3 py-2 text-right">
                  ¥{investor.current_value.toLocaleString("zh-CN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3 py-2 text-right">
                  {investor.is_admin ? (
                    <span className="inline-flex items-center rounded-full bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400">
                      是
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-1 text-xs font-medium text-slate-400">
                      否
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditDialog(investor)}
                      className="text-sm text-sky-300 hover:text-sky-200"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(investor.id)}
                      className="text-sm text-rose-300 hover:text-rose-200"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && investors.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            暂无数据，请先点击"同步最新数据"或新增投资人。
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-slate-400">初始投资合计：</span>
          <span className="font-semibold text-sky-300">
            ¥
            {investors
              .reduce((sum, investor) => sum + investor.initial_investment, 0)
              .toLocaleString("zh-CN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
          </span>
        </div>
        <div>
          <span className="text-slate-400">总资产市值：</span>
          <span className="font-semibold text-emerald-300">
            ¥
            {(typeof totalAssets === "number"
              ? totalAssets
              : investors.reduce((sum, investor) => sum + investor.current_value, 0)
            )
              .toLocaleString("zh-CN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
          </span>
        </div>
      </div>

      <Transition appear show={isDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsDialogOpen}>
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
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-900 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-slate-100">
                    {formState.id ? "编辑投资人" : "新增投资人"}
                  </Dialog.Title>
                  <div className="mt-4 space-y-4 text-sm text-slate-300">
                    <label className="block">
                      姓名
                      <input
                        type="text"
                        value={formState.name}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      投资人 ID (可选)
                      <input
                        type="text"
                        value={formState.identifier}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            identifier: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      初始投资额
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formState.initial_investment}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            initial_investment: Number(event.target.value),
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      份额
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={formState.shares}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            shares: Number(event.target.value),
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formState.is_admin}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              is_admin: event.target.checked,
                            }))
                          }
                          className="mr-2 h-4 w-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500"
                        />
                        <span>管理员权限</span>
                      </div>
                    </label>
                    {(
                      <label className="block">
                        密码
                        <input
                          type="password"
                          value={formState.password || ""}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              password: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                          placeholder="请输入密码"
                        />
                      </label>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                      className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
                    >
                      保存
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