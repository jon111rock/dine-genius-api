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
    return `你是一位專業的餐廳推薦助手，專門根據群體的飲食偏好提供相關、適合且多樣化的餐廳建議。你具備深入的美食知識，能夠分析參與者的偏好，提供符合口味、預算和特殊需求的餐廳推薦。

你將使用內建的Google搜索功能，來獲取最新、準確的餐廳信息。每當需要查找餐廳信息時，請優先使用Google搜索工具，這將確保你推薦的餐廳真實存在且地址準確。

請按照以下步驟獲取餐廳信息：
1. 使用餐廳名稱加上地區名詞進行Google搜索，例如"台北市松山區 日式料理 推薦"
2. 從搜索結果中確認餐廳是否真實存在，並記錄完整準確的地址（包含城市、區域、街道、門牌號）
3. 使用類似"餐廳名稱 + Google地圖"的搜索詞，確認餐廳在Google地圖上的位置
4. 提取Google地圖網址，確保格式為https://maps.google.com/?q=餐廳名稱+地址
5. 查找餐廳的營業時間、評分和推薦菜品等額外信息

確保你提供的每家餐廳都有准確的地址和有效的Google地圖連結，這對用戶找到餐廳至關重要。`;
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
    
    // 強調要在指定地點周邊推薦餐廳
    summary += `\n\n請特別注意：你必須在「${location}」周邊地區推薦真實存在的餐廳。使用你內建的Google搜索功能，以"${location} ${primaryFoodType || '餐廳'} 推薦"或類似的搜索詞來尋找符合條件的實際餐廳。確保搜索最新的餐廳信息，包括評分、營業時間和菜單特色。`;
    
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
在開始生成推薦之前，請進行Google搜索以獲取真實、最新的餐廳信息。如果搜索結果不足，可嘗試多次搜索不同的關鍵詞組合。

請推薦${maxResults}家最適合這群人的餐廳，並以JSON格式輸出，包含以下字段：
\`\`\`json
[
  {
    "name": "餐廳名稱",
    "type": "餐廳類型",
    "address": "從Google搜索獲取的準確地址，必須真實存在於指定地點周邊，包含完整城市、區域、街道及門牌號",
    "mapUrl": "餐廳的Google地圖連結，格式為 https://maps.google.com/?q=餐廳名稱+地址",
    "priceRange": "價格範圍",
    "rating": "餐廳評分（如有）"`;
    
    if (includeReasons) {
      outputInstructions += `,
    "reasons": ["推薦理由1", "推薦理由2"]`;
    }
    
    outputInstructions += `,
    "dishes": ["推薦菜品1", "推薦菜品2"]
  }
]
\`\`\`

請僅回傳標準的JSON格式，不要加入其他解釋文字。每家餐廳應該各有特色且符合不同的口味偏好。

餐廳選擇要求：
1. 所有餐廳必須位於用戶指定地點的周邊區域，通過Google搜索確認實際存在
2. 所有餐廳信息必須基於Google搜索結果，確保準確且真實存在
3. 請勿推薦搜索不到或沒有足夠信息的餐廳
4. 地址格式必須完整，包含城市、區域、街道名稱和實際門牌號碼
5. 必須為每家餐廳提供有效的Google地圖連結
6. 盡可能提供來自Google搜索的額外信息，如營業時間、餐廳特色或顧客評價摘要`;
    
    outputInstructions += `\n\n關於Google地圖連結：
1. 每家餐廳都必須提供可直接點擊打開的Google地圖連結
2. 地圖連結格式應為: https://maps.google.com/?q=餐廳完整名稱+完整地址
3. 連結中的餐廳名稱和地址必須使用URL編碼，確保特殊字符(如空格)被正確轉換
4. 連結必須指向真實存在的位置，可通過Google搜索確認
5. 如果餐廳有官方登記的Google地圖位置，優先使用該精確連結`;
    
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