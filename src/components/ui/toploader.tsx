'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { configure, done, start } from 'nprogress';
import { useEffect } from 'react';

// Earn's bar along the top while a page loads. The App Router has no route
// events: a click on a link to another page here starts it, and arriving
// (a new path or query) finishes it. Code that navigates itself calls
// `startTopLoader`.
export const startTopLoader = () => start();

const isPageLink = (event: MouseEvent): string | null => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null;
  }
  const target = event.target;
  if (!(target instanceof Element)) return null;
  const anchor = target.closest('a');
  if (!anchor || (anchor.target && anchor.target !== '_self')) return null;
  if (anchor.hasAttribute('download')) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  const here = window.location;
  if (url.pathname === here.pathname && url.search === here.search) {
    return null;
  }
  return url.href;
};

export const TopLoader = () => {
  const color = '#6366F1';
  const height = 3;

  const boxShadow = `box-shadow:0 0 10px ${color},0 0 5px ${color}`;

  const positionStyle = 'top: 0;';
  const spinnerPositionStyle = 'top: 15px;';

  const pathname = usePathname();
  const search = useSearchParams()?.toString();

  const styles = (
    <style>
      {`#nprogress{pointer-events:none}#nprogress .bar{background:${color};position:fixed;z-index:1600;${positionStyle}left:0;width:100%;height:${height}px}#nprogress .peg{display:block;position:absolute;right:0;width:100px;height:100%;${boxShadow};opacity:1;-webkit-transform:rotate(3deg) translate(0px,-4px);-ms-transform:rotate(3deg) translate(0px,-4px);transform:rotate(3deg) translate(0px,-4px)}#nprogress .spinner{display:block;position:fixed;z-index:1600;${spinnerPositionStyle}right:15px}#nprogress .spinner-icon{width:18px;height:18px;box-sizing:border-box;border:2px solid transparent;border-top-color:${color};border-left-color:${color};border-radius:50%;-webkit-animation:nprogress-spinner 400ms linear infinite;animation:nprogress-spinner 400ms linear infinite}.nprogress-custom-parent{overflow:hidden;position:relative}.nprogress-custom-parent #nprogress .bar,.nprogress-custom-parent #nprogress .spinner{position:absolute}@-webkit-keyframes nprogress-spinner{0%{-webkit-transform:rotate(0deg)}100%{-webkit-transform:rotate(360deg)}}@keyframes nprogress-spinner{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}
    </style>
  );

  useEffect(() => {
    configure({
      showSpinner: false,
      trickle: true,
      trickleSpeed: 200,
      minimum: 0.08,
      easing: 'ease',
      speed: 200,
      template:
        '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>',
    });

    const onClick = (event: MouseEvent) => {
      if (isPageLink(event)) start();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Arrived: a new path or query.
  useEffect(() => {
    done(true);
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- they're the trigger
  }, [pathname, search]);

  return styles;
};
