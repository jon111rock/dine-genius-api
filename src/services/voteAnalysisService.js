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