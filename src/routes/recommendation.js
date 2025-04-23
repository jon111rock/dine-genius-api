import { Router } from 'express';
import recommendationController from '../controllers/recommendationController.js';
import { validateRecommendationRequest } from '../utils/validators.js';

const router = Router();

/**
 * 推薦API端點
 * POST /recommendations - 根據投票數據生成餐廳推薦
 * 使用驗證中間件確保請求數據格式正確
 */
router.post('/recommendations', validateRecommendationRequest, recommendationController.getRecommendations);

/**
 * 推薦API端點
 * GET /recommendations - 獲取餐廳推薦
 */
router.get('/recommendations/:roomId', recommendationController.getExistingRecommendations);

/**
 * 健康檢查端點
 * GET /health - 檢查API服務狀態
 */
router.get('/health', recommendationController.healthCheck);

export { router as recommendationRoutes }; 