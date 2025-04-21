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
export const getRoomData = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      return { id: roomSnap.id, ...roomSnap.data() };
    } else {
      console.log(`Room ID ${roomId} not found`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching room data:', error);
    throw error;
  }
};

/**
 * 向房間數據中添加新字段或更新現有字段
 * @param {string} roomId - 房間ID
 * @param {Object} newData - 要添加/更新的數據
 * @returns {Promise<boolean>} - 操作是否成功
 */
export const updateRoomData = async (roomId, newData) => {
  try {
    // 確保房間存在
    const roomExists = await getRoomData(roomId);
    if (!roomExists) {
      console.error(`Cannot update non-existent room: ${roomId}`);
      return false;
    }
    
    // 清理數據，移除 undefined 值（Firebase 不支持）
    const cleanedData = removeUndefinedValues(newData);
    
    // 添加更新時間戳
    const dataToUpdate = {
      ...cleanedData,
      updatedAt: serverTimestamp()
    };
    
    // 更新文檔
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, dataToUpdate);
    console.log(`Successfully updated room ${roomId}`);
    return true;
  } catch (error) {
    console.error('Error updating room data:', error);
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
