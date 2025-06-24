import Router from 'next/router';
import { configure, done, start } from 'nprogress';
import { useEffect } from 'react';

export const TopLoader = () => {
  const color = '#6366F1';
  const height = 3;

  const boxShadow = `box-shadow:0 0 10px ${color},0 0 5px ${color}`;

  const positionStyle = 'top: 0;';
  const spinnerPositionStyle = 'top: 15px;';

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

    const progressStarted = () => start();
    const progressComplete = () => done(true);

    Router.events.on('routeChangeStart', progressStarted);
    Router.events.on('routeChangeComplete', progressComplete);
    Router.events.on('routeChangeError', progressComplete);

    return () => {
      Router.events.off('routeChangeStart', progressStarted);
      Router.events.off('routeChangeComplete', progressComplete);
      Router.events.off('routeChangeError', progressComplete);
    };
  }, []);

  return styles;
};
