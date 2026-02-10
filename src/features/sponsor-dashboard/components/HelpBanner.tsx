import posthog from 'posthog-js';

import MdOutlineChatBubbleOutline from '@/components/icons/MdOutlineChatBubbleOutline';
import { LocalImage } from '@/components/ui/local-image';
import { JTTG } from '@/constants/Telegram';

export const HelpBanner = () => {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-white xl:bg-indigo-50 xl:px-8 xl:py-5">
      <a
        className="ph-no-capture no-underline"
        href={JTTG}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => posthog.capture('message pratik_sponsor')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 xl:gap-0">
            <LocalImage
              className="mr-2 size-8 xl:mr-3 xl:size-[3.3rem]"
              alt="message pratik"
              src={'/assets/sponsor/jill.png'}
            />
            <div className="flex gap-2 xl:block">
              <p className="text-sm font-semibold whitespace-nowrap text-slate-900 xl:text-base">
                Stuck somewhere?
              </p>
              <p className="text-sm font-semibold whitespace-nowrap text-slate-500 xl:text-base">
                Message Us
              </p>
            </div>
          </div>
          <MdOutlineChatBubbleOutline
            color="#1E293B"
            size={20}
            className="xl:hidden"
          />
          <MdOutlineChatBubbleOutline
            color="#1E293B"
            size={24}
            className="hidden xl:block"
          />
        </div>
      </a>
    </div>
  );
};
