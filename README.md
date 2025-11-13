# 乌龟基金账户每日净值展示系统

乌龟基金是一个自动化的基金净值展示平台，提供东方赢家账户数据同步、投资人份额管理以及可视化看板。系统分为 FastAPI 后端与 Next.js 前端两部分，并预置 PostgreSQL（开发阶段默认 SQLite）与每日 16:30 的自动调度任务。

## 功能亮点
- 自动抓取东方赢家持仓（优先 tushare，失败时可上传截图 OCR 解析）
- 根据投资人初始份额计算每日净值及个人资产变动
- 仪表盘展示：净值走势、持仓占比、投资人明细、数据上传入口
- 后台管理：投资人信息增删改查
- APScheduler 定时任务，每日 16:30 触发净值更新

## 项目结构
```
/Users/huangtianzhu5746/TurtlePortfolio
├── backend/                 # FastAPI 服务端
│   ├── main.py              # 应用入口，注册路由与调度
│   ├── database.py          # SQLAlchemy 引擎与 Session 管理
│   ├── models.py            # ORM 模型（investors / holdings / fund_history）
│   ├── schemas.py           # Pydantic 模型
│   ├── crud.py              # 核心业务逻辑（净值计算、数据写入）
│   ├── routers/             # API 路由（fund / holdings / investors / upload）
│   ├── utils/               # tushare、OCR、调度工具
│   └── requirements.txt     # 后端依赖
├── frontend/                # Next.js + Tailwind 仪表盘与后台
│   ├── src/app/             # App Router 页面（首页 + /admin）
│   ├── src/components/      # 图表、表格、上传组件
│   ├── src/lib/             # API 客户端与配置
│   ├── package.json         # 前端依赖
│   └── Dockerfile
├── config/env.example       # 环境变量模板（复制为 .env 使用）
├── docker-compose.yml       # 本地/云端一键部署（frontend + backend + postgres）
├── init_db.sql              # PostgreSQL 初始化脚本
├── data/.gitkeep            # SQLite 默认数据库目录
└── uploads/.gitkeep         # 截图上传目录
```

## 环境配置
1. 复制环境变量模板
   ```bash
   cd /Users/huangtianzhu5746/TurtlePortfolio
   cp config/env.example .env
   ```
   - `DATABASE_URL`：本地默认 `sqlite:///./data/app.db`，部署时改为 PostgreSQL 连接串（例如 `postgresql+psycopg2://user:pass@host:5432/db`）。
   - `TUSHARE_TOKEN`：东方赢家账户对应的 tushare Token。
   - `SCHEDULER_TIMEZONE`：定时任务时区，默认 `Asia/Shanghai`。

2. 安装依赖
   ```bash
   # 后端
   cd /Users/huangtianzhu5746/TurtlePortfolio/backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

   # 前端
   cd /Users/huangtianzhu5746/TurtlePortfolio/frontend
   npm install
   ```

3. 数据库初始化（PostgreSQL 可选）
   ```bash
   psql -U <user> -d <database> -f /Users/huangtianzhu5746/TurtlePortfolio/init_db.sql
   ```
   若使用默认 SQLite，可跳过。

## 本地运行
1. 启动 FastAPI 后端
   ```bash
   cd /Users/huangtianzhu5746/TurtlePortfolio/backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. 启动 Next.js 前端
   ```bash
   cd /Users/huangtianzhu5746/TurtlePortfolio/frontend
   npm run dev
   ```

3. 打开浏览器访问
   - 仪表盘首页：`http://localhost:3000`
   - 投资人后台：`http://localhost:3000/admin`

## 核心 API
- `POST /api/upload/tushare`：调用 tushare 自动拉取持仓并更新净值
- `POST /api/upload/screenshot`：上传东方赢家截图，OCR 解析后写入持仓
- `POST /api/holdings/manual`：管理员手工录入持仓
- `GET /api/fund/nav`：查询最新净值
- `GET /api/fund/history`：获取净值历史
- `GET /api/investors` / `POST` / `PUT` / `DELETE`：投资人管理

## 定时任务
- `backend/utils/scheduler.py` 预置 APScheduler，在应用启动时注册。
- 默认每日 16:30（Asia/Shanghai）执行 `fetch_holdings()`，成功后自动写入净值历史。
- 若 tushare 未配置或拉取失败，会记录 warning 日志并跳过。

## OCR 上传备选流程
1. 管理员在首页选择“东方赢家截图”并指定日期。
2. 后端 `parse_account_screenshot()` 使用 PaddleOCR 解析表格，提取名称/代码/数量/市值。
3. 调用 `update_holdings_and_nav()` 重新计算净值和投资人资产。
4. 解析失败时返回 400，前端提示改用手动录入或检查截图。

## 部署建议
- 前端：Vercel / Cloud Run 等静态或 Serverless 环境，设置 `NEXT_PUBLIC_API_BASE_URL` 指向后端域名。
- 后端：Google Cloud Run / Render / Railway 均可，部署镜像可使用 `backend/Dockerfile`。
- 数据库：Cloud SQL、Supabase、Neon 等托管 PostgreSQL。
- 若使用 `docker-compose.yml` 本地/云端部署，执行：
  ```bash
  TUSHARE_TOKEN=your_token docker compose up -d --build
  ```

## 后续优化路线
- 集成身份认证与投资人登录（/admin 仅管理员访问）
- 支持邮件/企业微信的净值推送
- 导出净值与持仓报表（Excel / PDF）
- 引入单元测试与端到端测试保障任务调度

## 常见问题
- **tushare 拉取为空**：检查 Token 权限，或在 `backend/utils/tushare_client.py` 中补充适配东方赢家接口。
- **OCR 识别率低**：可在同文件内替换为 Tesseract 或自定义表格解析逻辑。
- **初始投资总额为 0**：需在后台添加投资人并设置初始投资额，否则净值无法计算。
