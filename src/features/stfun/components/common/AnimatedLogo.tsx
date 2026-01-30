'use client';

import { useEffect, useRef } from 'react';

import { gsap } from '@/lib/gsap';

export default function AnimatedLogo() {
  const slicesRef = useRef({ val1: 0, val2: 20, val3: 0 });
  const clipPathRef = useRef<SVGClipPathElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(slicesRef.current, {
        val1: 20,
        val2: 0,
        val3: 32,
        duration: 1.8,
        delay: 0.3,
        ease: 'power2.out',
        onUpdate: () => {
          if (clipPathRef.current) {
            const { val1, val2, val3 } = slicesRef.current;
            // Update SVG clip path polygons for animation
            // These values are computed numbers, not user input
            clipPathRef.current.innerHTML = `
              <polygon points="0 0, ${val1} 0, ${val1} 16, 0 16" />
              <polygon points="${val2} 16, 20 16, 20 32, ${val2} 32" />
              <polygon points="20 0, 42 0, 42 ${val3}, 20 ${val3}" />
            `;
          }
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <svg
      width="42"
      height="32"
      viewBox="0 0 42 32"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="clip0" ref={clipPathRef}>
          <polygon points="0 0, 0 0, 0 16, 0 16" />
          <polygon points="20 16, 20 16, 20 32, 20 32" />
          <polygon points="20 0, 42 0, 42 0, 20 0" />
        </clipPath>
      </defs>
      <path
        style={{ clipPath: 'url(#clip0)' }}
        d="M32.6944 4.90892H41.4468V8.28973C41.4468 12.8741 37.742 16.5795 33.1571 16.5795H32.6938L32.6944 4.90892ZM20.2372 0H32.6944V31.9071H31.2127C22.1822 31.9071 20.3765 25.6088 20.3765 20.0055L20.2372 0ZM0 7.22433C0 12.9205 4.07522 15.0043 8.61369 15.6993H0V32H8.28973C16.6252 32 17.5978 28.2952 17.5978 24.7757C17.5978 20.4688 14.6338 17.459 10.0495 16.3007H17.5978V0H9.30807C0.972554 0 0 3.70477 0 7.22433Z"
        fill="white"
      />
    </svg>
  );
}
