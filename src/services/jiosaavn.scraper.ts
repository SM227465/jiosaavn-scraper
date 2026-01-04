import axios from 'axios';
import { redisClient } from '../utils/redis.util';
import logger from '../utils/logger.util';

export interface PlaylistData {
  id: string;
  title: string;
  url: string;
  image?: string;
  subtitle?: string;
  followers?: string;
}

export interface ArtistData {
  id: string;
  name: string;
  url: string;
  image?: string;
  fans?: string;
}

export interface ChartData {
  id: string;
  title: string;
  url: string;
  image?: string;
  subtitle?: string;
}

export interface NewReleaseData {
  id: string;
  title: string;
  url: string;
  image?: string;
  subtitle?: string;
}

export interface JioSaavnScrapedData {
  newReleases: NewReleaseData[];
  topCharts: ChartData[];
  topPlaylists: PlaylistData[];
  topArtists: ArtistData[];
  scrapedAt: string;
}

const JIOSAAVN_BASE_URL = 'https://www.jiosaavn.com';

export class JioSaavnScraper {
  // Validate if an ID is likely a song ID (alphanumeric) vs album ID (numeric only)
  // JioSaavn song IDs typically contain letters, while album IDs are purely numeric
  private isValidSongId(id: string): boolean {
    // Check if the ID contains at least one letter (not purely numeric)
    return /[a-zA-Z]/.test(id);
  }
  private async fetchPage(url: string): Promise<string | null> {
    try {
      logger.info(`Fetching page: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
        },
        timeout: 15000,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch page: ${url}`);
      logger.error(error);
      return null;
    }
  }

