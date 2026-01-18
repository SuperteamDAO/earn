'use client';

import { X } from '@phosphor-icons/react';
import { useCallback, useEffect } from 'react';

import PrimaryButton from './PrimaryButton';
import Thunder from './Thunder';

interface ModalProps {
  imgurl: string;
  text: string;
  top_content: string;
  points: string[];
  btnText: string;
  btnLink: string;
  onClose: () => void;
}

export default function Modal({
  imgurl,
  text,
  top_content,
  points,
  btnText,
  btnLink,
  onClose,
}: ModalProps) {
  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  return (
    <div
      className="st-modal-backdrop bg-opacity-50 fixed inset-0 col-span-5 flex items-center justify-center bg-black"
      onClick={onClose}
    >
      <div
        className="st-modal-content st-bottom-sheet st-scale-up flex h-fit w-full flex-col overflow-hidden bg-white md:h-[600px] md:w-[95%] md:flex-row md:rounded-lg lg:w-[780px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="left-img relative h-[200px] w-full overflow-hidden md:h-full md:w-1/2">
          <div className="st-modal-overlay absolute inset-0 h-full w-full" />
          <img
            src={imgurl}
            alt={text}
            className="h-full w-full object-cover md:blur-md"
          />
          <div className="text-on-img absolute top-[24px] left-[24px] flex w-5/6 flex-row justify-between text-[24px] text-white md:top-[53px] md:left-[40px] md:text-[32px]">
            <div className="section-heading">{text}</div>
            <div
              className="cross z-11 cursor-pointer md:hidden"
              onClick={onClose}
            >
              <X size={20} color="#727272" weight="duotone" />
            </div>
          </div>
        </div>

        <div className="right relative z-10 flex h-fit w-full flex-col bg-[#161616] text-left text-white md:h-full md:w-1/2 md:rounded-r-lg md:rounded-b-lg md:rounded-bl-none">
          <div
            className="cross mt-[46px] mr-[64px] hidden cursor-pointer self-end md:block"
            onClick={onClose}
          >
            <X size={30} />
          </div>
          <div className="top-content mt-[32px] mr-[105px] ml-[32px] w-fit text-[14px] leading-[19px] md:mr-0 md:ml-[64px] md:w-[230px] md:text-[18px] md:leading-[19px]">
            {top_content}
          </div>
          <div className="modal-points mr-[80px] ml-[36px] w-fit text-[14px] md:mr-[64px] md:ml-[64px] md:w-[250px] md:text-[18px]">
            {points.map((point, index) => (
              <div
                key={index}
                className={`point${index + 1} mt-${index === 0 ? '[32px]' : '[12px]'} flex flex-row gap-4`}
              >
                <span className="mt-2 self-center md:mt-2">
                  <Thunder size={16} />
                </span>
                <p className="mt-2">{point}</p>
              </div>
            ))}
          </div>
          <div className="mt-[32px] mb-[34px] ml-[32px] md:ml-[64px]">
            <PrimaryButton className="bg-white" href={btnLink}>
              {btnText}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
