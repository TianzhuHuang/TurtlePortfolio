"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api";

interface LoginForm {
  identifier: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginForm>({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await login(formData);
      const { token } = data;

      // Store token in localStorage
      localStorage.setItem("user-token", token.token);

      // Redirect to home page
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.response?.status === 401) {
        setError("用户名或密码错误");
      } else {
        setError("登录失败，请稍后再试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start pt-20 justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-slate-100">
            乌龟基金管理系统
          </h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            请输入您的账号和密码登录
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-900/50 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="-space-y-px rounded-md shadow-sm">
            <div className="pb-4">
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-300">
                账号
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                value={formData.identifier}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                placeholder="请输入账号"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                placeholder="请输入密码"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "登录中..." : "登录"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}