  private extractInitialData(html: string): any {
    try {
      // Find window.__INITIAL_DATA__ embedded in the HTML
      const match = html.match(/window\.__INITIAL_DATA__\s*=\s*({.*?});?\s*<\/script>/s);

      if (match && match[1]) {
        let jsonStr = match[1];

        // Clean up the JSON string to make it parseable
        // Replace new Date("...") with just the date string
        jsonStr = jsonStr.replace(/new Date\("([^"]+)"\)/g, '"$1"');

        // Replace undefined with null
        jsonStr = jsonStr.replace(/:undefined([,}])/g, ':null$1');

        return JSON.parse(jsonStr);
      }
      return null;
    } catch (error) {
      logger.error('Failed to extract window.__INITIAL_DATA__');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      return null;
    }
  }

  private async scrapeNewReleases(): Promise<NewReleaseData[]> {
    try {
      const html = await this.fetchPage(`${JIOSAAVN_BASE_URL}/`);
      if (!html) return [];

      const initialData = this.extractInitialData(html);
      if (!initialData || !initialData.homeView?.modules) return [];

      // Look for new_trending or similar modules on the homepage
      const releases: NewReleaseData[] = [];
      for (const module of initialData.homeView.modules) {
        // Look for modules with 'new_trending', 'new_albums', or 'trending' in the key
        if ((module.key === 'new_trending' || module.key?.includes('new_') || module.key?.includes('trending'))
            && Array.isArray(module.data)) {
          module.data.forEach((item: any) => {
            // Only include songs with valid song IDs (containing letters, not purely numeric)
            // This filters out album IDs which are purely numeric
            if (item.type === 'song' && item.id && item.title && this.isValidSongId(item.id)) {
              releases.push({
                id: item.id,
                title: item.title?.text || item.title,
                url: item.perma_url || `${JIOSAAVN_BASE_URL}${item.title?.action || ''}`,
                image: Array.isArray(item.image) ? item.image[item.image.length - 1] : item.image,
                subtitle: item.subtitle?.text || (Array.isArray(item.subtitle) ? '' : item.subtitle) || '',
              });
            }
          });
        }
      }

      logger.info(`Scraped ${releases.length} new releases from JSON data`);
      return releases.slice(0, 20); // Limit to top 20
    } catch (error) {
      logger.error('Failed to scrape new releases');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      return [];
    }
  }

  private async scrapeTopCharts(): Promise<ChartData[]> {
    try {
      const html = await this.fetchPage(`${JIOSAAVN_BASE_URL}/charts`);
      if (!html) return [];

      const initialData = this.extractInitialData(html);
      if (!initialData || !initialData.browse?.browse_list) return [];

      const charts: ChartData[] = initialData.browse.browse_list.map((item: any) => ({
        id: item.id,
        title: item.title?.text || item.title,
        url: item.perma_url || '',
        image: Array.isArray(item.image) ? item.image[item.image.length - 1] : item.image,
        subtitle: item.subtitle?.text || (Array.isArray(item.subtitle) ? '' : item.subtitle) || '',
      })).filter((item: ChartData) => item.id && item.title);

      logger.info(`Scraped ${charts.length} top charts from JSON data`);
      return charts.slice(0, 20);
    } catch (error) {
      logger.error('Failed to scrape top charts');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      return [];
    }
  }

  private async scrapeTopPlaylists(): Promise<PlaylistData[]> {
    try {
      const html = await this.fetchPage(`${JIOSAAVN_BASE_URL}/featured-playlists`);
      if (!html) return [];

      const initialData = this.extractInitialData(html);
      if (!initialData || !initialData.browse?.browse_list) return [];

      const playlists: PlaylistData[] = initialData.browse.browse_list
        .filter((item: any) => item.type === 'playlist')
        .map((item: any) => {
          const subtitle = item.subtitle?.text || (Array.isArray(item.subtitle) ? '' : item.subtitle) || '';
          const followers = Array.isArray(item.be_subtitle) && item.be_subtitle.length > 0
            ? item.be_subtitle[0].text
            : '';

          return {
            id: item.id,
            title: item.title?.text || item.title,
            url: item.perma_url || '',
            image: Array.isArray(item.image) ? item.image[item.image.length - 1] : item.image,
            subtitle,
            followers,
          };
        })
        .filter((item: PlaylistData) => item.id && item.title);

      logger.info(`Scraped ${playlists.length} top playlists from JSON data`);
      return playlists.slice(0, 20);
    } catch (error) {
      logger.error('Failed to scrape top playlists');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      return [];
    }
  }

  private async scrapeTopArtists(): Promise<ArtistData[]> {
    try {
      const html = await this.fetchPage(`${JIOSAAVN_BASE_URL}/top-artists`);
      if (!html) return [];

      const initialData = this.extractInitialData(html);
      if (!initialData || !initialData.browse?.browse_list) return [];

      const artists: ArtistData[] = initialData.browse.browse_list
        .filter((item: any) => item.type === 'artist')
        .map((item: any) => ({
          id: item.id,
          name: item.title?.text || item.title,
          url: item.perma_url || '',
          image: Array.isArray(item.image) ? item.image[item.image.length - 1] : item.image,
          fans: item.subtitle?.text || (Array.isArray(item.subtitle) ? '' : item.subtitle) || '',
        }))
        .filter((item: ArtistData) => item.id && item.name);

      logger.info(`Scraped ${artists.length} top artists from JSON data`);
      return artists.slice(0, 20);
    } catch (error) {
      logger.error('Failed to scrape top artists');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      return [];
    }
  }

  public async scrapeAll(): Promise<JioSaavnScrapedData> {
    logger.info('Starting JioSaavn scraping...');

    const [newReleases, topCharts, topPlaylists, topArtists] = await Promise.all([
      this.scrapeNewReleases(),
      this.scrapeTopCharts(),
      this.scrapeTopPlaylists(),
      this.scrapeTopArtists(),
    ]);

    const scrapedData: JioSaavnScrapedData = {
      newReleases,
      topCharts,
      topPlaylists,
      topArtists,
      scrapedAt: new Date().toISOString(),
    };

    logger.info(`JioSaavn scraping completed - New Releases: ${newReleases.length}, Charts: ${topCharts.length}, Playlists: ${topPlaylists.length}, Artists: ${topArtists.length}`);

    return scrapedData;
  }

  public async scrapeAndStore(): Promise<void> {
    try {
      const data = await this.scrapeAll();
      const client = redisClient();

      // Store in Redis without TTL - data persists and gets overridden on each cron run
      // This ensures old data is available even if a cron job fails
      await Promise.all([
        client.set('jiosaavn:newReleases', JSON.stringify(data.newReleases)),
        client.set('jiosaavn:topCharts', JSON.stringify(data.topCharts)),
        client.set('jiosaavn:topPlaylists', JSON.stringify(data.topPlaylists)),
        client.set('jiosaavn:topArtists', JSON.stringify(data.topArtists)),
        client.set('jiosaavn:lastScraped', data.scrapedAt),
      ]);

      // Also store the complete data
      await client.set('jiosaavn:all', JSON.stringify(data));

      logger.info('JioSaavn data stored in Redis successfully');
    } catch (error) {
      logger.error('Failed to scrape and store JioSaavn data');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      throw error;
    }
  }
}

export const jioSaavnScraper = new JioSaavnScraper();
