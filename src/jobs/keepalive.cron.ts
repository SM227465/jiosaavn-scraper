import cron from 'node-cron';
import logger from '../utils/logger.util';

const BASE_API_URL = 'https://jiosaavn-scraper.onrender.com/';

// Cron expression for every 14 minutes: */14 * * * *
const KEEP_ALIVE_SCHEDULE = '*/14 * * * *';

export const startKeepAliveCronJob = (): void => {
  logger.info('Initializing Keep-Alive cron job...');

  // Schedule cron job to run every 14 minutes to prevent server sleep
  cron.schedule(KEEP_ALIVE_SCHEDULE, async () => {
    try {
      const res = await fetch(BASE_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      const date = new Date();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const adjustedHours = hours % 12 || 12;
      const formattedTime = `${adjustedHours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;

      if (data?.success) {
        logger.info(`Keep-Alive cron job executed successfully at ${formattedTime}`);
      } else {
        logger.warn(`Keep-Alive cron job executed at ${formattedTime} but received unexpected response`);
      }
    } catch (error) {
      const date = new Date();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const adjustedHours = hours % 12 || 12;
      const formattedTime = `${adjustedHours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;

      logger.error(`Keep-Alive cron job failed at ${formattedTime}`);
      if (error instanceof Error) {
        logger.error(error.message);
      }
    }
  });

  logger.info(`Keep-Alive cron job scheduled: ${KEEP_ALIVE_SCHEDULE} (every 14 minutes)`);
};
