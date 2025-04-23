import admin from 'firebase-admin';

let firebaseApp;

// 初始化 Firebase Admin SDK
try {
  console.log('嘗試初始化 Firebase Admin SDK...');
  
  // 檢查是否已初始化
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('缺少 FIREBASE_SERVICE_ACCOUNT 環境變數');
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.VITE_FIREBASE_PROJECT_ID || serviceAccount.project_id}.firebaseio.com`
  });
} catch (error) {
  console.error('Firebase Admin SDK 初始化失敗:', error);
  throw error;
}

// 獲取 Firestore 實例
const db = admin.firestore();
console.log('Firestore 實例創建成功');

// 獲取 Auth 實例
const auth = admin.auth();
console.log('Auth 實例創建成功');

// 導出所需的服務
export { admin, db, auth, firebaseApp };

