```markdown
# DeepSeek Tweet Suggester 🤖✨

A secure AI-powered bot that generates tweet suggestions using DeepSeek AI and delivers them via Telegram.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- DeepSeek API Key
- Telegram Bot Token

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials.

3. **Run the bot**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
├── app.js                 # Main application
├── package.json           # Dependencies
├── config/               # Configuration files
├── jobs/                 # Scheduled tasks
├── services/             # Core services
└── .gitignore           # Git ignore rules
```

## 🛠️ Usage

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Security Audit:**
```bash
npm run audit
npm run security-check
```

## ⚙️ Configuration

Create `.env` file:
```env
DEEPSEEK_API_KEY=your_key_here
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
PORT=3000
```

## 🔧 Features

- 🤖 DeepSeek AI integration
- 📱 Telegram notifications  
- ⏰ Scheduled tweet generation
- 🔒 Security middleware
- 🌐 Web scraping capabilities

## 📄 License

MIT License - see package.json for details
