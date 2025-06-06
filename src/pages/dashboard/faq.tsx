import React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SponsorLayout } from '@/layouts/Sponsor';

import { HelpBanner } from '@/features/sponsor-dashboard/components/HelpBanner';

const faqs = [
  {
    question: 'Who qualifies to be a sponsor?',
    answer: `Any team or project that is building in the Solana ecosystem can sponsor a listing on Superteam Earn. Size of the team or operations don't matter — you can be a tokenised project or a small grantee; as long as you are building on the Solana blockchain, you can add a listing on Earn.`,
  },
  {
    question: 'How much money do I need to put up?',
    answer: `There is no upper or lower limit of the amount of money you need to put up per listing. However, the compensation offered per listing will affect the distribution (via emails, discord, platform discovery, etc.) that the listing will get.`,
  },
  {
    question: 'Who judges the bounties & projects?',
    answer: `The sponsors are supposed to review, announce, and pay out the winners on Superteam Earn. It's super simple to manage your submissions, all within Earn.`,
  },
  {
    question: 'Are there any hidden costs and charges?',
    answer: `None at all!`,
  },
  {
    question: 'What can I use Superteam Earn for?',
    answer: `Superteam Earn is a platform to get work done from crypto-native talent. This can be in the form of boutnies (get the same work done by many people) or hiring freelancers in the form of Project listings.
<br />
Earn can be used to get any small to medium scale task done, including but not limited to development, writing, design, research, and product feedback.
<br />
<a style="color: blue" href="https://in.superteam.fun/bounty-menu" target="_blank" >Click here</a> to access the Listings Menu, which contains ideas, listing examples, suggested prize ranges, etc.`,
  },
  {
    question: 'I need help with my listing. How can I get in touch?',
    answer: `You can get in touch with us at <a style="color: blue" href="mailto:support@superteamearn.com" target="_blank">support@superteamearn.com</a> and we will get back to you ASAP.`,
  },
];

export default function FAQ() {
  return (
    <SponsorLayout>
      <div className="py=4 px-8">
        <div className="flex items-center justify-between">
          <p className="text-3xl font-semibold">Frequently Asked Questions</p>
          <div className="w-[400px]">
            <HelpBanner />
          </div>
        </div>
        <Accordion type="multiple">
          {faqs.map((faq) => (
            <AccordionItem
              className="my-5 rounded-lg border border-slate-200 bg-white"
              key={faq.question}
              value={faq.question}
            >
              <AccordionTrigger className="rounded px-5 py-5 text-base font-normal hover:bg-slate-200/5 hover:no-underline">
                <span className="flex-1 text-left text-lg font-medium">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-6 text-base text-slate-700">
                <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SponsorLayout>
  );
}
