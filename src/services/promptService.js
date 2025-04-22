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
    return `你是一位專業的餐廳推薦助手，根據群體的飲食偏好提供餐廳建議。

請使用內建功能搜索餐廳，確保推薦真實存在的餐廳。出於效率考量，請簡化搜索步驟：

1. 簡單搜索：
   - 使用"[地區] [餐廳類型] 推薦"進行搜索
   - 選擇真實存在且符合用戶偏好的餐廳

2. 基本資訊收集：
   - 記錄餐廳名稱、類型和簡短地址
   - 取得Google地圖連結
   - 尋找餐廳照片
   - 獲取評分資訊
   
3. 推薦菜品：
   - 搜索2-3道推薦菜品
   
請注意效率，不要花費太多時間在詳細搜索每家餐廳上，保持回應速度。`;
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
    
    // 建構精簡摘要
    let summary = `根據${participantCount}位參與者的投票，請推薦餐廳。

# 關鍵偏好
- 主要餐廳類型：${primaryFoodType || '無明確偏好'}`;

    // 添加預算資訊
    summary += `\n- 預算：${budgetRange.min}-${budgetRange.max}${currency}`;
    
    // 添加口味偏好
    summary += `\n- 口味：辣度${spiciness}/5，甜度${sweetness}/5`;
    
    // 添加飲食限制（如果有）
    if (dietaryRestrictions && dietaryRestrictions.length > 0) {
      summary += `\n- 特殊需求：${dietaryRestrictions.join(', ')}`;
    }
    
    // 添加地點
    summary += `\n- 地點：${location}`;
    
    return summary;
  }
  
  /**
   * 建構輸出格式指示
   * @param {Number} maxResults - 最大推薦數量
   * @param {Boolean} includeReasons - 是否包含推薦理由
   * @returns {String} 輸出指示文本
   */
  buildOutputInstructions(maxResults, includeReasons) {
    let outputInstructions = `# 輸出要求
請簡化搜索步驟，直接推薦${maxResults}家最適合這群人的餐廳。輸出格式為簡化的JSON，僅包含最關鍵資訊：

\`\`\`json
[
  {
    "name": "餐廳名稱",
    "type": "餐廳類型", 
    "address": "簡短地址",
    "mapUrl": "Google地圖連結",
    "photoUrl": "餐廳照片URL",
    "priceRange": "價格範圍",
    "rating": "評分（例如：4.5/5.0）""`;
  
    if (includeReasons) {
      outputInstructions += `,
    "reasons": ["簡短理由1", "簡短理由2"]`;
    }
    
    outputInstructions += `,
    "dishes": ["推薦菜品1", "推薦菜品2"]
  }
]
\`\`\`

請僅回傳標準的JSON格式，不要加入其他解釋文字。每家餐廳應具有不同特色。

輸出要求簡化：
1. 所有餐廳必須位於指定地點的周邊區域
2. 地址可簡短但要準確
3. 照片URL必須有效
4. 評分格式簡化為"4.5/5.0"
5. 所有URL必須可直接訪問`;
  
    return outputInstructions;
  }
  
  /**
   * 為特定場景（如特殊飲食限制）生成專門的提示詞
   * @param {String} restriction - 飲食限制類型
   * @returns {String} 專門的提示詞添加文本
   */
  getSpecialDietaryPrompt(restriction) {
    const specialPrompts = {
      vegetarian: '請確保推薦包含足夠的素食選項。在Google搜索時，添加"素食友好"或"素食選項"關鍵詞。',
      vegan: '請確保推薦純素友好的餐廳選項。在Google搜索時，添加"全素"或"純素"關鍵詞。',
      glutenFree: '請考慮推薦提供無麩質選項的餐廳。在Google搜索時，添加"無麩質"或"gluten-free"關鍵詞。',
      nutFree: '請確保推薦的餐廳能夠提供無堅果選項。在Google搜索時，添加"無堅果"或"nut-free"關鍵詞。',
      seafoodAllergy: '請避免以海鮮為主的餐廳，或確保有足夠非海鮮選項。在Google搜索時，排除"海鮮"關鍵詞。',
      lactoseFree: '請考慮推薦能提供無乳製品選項的餐廳。在Google搜索時，添加"無乳製品"或"lactose-free"關鍵詞。'
    };
    
    return specialPrompts[restriction] || '';
  }
}

export default new PromptService(); 