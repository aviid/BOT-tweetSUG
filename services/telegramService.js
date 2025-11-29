const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/keys');

class TelegramService {
  constructor() {
    this.bot = new TelegramBot(config.telegram.botToken, { polling: false });
    this.chatId = config.telegram.chatId;
  }

  async sendTweetSuggestion(tweetSuggestion, postLink, topic, source) {
    try {
      const message = `
🚀 **TRENDING SUGGESTION** 🚀

📊 **Topic:** ${topic}
📡 **Source:** ${source}

💡 **Tweet Suggestion:**
${tweetSuggestion}

🔗 **Engage Here:**
${postLink}

⏰ _Generated: ${new Date().toLocaleString()}_
      `;

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });
      
      console.log('Suggestion sent to Telegram successfully');
    } catch (error) {
      console.error('Error sending Telegram message:', error);
    }
  }

  async sendError(errorMessage) {
    try {
      await this.bot.sendMessage(this.chatId, `❌ Bot Error: ${errorMessage}`);
    } catch (error) {
      console.error('Error sending error message to Telegram:', error);
    }
  }
}

module.exports = new TelegramService();