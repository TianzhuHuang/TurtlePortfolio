"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // 检查是否存在有效的认证token
    const checkAuth = () => {
      // 这里可以添加更复杂的token验证逻辑
      const token = localStorage.getItem("user-token");
      
      // 如果在需要认证的页面但没有token，则重定向到登录页
      // const protectedRoutes = ["/admin"];
      // const isProtectedRoute = protectedRoutes.some(route =>
      //   window.location.pathname.startsWith(route)
      // );

      // 对于所有需要认证的页面（除了登录页本身），检查认证状态
      if (!token && (window.location.pathname !== "/login")) {
        router.push("/login");
      } 
      // 如果在登录页但已经登录，则重定向到主页
      else if (token && window.location.pathname === "/login") {
        router.push("/");
      }
    };

    checkAuth();
    
    // 监听storage事件，在其他标签页登录/退出时保持同步
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user-token") {
        if (!e.newValue) {
          router.push("/login");
        } else if (window.location.pathname === "/login") {
          router.push("/");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  return <>{children}</>;
}