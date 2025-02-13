import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CHAIN_NAME, PROJECT_NAME, SUPPORT_EMAIL } from '@/constants/project';
import { cn } from '@/utils/cn';

import { maxW } from '../utils/styles';

const faqs = [
  {
    question: 'Who qualifies to be a sponsor?',
    answer: `Any team or project that is building in the ${CHAIN_NAME} ecosystem can sponsor a listing on ${PROJECT_NAME}. Size of the team or operations don't matter — you can be a tokenised project or a small grantee; as long as you are building on the ${CHAIN_NAME} blockchain, you can add a listing on ${PROJECT_NAME}.`,
  },
  {
    question: 'How much money do I need to put up?',
    answer: `There is no upper or lower limit of the amount of money you need to put up per listing. However, the compensation offered per listing will affect the distribution (via emails, discord, platform discovery, etc.) that the listing will get.`,
  },
  {
    question: 'Who judges the bounties & projects?',
    answer: `The sponsors are supposed to review, announce, and pay out the winners on ${PROJECT_NAME}. It's super simple to manage your submissions, all within ${PROJECT_NAME}.`,
  },
  {
    question: 'Are there any hidden costs and charges?',
    answer: `None at all!`,
  },
  {
    question: `What can I use ${PROJECT_NAME} for?`,
    answer: `${PROJECT_NAME} is a platform to get work done from crypto-native talent. This can be in the form of boutnies (get the same work done by many people) or hiring freelancers in the form of Project listings.
<br />
${PROJECT_NAME} can be used to get any small to medium scale task done, including but not limited to development, writing, design, research, and product feedback.
<br />`,
  },
  {
    question: `I need help with my listing. How can I get in touch?`,
    answer: `You can get in touch with us at <a style="color: blue" href="mailto:${SUPPORT_EMAIL}" target="_blank">${SUPPORT_EMAIL}</a> and we will get back to you ASAP.`,
  },
];

export function FAQs() {
  return (
    <div
      className="flex w-full flex-col items-center bg-indigo-50 pb-16 pt-8"
      id="faqs"
    >
      <h2
        className={cn(
          'relative w-full text-center font-semibold text-slate-800',
          'text-[2rem] md:text-[3.5rem]',
        )}
      >
        FAQs
      </h2>

      <div
        className={cn(
          'w-full rounded',
          maxW,
          'mx-[1.875rem] px-[1.875rem] lg:mx-[7rem] lg:px-[7rem] xl:mx-[11rem] xl:px-[11rem]',
        )}
      >
        <Accordion collapsible type="single">
          {faqs.map((faq) => (
            <AccordionItem
              className="my-4 rounded border-0 bg-white"
              key={faq.question}
              value={faq.question}
            >
              <AccordionTrigger className="rounded px-3 py-4 text-base font-normal data-[state=open]:bg-black/5 hover:bg-black/5 hover:no-underline">
                <span className="flex-1 text-left">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 pt-2 text-base">
                <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
