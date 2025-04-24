// 測試平衡推薦功能
import fs from 'fs';
import path from 'path';
import voteAnalysisService from '../src/services/voteAnalysisService.js';
import promptService from '../src/services/promptService.js';

// 載入測試數據
const testDataPath = path.join(process.cwd(), 'test-data', 'divergent-preferences.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

// 模擬投票分析流程
function testBalancedRecommendations() {
  console.log('======= 開始測試平衡推薦功能 =======');
  
  try {
    // 1. 分析投票數據
    console.log('1. 分析投票數據...');
    const { analysis, summary } = voteAnalysisService.analyzeVotingData(testData.votes);
    console.log('投票分析結果摘要:', summary);
    console.log('topFoodTypes:', JSON.stringify(analysis.topFoodTypes, null, 2));
    
    // 2. 提取關鍵偏好
    console.log('\n2. 提取關鍵偏好...');
    const preferences = voteAnalysisService.extractKeyPreferences(analysis);
    console.log('偵測到的偏好結構:', JSON.stringify(preferences, null, 2));
    
    // 檢查是否正確識別了偏好分歧
    if (preferences.dominantPreferences && preferences.dominantPreferences.length > 1) {
      console.log('✅ 成功識別投票分歧!');
      console.log(`發現 ${preferences.dominantPreferences.length} 個主要偏好:`);
      preferences.dominantPreferences.forEach(pref => {
        console.log(`- ${pref.type} (重要性: ${pref.score})`);
      });
    } else {
      console.log('❌ 未能識別投票分歧');
      console.log('提取的偏好:', preferences);
    }
    
    // 3. A. 構建帶有偏好分歧的提示詞
    console.log('\n3A. 構建提示詞 (新版，帶偏好分歧)...');
    const prompt = promptService.buildRestaurantRecommendationPrompt(preferences, testData.options);
    
    // 輸出提示詞的關鍵部分
    const dataSummaryStart = prompt.indexOf('# 關鍵偏好');
    const dataSummaryEnd = prompt.indexOf('# 輸出要求');
    const dataSummary = prompt.substring(dataSummaryStart, dataSummaryEnd).trim();
    console.log('提示詞中的關鍵偏好部分:\n', dataSummary);
    
    // 檢查提示詞中是否包含平衡指示
    if (prompt.includes('**重要平衡指示**')) {
      console.log('✅ 提示詞包含平衡指示');
    } else {
      console.log('❌ 提示詞中缺少平衡指示');
    }
    
    // 3. B. 構建不帶偏好分歧的提示詞 (模擬舊版行為)
    console.log('\n3B. 構建提示詞 (舊版，無偏好分歧)...');
    const oldPreferences = {
      ...preferences,
      primaryFoodType: preferences.dominantPreferences ? preferences.dominantPreferences[0].type : null,
      dominantPreferences: null
    };
    const oldPrompt = promptService.buildRestaurantRecommendationPrompt(oldPreferences, testData.options);
    
    // 輸出提示詞的關鍵部分
    const oldDataSummaryStart = oldPrompt.indexOf('# 關鍵偏好');
    const oldDataSummaryEnd = oldPrompt.indexOf('# 輸出要求');
    const oldDataSummary = oldPrompt.substring(oldDataSummaryStart, oldDataSummaryEnd).trim();
    console.log('舊版提示詞中的關鍵偏好部分:\n', oldDataSummary);
    
    // 4. 總結差異
    console.log('\n4. 新舊版本提示詞差異分析:');
    console.log('- 新版提示詞是否標示多個偏好:', prompt.includes('主要偏好分歧') ? '是' : '否');
    console.log('- 新版提示詞是否包含平衡指示:', prompt.includes('重要平衡指示') ? '是' : '否');
    console.log('- 舊版提示詞是否標示多個偏好:', oldPrompt.includes('主要偏好分歧') ? '是' : '否');
    console.log('- 舊版提示詞是否包含平衡指示:', oldPrompt.includes('重要平衡指示') ? '是' : '否');
    
    console.log('\n======= 測試完成 =======');
  } catch (error) {
    console.error('測試過程中出現錯誤:', error);
  }
}

// 執行測試
testBalancedRecommendations(); 