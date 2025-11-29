```markdown
# DeepSeek Tweet Suggester 🤖✨

A secure, AI-powered bot that generates intelligent tweet suggestions using DeepSeek AI and delivers them via Telegram.

## 🚀 Features

- **AI-Powered Suggestions** - Uses DeepSeek AI to generate engaging tweet content
- **Telegram Integration** - Delivers suggestions directly to Telegram
- **Web Scraping** - Gathers trending topics for relevant content
- **Secure by Design** - Built with security best practices
- **Scheduled Automation** - Runs on customizable schedules
- **RESTful API** - Includes Express server with rate limiting and CORS

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/deepseek-tweet-suggester.git
   cd deepseek-tweet-suggester
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   ```env
   DEEPSEEK_API_KEY=your_deepseek_api_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   PORT=3000
   NODE_ENV=production
   ```

## 🛠️ Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Security Checks
```bash
npm run audit
npm run security-check
```

## 🔧 Configuration

The bot uses several key dependencies:

- **Express** - Web server framework
- **Axios** - HTTP requests to DeepSeek API
- **Cheerio** - Web scraping for trends
- **Telegraf** - Telegram bot integration
- **Node-cron** - Scheduling tasks
- **Security** - Helmet, rate limiting, CORS, compression

## 📁 Project Structure

```
deepseek-tweet-suggester/
├── app.js                 # Main application entry point
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create from .env.example)
├── src/
│   ├── services/          # DeepSeek AI and Telegram services
│   ├── scrapers/          # Web scraping utilities
│   ├── schedulers/        # Cron jobs and scheduling
│   └── middleware/        # Security and rate limiting
└── config/               # Configuration files
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - Prevents API abuse
- **CORS** - Cross-origin resource sharing control
- **Compression** - Performance optimization
- **Environment Variables** - Secure credential management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆕 Version 2.0.0 Highlights

- **ES Modules** support with `"type": "module"`
- **Enhanced security** with additional middleware
- **Improved error handling** and reliability
- **Better performance** with compression
- **Updated dependencies** for security and features

---

**Need help?** Check the issues page or create a new issue for support.
```
