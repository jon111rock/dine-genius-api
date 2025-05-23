/**
 * 建立成功的API回應格式
 * @param {Object} data - 回應數據
 * @param {Object} meta - 元數據
 * @returns {Object} 格式化的回應
 */
export const createSuccessResponse = (data, meta = {}) => {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
};

/**
 * 建立錯誤的API回應格式
 * @param {String} message - 錯誤訊息
 * @param {Number} statusCode - HTTP狀態碼
 * @param {Array} details - 詳細錯誤信息
 * @returns {Object} 格式化的錯誤回應
 */
export const createErrorResponse = (message, statusCode = 500, details = null) => {
  return {
    success: false,
    error: {
      message,
      statusCode,
      details: details || undefined
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * 解析並格式化AI推薦回應
 * @param {String} aiResponseText - 來自AI的原始回應文本
 * @param {Object} analysisStats - 投票分析統計
 * @param {Number} startTime - 處理開始時間戳 (毫秒)
 * @returns {Object} 格式化後的推薦數據
 */
export const formatAIResponse = (aiResponseText, analysisStats, startTime) => {
  try {
    // 嘗試解析JSON回應
    let recommendations = [];
    
    try {
      // 優先嘗試直接解析JSON
      const jsonMatch = aiResponseText.match(/```json([\s\S]*?)```/) || 
                        aiResponseText.match(/```([\s\S]*?)```/) ||
                        [null, aiResponseText];
      
      const jsonText = jsonMatch[1].trim();
      recommendations = JSON.parse(jsonText);
      
      // 確保返回的是陣列
      if (!Array.isArray(recommendations)) {
        if (recommendations.recommendations && Array.isArray(recommendations.recommendations)) {
          recommendations = recommendations.recommendations;
        } else {
          throw new Error('AI回應格式不正確');
        }
      }
    } catch (jsonError) {
      // JSON解析失敗，嘗試從文本中提取
      recommendations = parseRecommendationsFromText(aiResponseText);
    }
    
    // 確保每個推薦都有必要的字段
    recommendations = recommendations.map(ensureRecommendationFormat);
    
    // 計算處理時間
    const processingTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    
    // 返回格式化後的回應
    return createSuccessResponse({
      recommendations,
      analysisStats
    }, {
      processingTime,
      aiModel: "gemini-1.5-flash"
    });
  } catch (error) {
    console.error('解析AI回應失敗:', error);
    throw new Error('無法解析AI推薦結果: ' + error.message);
  }
};

/**
 * 從文本中提取推薦
 * @param {String} text - AI回應文本
 * @returns {Array} 提取的推薦陣列
 */
const parseRecommendationsFromText = (text) => {
  const recommendations = [];
  
  // 尋找推薦餐廳的模式
  const restaurantPattern = /(?:推薦|建議)(?:\s*\d+\s*[:：.])?\s*([^,，.。\n]+)/g;
  let match;
  
  while ((match = restaurantPattern.exec(text)) !== null) {
    // 提取餐廳名稱
    const name = match[1].trim();
    
    // 嘗試提取這個餐廳周圍的信息
    const context = text.substring(
      Math.max(0, match.index - 100),
      Math.min(text.length, match.index + 200)
    );
    
    // 嘗試提取類型
    let type = null;
    const typeMatch = context.match(/類型[:：]?\s*([^,，.。\n]+)/);
    if (typeMatch) type = typeMatch[1].trim();
    
    // 嘗試提取價格範圍
    let priceRange = null;
    const priceMatch = context.match(/價格[:：]?\s*([^,，.。\n]+)/) || 
                       context.match(/預算[:：]?\s*([^,，.。\n]+)/);
    if (priceMatch) priceRange = priceMatch[1].trim();
    
    // 嘗試提取地址
    let address = null;
    const addressMatch = context.match(/地址[:：]?\s*([^,，.。\n]+)/) ||
                          context.match(/位於[:：]?\s*([^,，.。\n]+)/) ||
                          context.match(/位置[:：]?\s*([^,，.。\n]+)/);
    if (addressMatch) address = addressMatch[1].trim();
    
    // 嘗試提取 Google 地圖連結
    let mapUrl = null;
    const mapMatch = context.match(/地圖[:：]?\s*(https:\/\/maps\.google\.com\/\?q=[^\s]+)/) ||
                      context.match(/(https:\/\/maps\.google\.com\/\?q=[^\s]+)/) ||
                      context.match(/(https:\/\/maps\.google\.com[^\s]+)/);
    if (mapMatch) mapUrl = mapMatch[1].trim();
    
    // 嘗試提取照片連結
    let photoUrl = null;
    const photoMatch = context.match(/照片[:：]?\s*(https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)[^\s]*)/) ||
                       context.match(/圖片[:：]?\s*(https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)[^\s]*)/) ||
                       context.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)[^\s]*)/);
    if (photoMatch) photoUrl = photoMatch[1].trim();
    
    // 提取理由（如果有）
    const reasons = [];
    const reasonPattern = /(?:因為|原因|理由)[:：]?\s*([^,，.。\n]+)/g;
    let reasonMatch;
    while ((reasonMatch = reasonPattern.exec(context)) !== null) {
      reasons.push(reasonMatch[1].trim());
    }
    
    // 提取推薦菜品（如果有）
    const dishes = [];
    const dishPattern = /(?:推薦菜品|招牌菜|特色菜)[:：]?\s*([^,，.。\n]+)/g;
    let dishMatch;
    while ((dishMatch = dishPattern.exec(context)) !== null) {
      dishes.push(dishMatch[1].trim());
    }
    
    // 添加到推薦列表
    recommendations.push({
      name,
      type: type || "未指定",
      address: address || "詳細地址未提供",
      mapUrl: mapUrl || null,
      photoUrl: photoUrl || null,
      priceRange: priceRange || "未指定",
      reasons: reasons.length > 0 ? reasons : [],
      dishes: dishes.length > 0 ? dishes : []
    });
  }
  
  return recommendations.length > 0 ? recommendations : 
         [{ 
            name: "解析失敗，請查看原始回應", 
            type: "未知", 
            address: "詳細地址未提供", 
            mapUrl: null,
            photoUrl: null,
            priceRange: "未知",
            reasons: [],
            dishes: []
          }];
};

