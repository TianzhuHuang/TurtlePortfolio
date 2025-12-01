import axios from "axios";
import dayjs from "dayjs";

import { API_BASE_URL } from "./config";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
});

// 添加请求拦截器来设置认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("user-token") : null;
    if (token) {
      config.headers["user-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response.status === 401) {
      localStorage.removeItem("user-token");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export interface FundSummary {
  date: string;
  nav: number;
  total_value: number;
  cash: number;
  change_value?: number | null;
  change_pct?: number | null;
}

export interface Holding {
  id: number;
  name: string;
  symbol?: string | null;
  quantity?: number | null;
  cost_price?: number | null;
  market_value: number;
  weight?: number | null;
  date: string;
}

export interface HoldingsResponse {
  date: string;
  total_value: number;
  holdings: Holding[];
}

export interface Investor {
  id: number;
  name: string;
  identifier?: string | null;
  shares: number;
  initial_investment: number;
  current_value: number;
  today_value: number;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
}

export interface FundHistory extends FundSummary {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface UploadPreview {
  date: string;
  holdings_value: number;
  cash: number;
  total_assets: number;
  nav?: number | null;
  holdings: Array<{
    name: string;
    symbol?: string | null;
    quantity?: number | null;
    cost_price?: number | null;
    market_value: number;
  }>;
}

export interface CashBalance {
  amount: number;
  updated_at: string;
  created_at: string;
}

// 登录相关接口
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  investor: Investor;
  token: {
    id: number;
    token: string;
    investor_id: number;
    expires_at: string;
    last_used_at: string | null;
    user_agent: string | null;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
  };
}

export const fetchFundSummary = async (): Promise<FundSummary | null> => {
  const { data } = await apiClient.get<FundSummary | null>("/fund/nav");
  return data;
};

export const fetchHoldings = async (): Promise<HoldingsResponse | null> => {
  const { data } = await apiClient.get<HoldingsResponse | null>(
    "/holdings/today",
  );
  return data;
};

export const fetchInvestors = async (): Promise<Investor[]> => {
  const { data } = await apiClient.get<Investor[]>("/investors/");
  return data;
};

export const fetchFundHistory = async (): Promise<FundHistory[]> => {
  const { data } = await apiClient.get<FundHistory[]>("/fund/history", {
    params: { limit: 90 },
  });
  return data;
};

export const uploadScreenshot = async (
  files: File[],
  holdingsDate?: string,
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (holdingsDate) {
    formData.append("holdings_date", dayjs(holdingsDate).format("YYYY-MM-DD"));
  }
  return apiClient.post("/upload/screenshot", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const previewScreenshot = async (
  files: File[],
  holdingsDate?: string,
): Promise<UploadPreview> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (holdingsDate) {
    formData.append("holdings_date", dayjs(holdingsDate).format("YYYY-MM-DD"));
  }
  const { data } = await apiClient.post<UploadPreview>(
    "/upload/screenshot/preview",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data;
};

export const submitManualHoldings = async (
  payload: {
    date: string;
    holdings: Array<{
      name: string;
      symbol?: string | null;
      quantity?: number | null;
      cost_price?: number | null;
      market_value: number;
    }>;
  },
  overwrite = true,
) => {
  return apiClient.post(
    "/holdings/manual",
    {
      date: payload.date,
      holdings: payload.holdings,
    },
    {
      params: { overwrite },
    },
  );
};

export const triggerTushareRefresh = async () => {
  return apiClient.post("/upload/tushare");
};

export const fetchCashBalance = async (): Promise<CashBalance> => {
  const { data } = await apiClient.get<CashBalance>("/fund/cash");
  return data;
};

export const updateCashBalance = async (amount: number): Promise<CashBalance> => {
  const { data } = await apiClient.put<CashBalance>("/fund/cash", { amount });
  return data;
};

// 登录相关 API
export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

export const getCurrentInvestor = async (): Promise<Investor> => {
  const { data } = await apiClient.get<Investor>("/investors/me");
  return data;
};

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export const changePassword = async (payload: ChangePasswordRequest): Promise<Investor> => {
  const { data } = await apiClient.put<Investor>("/auth/change-password", payload);
  return data;
};
