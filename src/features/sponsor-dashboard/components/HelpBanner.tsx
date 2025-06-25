import posthog from 'posthog-js';
import React from 'react';
import { MdOutlineChatBubbleOutline } from 'react-icons/md';

import { LocalImage } from '@/components/ui/local-image';
import { PDTG } from '@/constants/Telegram';

export const HelpBanner = () => {
  return (
    <div className="rounded-md border border-slate-200 bg-indigo-50 px-8 py-5 text-white">
      <a
        className="ph-no-capture no-underline"
        href={PDTG}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => posthog.capture('message pratik_sponsor')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LocalImage
              className="mr-3 h-[3.3rem] w-[3.2rem]"
              alt="message pratik"
              src={'/assets/sponsor/pratik.webp'}
            />
            <div>
              <p className="font-semibold whitespace-nowrap text-slate-900">
                Stuck somewhere?
              </p>
              <p className="font-semibold whitespace-nowrap text-slate-500">
                Message Us
              </p>
            </div>
          </div>
          <MdOutlineChatBubbleOutline color="#1E293B" size={24} />
        </div>
      </a>
    </div>
  );
};
