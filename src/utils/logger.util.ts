import pino from 'pino';

const transport = pino.transport({
  target: 'pino-pretty',
  options: { colorize: true },
});

const logger = pino({ base: { pid: false } }, transport);

export default logger;
