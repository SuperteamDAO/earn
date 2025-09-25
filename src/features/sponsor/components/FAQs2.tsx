import { SupportFormDialog } from '@/components/shared/SupportFormDialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { domPurify } from '@/lib/domPurify';

import { maxW } from '../utils/styles';

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
export function FAQs2() {
  return (
    <div className="w-full bg-white py-10 md:py-16" id="faqs">
      <div
        className={`${maxW} mx-[1.875rem] grid grid-cols-1 gap-8 md:grid-cols-2 lg:mx-[7rem] xl:mx-[11rem]`}
      >
        <div className="max-w-md space-y-4">
          <p className="text-sm font-semibold text-indigo-600">FAQs</p>
          <h2 className="text-[2rem] leading-[1.1] font-semibold text-slate-900 md:text-[3.25rem]">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-slate-600 md:text-lg">
            Here are the most commonly asked questions. Feel free to{' '}
            <SupportFormDialog>
              <span className="cursor-pointer text-indigo-600 underline">
                reach out
              </span>
            </SupportFormDialog>{' '}
            if you have any other questions!
          </p>
        </div>

        <div>
          <Accordion collapsible type="single">
            {faqs.map((faq) => (
              <AccordionItem
                className="my-4 rounded-lg border border-slate-200 bg-white shadow-sm"
                key={faq.question}
                value={faq.question}
              >
                <AccordionTrigger className="rounded px-4 py-4 text-base font-normal hover:bg-black/5 hover:no-underline data-[state=open]:bg-black/5">
                  <span className="flex-1 text-left">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-5 text-base text-slate-700 [&_a]:text-blue-700 [&_a]:underline">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: domPurify(faq.answer),
                    }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
