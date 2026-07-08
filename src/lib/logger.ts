import { Logger } from 'tslog';

const logger = new Logger({
  // tslog levels: DEBUG=2, INFO=3. Locally surface DEBUG; in production
  // start at INFO so debug logs (which include full request bodies) are
  // not emitted to the log sink.
  minLevel: process.env.IS_LOCAL === 'true' ? 2 : 3,
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
