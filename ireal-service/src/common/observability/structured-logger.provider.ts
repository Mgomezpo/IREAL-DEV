import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino, { LoggerOptions } from 'pino';

export const STRUCTURED_LOGGER = Symbol('STRUCTURED_LOGGER');

const DEFAULT_REDACTIONS: LoggerOptions['redact'] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.token',
  'req.body.secret',
  'res.locals',
];

export const structuredLoggerProvider: Provider = {
  provide: STRUCTURED_LOGGER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const logLevel = configService.get<string>('LOG_LEVEL', 'info');
    return pino({
      level: logLevel,
      redact: DEFAULT_REDACTIONS,
      base: undefined,
      timestamp: pino.stdTimeFunctions.isoTime,
      serializers: {
        err: pino.stdSerializers.err,
      },
    });
  },
};
