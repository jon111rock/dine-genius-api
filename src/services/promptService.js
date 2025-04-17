/**
 * AI提示詞構建服務 - 根據投票分析結果構建優化的Gemini提示詞
 */
class PromptService {
  /**
   * 為餐廳推薦建構提示詞
   * @param {Object} preferences - 分析後的關鍵偏好
   * @param {Object} options - 用戶提供的選項
   * @returns {String} 格式化的提示詞
   */
  buildRestaurantRecommendationPrompt(preferences, options = {}) {
    // 設置默認值
    const language = options.language || 'zh-TW';
    const budgetCurrency = options.budgetCurrency || 'TWD';
    const locationContext = options.locationContext || '台灣';
    const maxResults = options.maxResults || 3;
    const includeReasons = options.includeReasons !== false;
    
    // 構建系統提示
    const systemPrompt = this.buildSystemPrompt();
    
    // 構建數據摘要
    const dataSummary = this.buildDataSummary(preferences, budgetCurrency, locationContext);
    
    // 構建輸出格式指示
    const outputInstructions = this.buildOutputInstructions(maxResults, includeReasons);
    
    // 組合完整提示詞
    return `${systemPrompt}

${dataSummary}

${outputInstructions}

請使用${language}回答。`;
  }
  
  /**
   * 建構系統提示（設定AI角色和任務）
   * @returns {String} 系統提示文本
   */
  buildSystemPrompt() {
    return `你是一位專業的餐廳推薦助手，專門根據群體的飲食偏好提供相關、適合且多樣化的餐廳建議。你具備深入的美食知識，能夠分析參與者的偏好，提供符合口味、預算和特殊需求的餐廳推薦。`;
  }
  
  /**
   * 建構數據摘要（投票分析結果）
   * @param {Object} preferences - 偏好數據
   * @param {String} currency - 貨幣單位
   * @param {String} location - 地點上下文
   * @returns {String} 數據摘要文本
   */
  buildDataSummary(preferences, currency, location) {
    const { 
      participantCount, 
      primaryFoodType, 
      topFoodTypes, 
      budgetRange, 
      spiciness, 
      sweetness, 
      dietaryRestrictions 
    } = preferences;
    
    // 建構主要摘要
    let summary = `根據${participantCount}位參與者的投票數據，我需要你提供餐廳推薦。

# 投票分析結果
- 最受歡迎的餐廳類型：${primaryFoodType || '無明確偏好'}`;

    // 添加排名前三的餐廳類型（如果有）
    if (topFoodTypes && topFoodTypes.length > 0) {
      summary += `\n- 排名前三的餐廳類型：`;
      topFoodTypes.forEach((foodType, index) => {
        summary += `${foodType.type}(${foodType.percentage}%)`;
        if (index < topFoodTypes.length - 1) summary += ', ';
      });
    }
    
    // 添加預算資訊
    summary += `\n- 預算範圍：${budgetRange.min}-${budgetRange.max}${currency}，平均${budgetRange.average}${currency}`;
    
    // 添加口味偏好
    summary += `\n- 口味偏好：辣度 ${spiciness}/5，甜度 ${sweetness}/5`;
    
    // 添加飲食限制（如果有）
    if (dietaryRestrictions && dietaryRestrictions.length > 0) {
      summary += `\n- 特殊飲食需求：${dietaryRestrictions.join(', ')}`;
    }
    
    // 添加地點上下文
    summary += `\n- 地點上下文：${location}`;
    
    return summary;
  }
  
  /**
   * 建構輸出格式指示
   * @param {Number} maxResults - 最大推薦數量
   * @param {Boolean} includeReasons - 是否包含推薦原因
   * @returns {String} 輸出指示文本
   */
  buildOutputInstructions(maxResults, includeReasons) {
    let outputInstructions = `# 輸出要求
請推薦${maxResults}家最適合這群人的餐廳，並以JSON格式輸出，包含以下字段：
\`\`\`json
[
  {
    "name": "餐廳名稱",
    "type": "餐廳類型",
    "priceRange": "價格範圍"`;
    
    if (includeReasons) {
      outputInstructions += `,
    "reasons": ["推薦理由1", "推薦理由2"]`;
    }
    
    outputInstructions += `,
    "dishes": ["推薦菜品1", "推薦菜品2"]
  }
]
\`\`\`

請僅回傳標準的JSON格式，不要加入其他解釋文字。每家餐廳應該各有特色且符合不同的口味偏好。`;
    
    return outputInstructions;
  }
  
  /**
   * 為特定場景（如特殊飲食限制）生成專門的提示詞
   * @param {String} restriction - 飲食限制類型
   * @returns {String} 專門的提示詞添加文本
   */
  getSpecialDietaryPrompt(restriction) {
    const specialPrompts = {
      vegetarian: '請確保推薦包含足夠的素食選項。',
      vegan: '請確保推薦純素友好的餐廳選項。',
      glutenFree: '請考慮推薦提供無麩質選項的餐廳。',
      nutFree: '請確保推薦的餐廳能夠提供無堅果選項。',
      seafoodAllergy: '請避免以海鮮為主的餐廳，或確保有足夠非海鮮選項。',
      lactoseFree: '請考慮推薦能提供無乳製品選項的餐廳。'
    };
    
    return specialPrompts[restriction] || '';
  }
}

export default new PromptService(); 