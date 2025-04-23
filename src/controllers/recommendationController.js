import { extractValidatedData } from '../utils/validators.js';
import { formatAIResponse } from '../utils/responseFormatter.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseFormatter.js';
import voteAnalysisService from '../services/voteAnalysisService.js';
import promptService from '../services/promptService.js';
import aiService from '../services/aiService.js';
import { updateRoomData, getRoomData } from '../firebase/rooms.js';
/**
 * 餐廳推薦控制器 - 處理推薦API請求
 */
class RecommendationController {
  /**
   * 處理獲取餐廳推薦的請求
   * @param {Object} req - Express請求對象
   * @param {Object} res - Express響應對象
   * @param {Function} next - Express下一個中間件函數
   */
  async getRecommendations(req, res, next) {
    const startTime = Date.now();
    
    try {
      // 1. 驗證並提取請求數據
      const { votes, options } = extractValidatedData(req);
      
      // 2. 分析投票數據
      const { analysis, summary } = voteAnalysisService.analyzeVotingData(votes);
      console.log('投票分析摘要:', summary);
      
      // 3. 提取關鍵偏好
      const keyPreferences = voteAnalysisService.extractKeyPreferences(analysis);
      
      // 4. 構建提示詞
      const prompt = promptService.buildRestaurantRecommendationPrompt(keyPreferences, options);
      
      // 5. 調用AI服務獲取推薦
      const aiResponse = await aiService.generateWithRetry(prompt);
      
      // 6. 格式化AI回應
      const recommendations = formatAIResponse(aiResponse, analysis, startTime);
      
      // 7. 先發送響應，避免超時
      res.status(200).json(recommendations);
      
      // 8. 異步保存到Firebase，不等待完成
      const roomId = req.body.roomId;
      if (roomId) {
        updateRoomData(roomId, { recommendations })
          .then(() => console.log('推薦餐廳已異步保存到Firebase'))
          .catch(firebaseError => console.error('保存推薦到Firebase失敗:', firebaseError));
      } else {
        console.log('未提供roomId，跳過保存到Firebase');
      }
      
      // 函數結束，響應已發送
      return;
      
    } catch (error) {
      console.error('推薦生成失敗:', error);
      
      // 處理不同類型的錯誤
      if (error.message.includes('無效的投票數據') || error.message.includes('驗證失敗')) {
        return res.status(400).json(
          createErrorResponse('無效的請求數據', 400, error.message)
        );
      } else if (error.message.includes('AI服務')) {
        return res.status(503).json(
          createErrorResponse('AI服務暫時不可用', 503, error.message)
        );
      } else {
        // 對於未預期的錯誤，傳遞給全局錯誤處理中間件
        next(error);
      }
    }
  }
  
  /**
   * 獲取已存在的餐廳推薦
   */
  async getExistingRecommendations(req, res) {
    try {
      const roomId = req.params.roomId;
      const roomData = await getRoomData(roomId);
      if (!roomData) {
        throw new Error('RoomData Not Found');
      } else if (!roomData.recommendations) {
        throw new Error('Recommendations Not Found');
      } else {
        return res.status(200).json(createSuccessResponse(roomData.recommendations));
      }
    } catch (error) {
      return res.status(500).json(createErrorResponse('獲取已存在的餐廳推薦失敗', 500, error.message));
    }
  }

  /**
   * 健康檢查端點 - 確認API服務狀態
   * @param {Object} req - Express請求對象
   * @param {Object} res - Express響應對象
   */
  healthCheck(req, res) {
    return res.status(200).json(
      createSuccessResponse({ status: 'ok', timestamp: new Date().toISOString() })
    );
  }
}

export default new RecommendationController(); 