import { createClient, RedisClientType } from 'redis';
import logger from './logger.util';

// Build Redis URL from environment variables
const buildRedisUrl = (): string => {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const password = process.env.REDIS_PASSWORD;
  const db = process.env.REDIS_DB || '0';

  if (password) {
    return `redis://:${password}@${host}:${port}/${db}`;
  }
  return `redis://${host}:${port}/${db}`;
};

// Lazy initialization of Redis client
let redisClient: RedisClientType | null = null;

const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    redisClient = createClient({
      url: buildRedisUrl(),
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Too many Redis reconnection attempts, giving up');
            return new Error('Too many retries');
          }
          return retries * 100;
        },
      },
    }) as RedisClientType;

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error');
      logger.error(err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });
  }
  return redisClient;
};

export const connectRedis = async () => {
  try {
    const client = getRedisClient();
    const redisUrl = buildRedisUrl();
    const maskedUrl = redisUrl.replace(/:([^@]+)@/, ':****@'); // Mask password in logs
    logger.info(`Connecting to Redis at ${maskedUrl}`);

    await client.connect();
    logger.info('Redis connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis');
    if (error instanceof Error) {
      logger.error(error.message);
    }
    throw error;
  }
};

export const disconnectRedis = async () => {
  try {
    const client = getRedisClient();
    await client.disconnect();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Failed to disconnect from Redis');
  }
};

export { getRedisClient as redisClient };
