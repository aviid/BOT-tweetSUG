const trendingService = require('../services/trendingService');
const deepseekService = require('../services/deepseekService');
const telegramService = require('../services/telegramService');

class TrendingJob {
  constructor() {
    this.lastProcessedTopics = new Set();
    this.executionCount = 0;
  }

  async execute() {
    try {
      this.executionCount++;
      console.log(`Starting trending job execution #${this.executionCount}...`);
      
      // Get trending topics from free sources
      const trends = await trendingService.getAllTrends();
      
      if (!trends || trends.length === 0) {
        console.log('No trends found from any source');
        await telegramService.sendError('No trends found from any source. Check if services are accessible.');
        return;
      }

      console.log(`Found ${trends.length} total trends`);

      // Filter out previously processed topics
      const newTrends = trends.filter(trend => 
        !this.lastProcessedTopics.has(trend.title.toLowerCase())
      );

      if (newTrends.length === 0) {
        console.log('No new trends found since last check');
        return;
      }

      console.log(`Processing ${newTrends.length} new trends`);

      // Process top 3 new trends
      for (const trend of newTrends.slice(0, 3)) {
        await this.processTrend(trend);
        
        // Add to processed topics
        this.lastProcessedTopics.add(trend.title.toLowerCase());
        
        // Clean up old topics to prevent memory issues
        if (this.lastProcessedTopics.size > 100) {
          const first = Array.from(this.lastProcessedTopics)[0];
          this.lastProcessedTopics.delete(first);
        }
        
        // Wait between processing
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      console.log('Trending job completed successfully');
    } catch (error) {
      console.error('Error in trending job:', error);
      await telegramService.sendError(`Trending job failed: ${error.message}`);
    }
  }

  async processTrend(trend) {
    try {
      console.log(`Processing trend: ${trend.title}`);
      
      // Get hot post link
      const postLink = await trendingService.getHotPostLink(trend);
      
      // Generate tweet suggestion
      const context = trend.description || trend.title;
      const tweetSuggestion = await deepseekService.generateTweetSuggestion(trend.title, context);
      
      // Send to Telegram
      await telegramService.sendTweetSuggestion(tweetSuggestion, postLink, trend.title, trend.source);
      
      console.log(`Successfully processed trend: ${trend.title}`);
    } catch (error) {
      console.error(`Error processing trend ${trend.title}:`, error);
    }
  }
}

module.exports = new TrendingJob();