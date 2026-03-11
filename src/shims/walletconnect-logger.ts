type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace'
  | 'silent';

type LoggerLike = {
  level: LogLevel;
  [PINO_CUSTOM_CONTEXT_KEY]?: string;
  [key: string]: unknown;
  child: (bindings?: Record<string, unknown>) => LoggerLike;
  error: (...args: unknown[]) => void;
  fatal: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  trace: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
};

const noop = () => {};

export const MAX_LOG_SIZE_IN_BYTES_DEFAULT = 1024 * 1000;
export const PINO_CUSTOM_CONTEXT_KEY = 'custom_context';
export const PINO_LOGGER_DEFAULTS = { level: 'info' as LogLevel };

export function pino(
  opts: { level?: LogLevel } = {},
  _destination?: unknown,
): LoggerLike {
  const logger: LoggerLike = {
    level: opts.level ?? PINO_LOGGER_DEFAULTS.level,
    child(bindings = {}) {
      const childLogger = pino({ level: logger.level });
      const context = bindings[PINO_CUSTOM_CONTEXT_KEY];

      if (typeof context === 'string') {
        childLogger[PINO_CUSTOM_CONTEXT_KEY] = context;
      }

      return childLogger;
    },
    error: noop,
    fatal: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop,
    log: noop,
  };

  return logger;
}

pino.levels = {
  values: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10,
    silent: Infinity,
  },
};

export function getDefaultLoggerOptions<T extends Record<string, unknown>>(
  opts: T,
): T & { level: LogLevel } {
  return {
    ...opts,
    level: (opts.level as LogLevel | undefined) ?? PINO_LOGGER_DEFAULTS.level,
  };
}

export function setLoggerContext<T extends LoggerLike>(
  logger: T,
  context: string,
  key = PINO_CUSTOM_CONTEXT_KEY,
): T {
  (logger as LoggerLike)[key] = context;
  return logger;
}

export function getLoggerContext(
  logger: LoggerLike,
  key = PINO_CUSTOM_CONTEXT_KEY,
): string {
  const value = logger[key];
  return typeof value === 'string' ? value : '';
}

export function formatChildLoggerContext(
  logger: LoggerLike,
  context: string,
  key = PINO_CUSTOM_CONTEXT_KEY,
): string {
  const current = getLoggerContext(logger, key);
  return current.trim() ? `${current}/${context}` : context;
}

export function generateChildLogger<T extends LoggerLike>(
  logger: T,
  context: string,
  key = PINO_CUSTOM_CONTEXT_KEY,
): T {
  const child = logger.child({
    [key]: formatChildLoggerContext(logger, context, key),
  });

  return setLoggerContext(
    child as T,
    formatChildLoggerContext(logger, context, key),
    key,
  );
}

export function generatePlatformLogger({
  opts,
  loggerOverride,
}: {
  opts?: { level?: LogLevel };
  loggerOverride?: LoggerLike;
}) {
  const logger = loggerOverride ?? pino(opts);

  return {
    logger,
    chunkLoggerController: {
      write: noop,
      clearLogs: noop,
      getLogs: () => [],
      getLogArray: () => [],
      logsToBlob: () => new Blob(),
    },
  };
}

export default pino;
