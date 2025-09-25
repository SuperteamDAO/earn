import MdCheck from '@/components/icons/MdCheck';
import { cn } from '@/utils/cn';

import { maxW } from '../utils/styles';

export function WhyChooseEarn() {
  return (
    <section className="w-full border-b bg-white py-16 md:py-24">
      <div
        className={cn(
          'mx-auto flex w-full flex-col items-center gap-12 px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
          maxW,
        )}
      >
        <h2 className="text-center text-[2.25rem] leading-[1.1] font-semibold text-slate-800 md:text-[3.25rem]">
          Why Choose Earn?
        </h2>

        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          <div className="flex flex-col items-start gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <MdCheck className="text-emerald-500" size={22} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 md:text-2xl">
              Get Solana Native Talent
            </h3>
            <p className="text-base leading-7 text-slate-500 md:text-lg">
              Instantly tap into a global network of skilled designers,
              developers, and creators eager to solve your problem.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <MdCheck className="text-emerald-500" size={22} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 md:text-2xl">
              Results, Not Resumes
            </h3>
            <p className="text-base leading-7 text-slate-500 md:text-lg">
              Skip interviews and vetting headaches — reward based on actual
              work done, not just claims.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <MdCheck className="text-emerald-500" size={22} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 md:text-2xl">
              Turn Work Into Buzz
            </h3>
            <p className="text-base leading-7 text-slate-500 md:text-lg">
              Each bounty puts your project in front of the entire Solana
              community of builders, creators, and early adopters.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
