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
        'Superteam Earn is a platform where anyone can earn crypto by completing bounties, applying to projects, or securing grants from teams across the Solana ecosystem. Create a profile, showcase your work, and get rewarded for contributing to real products.',
    },
    {
      question: 'How does Superteam Earn work?',
      answer:
        'Sponsors post opportunities such as bounties, projects, and grants. Anyone can apply or submit work, and rewards are distributed once the work is reviewed and approved. Everything happens through a single profile so your contributions build over time.',
    },
    {
      question: 'Who is it for?',
      answer:
        'Anyone building in web3 — developers, designers, writers, researchers, community contributors, and operators — can participate. Whether you\'re new to crypto or already experienced, you can start contributing and earning.',
    },
    {
      question: 'What\'s the difference between bounties, projects, and grants?',
      answer:
        'Bounties are short-term tasks where multiple participants submit work. Projects are longer-term roles where one applicant is selected to collaborate with a team. Grants provide equity-free funding to help builders develop larger ideas or products.',
    },
    {
      question: 'How do I get started?',
      answer:
        'Create your profile, explore crypto bounties or web3 opportunities, and submit your work. Completing smaller tasks helps you build a track record and unlock better opportunities (PRO) over time.',
    },
  ],
  '/earn/bounties': [
    {
      question: 'What are crypto bounties?',
      answer:
        'A crypto bounty is a task posted by a team where anyone can submit work to earn rewards. Sponsors publish bounty listings with clear requirements, participants submit before the deadline, and the best entries are selected based on quality and alignment with the brief. Payments are typically made in USDC, SOL, or other tokens.',
    },
    {
      question: 'Who should apply to crypto bounties?',
      answer:
        'Bounties are ideal for developers, designers, writers, researchers, and community contributors who want to build proof of work, grow their portfolio, and earn crypto for short-term tasks.',
    },
    {
      question: 'Are crypto bounties beginner friendly?',
      answer:
        'Yes. Many bounties are designed for newcomers looking to gain experience in Web3. Completing smaller tasks helps you build a track record.',
    },
    {
      question: 'How do I increase my chances of winning a bounty?',
      answer:
        'Read the requirements carefully, follow submission guidelines, and focus on quality rather than speed. Strong submissions usually demonstrate clear thinking, creativity, and attention to detail.',
    },
  ],
  '/earn/projects': [
    {
      question: 'How do Projects work?',
      answer:
        'Sponsors post project listings describing the scope, timeline, and compensation. You apply with your Earn profile and a short pitch explaining why you are the right fit. The sponsor reviews applications, selects a freelancer, and work begins. Once completed, you get paid in crypto tokens like USDC, SOL, or other tokens.',
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
