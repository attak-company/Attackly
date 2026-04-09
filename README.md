# 數位店長 (AI客服自動預約 SaaS)

「讓商家用0技術，擁有會接單、會排程、會成交的AI客服」

## 🚀 技術棧

- **Frontend**: Next.js (App Router), TailwindCSS, shadcn/ui
- **Backend**: FastAPI (Python), WebSocket, Celery
- **AI**: Gemini API, LangGraph, Pinecone (RAG)
- **Database**: Supabase (PostgreSQL)
- **Infrastructure**: Docker, Redis

## 📦 專案架構

- `frontend/`: Next.js 應用程式（商家後台與預約頁面）
- `backend/`: FastAPI 應用程式（AI 核心邏輯與 API）
- `shared/`: 共用的型別與常數
- `infra/`: Docker 與部署設定

## 🛠️ 開發指南

### 後端啟動
```bash
cd backend
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# 設定環境變數並啟動
$env:PYTHONPATH = "."
python app/main.py
```

### 前端啟動
```bash
cd frontend
npm install
npm run dev
```

## 🧠 AI 核心流程 (LangGraph)
系統使用 LangGraph 進行流程編排：
1. **意圖識別**: 判斷使用者是要 FAQ、預約還是閒聊。
2. **工具調用**: 根據意圖調用對應的工具（RAG 檢索或預約系統）。
3. **回應生成**: 使用 Gemini API 結合上下文生成回覆。
