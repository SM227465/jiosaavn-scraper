import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = isDevelopment
  ? pino(
      { base: { pid: false } },
      pino.transport({
        target: 'pino-pretty',
        options: { colorize: true },
      })
    )
  : pino({ base: { pid: false } });

export default logger;
