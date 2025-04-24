import { extractValidatedData } from '../utils/validators.js';
import { formatAIResponse } from '../utils/responseFormatter.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseFormatter.js';
import voteAnalysisService from '../services/voteAnalysisService.js';
import promptService from '../services/promptService.js';
import aiService from '../services/aiService.js';
import placesService from '../services/placesService.js';
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
      let recommendationsResult = formatAIResponse(aiResponse, analysis, startTime);
      
      // 提取AI生成的推薦餐廳列表
      const aiRecommendations = recommendationsResult.data?.recommendations || [];
      
      // 如果有推薦餐廳列表，調用Google Places API獲取更準確的資訊
      if (aiRecommendations.length > 0) {
        console.log(`正在為${aiRecommendations.length}間餐廳查詢Google Places API信息`);
        
        // 從options中提取位置上下文
        const locationContext = options?.location || '';
        
        // 使用Promise.allSettled並行處理所有餐廳查詢
        const placesPromises = aiRecommendations.map(restaurant => 
          placesService.findPlaceDetails(restaurant.name, locationContext)
        );
        
        // 等待所有Places API請求完成
        const placesResults = await Promise.allSettled(placesPromises);
        
        // 整合Places API結果到推薦中
        for (let i = 0; i < aiRecommendations.length; i++) {
          const result = placesResults[i];
          if (result.status === 'fulfilled' && result.value) {
            const placeDetails = result.value;
            
            // 更新餐廳資訊，使用Google Places信息
            aiRecommendations[i].photoUrl = placeDetails.photoUrl || aiRecommendations[i].photoUrl;
            aiRecommendations[i].mapUrl = placeDetails.googleMapsUri || aiRecommendations[i].mapUrl;
            
            // 如果餐廳沒有地址但Places API有，也更新地址
            if (aiRecommendations[i].address === "詳細地址未提供" && placeDetails.formattedAddress) {
              aiRecommendations[i].address = placeDetails.formattedAddress;
            }
            
            console.log(`已更新餐廳「${aiRecommendations[i].name}」的Places信息`);
          } else {
            console.log(`無法為餐廳「${aiRecommendations[i].name}」獲取Places信息`);
          }
        }
        
        // 更新推薦結果物件
        recommendationsResult.data.recommendations = aiRecommendations;
        
        // 添加Google Places API使用記錄到元數據
        recommendationsResult.meta.placesApiUsed = true;
      }
      
      // 7. 先發送響應，避免超時
      res.status(200).json(recommendationsResult);
      
      // 8. 異步保存到Firebase，不等待完成
      const roomId = req.body.roomId;
      if (roomId) {
        console.log(`開始異步保存推薦結果到Firebase，房間ID: ${roomId}`);
        console.log(`recommendations對象類型: ${typeof recommendationsResult}`);
        console.log(`recommendations對象長度: ${Object.keys(recommendationsResult).length}`);
        
        updateRoomData(roomId, { recommendations: recommendationsResult })
          .then(result => {
            console.log(`推薦餐廳已異步保存到Firebase，結果: ${result ? '成功' : '失敗'}`);
          })
          .catch(firebaseError => {
            console.error('保存推薦到Firebase失敗:', firebaseError);
            // 輸出詳細錯誤信息
            if (firebaseError.code) {
              console.error(`Firebase錯誤代碼: ${firebaseError.code}`);
            }
            if (firebaseError.message) {
              console.error(`Firebase錯誤信息: ${firebaseError.message}`);
            }
            if (firebaseError.stack) {
              console.error(`Firebase錯誤堆疊: ${firebaseError.stack}`);
            }
          });
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
      } else if (error.message.includes('Places API')) {
        // 對於Places API相關錯誤，記錄錯誤但仍嘗試返回AI推薦
        console.warn('Places API錯誤，但將繼續返回AI推薦:', error.message);
        const recommendations = formatAIResponse(aiResponse, analysis, startTime);
        return res.status(200).json(recommendations);
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