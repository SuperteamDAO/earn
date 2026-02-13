'use client';

import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { cn } from '@/utils/cn';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_BY_PAGE: Record<string, FaqItem[]> = {
  '/earn': [
    {
      question: 'What is Superteam Earn?',
      answer:
        'Superteam Earn is the leading platform for crypto bounties, web3 jobs, and Solana ecosystem opportunities. It connects talented freelancers and builders with top crypto projects looking for development, design, content, and growth support.',
    },
    {
      question: 'Who is it for?',
      answer:
        'Whether you are a developer, designer, writer, or community builder, Superteam Earn helps you find paid crypto work that matches your skills. Both newcomers exploring web3 and experienced professionals can find opportunities here.',
    },
    {
      question: 'What can you do here?',
      answer:
        'Browse and complete bounties for quick payouts, apply to longer-term freelance projects, or discover crypto grants to fund your ideas. All earnings are paid in crypto tokens like USDC and SOL.',
    },
  ],
  '/earn/bounties': [
    {
      question: 'How do Bounties work?',
      answer:
        'Sponsors post bounties with clear requirements, deadlines, and reward amounts. You browse open bounties, complete the task, and submit your work before the deadline. Sponsors review all submissions and select winners who receive the posted reward in crypto. No interviews or lengthy applications — just deliver quality work and get paid.',
    },
    {
      question: 'Who should apply to Bounties?',
      answer:
        'Bounties are ideal for developers, designers, writers, and marketers who want to earn crypto by completing well-defined tasks. Whether you are new to web3 or an experienced contributor, bounties let you build a track record, earn tokens like USDC and SOL, and connect with leading Solana projects.',
    },
  ],
  '/earn/projects': [
    {
      question: 'How do Projects work?',
      answer:
        'Sponsors post project listings describing the scope, timeline, and compensation. You apply with your Earn profile and a short pitch explaining why you are the right fit. The sponsor reviews applications, selects a freelancer, and work begins. Once completed, you get paid in crypto tokens like USDC or SOL.',
    },
    {
      question: 'Who should apply to Projects?',
      answer:
        'Projects are best suited for experienced freelancers who want longer-term crypto engagements. If you are a full-stack developer, smart contract engineer, UI/UX designer, or content strategist, projects give you the chance to work closely with top Solana teams on meaningful deliverables.',
    },
    {
      question: 'Projects vs Bounties?',
      answer:
        'Bounties are open competitions where anyone can submit work and winners are selected from all entries. Projects are more like traditional freelance gigs — you apply, get selected, and then complete the work. Projects typically involve larger scopes and higher payouts, while bounties offer faster turnaround and lower barriers to entry.',
    },
  ],
  '/earn/grants': [
    {
      question: 'How do Grants work?',
      answer:
        'Crypto grants provide equity-free funding for builders and creators in the Solana ecosystem. Browse available grants from top protocols and foundations, submit your proposal describing your project and milestones, and receive funding to bring your idea to life. No equity taken, no lengthy VC processes — just fast, direct support for builders.',
    },
    {
      question: 'Who should apply for Grants?',
      answer:
        'Grants are designed for developers, researchers, artists, and creators building on Solana and in the broader web3 space. Whether you are launching a new protocol, creating developer tooling, producing educational content, or building community infrastructure, there are grants available to support your work.',
    },
  ],
};

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between py-2.5 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium text-slate-600">
          {item.question}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isOpen ? 'grid-rows-[1fr] pb-3' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <p className="text-xs leading-relaxed text-slate-400">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SeoFaq() {
  const router = useRouter();
  const path = router.asPath.split('?')[0]?.replace(/\/$/, '') || '/earn';
  const faqs = FAQ_BY_PAGE[path];

  if (!faqs) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-400">FAQ</p>
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-4">
        {faqs.map((faq) => (
          <FaqAccordionItem key={faq.question} item={faq} />
        ))}
      </div>
    </div>
  );
}
