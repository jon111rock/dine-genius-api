import axios from 'axios';

/**
 * Places 服務 - 封裝與 Google Places API (New) 的互動邏輯
 */
class PlacesService {
  /**
   * 初始化服務
   */
  constructor() {
    // 使用環境變數中的 API 金鑰
    this.apiKey = process.env.VITE_FIREBASE_API_KEY;
    this.baseUrl = 'https://places.googleapis.com/v1';
    
    // 設置默認照片寬度
    this.defaultPhotoWidth = 400;
    
    // 設置默認語言
    this.language = 'zh-TW';
  }
  
  /**
   * 根據餐廳名稱和位置搜尋地點詳情
   * @param {String} name - 餐廳名稱
   * @param {String} locationContext - 位置上下文 (例如 "台北市")
   * @returns {Promise<Object|null>} 地點詳情或 null
   */
  async findPlaceDetails(name, locationContext = '') {
    try {
      console.log(`開始搜尋餐廳: ${name} ${locationContext ? `在 ${locationContext}` : ''}`);
      
      // 構建搜尋查詢
      const query = locationContext ? `${name} ${locationContext}` : name;
      
      // 設置請求配置
      const config = {
        method: 'post',
        url: `${this.baseUrl}/places:searchText`,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.photos,places.googleMapsUri'
        },
        data: {
          textQuery: query,
          languageCode: this.language
        }
      };
      
      // 發送請求
      const response = await axios(config);
      
      // 處理回應
      if (response.data && response.data.places && response.data.places.length > 0) {
        const place = response.data.places[0];
        
        // 構建結果對象
        const result = {
          id: place.id,
          displayName: place.displayName?.text || name,
          formattedAddress: place.formattedAddress || '',
          googleMapsUri: place.googleMapsUri || null,
          photoUrl: null
        };
        
        // 處理照片
        if (place.photos && place.photos.length > 0) {
          const photoReference = place.photos[0].name;
          result.photoUrl = this.buildPhotoUrl(photoReference);
        }
        
        console.log(`找到餐廳 "${name}" 的位置: ${result.displayName}`);
        return result;
      }
      
      console.log(`未找到餐廳 "${name}" 的位置信息`);
      return null;
    } catch (error) {
      console.error(`搜尋餐廳 "${name}" 失敗:`, error.message);
      if (error.response) {
        console.error('API 回應狀態:', error.response.status);
        console.error('API 回應數據:', JSON.stringify(error.response.data));
      }
      return null;
    }
  }
  
  /**
   * 根據照片參考構建照片 URL
   * @param {String} photoReference - 照片參考
   * @returns {String} 完整照片 URL
   */
  buildPhotoUrl(photoReference) {
    if (!photoReference) return null;
    
    return `${this.baseUrl}/${photoReference}/media?key=${this.apiKey}&maxWidthPx=${this.defaultPhotoWidth}`;
  }
  
  /**
   * 批量獲取多個餐廳的地點詳情
   * @param {Array<{name: string}>} restaurants - 餐廳對象數組
   * @param {String} locationContext - 位置上下文
   * @returns {Promise<Array>} 地點詳情數組
   */
  async findMultiplePlaceDetails(restaurants, locationContext = '') {
    if (!restaurants || !Array.isArray(restaurants) || restaurants.length === 0) {
      console.warn('未提供有效的餐廳列表');
      return [];
    }
    
    try {
      // 使用 Promise.allSettled 而非 Promise.all 以避免單一失敗影響整體
      const placesPromises = restaurants.map(restaurant => 
        this.findPlaceDetails(restaurant.name, locationContext)
      );
      
      const results = await Promise.allSettled(placesPromises);
      
      // 處理結果
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value; // 成功的結果
        } else {
          console.warn(`獲取餐廳 "${restaurants[index].name}" 的地點詳情失敗:`, result.reason);
          return null; // 失敗返回 null
        }
      });
    } catch (error) {
      console.error('批量獲取地點詳情失敗:', error);
      return restaurants.map(() => null); // 全部失敗返回 null 陣列
    }
  }
}

export default new PlacesService(); 