/**
 * 分析投票數據，提取關鍵統計和偏好
 * @param {Array} votes - 投票數據陣列
 * @returns {Object} 分析結果
 */
export const analyzeVotes = (votes) => {
  if (!votes || votes.length === 0) {
    return { error: '無投票數據' };
  }
  
  // 初始化統計數據
  const foodTypeCount = {};
  const spiceLevels = [];
  const sweetLevels = [];
  let totalBudget = 0;
  const comments = [];
  
  // 遍歷並處理每個投票
  votes.forEach(vote => {
    // 計算食物類型偏好
    if (vote.foodType) {
      foodTypeCount[vote.foodType] = (foodTypeCount[vote.foodType] || 0) + 1;
    }
    
    // 收集調味偏好
    if (typeof vote.spiciness === 'number') {
      spiceLevels.push(vote.spiciness);
    }
    
    if (typeof vote.sweetness === 'number') {
      sweetLevels.push(vote.sweetness);
    }
    
    // 計算預算
    if (typeof vote.budget === 'number' || !isNaN(Number(vote.budget))) {
      totalBudget += Number(vote.budget);
    }
    
    // 收集評論
    if (vote.comments && vote.comments.trim()) {
      comments.push(vote.comments);
    }
  });
  
  // 計算平均值和排名
  const averageBudget = Math.round(totalBudget / votes.length);
  const averageSpiciness = spiceLevels.length > 0 
    ? Math.round((spiceLevels.reduce((sum, level) => sum + level, 0) / spiceLevels.length) * 10) / 10
    : 0;
  const averageSweetness = sweetLevels.length > 0 
    ? Math.round((sweetLevels.reduce((sum, level) => sum + level, 0) / sweetLevels.length) * 10) / 10
    : 0;
  
  // 找出最受歡迎的食物類型
  const sortedFoodTypes = Object.entries(foodTypeCount)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ 
      type, 
      count,
      percentage: Math.round((count / votes.length) * 100)
    }));
  
  // 整理並返回分析結果
  return {
    participantCount: votes.length,
    topFoodTypes: sortedFoodTypes.slice(0, 3),
    mostPopularFoodType: sortedFoodTypes[0]?.type || null,
    averageBudget,
    flavorPreferences: {
      spiciness: averageSpiciness,
      sweetness: averageSweetness
    },
    budgetDistribution: {
      min: Math.min(...votes.map(v => Number(v.budget) || 0)),
      max: Math.max(...votes.map(v => Number(v.budget) || 0)),
      average: averageBudget
    },
    comments: comments.length > 0 ? comments : null
  };
};

/**
 * 生成投票數據的摘要文本
 * @param {Object} analysis - 分析結果對象
 * @returns {String} 摘要文本
 */
export const generateVoteSummary = (analysis) => {
  if (analysis.error) {
    return analysis.error;
  }
  
  const { participantCount, mostPopularFoodType, averageBudget, flavorPreferences } = analysis;
  
  return `根據${participantCount}位參與者的投票，最受歡迎的餐廳類型是${mostPopularFoodType}，平均預算為${averageBudget}元。` +
    `整體口味偏好：辣度${flavorPreferences.spiciness}/5，甜度${flavorPreferences.sweetness}/5。`;
}; 