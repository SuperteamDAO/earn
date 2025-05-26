import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

turndownService.addRule('plainText', {
  filter: [
    'strong',
    'b',
    'em',
    'i',
    'code',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
  ],
  replacement: function (content) {
    return content;
  },
});

turndownService.addRule('links', {
  filter: 'a',
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const href = element.getAttribute('href');
    if (href && href !== content) {
      return `${content} ( ${href} )`;
    }
    return content;
  },
});

turndownService.addRule('unorderedList', {
  filter: 'ul',
  replacement: function (content) {
    return '\n' + content + '\n';
  },
});

turndownService.addRule('listItem', {
  filter: 'li',
  replacement: function (content) {
    return '• ' + content.trim() + '\n';
  },
});

turndownService.addRule('orderedList', {
  filter: 'ol',
  replacement: function (content) {
    return '\n' + content + '\n';
  },
});

export { turndownService as plainTextFromHtmlTurndown };
