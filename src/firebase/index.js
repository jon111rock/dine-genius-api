import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 記錄環境變量的存在性，不記錄實際值以保護敏感信息
console.log('Firebase配置檢查:', {
  apiKey: process.env.VITE_FIREBASE_API_KEY ? '已設定' : '未設定',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ? '已設定' : '未設定',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ? '已設定' : '未設定',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ? '已設定' : '未設定',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '已設定' : '未設定',
  appId: process.env.VITE_FIREBASE_APP_ID ? '已設定' : '未設定',
});

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

let db;
let auth;

try {
  // 初始化 Firebase
  console.log('嘗試初始化Firebase...');
  const app = initializeApp(firebaseConfig);
  console.log('Firebase初始化成功');

  // 初始化 Firestore
  console.log('嘗試初始化Firestore...');
  db = getFirestore(app);
  console.log('Firestore初始化成功');

  // 初始化 Auth
  console.log('嘗試初始化Auth...');
  auth = getAuth(app);
  console.log('Auth初始化成功');
} catch (error) {
  console.error('Firebase初始化失敗:', error);
  throw error;
}

export { db, auth };
