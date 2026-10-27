import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { domPurify } from '@/lib/domPurify';

export interface HackathonFAQ {
  question: string;
  // HTML string; sanitized with domPurify before rendering.
  answer: string;
}

interface HackathonFAQsProps {
  faqs: HackathonFAQ[];
}

export const HackathonFAQs = ({ faqs }: HackathonFAQsProps) => {
  return (
    <div className="mt-4 flex flex-col items-center px-1 py-8 md:mt-8">
      <h2 className="pb-2 text-4xl font-bold md:text-5xl">FAQ</h2>
      <div className="w-full max-w-[35rem]">
        <Accordion type="single" collapsible>
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.question}
              value={faq.question}
              className="my-4 rounded-lg border shadow-md"
            >
              <AccordionTrigger className="rounded px-4 py-3 text-left font-normal text-slate-500 hover:bg-black/5 hover:no-underline focus:no-underline data-[state=open]:bg-black/5">
                <span className="flex-1 text-left text-sm sm:text-base">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-3 text-sm text-slate-700 sm:text-base [&_a]:text-blue-700">
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
  );
};
