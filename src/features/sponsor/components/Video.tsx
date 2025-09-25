import posthog from 'posthog-js';

import { cn } from '@/utils/cn';

import { maxW, maxW2 } from '../utils/styles';
import { HighQualityImage } from './HighQualityImage';

interface Props {
  showVideo: () => void;
}

export function Video({ showVideo }: Props) {
  return (
    <section
      className={cn(
        'relative mx-auto my-5 w-full px-[1.875rem] md:my-24 lg:px-[7rem] xl:px-[11rem]',
        maxW,
      )}
      id="video"
    >
      <div
        className={cn(
          'relative z-1 mx-auto grid w-full items-start gap-6 py-6 md:py-10 lg:grid-cols-2',
          maxW2,
        )}
      >
        <h2 className="text-center text-[2rem] leading-[1.1] font-semibold text-slate-800 md:text-left md:text-[3.5rem]">
          It Takes Less Than 2 Mins To Post
        </h2>
        <p className="text-base text-slate-500 md:text-[1.2rem]">
          You can get started in under two minutes! Our user-friendly dashboard
          makes it as simple as tweeting.
        </p>
      </div>

      <div
        className={cn(
          'ph-no-capture relative mx-auto mt-6 flex w-full items-center justify-center',
          maxW2,
        )}
        onClick={() => {
          posthog?.capture('clicked_video');
          showVideo();
        }}
      >
        <div className="absolute -top-10 h-3/5 w-full scale-x-150 rounded-[0.5rem] bg-slate-50 md:h-3/5 md:scale-x-100" />

        <div className="bg-brand-purple absolute inset-0 z-10 m-auto flex h-fit w-fit cursor-pointer items-center justify-center rounded-full p-3">
          <svg
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_video_play)">
              <path
                d="M14.1667 12.24L21.6325 17L14.1667 21.76V12.24ZM11.3334 7.08337V26.9167L26.9167 17L11.3334 7.08337Z"
                fill="white"
              />
            </g>
            <defs>
              <clipPath id="clip0_video_play">
                <rect width="34" height="34" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>

        <div className="relative w-full overflow-hidden rounded-[0.75rem] bg-white shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06),0px_0px_4px_0px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/70 md:w-10/12">
          <HighQualityImage
            className="block h-full w-full cursor-pointer rounded-none"
            src="/landingsponsor/displays/sponsor-dashboard.webp"
            alt="Sponsor dashboard preview"
          />
        </div>
      </div>
    </section>
  );
}
