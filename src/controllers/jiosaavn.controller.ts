import { Request, Response } from 'express';
import { redisClient } from '../utils/redis.util';
import logger from '../utils/logger.util';

export class JioSaavnController {
  // Get all scraped data
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const client = redisClient();
      const data = await client.get('jiosaavn:all');

      if (!data) {
        res.status(404).json({
          success: false,
          message: 'No data available. Scraping may not have run yet.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: JSON.parse(data),
      });
    } catch (error) {
      logger.error('Error fetching all JioSaavn data');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch data',
      });
    }
  }

  // Get new releases
  async getNewReleases(req: Request, res: Response): Promise<void> {
    try {
      const client = redisClient();
      const data = await client.get('jiosaavn:newReleases');

      if (!data) {
        res.status(404).json({
          success: false,
          message: 'No new releases data available',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: JSON.parse(data),
      });
    } catch (error) {
      logger.error('Error fetching new releases');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch new releases',
      });
    }
  }

  // Get top charts
  async getTopCharts(req: Request, res: Response): Promise<void> {
    try {
      const client = redisClient();
      const data = await client.get('jiosaavn:topCharts');

      if (!data) {
        res.status(404).json({
          success: false,
          message: 'No top charts data available',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: JSON.parse(data),
      });
    } catch (error) {
      logger.error('Error fetching top charts');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top charts',
      });
    }
  }

  // Get top playlists
  async getTopPlaylists(req: Request, res: Response): Promise<void> {
    try {
      const client = redisClient();
      const data = await client.get('jiosaavn:topPlaylists');

      if (!data) {
        res.status(404).json({
          success: false,
          message: 'No top playlists data available',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: JSON.parse(data),
      });
    } catch (error) {
      logger.error('Error fetching top playlists');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top playlists',
      });
    }
  }

  // Get top artists
  async getTopArtists(req: Request, res: Response): Promise<void> {
    try {
      const client = redisClient();
      const data = await client.get('jiosaavn:topArtists');

      if (!data) {
        res.status(404).json({
          success: false,
          message: 'No top artists data available',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: JSON.parse(data),
      });
    } catch (error) {
      logger.error('Error fetching top artists');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top artists',
      });
    }
  }

  // Get last scraped timestamp
  async getLastScraped(req: Request, res: Response): Promise<void> {
    try {
      const client = redisClient();
      const timestamp = await client.get('jiosaavn:lastScraped');

      if (!timestamp) {
        res.status(404).json({
          success: false,
          message: 'No scraping timestamp available',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          lastScraped: timestamp,
        },
      });
    } catch (error) {
      logger.error('Error fetching last scraped timestamp');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch timestamp',
      });
    }
  }
}

export const jioSaavnController = new JioSaavnController();
