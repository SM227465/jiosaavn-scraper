import dotenv from 'dotenv';
import logger from "./utils/logger.util";
import app from '.';
import { connectRedis, disconnectRedis } from './utils/redis.util';
import { startJioSaavnCronJob } from './jobs/jiosaavn.cron';

process.on('uncaughtException', (error) => {
  logger.info('UNCAUGHT EXCEPTION!');
  logger.error(error.message);
  process.exit(1);
});

dotenv.config();

const port = process.env.PORT || 8000;

// Initialize Redis and cron jobs
const initializeServices = async () => {
  try {
    await connectRedis();
    startJioSaavnCronJob();
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services');
    logger.error(error);
    process.exit(1);
  }
};

initializeServices();

const server = app.listen(port, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV} environment on port ${port}`);
});

process.on('unhandledRejection', (error) => {
  logger.info('UNHANDLED REJECTION!');
  logger.error(error);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectRedis();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
