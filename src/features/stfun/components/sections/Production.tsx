'use client';

import { useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';

import IllustrationCard from '../cards/IllustrationCard';
import Modal from '../common/Modal';

interface ModalContent {
  top_content: string;
  text: string;
  imgurl: string;
  points: string[];
  btnText: string;
  btnLink: string;
}

export default function Production() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);

  const openModal = (content: ModalContent) => {
    setModalContent(content);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
  };

  return (
    <div className="productions-container relative col-span-5 mt-[224px] flex flex-col justify-center text-center">
      {modalOpen && modalContent && (
        <Modal
          imgurl={modalContent.imgurl}
          text={modalContent.text}
          top_content={modalContent.top_content}
          points={modalContent.points}
          btnText={modalContent.btnText}
          btnLink={modalContent.btnLink}
          onClose={closeModal}
        />
      )}

      <div className="bg-images absolute right-1/2 left-1/2 flex h-full w-screen -translate-x-1/2 flex-col lg:flex-row">
        {/* Mobile */}
        <picture className="block md:hidden">
          <img
            src={`${ASSET_URL}/st/images/mid-light.png`}
            alt=""
            loading="lazy"
            style={{ width: 'calc(100% + 100px)', transform: 'scale(2.0)' }}
            className="midlight-sm -mt-[100px] -mr-[200px] h-[300px] w-full justify-items-center overflow-visible object-cover"
          />
        </picture>

        {/* Tablet */}
        <picture className="hidden md:block lg:hidden">
          <img
            src="/assets/images/top-light.svg"
            alt=""
            loading="lazy"
            className="absolute -mt-[600px] h-full w-full justify-items-start md:mt-0 md:h-[50%] md:w-full md:max-w-full md:overflow-y-visible md:object-cover"
          />
        </picture>
        <picture className="hidden md:block lg:hidden">
          <img
            src={`${ASSET_URL}/st/images/mid-light.png`}
            alt=""
            loading="lazy"
            className="midlight left-[21%] -mt-[200px] h-fit justify-items-center"
          />
        </picture>
        <picture className="hidden md:block lg:hidden">
          <img
            src="/assets/images/top-right-light.svg"
            alt=""
            loading="lazy"
            className="absolute top-0 right-0 -mt-[100px] -mr-[50px] w-3/5 scale-150 justify-items-end"
          />
        </picture>
        <picture className="hidden md:block lg:hidden">
          <img
            src="/assets/images/bottom-light.svg"
            alt=""
            loading="lazy"
            className="absolute right-0 z-10 -mt-[250px] h-1/2 w-1/2 justify-items-end"
          />
        </picture>

        {/* Desktop */}
        <picture className="hidden lg:block">
          <img
            src="/assets/images/left-light.svg"
            alt=""
            loading="lazy"
            className="leftlight absolute -mt-[62px] justify-items-start lg:left-0 lg:h-full lg:w-2/3"
          />
        </picture>
        <picture className="hidden lg:block">
          <img
            src={`${ASSET_URL}/st/images/mid-light.png`}
            alt=""
            loading="lazy"
            className="midlight absolute top-0 left-[21%] h-fit w-[900px] justify-items-center min-[2000px]:left-[32%] lg:-mt-[192px] lg:w-[900px]"
          />
        </picture>
        <picture className="hidden lg:block">
          <img
            src="/assets/images/right-light.svg"
            alt=""
            loading="lazy"
            className="rightlight absolute z-10 -mt-[222px] w-full justify-items-end lg:right-0 lg:h-full lg:w-3/4"
          />
        </picture>
      </div>

      <div className="prod-head">
        <p className="font-secondary relative text-xl leading-[22px] font-semibold text-white">
          superteam
        </p>
        <div className="section-heading relative text-[40px] leading-[44px] md:text-[50px] lg:leading-[54px]">
          productions
        </div>
      </div>

      <div className="all-cards-wrapper mt-[68px] flex items-center justify-center lg:mt-0">
        <div className="cards-container flex max-w-[240px] flex-col gap-x-8 sm:max-w-full sm:gap-y-8 md:grid">
          <IllustrationCard
            text="Earn"
            imageUrl={`${ASSET_URL}/st/cards/Earn_new.png`}
            className="min-h-[300px] min-w-[240px] md:col-start-1 md:row-start-2 md:row-end-4 lg:row-start-1 lg:row-end-3"
            onClick={() =>
              openModal({
                top_content:
                  'our very own job listing and bounty platform to find every earning opportunity in solana',
                text: 'Earn',
                imgurl: `${ASSET_URL}/st/cards/Earn_new.png`,
                points: [
                  '1,000+ verified user profiles',
                  'Global pay standards',
                  'End-to-end bounty management',
                ],
                btnText: 'Start Earning',
                btnLink: 'https://earn.superteam.fun',
              })
            }
          />
          <IllustrationCard
            className="min-h-[300px] min-w-[240px] md:col-start-1 md:row-start-8 md:row-end-10 lg:col-start-3 lg:row-start-1 lg:row-end-3"
            text="Idea Bank"
            imageUrl={`${ASSET_URL}/st/cards/Build_new.png`}
            onClick={() => window.open('https://build.superteam.fun', '_blank')}
          />
          <IllustrationCard
            className="min-h-[300px] min-w-[240px] md:col-start-1 md:row-start-5 md:row-end-7 lg:col-start-2 lg:row-start-2 lg:row-end-5"
            text="Instagrants"
            imageUrl={`${ASSET_URL}/st/cards/Instagrants_new.png`}
            onClick={() =>
              openModal({
                top_content:
                  'get grants to get started with your dream code, content, and community projects from our partners',
                text: 'Instagrants',
                imgurl: `${ASSET_URL}/st/cards/Instagrants_new.png`,
                points: [
                  'application takes less than 2 mins',
                  '$1-$10,000 grants',
                  'paid out every week',
                ],
                btnText: 'Apply now!',
                btnLink: 'https://earn.superteam.fun/grants/',
              })
            }
          />
          <IllustrationCard
            className="min-h-[300px] min-w-[240px] md:col-start-2 md:row-start-4 md:row-end-6 lg:col-start-2 lg:row-start-6 lg:-row-end-1"
            text="Superteam Handbook"
            imageUrl={`${ASSET_URL}/st/cards/founders_league_new.png`}
            onClick={() =>
              window.open(
                'https://docs.superteam.fun/the-superteam-handbook/',
                '_blank',
              )
            }
          />
          <IllustrationCard
            className="min-h-[300px] min-w-[240px] md:col-start-2 md:row-start-1 md:row-end-3 lg:col-start-1 lg:row-start-4 lg:row-end-7"
            text="Members' Lounge"
            imageUrl={`${ASSET_URL}/st/cards/ecosystem_calls_new.png`}
            onClick={() =>
              window.open(
                'https://x.com/superteam/status/1852284030537900442',
                '_blank',
              )
            }
          />
          <IllustrationCard
            className="min-h-[300px] min-w-[240px] md:col-start-2 md:row-start-7 md:row-end-6 lg:col-start-3 lg:row-start-4 lg:row-end-7"
            text="Fast Track"
            imageUrl={`${ASSET_URL}/st/cards/alphasquad_new.png`}
            onClick={() =>
              window.open('https://superteam.fun/fast-track/', '_blank')
            }
          />
        </div>
      </div>
    </div>
  );
}
