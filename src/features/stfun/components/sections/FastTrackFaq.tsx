'use client';

import { useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

const initialFaqs: FaqItem[] = [
  {
    question: 'Who is eligible to apply?',
    answer:
      'This program is exclusive for Superteam Members. All Global Superteam Members are eligible to apply.',
    open: false,
  },
  {
    question: 'How much does this cost?',
    answer: '$0.',
    open: false,
  },
  {
    question: 'How long does it take to get accepted?',
    answer:
      'This varies from program to program but applicants normally receive feedback within 1-2 weeks from the final application deadline.',
    open: false,
  },
  {
    question: 'Does fast track mean I get a guaranteed spot in the program?',
    answer:
      'This program is an attempt to grant exclusive perks to Superteam Members and does not guarantee that the applications will get accepted.',
    open: false,
  },
];

export default function FastTrackFaq() {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);

  const toggle = (index: number) => {
    setFaqs(
      faqs.map((faq, i) => {
        if (i === index) {
          return { ...faq, open: !faq.open };
        }
        return { ...faq, open: false };
      }),
    );
  };

  return (
    <div className="faq-container relative right-1/2 left-1/2 z-1 col-span-5 -mt-[70px] -mb-[50px] flex h-fit w-screen -translate-x-1/2 items-center justify-center bg-black md:-mt-[250px] md:-mb-[20px] md:h-fit md:rounded-[64px] lg:-mb-[30px]">
      <div className="faq-overlay absolute hidden h-full w-full md:block" />
      <img
        src={`${ASSET_URL}/st/fast-tracks/FAQ.png`}
        loading="lazy"
        alt=""
        className="faq-image h-[690px] object-cover md:rounded-[64px] lg:h-fit"
      />
      <div className="faq-content-container absolute flex h-[800px] w-full flex-col items-center md:h-full md:justify-center">
        <p className="faq-header-text">Your questions, answered</p>
        <p className="faq-description-text">
          If you have any further questions, reach out to Noe{' '}
          <a
            href="https://x.com/rieker_noe"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            here
          </a>
        </p>
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <button className="faq-question" onClick={() => toggle(index)}>
              {faq.question}
              <span className="faq-icon">{faq.open ? '▲' : '▼'}</span>
            </button>
            <div
              className={`answer-wrapper ${faq.open ? 'answer-open' : 'answer-closed'}`}
            >
              <p className="faq-answer">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
