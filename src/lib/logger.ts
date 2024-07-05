import { Logger } from 'tslog';

const logger = new Logger({
  minLevel: 2,
  prettyLogTimeZone: 'UTC',
  prettyErrorStackTemplate:
    '  • {{fileName}}\t{{method}}\n\t{{filePathWithLine}}',
  prettyErrorTemplate:
    '\n{{errorName}} {{errorMessage}}\nerror stack:\n{{errorStack}}',
  prettyLogTemplate: '{{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}',
  stylePrettyLogs: true,
  prettyLogStyles: {
    name: 'yellow',
    dateIsoStr: 'blue',
  },
});

export default logger;
