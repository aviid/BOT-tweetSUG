const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config/keys');

class TrendingService {
  constructor() {
    this.sources = [
      'reddit',
      'news',
      'google_trends'
    ];
  }

  // Method 1: Get trends from Reddit (completely free)
  async getRedditTrends() {
    try {
      const response = await axios.get('https://www.reddit.com/r/popular.json', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const posts = response.data.data.children.slice(0, 20);
      const trends = posts.map(post => ({
        title: post.data.title,
        url: `https://reddit.com${post.data.permalink}`,
        source: 'reddit',
        engagement: post.data.score + post.data.num_comments,
        category: this.categorizeContent(post.data.title)
      }));

      return trends.filter(trend => 
        config.categories.includes(trend.category)
      );
    } catch (error) {
      console.error('Error fetching Reddit trends:', error.message);
      return [];
    }
  }

  // Method 2: Get trends from NewsAPI (free tier)
  async getNewsTrends() {
    try {
      // Using free NewsAPI (1000 requests/day free)
      const apiKey = process.env.NEWS_API_KEY || 'demo'; // demo key for testing
      const response = await axios.get(
        `https://newsapi.org/v2/top-headlines?country=us&pageSize=20&apiKey=${apiKey}`
      );

      const trends = response.data.articles.map(article => ({
        title: article.title,
        url: article.url,
        source: 'news',
        description: article.description,
        category: this.categorizeContent(article.title)
      }));

      return trends.filter(trend => 
        config.categories.includes(trend.category)
      );
    } catch (error) {
      console.error('Error fetching news trends:', error.message);
      return this.getRedditTrends(); // Fallback to Reddit
    }
  }

  // Method 3: Get Google Trends (web scraping approach)
  async getGoogleTrends() {
    try {
      // Note: This is a simplified approach. For production, consider using 
      // Google Trends API alternatives or official APIs
      const response = await axios.get('https://trends.google.com/trending/api/dailytrends', {
        params: {
          geo: 'US',
          ns: 15
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Parse the response (Google Trends returns JSONP)
      const trends = this.parseGoogleTrendsResponse(response.data);
      return trends.slice(0, 10);
    } catch (error) {
      console.error('Error fetching Google trends:', error.message);
      return [];
    }
  }

  parseGoogleTrendsResponse(data) {
    try {
      // Google Trends returns JSONP, so we need to parse it
      const jsonString = data.replace(')]}\',', '');
      const trendsData = JSON.parse(jsonString);
      
      return trendsData.default.trendingSearchesDays[0].trendingSearches.map(item => ({
        title: item.title.query,
        traffic: item.formattedTraffic,
        articles: item.articles,
        category: this.categorizeContent(item.title.query)
      }));
    } catch (error) {
      console.error('Error parsing Google trends:', error);
      return [];
    }
  }

  // Method 4: Get Twitter trends without API (using Nitter alternative)
  async getTwitterTrends() {
    try {
      // Using Nitter (Twitter front-end alternative)
      const response = await axios.get('https://nitter.net/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const trends = [];

      $('.trend-item').each((i, element) => {
        if (i < 10) {
          const trend = $(element).find('.trend-name').text().trim();
          if (trend) {
            trends.push({
              title: trend,
              source: 'twitter',
              category: this.categorizeContent(trend)
            });
          }
        }
      });

      return trends.filter(trend => 
        config.categories.includes(trend.category)
      );
    } catch (error) {
      console.error('Error fetching Twitter trends:', error.message);
      return this.getRedditTrends(); // Fallback
    }
  }

  // Categorize content based on keywords
  categorizeContent(text) {
    const lowerText = text.toLowerCase();
    
    const categories = {
      entertainment: ['movie', 'celebrity', 'hollywood', 'music', 'film', 'actor', 'actress', 'oscar', 'grammy', 'netflix', 'disney', 'marvel', 'star wars', 'beyonce', 'taylor swift', 'kardashian'],
      gossip: ['rumor', 'scandal', 'affair', 'breakup', 'dating', 'relationship', 'cheating', 'divorce', 'feud', 'beef', 'drama', 'leak', 'secret'],
      politics: ['biden', 'trump', 'congress', 'senate', 'election', 'democrat', 'republican', 'policy', 'white house', 'government', 'bill', 'law', 'vote', 'campaign']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }

    return 'other';
  }

  // Main method to get all trends
  async getAllTrends() {
    try {
      const [redditTrends, newsTrends, twitterTrends] = await Promise.all([
        this.getRedditTrends(),
        this.getNewsTrends(),
        this.getTwitterTrends()
      ]);

      // Combine and deduplicate trends
      const allTrends = [...redditTrends, ...newsTrends, ...twitterTrends];
      const uniqueTrends = this.deduplicateTrends(allTrends);
      
      // Sort by engagement/importance
      return uniqueTrends
        .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
        .slice(0, 15);
    } catch (error) {
      console.error('Error getting all trends:', error);
      return [];
    }
  }

  deduplicateTrends(trends) {
    const seen = new Set();
    return trends.filter(trend => {
      const key = trend.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Get hot post link for engagement
  async getHotPostLink(trend) {
    try {
      // For Reddit trends, use the Reddit post URL
      if (trend.source === 'reddit' && trend.url) {
        return trend.url;
      }
      
      // For news trends, use the article URL
      if (trend.source === 'news' && trend.url) {
        return trend.url;
      }
      
      // For Twitter trends, create a search link
      if (trend.source === 'twitter') {
        return `https://twitter.com/search?q=${encodeURIComponent(trend.title)}&src=trend_click`;
      }
      
      // Default: Google search for the trend
      return `https://www.google.com/search?q=${encodeURIComponent(trend.title)}&tbm=nws`;
    } catch (error) {
      console.error('Error generating hot post link:', error);
      return `https://www.google.com/search?q=${encodeURIComponent(trend.title)}`;
    }
  }
}

module.exports = new TrendingService();