import Image from 'next/image';
import Link from 'next/link';
import posthog from 'posthog-js';

const BACKGROUND_IMAGE =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/v1789989342/assets/hackathon/next-stop-breakpoint/road-to-bp.png';

export function HomeNextStopBreakpointBanner() {
  return (
    <Link
      href="/earn/next-stop-breakpoint"
      className="group relative mx-auto flex h-full min-h-64 w-full flex-col overflow-hidden rounded-lg p-5 text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 md:p-10"
      prefetch={false}
      onClick={() => {
        posthog.capture('next_stop_breakpoint_home_banner');
      }}
    >
      <div className="absolute inset-0 overflow-hidden bg-slate-900">
        <Image
          src={BACKGROUND_IMAGE}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 1280px"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" />

      <h1 className="relative z-10 max-w-[22rem] text-2xl leading-[120%] font-bold md:max-w-[30rem] md:text-[28px]">
        Next Stop Breakpoint
      </h1>
      <p className="relative z-10 mt-2.5 max-w-[30rem] text-sm leading-[130%] [text-shadow:_0_1px_2px_rgb(0_0_0_/1)] md:mt-4 md:text-lg">
        Submit to bounties for a chance to win Breakpoint tickets.
      </p>
      <div className="relative z-10 mt-auto flex pt-4">
        <span className="ph-no-capture inline-flex min-h-10 w-full items-center justify-center rounded-md bg-white px-9 py-3 text-sm font-medium text-slate-900 transition-colors group-hover:bg-slate-100 group-focus-visible:bg-slate-100 md:w-auto">
          View Bounties
        </span>
      </div>
    </Link>
  );
}
