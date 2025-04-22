import { model } from '../config/gemini.js';

/**
 * AI服務 - 封裝Gemini API調用邏輯
 */
class AIService {
  /**
   * 設置Gemini API的默認參數
   */
  constructor() {
    this.defaultParams = {
      temperature: 0.2,     // 低溫度，提高確定性
      maxOutputTokens: 800, // 控制回應長度，降低以加快速度
      topK: 40,             // 控制多樣性
      topP: 0.95            // 控制多樣性
    };
    
    // 將超時時間設為8秒，確保不超過Vercel的10秒限制
    this.timeoutMs = parseInt(process.env.API_TIMEOUT) || 8000; // 預設8秒超時
  }
  
  /**
   * 向Gemini API發送提示詞並獲取回應
   * @param {String} prompt - 提示詞文本
   * @param {Object} options - API調用選項
   * @returns {Promise<String>} AI生成的回應文本
   */
  async generateRecommendation(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // 組合API參數
      const params = {
        ...this.defaultParams,
        ...options
      };
      
      // 設置請求超時
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI請求超時')), this.timeoutMs);
      });
      
      // 發送API請求
      const apiPromise = model.generateContent(prompt, params);
      
      // 使用Promise.race實現超時控制
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
      // 處理回應
      if (!response || !response.response) {
        throw new Error('無效的AI回應');
      }
      
      const responseText = response.response.text();
      const processingTime = Date.now() - startTime;
      
      console.log(`AI回應生成完成，耗時: ${processingTime}ms`);
      
      return responseText;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error(`AI回應生成失敗，耗時: ${processingTime}ms`, error);
      
      // 處理不同類型的錯誤
      if (error.message.includes('超時')) {
        throw new Error('AI服務回應超時，請稍後再試');
      } else if (error.message.includes('rate limit')) {
        throw new Error('AI服務暫時受限，請稍後再試');
      } else {
        throw new Error(`AI服務錯誤: ${error.message}`);
      }
    }
  }
  
  /**
   * 實現重試邏輯的AI請求
   * @param {String} prompt - 提示詞文本
   * @param {Number} maxRetries - 最大重試次數
   * @param {Object} options - API調用選項
   * @returns {Promise<String>} AI生成的回應文本
   */
  async generateWithRetry(prompt, maxRetries = 1, options = {}) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 如果不是第一次嘗試，添加提示詞以鼓勵模型生成有效回應
        let currentPrompt = prompt;
        if (attempt > 0) {
          currentPrompt += '\n\n請注意：先前的回應未能正確生成。請確保回應格式完全符合要求，並只輸出JSON數據，不要包含解釋性文字。';
        }
        
        // 嘗試生成回應
        return await this.generateRecommendation(currentPrompt, options);
      } catch (error) {
        lastError = error;
        
        // 如果是最後一次嘗試失敗，則拋出錯誤
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        console.log(`AI請求失敗，進行第${attempt + 1}次重試...`);
        
        // 等待時間縮短，在Vercel環境中不要等待太久
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
}

export default new AIService(); 