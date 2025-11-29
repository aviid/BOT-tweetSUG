require('dotenv').config();

module.exports = {
  // Free alternatives - No API keys needed for basic functionality
  newsApi: {
    // Free tier available - 100 requests/day
    apiKey: process.env.NEWS_API_KEY || 'free_tier'
  },
  
  // DeepSeek API (has free tier)
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1'
  },
  
  // Telegram Bot (free)
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  },
  
  // Categories to monitor
  categories: ['entertainment', 'gossip', 'politics'],
  
  // Free data sources
  dataSources: {
    googleTrends: 'https://trends.google.com/trending?geo=US',
    reddit: 'https://www.reddit.com/r/trending.json',
    news: 'https://newsapi.org/v2/top-headlines?country=us&apiKey='
  }
};