/**
 * 確保推薦格式的一致性
 * @param {Object} recommendation - 推薦對象
 * @returns {Object} 格式統一的推薦
 */
const ensureRecommendationFormat = (recommendation) => {
  // 獲取餐廳名稱和地址
  const name = recommendation.name || recommendation.restaurantName || "未命名餐廳";
  const address = recommendation.address || recommendation.location || "詳細地址未提供";
  
  // 生成 Google 地圖連結（如果沒有提供）
  let mapUrl = recommendation.mapUrl || recommendation.googleMapUrl || recommendation.mapLink;
  if (!mapUrl && address !== "詳細地址未提供") {
    // 使用餐廳名稱和地址創建 Google 地圖連結
    const encodedQuery = encodeURIComponent(`${name} ${address}`);
    mapUrl = `https://maps.google.com/?q=${encodedQuery}`;
  }
  
  // 檢查照片URL是否有效
  let photoUrl = recommendation.photoUrl || recommendation.image || recommendation.imageUrl || recommendation.picture;
  // 確保圖片URL有效（簡單檢查是否為URL格式）
  if (photoUrl) {
    if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp)/i.test(photoUrl)) {
      // 如果不是典型的圖片URL，可能不是直接的圖片連結
      photoUrl = null;
    }
  } else {
    photoUrl = null; // 確保未提供時設為 null 而不是 undefined
  }
  
  // 處理評分信息
  let rating = null;
  if (recommendation.rating) {
    if (typeof recommendation.rating === 'object') {
      // 如果已經是對象格式，確保所有必要字段都存在
      rating = {
        score: recommendation.rating.score || 0,
        outOf: recommendation.rating.outOf || 5.0,
        source: recommendation.rating.source || "未知來源",
        count: recommendation.rating.count || "0"
      };
    } else {
      // 如果是字符串或數字，轉換為標準格式
      const ratingValue = parseFloat(recommendation.rating) || 0;
      rating = {
        score: ratingValue,
        outOf: 5.0,
        source: "未知來源",
        count: "0"
      };
    }
  }
  
  return {
    name: name,
    type: recommendation.type || recommendation.cuisine || recommendation.foodType || "未指定",
    address: address,
    mapUrl: mapUrl || null, // 使用 null 代替 undefined
    photoUrl: photoUrl, // 已確保為有效值或 null
    priceRange: recommendation.priceRange || recommendation.price || recommendation.budget || "未指定",
    rating: rating, // 新增評分字段
    reasons: recommendation.reasons || recommendation.reasonsForRecommendation || [],
    dishes: recommendation.dishes || recommendation.recommendedDishes || []
  };
}; 