const axios = require('axios');
const config = require('../config/keys');

class DeepSeekService {
  constructor() {
    this.apiKey = config.deepseek.apiKey;
    this.baseURL = config.deepseek.baseURL;
  }

  async generateTweetSuggestion(topic, context) {
    try {
      // If DeepSeek API key is not available, use a fallback generator
      if (!this.apiKey || this.apiKey === 'free_tier') {
        return this.fallbackTweetGenerator(topic, context);
      }

      const prompt = `
        Create an engaging tweet about: "${topic}"
        Context: "${context}"
        
        Requirements:
        - Maximum 280 characters
        - Engaging and attention-grabbing
        - Include relevant hashtags
        - Suitable for Twitter audience
        - Return ONLY the tweet text
      `;

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error with DeepSeek API, using fallback:', error.message);
      return this.fallbackTweetGenerator(topic, context);
    }
  }

  fallbackTweetGenerator(topic, context) {
    const templates = [
      `🔥 Hot topic: ${topic}\n\nWhat are your thoughts on this? 💬\n\n#Trending #News`,
      `🚨 Breaking: ${topic}\n\nThis is getting a lot of attention right now! 👀\n\nWhat's your take?`,
      `📊 Trending now: ${topic}\n\nThe internet is buzzing about this! 🐝\n\nJoin the conversation!`,
      `💡 Big discussion: ${topic}\n\nEveryone's talking about this today! 🗣️\n\nWhere do you stand?`,
      `🌟 Hot take: ${topic}\n\nThis story is blowing up! 💥\n\nWhat's your opinion? #HotTopic`
    ];

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Ensure the tweet doesn't exceed 280 characters
    let tweet = randomTemplate.replace('${topic}', topic.substring(0, 100));
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + '...';
    }
    
    return tweet;
  }
}

module.exports = new DeepSeekService();