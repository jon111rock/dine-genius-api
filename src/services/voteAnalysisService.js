import { analyzeVotes, generateVoteSummary } from '../utils/voteAnalyzer.js';

/**
 * 投票分析服務 - 處理投票數據分析
 */
class VoteAnalysisService {
  /**
   * 分析投票數據並生成結果
   * @param {Array} votes - 投票數據陣列
   * @returns {Object} 分析結果，包含統計和摘要
   */
  analyzeVotingData(votes) {
    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      throw new Error('無效的投票數據');
    }

    try {
      // 執行投票分析
      const analysisResult = analyzeVotes(votes);
      
      // 生成摘要文本
      const summary = generateVoteSummary(analysisResult);
      
      return {
        analysis: analysisResult,
        summary
      };
    } catch (error) {
      console.error('投票分析失敗:', error);
      throw new Error(`投票分析處理錯誤: ${error.message}`);
    }
  }
  
  /**
   * 提取關鍵偏好數據，提供給提示詞服務使用
   * @param {Object} analysisResult - 分析結果對象
   * @returns {Object} 關鍵偏好數據
   */
  extractKeyPreferences(analysisResult) {
    if (!analysisResult || analysisResult.error) {
      throw new Error('無效的分析結果');
    }
    
    // 檢查是否存在偏好分歧
    const hasDominantPreferences = this.checkForPreferenceDivergence(analysisResult.topFoodTypes);
    
    if (hasDominantPreferences) {
      // 存在明顯的偏好分歧，使用新格式
      return {
        participantCount: analysisResult.participantCount,
        // 不設置 primaryFoodType，而是用 dominantPreferences 表示多個主要偏好
        dominantPreferences: analysisResult.topFoodTypes.slice(0, hasDominantPreferences).map(item => ({
          type: item.type,
          score: item.percentage || item.count
        })),
        budgetRange: {
          min: analysisResult.budgetDistribution.min,
          max: analysisResult.budgetDistribution.max,
          average: analysisResult.budgetDistribution.average
        },
        spiciness: analysisResult.flavorPreferences.spiciness,
        sweetness: analysisResult.flavorPreferences.sweetness,
        dietaryRestrictions: this.extractDietaryRestrictionsFromComments(analysisResult.comments)
      };
    } else {
      // 沒有明顯的偏好分歧，使用原有格式
      return {
        participantCount: analysisResult.participantCount,
        primaryFoodType: analysisResult.mostPopularFoodType,
        topFoodTypes: analysisResult.topFoodTypes,
        budgetRange: {
          min: analysisResult.budgetDistribution.min,
          max: analysisResult.budgetDistribution.max,
          average: analysisResult.budgetDistribution.average
        },
        spiciness: analysisResult.flavorPreferences.spiciness,
        sweetness: analysisResult.flavorPreferences.sweetness,
        dietaryRestrictions: this.extractDietaryRestrictionsFromComments(analysisResult.comments)
      };
    }
  }
  
  /**
   * 檢查投票偏好中是否存在分歧
   * @param {Array} topFoodTypes - 排序後的食物類型偏好
   * @returns {Number|Boolean} - 如果存在分歧，返回應該包含的偏好數量；否則返回 false
   */
  checkForPreferenceDivergence(topFoodTypes) {
    // 如果沒有足夠的數據，不可能有分歧
    if (!topFoodTypes || topFoodTypes.length < 2) {
      return false;
    }
    
    // 設置相似重要性的閾值（80%）
    const SIMILARITY_THRESHOLD = 0.8;
    
    // 獲取最高分的偏好
    const topScore = topFoodTypes[0].percentage || topFoodTypes[0].count;
    
    // 計算有多少偏好接近最高分（至少80%）
    let divergentCount = 1; // 至少包含最高分
    
    for (let i = 1; i < topFoodTypes.length; i++) {
      const currentScore = topFoodTypes[i].percentage || topFoodTypes[i].count;
      const similarity = currentScore / topScore;
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        divergentCount++;
      } else {
        // 一旦找到分數明顯下降的偏好，就停止檢查
        break;
      }
    }
    
    // 如果有多個相似重要性的偏好，返回偏好數量；否則返回 false
    return divergentCount > 1 ? divergentCount : false;
  }
  
  /**
   * 從評論中提取飲食限制信息
   * @param {Array} comments - 評論陣列
   * @returns {Array} 提取的飲食限制
   */
  extractDietaryRestrictionsFromComments(comments) {
    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return [];
    }
    
    const dietaryKeywords = {
      vegetarian: ['素食', '不吃肉', '菜食'],
      vegan: ['全素', '純素'],
      glutenFree: ['無麩質', '不含麩質'],
      nutFree: ['堅果過敏', '不吃堅果'],
      seafoodAllergy: ['海鮮過敏', '不吃海鮮'],
      lactoseFree: ['乳糖不耐', '不吃奶製品']
    };
    
    const restrictions = [];
    
    // 檢查評論中是否包含飲食限制關鍵詞
    comments.forEach(comment => {
      for (const [restriction, keywords] of Object.entries(dietaryKeywords)) {
        if (keywords.some(keyword => comment.includes(keyword))) {
          restrictions.push(restriction);
        }
      }
    });
    
    // 返回不重複的限制列表
    return [...new Set(restrictions)];
  }
}

export default new VoteAnalysisService(); 