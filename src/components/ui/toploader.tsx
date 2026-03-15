import Router from 'next/router';
import { useEffect, useSyncExternalStore } from 'react';

import {
  finishTopLoader,
  getTopLoaderSnapshot,
  startTopLoader,
  subscribeTopLoader,
} from '@/lib/top-loader';

export const TopLoader = () => {
  const color = '#6366F1';
  const height = 2;
  const { progress, visible } = useSyncExternalStore(
    subscribeTopLoader,
    getTopLoaderSnapshot,
    getTopLoaderSnapshot,
  );

  const boxShadow = '0 0 4px rgba(99, 102, 241, 0.28)';

  const styles = (
    <style>
      {`#st-top-loader{pointer-events:none;position:fixed;top:0;left:0;z-index:1600;height:${height}px;width:100%;transform-origin:left center;transition:transform 180ms ease,opacity 220ms ease;will-change:transform,opacity}#st-top-loader .bar{height:100%;width:100%;background:${color};box-shadow:${boxShadow}}`}
    </style>
  );

  useEffect(() => {
    const progressStarted = () => startTopLoader();
    const progressComplete = () => finishTopLoader();

    Router.events.on('routeChangeStart', progressStarted);
    Router.events.on('routeChangeComplete', progressComplete);
    Router.events.on('routeChangeError', progressComplete);

    return () => {
      Router.events.off('routeChangeStart', progressStarted);
      Router.events.off('routeChangeComplete', progressComplete);
      Router.events.off('routeChangeError', progressComplete);
    };
  }, []);

  return (
    <>
      {styles}
      <div
        id="st-top-loader"
        aria-hidden="true"
        style={{
          opacity: visible ? 1 : 0,
          transform: `scaleX(${progress / 100})`,
        }}
      >
        <div className="bar" />
      </div>
    </>
  );
};
