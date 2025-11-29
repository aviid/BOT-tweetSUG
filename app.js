import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cors from 'cors';
import { Telegraf } from 'telegraf';
import cron from 'node-cron';
import axios from 'axios';
import * as cheerio from 'cheerio';

class PureAITweetBot {
    constructor() {
        this.app = express();
        this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        this.subscribedUsers = new Set();
        this.setupServer();
        this.setupBot();
        this.startScheduler();
    }

    // Helper function to escape Markdown characters
    escapeMarkdown(text) {
        return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
    }

    // Safe Markdown message sender
    async sendSafeMarkdown(ctx, text, extra = {}) {
        try {
            const escapedText = this.escapeMarkdown(text);
            return await ctx.reply(escapedText, { 
                parse_mode: 'Markdown',
                ...extra 
            });
        } catch (error) {
            console.log('Markdown failed, sending as plain text');
            return await ctx.reply(text, { 
                parse_mode: null,
                ...extra 
            });
        }
    }

    setupServer() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            },
            crossOriginEmbedderPolicy: false
        }));

        this.app.use(cors());
        this.app.use(compression());
        this.app.use(express.json({ limit: '10kb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use(limiter);

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'success',
                message: 'Pure AI Tweet Bot is running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                ai: process.env.DEEPSEEK_API_KEY ? 'enabled' : 'disabled',
                subscribers: this.subscribedUsers.size
            });
        });

        // Error handling middleware
        this.app.use((err, req, res, next) => {
            console.error('Server Error:', err);
            res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        });

        this.app.use('*', (req, res) => {
            res.status(404).json({
                status: 'error',
                message: 'Route not found'
            });
        });
    }

    setupBot() {
        // Start command
        this.bot.start((ctx) => {
            const welcomeMessage = `*Pure AI Tweet Generator* 

Powered by AI only - no templates, just pure AI creativity!

*Available Commands:*
/trending - Get current trending topics
/tweet - Generate AI-powered tweets
/subscribe - Get daily AI tweets
/unsubscribe - Stop daily tweets
/help - Show help message

*100% AI - No templates used*`;
            
            this.sendSafeMarkdown(ctx, welcomeMessage);
        });

        // Help command
        this.bot.help((ctx) => {
            const helpMessage = `*Pure AI Bot*

/trending - Get trending topics
/tweet - Generate creative tweets using AI
/subscribe - Daily AI tweets at 9 AM
/unsubscribe - Stop daily tweets

*Powered 100% by AI* - No fallbacks, no templates!`;
            
            this.sendSafeMarkdown(ctx, helpMessage);
        });

        // Trending topics command
        this.bot.command('trending', async (ctx) => {
            try {
                await ctx.reply('🔍 Fetching trending topics...');
                const trends = await this.fetchTrendingTopics();
                
                if (trends.length === 0) {
                    return ctx.reply('❌ Unable to fetch trends at the moment.');
                }

                const trendsMessage = `📈 *Current Trending Topics\\:*\n\n${trends.map((topic, index) => 
                    `${index + 1}\\. ${this.escapeMarkdown(topic)}`
                ).join('\n')}\n\nUse /tweet to generate AI\\-powered tweets\\!`;

                this.sendSafeMarkdown(ctx, trendsMessage);
            } catch (error) {
                console.error('Trending command error:', error);
                ctx.reply('❌ Error fetching trends. Please try again later.');
            }
        });

        // Main tweet generation command - PURE AI
        this.bot.command('tweet', async (ctx) => {
            try {
                if (!process.env.DEEPSEEK_API_KEY) {
                    return ctx.reply(' AI is not configured. Please add DEEPSEEK_API_KEY to your environment variables.');
                }

                await ctx.reply(' AI is generating your tweets...');
                const trends = await this.fetchTrendingTopics();
                const tweets = await this.generateAITweets(trends);
                
                this.sendSafeMarkdown(ctx, tweets);
            } catch (error) {
                console.error('Tweet command error:', error);
                ctx.reply(' AI is unavailable. Please try again later.');
            }
        });

        // Subscribe to daily AI tweets
        this.bot.command('subscribe', (ctx) => {
            const userId = ctx.from.id;
            this.subscribedUsers.add(userId);
            
            const message = `✅ *Subscribed\\!* You'll receive daily AI\\-generated tweets at 9 AM\\.\n\n*Pure AI \\- No templates* 🧠`;
            this.sendSafeMarkdown(ctx, message);
        });

        // Unsubscribe command
        this.bot.command('unsubscribe', (ctx) => {
            const userId = ctx.from.id;
            this.subscribedUsers.delete(userId);
            
            ctx.reply('❌ Unsubscribed from daily AI tweets.');
        });

        // Error handling for bot
        this.bot.catch((err, ctx) => {
            console.error(`Bot error for ${ctx.updateType}:`, err);
            ctx.reply('❌ An error occurred. Please try again later.');
        });

        console.log('🤖 Pure AI Telegram bot setup completed');
    }

    startScheduler() {
        // Send daily AI tweets at 9 AM
        cron.schedule('0 9 * * *', async () => {
            try {
                console.log('🕘 Running daily AI tweet generation...');
                
                if (!process.env.DEEPSEEK_API_KEY) {
                    console.log(' API key missing - skipping daily tweets');
                    return;
                }

                const trends = await this.fetchTrendingTopics();
                const tweets = await this.generateAITweets(trends);
                const message = `🌅 *Your Daily AI\\-Generated Tweets* 🧠\n\n${tweets}`;

                for (const userId of this.subscribedUsers) {
                    try {
                        await this.sendSafeMarkdownToUser(userId, message);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error) {
                        console.error(`Failed to send to user ${userId}:`, error);
                        if (error.code === 403) {
                            this.subscribedUsers.delete(userId);
                        }
                    }
                }
            } catch (error) {
                console.error('Daily AI scheduler error:', error);
            }
        });

        console.log('⏰ Daily AI tweet scheduler started');
    }

    // Helper to send messages to specific users
    async sendSafeMarkdownToUser(userId, text) {
        try {
            const escapedText = this.escapeMarkdown(text);
            await this.bot.telegram.sendMessage(userId, escapedText, { 
                parse_mode: 'Markdown' 
            });
        } catch (error) {
            await this.bot.telegram.sendMessage(userId, text, { 
                parse_mode: null 
            });
        }
    }

    async fetchTrendingTopics() {
        try {
            // Using Google Trends RSS as primary source
            const response = await axios.get('https://trends.google.com/trending/rss?geo=US', {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data, { xmlMode: true });
            const trends = [];

            $('item').each((i, element) => {
                if (i < 15) {
                    const title = $(element).find('title').text();
                    if (title) {
                        const cleanTitle = this.cleanTopic(title);
                        trends.push(cleanTitle);
                    }
                }
            });

            // Fallback if no trends found
            if (trends.length === 0) {
                return this.getFallbackTrends();
            }

            return trends.slice(0, 10);
        } catch (error) {
            console.error('Error fetching trends:', error.message);
            return this.getFallbackTrends();
        }
    }

    cleanTopic(topic) {
        return topic
            .replace(/^[^a-zA-Z0-9]+/, '') // Remove leading special chars
            .replace(/[^a-zA-Z0-9\s]+$/, '') // Remove trailing special chars
            .trim()
            .substring(0, 100); // Limit length
    }

    getFallbackTrends() {
        return [
            'Gissip',
            'political news', 
            'Technology News',
            'white house',
            'Tucker Carson',
            'Elon Musk',
            'Andrew Tate',
            'Putin',
            'Isreal',
            'middle east'
        ];
    }

    async generateAITweets(trends) {
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new Error('API key not configured');
        }

        const prompt = `Generate 3 creative, engaging, and viral-worthy tweet suggestions based on these trending topics: ${trends.slice(0, 5).join(', ')}.

IMPORTANT REQUIREMENTS:
- Create 3 completely different tweets
- Each tweet must be under 280 characters
- Make them conversational, engaging, and shareable
- Include relevant emojis but don't overuse them
- Sound natural and human-written
- Each tweet should be a complete thought
- Focus on different angles and controversial
- Make them attention-grabbing and viral-worthy

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
1. [First creative tweet here]
2. [Second engaging tweet here] 
3. [Third viral-worthy tweet here]

Be creative, witty, and make these tweets stand out!`;

        try {
            const response = await axios.post(
                process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert social media strategist and creative writer. You specialize in creating viral, engaging tweet content that gets high engagement and shares. You understand trending topics and know how to create content that resonates with audiences.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 600,
                    temperature: 0.85, // More creative
                    top_p: 0.9
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (response.data.choices && response.data.choices[0].message) {
                let aiResponse = response.data.choices[0].message.content;
                
                // Clean and format the AI response
                aiResponse = this.escapeMarkdown(aiResponse);
                
                return `🧠 *AI Generated Tweets* ⚡\n\n${aiResponse}\n\n💫 *Inspired by trends:* ${trends.slice(0, 5).map(t => this.escapeMarkdown(t)).join(', ')}\n\n*TweetSUG Powered by AI* 🤖`;
            } else {
                throw new Error('Invalid response from API');
            }
        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
            throw new Error('AI is currently unavailable. Please try again in a few moments.');
        }
    }

    async start() {
        const port = process.env.PORT || 3000;
        
        this.server = this.app.listen(port, () => {
            console.log(`🚀 Pure AI Tweet Bot running on port ${port}`);
            console.log(`🌐 Health: http://localhost:${port}/health`);
            console.log(`🧠 AI: ${process.env.DEEPSEEK_API_KEY ? 'ENABLED' : 'DISABLED'}`);
        });

        await this.bot.launch();
        console.log('🤖 Telegram bot running with Pure AI');

        process.once('SIGINT', () => this.shutdown());
        process.once('SIGTERM', () => this.shutdown());
    }

    async shutdown() {
        console.log('🛑 Shutting down Pure AI bot...');
        this.bot.stop();
        this.server?.close();
        process.exit(0);
    }
}

// Start the bot
const bot = new PureAITweetBot();
bot.start().catch(console.error);

export default PureAITweetBot;