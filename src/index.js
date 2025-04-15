import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

// 初始化Express應用
const app = express();
const PORT = process.env.PORT || 3000;

// 中間件設置
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
}));

// 根路由 - Hello World
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Hello World from Dine Genius API'
  });
});

// 全局錯誤處理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 