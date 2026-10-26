'use client';

import { useEffect } from 'react';

const handleImageLoad = (img: HTMLImageElement) => {
  if (img.complete) {
    img.classList.add('loaded');
  } else {
    img.addEventListener('load', () => img.classList.add('loaded'), {
      once: true,
    });
  }
};

// superteam.fun's dark page background, and the fade-in of every image once
// it has loaded (`img.loaded` in st-globals.css).
export default function StEffects() {
  useEffect(() => {
    let observer: MutationObserver | null = null;

    void import('@/lib/gsap').then(({ gsap, ScrollTrigger }) => {
      document.documentElement.style.backgroundColor = 'rgb(4, 5, 7)';
      document.body.style.backgroundColor = 'rgb(4, 5, 7)';

      gsap.registerPlugin(ScrollTrigger);

      document.querySelectorAll('img').forEach((img) => handleImageLoad(img));

      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLImageElement) {
              handleImageLoad(node);
            }
            if (node instanceof HTMLElement) {
              node
                .querySelectorAll('img')
                .forEach((img) => handleImageLoad(img));
            }
          });
        });
      });

      const stContainer = document.querySelector('.st-app');
      if (stContainer) {
        observer.observe(stContainer, { childList: true, subtree: true });
      }
    });

    return () => {
      observer?.disconnect();
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  return null;
}
