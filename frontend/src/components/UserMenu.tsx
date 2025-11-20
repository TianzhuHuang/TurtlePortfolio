"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import axios from "axios";

import {getCurrentInvestor, Investor, changePassword, ChangePasswordRequest} from "@/lib/api";

export interface ChangePasswordForm {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState<ChangePasswordForm>({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);

  // 获取当前用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const data = await getCurrentInvestor();
        setUser(data);
      } catch (error) {
        console.error("获取用户信息失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("user-token");
    router.push("/login");
    router.refresh();

    await logout();
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    // 验证新密码和确认密码是否一致
    if (changePasswordForm.new_password !== changePasswordForm.confirm_password) {
      setChangePasswordError("新密码和确认密码不一致");
      return;
    }

    // 验证密码长度
    if (changePasswordForm.new_password.length < 6) {
      setChangePasswordError("密码长度至少为6位");
      return;
    }

    try {
      await changePassword({
        old_password: changePasswordForm.old_password,
        new_password: changePasswordForm.new_password
      } as ChangePasswordRequest);

      setChangePasswordSuccess("密码修改成功");
      setChangePasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: ""
      });
      
      // 2秒后关闭弹窗
      setTimeout(() => {
        setShowChangePassword(false);
        setChangePasswordSuccess(null);
      }, 2000);
    } catch (error: any) {
      console.error("修改密码失败:", error);
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        setChangePasswordError("原密码错误");
      } else {
        setChangePasswordError("密码修改失败，请稍后重试");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChangePasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-sky-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* 用户菜单触发按钮 */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        <div className="h-8 w-8 rounded-full bg-sky-600 flex items-center justify-center">
          <span className="text-xs font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span>{user.name}</span>
      </button>

      {/* 下拉菜单 */}
      {menuOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setMenuOpen(false)}
          ></div>
          <div className="absolute right-0 top-full z-20 mt-2 w-56 origin-top-right rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-slate-400 border-b border-slate-700">
                <p className="truncate">{user.name}</p>
                {user.identifier && (
                  <p className="text-xs truncate text-slate-500">{user.identifier}</p>
                )}
              </div>
              
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/");
                }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                首页
              </button>
              
              {user.is_admin && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/admin");
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  投资人管理
                </button>
              )}

                {(<button
                onClick={() => {
                  setMenuOpen(false);
                  setShowChangePassword(true);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                修改密码
              </button>)}
              
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300"
              >
                退出登录
              </button>
            </div>
          </div>
        </>
      )}

      {/* 修改密码模态框 */}
      {showChangePassword && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-slate-800 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">修改密码</h3>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setChangePasswordError(null);
                  setChangePasswordSuccess(null);
                  setChangePasswordForm({
                    old_password: "",
                    new_password: "",
                    confirm_password: ""
                  });
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="old_password" className="block text-sm font-medium text-slate-300">
                    原密码
                  </label>
                  <input
                    id="old_password"
                    name="old_password"
                    type="password"
                    required
                    value={changePasswordForm.old_password}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="new_password" className="block text-sm font-medium text-slate-300">
                    新密码
                  </label>
                  <input
                    id="new_password"
                    name="new_password"
                    type="password"
                    required
                    value={changePasswordForm.new_password}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-300">
                    确认新密码
                  </label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    required
                    value={changePasswordForm.confirm_password}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  />
                </div>

                {changePasswordError && (
                  <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-300">
                    {changePasswordError}
                  </div>
                )}

                {changePasswordSuccess && (
                  <div className="rounded-md bg-green-900/50 p-3 text-sm text-green-300">
                    {changePasswordSuccess}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setChangePasswordError(null);
                      setChangePasswordSuccess(null);
                      setChangePasswordForm({
                        old_password: "",
                        new_password: "",
                        confirm_password: ""
                      });
                    }}
                    className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                  >
                    确认修改
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}