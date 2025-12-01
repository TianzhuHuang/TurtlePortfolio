import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import { Providers } from './app/providers';
import HomePage from './app/page';
import LoginPage from './app/login/page';
import AdminPage from './app/admin/page';
import './app/globals.css';

const App: React.FC = () => {
  return (
    <Providers>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10">
          <AppRoutes />
        </main>
      </div>
    </Providers>
  );
};

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 处理认证检查逻辑
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("user-token");

      // 对于所有需要认证的页面（除了登录页本身），检查认证状态
      if ((!token && location.pathname !== "/login")) {
        navigate("/login");
      } 
      // 如果在登录页但已经登录，则重定向到主页
      else if (token && location.pathname === "/login") {
        navigate("/");
      }
    };

    checkAuth();
  }, [location, navigate]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
};

export default App;