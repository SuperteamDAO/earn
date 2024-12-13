import parse, { Element } from 'html-react-parser';
import { type ReactElement } from 'react';

/**
 * Cleans HTML string by removing direct color styles while preserving CSS variable colors
 * and all other style properties
 */
export const cleanHTMLStyles = (html: string): string => {
  const parsed = parse(html, {
    replace: (node) => {
      if (!(node instanceof Element)) return node;
      const style = node.attribs?.style;
      if (!style) return node;

      // Split into individual style declarations and clean
      const cleanedStyles = style
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          // Split only at first colon to handle CSS variables with colons
          const colonIndex = s.indexOf(':');
          if (colonIndex === -1) return '';

          const prop = s.slice(0, colonIndex).trim();
          const value = s.slice(colonIndex + 1).trim();

          if (!prop || !value) return '';

          // Only transform 'color' property, leave others untouched
          if (prop.toLowerCase() === 'color') {
            return value.includes('var(--') ? `${prop}: ${value}` : '';
          }

          // Keep all other style properties exactly as they are
          return s;
        })
        .filter(Boolean);

      if (cleanedStyles.length) {
        node.attribs.style = cleanedStyles.join('; ');
      } else {
        delete node.attribs.style;
      }

      return node;
    },
  });

  // Convert the parsed React elements back to HTML string
  if (Array.isArray(parsed)) {
    return parsed
      .map((el) => {
        if (typeof el === 'string') return el;
        return (el as ReactElement).props.children;
      })
      .join('');
  }

  if (typeof parsed === 'string') return parsed;
  return (parsed as ReactElement).props.children;
};
