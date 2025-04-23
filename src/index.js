import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
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

// 安全頭部配置 - 使用helmet中間件
app.use(helmet());
// 自定義Content-Security-Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", 
        process.env.NODE_ENV === 'production' 
          ? 'https://dine-vote.firebaseapp.com https://dine-vote.web.app' 
          : 'http://localhost:*'
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  })
);
// 設置X-XSS-Protection
app.use(helmet.xssFilter());
// 設置X-Content-Type-Options
app.use(helmet.noSniff());
// 設置Strict-Transport-Security
app.use(
  helmet.hsts({
    maxAge: 15552000, // 180天
    includeSubDomains: true,
    preload: true,
  })
);

// 設置 CORS 中間件 - 允許跨域請求
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173','http://localhost:3000', 'https://dine-vote.firebaseapp.com', 'https://dine-vote.web.app'];

app.use(cors({
  origin: function(origin, callback) {
    // 允許沒有來源的請求（如移動應用或 Postman）
    if(!origin) return callback(null, true);
    
    if(allowedOrigins.indexOf(origin) === -1) {
      const msg = `此站點的CORS政策不允許來自此來源 ${origin} 的訪問`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true, // 允許攜帶憑證（cookies等）
  maxAge: 86400, // 預檢請求結果緩存24小時
  optionsSuccessStatus: 204 // 預檢請求成功時的狀態碼
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
  console.log(`CORS已啟用，允許的來源: ${allowedOrigins.join(', ')}`);
});

export default app; 