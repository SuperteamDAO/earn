import { type Dispatch, type SetStateAction } from 'react';
import { AiOutlineCheck } from 'react-icons/ai';

import { cn } from '@/utils';

interface Props {
  currentStep: number;
  thisStep: number;
  label: string;
  sublabel?: string;
  setStep?: Dispatch<SetStateAction<number>>;
}

export const Steps = ({ currentStep, thisStep, label, setStep }: Props) => {
  const handleChange = () => {
    if (currentStep > thisStep && setStep) {
      setStep(thisStep);
    }
  };

  const isActive = currentStep === thisStep;
  const isCompleted = currentStep > thisStep;

  return (
    <div
      className={cn(
        'relative flex h-24 items-center justify-center',
        currentStep > thisStep ? 'cursor-pointer' : 'cursor-default',
      )}
      onClick={handleChange}
    >
      <div
        className={cn(
          'flex h-[2.3rem] w-[2.3rem] items-center justify-center rounded-full',
          currentStep >= thisStep
            ? 'bg-[#6562FF] text-white'
            : 'bg-transparent',
          currentStep <= thisStep - 1 && 'border border-slate-400',
        )}
      >
        {isCompleted ? (
          <AiOutlineCheck className="text-white" size={16} />
        ) : (
          <div className="flex">
            <span
              className={cn(
                'h-full text-center text-base',
                isActive ? 'text-white' : 'text-slate-500',
              )}
            >
              {thisStep}
            </span>
          </div>
        )}
      </div>
      <span
        className={cn(
          'absolute bottom-0 flex w-max items-center justify-center',
          'text-[0.9rem] md:text-base',
          isActive
            ? 'font-semibold text-brand-purple'
            : 'font-medium text-slate-500',
        )}
      >
        {label}
      </span>
    </div>
  );
};
