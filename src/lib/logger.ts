import { Logger } from 'tslog';

const MIN_LOG_LEVEL =
  process.env.LOG_LEVEL !== undefined
    ? parseInt(process.env.LOG_LEVEL, 10)
    : process.env.NODE_ENV === 'production'
      ? 2
      : 99999;

const logger = new Logger({
  minLevel: MIN_LOG_LEVEL,
  prettyLogTimeZone: 'UTC',
  prettyErrorStackTemplate:
    '  • {{fileName}}\t{{method}}\n\t{{filePathWithLine}}',
  prettyErrorTemplate:
    '\n{{errorName}} {{errorMessage}}\nerror stack:\n{{errorStack}}',
  prettyLogTemplate: '{{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}',
  stylePrettyLogs: true,
  prettyLogStyles: {
    logLevelName: {
      '*': ['bold', 'black', 'bgWhiteBright', 'dim'],
      SILLY: ['bold', 'white'],
      TRACE: ['bold', 'blue'],
      DEBUG: ['bold', 'cyan'],
      INFO: ['bold', 'green'],
      WARN: ['bold', 'yellow'],
      ERROR: ['bold', 'red'],
      FATAL: ['bold', 'magenta'],
    },
    dateIsoStr: 'blue',
    filePathWithLine: 'magenta',
  },
});

export default logger;
