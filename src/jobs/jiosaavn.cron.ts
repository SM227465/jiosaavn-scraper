import cron from 'node-cron';
import { jioSaavnScraper } from '../services/jiosaavn.scraper';
import logger from '../utils/logger.util';

// Cron expression for every 6 hours: 0 */6 * * *
// This runs at: 00:00, 06:00, 12:00, 18:00
const CRON_SCHEDULE = '0 */6 * * *';

export const startJioSaavnCronJob = (): void => {
  logger.info('Initializing JioSaavn scraper cron job...');

  // Run immediately on startup
  logger.info('Running initial JioSaavn scrape...');
  jioSaavnScraper.scrapeAndStore().catch((error) => {
    logger.error('Initial JioSaavn scrape failed');
    if (error instanceof Error) {
      logger.error(error.message);
    }
  });

  // Schedule cron job to run every 6 hours
  cron.schedule(CRON_SCHEDULE, async () => {
    logger.info('JioSaavn cron job triggered');
    try {
      await jioSaavnScraper.scrapeAndStore();
      logger.info('JioSaavn cron job completed successfully');
    } catch (error) {
      logger.error('JioSaavn cron job failed');
      if (error instanceof Error) {
        logger.error(error.message);
      }
    }
  });

  logger.info(`JioSaavn scraper cron job scheduled: ${CRON_SCHEDULE}`);
};
