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

請嚴格按照以下步驟獲取每家餐廳的信息：

1. 營業狀態確認（必須最優先檢查）：
   - 使用以下關鍵詞組合進行搜索：
     * "[餐廳名稱] 營業時間"
     * "[餐廳名稱] 最新評價"
     * "[餐廳名稱] 近期評論"
   - 營業狀態確認要求：
     * 必須確認餐廳目前仍在營業中
     * 檢查最近一個月內是否有新評論或打卡
     * 如發現任何"已歇業"、"永久歇業"、"結束營業"等信息，立即排除該餐廳
     * 如無法確認營業狀態，應選擇其他餐廳推薦

2. 基本信息搜索：
   - 使用"[地區] [餐廳類型] 推薦"進行初步搜索
   - 例如："台北市松山區 日式料理 推薦"
   - 從搜索結果中選擇符合條件的餐廳

3. 地址和地圖確認：
   - 使用"[餐廳名稱] 地址"精確搜索
   - 記錄完整地址（必須包含：城市、區域、街道、門牌號）
   - 使用"[餐廳名稱] Google地圖"獲取地圖連結
   - 確保地圖連結格式為：https://maps.google.com/?q=餐廳名稱+地址

4. 照片搜索（必須執行）：
   - 使用Google圖片搜索以下關鍵詞組合：
     * "[餐廳名稱]" - 先用餐廳名稱進行基本搜索
     * "[餐廳名稱] 料理" - 搜索餐點照片
     * "[餐廳名稱] 餐廳" - 搜索店面照片
     * "[餐廳名稱] 美食" - 搜索更多相關照片
   - 照片搜索技巧：
     * 使用餐廳的完整名稱，包含分店名（如果有）
     * 可以加上地區名稱提高準確性（例如：台北 OO餐廳）
     * 使用引號 "餐廳名稱" 進行精確匹配
   - 照片來源優先順序：
     1. 餐廳官方網站的照片
     2. 美食部落格的原創照片
     3. 美食評論網站的照片（如愛食記、痞客邦）
     4. 其他用戶分享的高質量照片
   - 禁止使用的照片：
     * Google地圖的照片
     * 社群媒體平台的內嵌照片（如 Facebook、Instagram 內嵌）
     * 需要登入才能查看的照片
     * 低解析度或模糊的照片
     * 有明顯浮水印的照片
     * 非餐廳實景或餐點的照片
   - 照片URL要求：
     * 必須以 http:// 或 https:// 開頭
     * 必須以 .jpg、.jpeg、.png 或 .webp 結尾
     * 必須是直接可訪問的圖片連結
     * 不接受短網址或重定向連結
   - 照片內容要求：
     * 優先選擇餐廳招牌菜的清晰照片
     * 其次是餐廳內部環境或外觀照片
     * 照片應該能清楚展現餐點賣相或餐廳特色
     * 照片必須是真實的餐廳照片，不要使用示意圖
   - 照片搜索步驟：
     1. 先用餐廳名稱在 Google 圖片搜索
     2. 檢查搜索結果是否確實為目標餐廳的照片
     3. 點擊照片查看原始大圖
     4. 確認圖片URL符合格式要求
     5. 如果找不到合適照片，嘗試其他關鍵詞組合
     6. 如果多次嘗試都找不到合適照片，考慮推薦其他餐廳

5. 評分和評論搜索：
   - 使用以下關鍵詞組合搜索評分：
     * "[餐廳名稱] 評分"
     * "[餐廳名稱] 評價"
     * "[餐廳名稱] Google評分"
   - 評分來源優先順序：
     1. Google評分（例如：4.5/5.0）
     2. 美食評論網站評分
     3. 部落客綜合評分
   - 評分格式要求：
     * 必須包含分數（例如：4.5）
     * 必須包含滿分基準（例如：滿分5分）
     * 必須註明評分來源
     * 例如："4.5/5.0 (Google評分，500+則評價)"
   - 如果找到多個評分，選擇最具代表性且評價數量最多的

6. 額外信息收集：
   - 搜索並記錄營業時間
   - 整理推薦菜品清單
   - 收集用戶評價重點
   - 記錄價格範圍

每家推薦的餐廳都必須提供完整的地址、有效的Google地圖連結、符合格式要求的照片URL和評分信息。缺少任何一項信息或格式不符合要求，都應該選擇其他餐廳推薦。特別注意：照片必須來自Google圖片搜索結果，不要使用Google地圖的照片。`;
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
    summary += `\n\n請特別注意：你必須在「${location}」周邊地區推薦真實存在的餐廳。使用你內建的Google搜索功能，以"${location} ${primaryFoodType || '餐廳'} 推薦"或類似的搜索詞來尋找符合條件的實際餐廳。確保搜索最新的餐廳信息，包括地址、評分、營業時間和菜單特色。

同時，對於每家推薦的餐廳，請務必搜索並提供餐廳或其招牌菜品的照片連結。你可以使用"餐廳名稱 + 照片"或"餐廳名稱 + 招牌菜"等關鍵詞進行搜索，找到適合的照片URL。視覺信息對用戶選擇餐廳非常重要。`;
    
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
在開始生成推薦之前，請確保已按照系統提示中的步驟，為每家餐廳從Google圖片搜索獲取符合格式要求的照片URL，並收集完整的評分信息。切勿使用Google地圖的照片。

請推薦${maxResults}家最適合這群人的餐廳，並以JSON格式輸出，包含以下字段：
\`\`\`json
[
  {
    "name": "餐廳名稱",
    "type": "餐廳類型",
    "address": "完整地址（必須包含城市、區域、街道、門牌號）",
    "mapUrl": "Google地圖連結，格式為 https://maps.google.com/?q=餐廳名稱+地址",
    "photoUrl": "從Google圖片搜索獲取的餐廳照片URL（必須以http://或https://開頭，以.jpg、.jpeg、.png或.webp結尾）",
    "priceRange": "價格範圍",
    "rating": {
      "score": "評分（例如：4.5）",
      "outOf": "滿分（例如：5.0）",
      "source": "評分來源（例如：Google評分）",
      "count": "評價數量（例如：500+）"
    }"`;
    
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

輸出要求：
1. 所有餐廳必須位於指定地點的周邊區域
2. 所有信息必須基於Google搜索結果，確保真實存在
3. 地址必須完整，包含所有必要部分
4. 每家餐廳必須提供有效的Google地圖連結
5. 照片要求：
   - 必須從Google圖片搜索獲取，不使用Google地圖照片
   - URL必須以 http:// 或 https:// 開頭
   - URL必須以 .jpg、.jpeg、.png 或 .webp 結尾
   - 必須是可直接訪問的完整URL
   - 不接受需要登入或授權的連結
   - 優先使用展示招牌菜或餐廳環境的清晰照片
6. 評分要求：
   - score：必須是數字格式（例如：4.5）
   - outOf：必須指明滿分基準（例如：5.0）
   - source：必須註明評分來源
   - count：必須提供評價數量（如無法獲取精確數字，可使用約略值如 500+）
7. 如果無法找到符合要求的照片URL或評分信息，應該選擇其他餐廳推薦
8. 所有URL必須是完整且可直接訪問的連結`;
    
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