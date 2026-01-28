'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

import PrimaryButton from './PrimaryButton';

interface AccordionProps {
  image: string;
  heading: string;
  subheading: string;
  content: string;
  btnText: string;
  btnLink: string;
}

export default function Accordion({
  image,
  heading,
  subheading,
  content,
  btnText,
  btnLink,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null);
  const isImageLoaded = loadedImageSrc === image;

  const toggleAccordion = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  };

  const handleImageLoad = () => {
    setLoadedImageSrc(image);
  };

  return (
    <div className="accordion-overlay z-1 rounded-lg object-cover">
      <div
        className={cn(
          'st-accordion flex w-full cursor-pointer flex-col rounded-lg text-white',
          isOpen ? 'accordion-open' : 'accordion-closed',
        )}
        onClick={toggleAccordion}
      >
        <div className="flex h-[100px] flex-row justify-between">
          <div
            className={cn(
              'h-container flex w-full flex-col text-left md:flex-row md:items-center',
            )}
          >
            <div
              className={cn(
                'font-secondary relative z-20 ml-[32px] text-left text-[24px] leading-[26px] font-semibold max-[360px]:text-[20px] md:ml-[64px]',
                isOpen ? 'max-md:pb-[32px]' : '',
              )}
            >
              <p>{heading}</p>
            </div>
            <div
              className={cn(
                'font-primary relative z-20 ml-[32px] text-[18px] leading-[24px] font-medium max-[360px]:text-[15px] max-md:mt-[8px] md:ml-[48px]',
                isOpen ? 'hidden' : 'visible',
              )}
            >
              <p>{subheading}</p>
            </div>
          </div>
          <div className="image-container h-fit">
            <div
              className={cn(
                'gradient-overlay pointer-events-none absolute -ml-[56px] hidden md:block',
                isOpen
                  ? 'accordion-image z-10 md:w-[263px]'
                  : 'accordion-image-closed z-10 overflow-hidden md:w-[263px]',
              )}
            />
            <img
              src={image}
              alt=""
              onLoad={handleImageLoad}
              className={cn(
                'st-no-fade',
                isOpen
                  ? 'accordion-image absolute w-full max-md:left-0 max-md:z-0 md:relative md:w-[400px]'
                  : 'accordion-image-closed absolute w-full overflow-hidden max-md:left-0 max-md:z-0 md:relative md:w-[400px]',
                isImageLoaded ? 'loaded' : '',
              )}
            />
          </div>
        </div>
        <div
          className={cn(
            'ml-[32px] h-fit text-left md:mt-[16px] md:ml-[64px] md:w-[267px]',
            'accordion-content',
          )}
        >
          <div className="font-primary text-[18px] leading-[24px] max-[360px]:text-[15px]">
            <p>{content}</p>
          </div>
        </div>
        <div className="accordion-btn mt-[51px] ml-[32px] w-fit md:ml-[64px]">
          <PrimaryButton className="w-fit bg-white" href={btnLink}>
            {btnText}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
