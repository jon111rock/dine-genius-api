# Dine Genius API

智能餐廳推薦微服務 - DineVote應用的AI推薦引擎

## 項目概述

Dine Genius API是一個輕量級微服務，接收投票數據，透過Google Gemini AI分析群體偏好，生成智能化餐廳推薦。

核心功能:
- 提供REST API接收投票數據
- 分析多位用戶的飲食偏好、預算與限制條件
- 調用Gemini AI生成符合群體喜好的餐廳推薦
- 返回結構化的餐廳推薦結果

## 技術架構

- **後端框架**: Express.js / Node.js
- **AI整合**: Google Generative AI SDK (@google/generative-ai)
- **資料處理**: 投票分析引擎
- **安全性**: API密鑰保護、CORS設定

## 安裝指南

### 前置需求

- Node.js v16或更高版本
- Google Gemini API密鑰

### 安裝步驟

1. 克隆儲存庫
```bash
git clone https://github.com/username/dine-genius-api.git
cd dine-genius-api
```

2. 安裝依賴
```bash
npm install
```

3. 配置環境變數
   - 複製`.env.example`為`.env`
   - 填入您的Gemini API密鑰和其他設定
```bash
cp .env.example .env
```

4. 啟動服務
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

5. 測試API
```bash
curl http://localhost:3000/api/v1/health
```

## API文檔

詳細的API文檔可在以下位置找到:
- [API文檔](docs/API_DOCUMENTATION.md)

## 資料夾結構

```
dine-genius-api/
├── docs/                 # 文檔
├── src/                  # 源代碼
│   ├── config/           # 配置文件
│   ├── controllers/      # 控制器
│   ├── middleware/       # 中間件
│   ├── routes/           # 路由定義
│   ├── services/         # 業務邏輯
│   ├── utils/            # 工具函數
│   └── index.js          # 應用入口
├── test-data/            # 測試數據
├── .env.example          # 環境變數範例
├── .gitignore            # Git忽略文件
└── package.json          # 項目配置
```

## 開發指南

### 添加新功能

1. 在適當的目錄中添加功能實現
2. 編寫測試確保功能正常
3. 更新文檔反映新功能

### 代碼風格

- 使用ES Module語法(import/export)
- 遵循MVC架構設計模式
- 使用async/await處理異步操作

## 部署

支持部署到以下平台:
- Firebase Functions
- Vercel
- Netlify

部署指南可在[部署文檔](docs/DEPLOYMENT.md)中找到。

## 授權

MIT授權協議 