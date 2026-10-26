'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { HelpBanner } from '@/features/sponsor-dashboard/components/HelpBanner';

import type { FAQSection } from './page';

export function FaqAccordion({
  sections: faqSections,
}: {
  sections: readonly FAQSection[];
}) {
  return (
    <div className="py=4 px-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <p className="text-3xl font-semibold">Frequently Asked Questions</p>
        <div className="w-[400px]">
          <HelpBanner />
        </div>
      </div>
      <div className="mt-8 space-y-8">
        {faqSections.map((section, index) => (
          <div key={section.title}>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-500">
                {section.title}
              </h2>
              <Accordion type="single" collapsible>
                {section.subsections.map((faq) => (
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
                      {/* Earn's own copy, written above in this repo, never user input. */}
                      {/* oxlint-disable-next-line react/no-danger */}
                      <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            {index < faqSections.length - 1 && (
              <div className="mt-8 mb-12 border-t border-slate-300" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
