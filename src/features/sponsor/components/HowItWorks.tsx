import { cn } from '@/utils/cn';

import { maxW, maxW2 } from '../utils/styles';
import { StepOne } from './steps/One';
import { StepThree } from './steps/Three';
import { StepTwo } from './steps/Two';

function Copy({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex max-w-[28rem] flex-col gap-4">
      <p className="text-[2rem] leading-[1.1] font-semibold text-slate-800 md:text-[2.25rem]">
        {title}
      </p>
      <p className="text-xl tracking-normal text-slate-500">{description}</p>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      className={cn(
        'mx-auto my-8 w-full px-[1.875rem] md:my-24 lg:px-[7rem] xl:px-[11rem]',
        maxW,
      )}
      id="how-it-works"
    >
      <div
        className="mx-auto grid gap-16 md:gap-24"
        style={{ maxWidth: '84rem' }}
      >
        <div
          className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16 ${maxW2}`}
        >
          <div className="order-1 md:order-2">
            <Copy
              title="Write A Brief"
              description="Just explain what you want to achieve, include some rewards, and watch the submissions come in!"
            />
          </div>
          <div className="order-2 flex items-center justify-center rounded-2xl bg-violet-50/60 md:order-1 md:p-6">
            <div className="scale-60 sm:scale-90 lg:scale-100">
              <StepOne />
            </div>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16 ${maxW2}`}
        >
          <div className="order-1 md:order-1">
            <Copy
              title="Builders Submit Entries And Compete"
              description="You will receive dozens (sometimes hundreds) of options to choose from, you only reward the best out of the best."
            />
          </div>
          <div className="order-2 flex items-center justify-center rounded-2xl bg-sky-50 md:order-2 md:p-6">
            <div className="scale-60 sm:scale-90 lg:scale-100">
              <StepTwo />
            </div>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16 ${maxW2}`}
        >
          <div className="order-1 md:order-2">
            <Copy
              title="Pay Winners Without Commissions Or Fees"
              description="All the prize money goes directly to the talent. Superteam Earn takes zero commission on work done through the platform."
            />
          </div>
          <div className="order-2 flex items-center justify-center rounded-2xl bg-emerald-50 md:order-1 md:p-6 md:py-10">
            <div className="scale-60 sm:scale-90 lg:scale-100">
              <StepThree />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
