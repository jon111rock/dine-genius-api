import { createErrorResponse } from '../utils/responseFormatter.js';

/**
 * 全局錯誤處理中間件
 * 集中處理應用中所有的錯誤，並返回標準格式的錯誤響應
 */
export const errorHandler = (err, req, res, next) => {
  // 記錄錯誤
  console.error('錯誤:', err.message);
  console.error('堆棧:', err.stack);
  
  // 根據錯誤類型確定狀態碼和錯誤信息
  let statusCode = 500;
  let errorMessage = '內部伺服器錯誤';
  let errorDetails = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  
  // 處理不同類型的錯誤
  if (err.name === 'ValidationError') {
    // 處理驗證錯誤
    statusCode = 400;
    errorMessage = '請求數據驗證失敗';
  } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    // 處理JSON解析錯誤
    statusCode = 400;
    errorMessage = '無效的JSON格式';
  } else if (err.message.includes('找不到') || err.message.includes('not found')) {
    // 處理資源不存在錯誤
    statusCode = 404;
    errorMessage = '請求的資源不存在';
  } else if (err.message.includes('超時') || err.message.includes('timeout')) {
    // 處理超時錯誤
    statusCode = 504;
    errorMessage = '處理請求超時';
  } else if (err.message.includes('未授權') || err.message.includes('unauthorized')) {
    // 處理授權錯誤
    statusCode = 401;
    errorMessage = '未授權的請求';
  }
  
  // 使用通用的錯誤響應格式
  const errorResponse = createErrorResponse(
    errorMessage,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.message : undefined
  );
  
  // 發送錯誤響應
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found 錯誤處理
 * 處理所有未匹配的路由請求
 */
export const notFoundHandler = (req, res) => {
  const errorResponse = createErrorResponse(
    '找不到請求的資源',
    404
  );
  
  res.status(404).json(errorResponse);
}; 