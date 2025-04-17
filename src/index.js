import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { recommendationRoutes } from './routes/recommendation.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { handleJsonErrors } from './middleware/validator.js';

// 載入環境變數
dotenv.config();

// 初始化Express應用
const app = express();
const PORT = process.env.PORT || 3000;

// 基本中間件設置
app.use(express.json({ limit: '1mb' }));
app.use(handleJsonErrors); // JSON解析錯誤處理
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
}));

// API路由 (帶版本號)
app.use('/api/v1', recommendationRoutes);

// 根路由重定向到API健康檢查
app.get('/', (req, res) => {
  res.redirect('/api/v1/health');
});

// 處理404錯誤 - 所有未匹配的路由
app.use(notFoundHandler);

// 全局錯誤處理中間件
app.use(errorHandler);

// 啟動服務器
app.listen(PORT, () => {
  console.log(`伺服器運行於 http://localhost:${PORT}`);
  console.log(`API文檔訪問路徑: http://localhost:${PORT}/api/v1/health`);
});

export default app; 