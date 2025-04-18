import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;


if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

// 使用支援 Function Calling 和 Google Search 功能的模型
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.9,
  },
  tools: [{
    googleSearch: {}  // 啟用 Google Search 作為工具
  }],
  // 可選：配置 Google Search 的行為
  toolConfig: {
    functionCallingConfig: {
      mode: "AUTO" // AUTO 模式讓模型自動決定何時使用 Google Search
    }
  }
});

export { genAI, model };
