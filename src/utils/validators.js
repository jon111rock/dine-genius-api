import { body, validationResult } from 'express-validator';

/**
 * 餐廳推薦API請求驗證規則
 */
export const validateRecommendationRequest = [
  // 驗證votes陣列
  body('votes').isArray({ min: 1 }).withMessage('至少需要一個投票數據'),
  
  // 驗證每個投票的必要欄位
  body('votes.*.participantId').exists().withMessage('參與者ID為必填').isString().withMessage('參與者ID必須為字串'),
  body('votes.*.participantName').optional().isString().withMessage('參與者姓名必須為字串'),
  body('votes.*.foodType').exists().withMessage('食物類型為必填').isString().withMessage('食物類型必須為字串'),
  body('votes.*.budget').exists().withMessage('預算為必填').isNumeric().withMessage('預算必須為數字'),
  
  // 驗證偏好選項
  body('votes.*.spiciness').optional().isInt({ min: 0, max: 5 }).withMessage('辣度必須為0-5的整數'),
  body('votes.*.sweetness').optional().isInt({ min: 0, max: 5 }).withMessage('甜度必須為0-5的整數'),
  body('votes.*.comments').optional().isString().withMessage('評論必須為字串'),
  
  // 驗證options選項
  body('options').optional().isObject().withMessage('選項必須為物件'),
  body('options.language').optional().isString().withMessage('語言必須為字串'),
  body('options.budgetCurrency').optional().isString().withMessage('貨幣必須為字串'),
  body('options.locationContext').optional().isString().withMessage('位置必須為字串'),
  body('options.maxResults').optional().isInt({ min: 1, max: 10 }).withMessage('最大結果數必須為1-10的整數'),
  body('options.includeReasons').optional().isBoolean().withMessage('includeReasons必須為布林值'),
  
  // 驗證執行中間件
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error', 
        message: '請求驗證失敗',
        errors: errors.array() 
      });
    }
    next();
  }
];

/**
 * 提取驗證後的數據
 */
export const extractValidatedData = (req) => {
  return {
    votes: req.body.votes,
    options: req.body.options || {}
  };
}; 