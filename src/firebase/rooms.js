import { db } from './index.js';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';

/**
 * 根據房間ID獲取房間數據
 * @param {string} roomId - 房間ID
 * @returns {Promise<Object|null>} - 返回房間數據或null（如果不存在）
 */
export async function getRoomData(roomId) {
  try {
    console.log(`嘗試獲取房間數據，ID: ${roomId}`);
    
    if (!roomId) {
      console.error('獲取房間數據失敗：未提供roomId');
      return null;
    }
    
    // 使用 Admin SDK 的 Firestore 語法
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    
    if (!roomDoc.exists) {
      console.log(`房間不存在，ID: ${roomId}`);
      return null;
    }
    
    const roomData = roomDoc.data();
    console.log(`成功獲取房間數據，ID: ${roomId}`);
    return roomData;
  } catch (error) {
    console.error(`獲取房間數據失敗，ID: ${roomId}，錯誤:`, error);
    throw error;
  }
}

/**
 * 向房間數據中添加新字段或更新現有字段
 * @param {string} roomId - 房間ID
 * @param {Object} newData - 要添加/更新的數據
 * @returns {Promise<boolean>} - 操作是否成功
 */
export const updateRoomData = async (roomId, newData) => {
  try {
    console.log(`嘗試更新房間數據，房間ID: ${roomId}`);
    
    if(!roomId){
      throw new Error('房間ID不能為空');
    }


    // 清理數據，移除 undefined 值（Firebase 不支持）
    const cleanedData = removeUndefinedValues(newData);
    
    // 添加更新時間戳
    const dataToUpdate = {
      ...cleanedData,
      updatedAt: serverTimestamp()
    };
    
    // 更新文檔
    await db.collection('rooms').doc(roomId).update(cleanedData);
    console.log(`成功更新房間數據，房間ID: ${roomId}`);
    
    return true;
  } catch (error) {
    console.error(`更新房間數據失敗，房間ID: ${roomId}，錯誤:`, error);
    // 輸出錯誤詳情以便調試
    if (error.code) {
      console.error(`錯誤代碼: ${error.code}`);
    }
    if (error.message) {
      console.error(`錯誤信息: ${error.message}`);
    }
    throw error;
  }
};

/**
 * 遞歸移除物件中的 undefined 值，Firebase 不支持存儲 undefined
 * @param {Object} obj - 要清理的物件
 * @returns {Object} - 清理後的物件
 */
const removeUndefinedValues = (obj) => {
  // 如果不是物件或是 null，直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 如果是陣列，遞歸處理每個元素
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item));
  }
  
  // 處理一般物件
  const cleaned = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      // 跳過 undefined 值
      if (value === undefined) {
        continue;
      }
      
      // 遞歸處理巢狀物件或陣列
      if (typeof value === 'object' && value !== null) {
        cleaned[key] = removeUndefinedValues(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
};
