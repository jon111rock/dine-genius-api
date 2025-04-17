import { validationResult } from 'express-validator';
import { createErrorResponse } from '../utils/responseFormatter.js';

/**
 * 通用驗證中間件
 * 使用express-validator執行驗證並格式化錯誤響應
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // 依次執行所有驗證
    for (let validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    // 收集驗證結果
    const errors = validationResult(req);
    
    // 如果有錯誤，返回400錯誤響應
    if (!errors.isEmpty()) {
      // 將驗證錯誤轉換為易讀格式
      const formattedErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }));
      
      return res.status(400).json(
        createErrorResponse('請求數據驗證失敗', 400, formattedErrors)
      );
    }

    // 通過驗證，繼續下一步
    return next();
  };
};

/**
 * JSON解析錯誤處理中間件
 * 處理請求體JSON解析錯誤
 */
export const handleJsonErrors = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json(
      createErrorResponse('無效的JSON格式', 400, err.message)
    );
  }
  
  next(err);
}; 