import React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SponsorLayout } from '@/layouts/Sponsor';

import { HelpBanner } from '@/features/sponsor-dashboard/components/HelpBanner';

interface FAQSection {
  readonly title: string;
  readonly subsections: readonly {
    readonly question: string;
    readonly answer: string;
  }[];
}

const faqSections: readonly FAQSection[] = [
  {
    title: 'Getting Started',
    subsections: [
      {
        question: 'What can I use Superteam Earn for?',
        answer: `Superteam Earn is a platform to get work done from crypto-native talent. This can be in the form of bounties (get the same work done by many people) or hiring freelancers in the form of Project listings. Earn can be used to get any small to medium-scale task done, including but not limited to development, writing, design, research, and product feedback.
<br />
<br />
<a style="color: blue" href="https://in.superteam.fun/bounty-menu" target="_blank">Click here</a> to access the Listings Menu, which contains ideas, listing examples, suggested prize ranges, etc.`,
      },
      {
        question: 'Are there any hidden charges to publish a listing?',
        answer: `No! Superteam Earn is completely free to use. There are no listing or platform fees.`,
      },
      {
        question: 'How much money do I need to put up?',
        answer: `There's no minimum or maximum limit. However, the reward amount influences visibility — higher-value listings may receive better distribution (via email, Discord, platform discovery, etc.).`,
      },
      {
        question: 'What kind of distribution do sponsors get from Earn?',
        answer: `When you publish a listing on Superteam Earn, it can be distributed across multiple high-visibility channels, including:
<br />
<br />
<strong>1. Homepage:</strong> Your listing will be featured on the Earn homepage, which receives <strong>50,000 monthly active users</strong> actively browsing for work opportunities.
<br />
<strong>2. Discord Bot:</strong> Listings are shared in real-time in relevant Superteam Discord channels across Superteam discords.
<br />
<strong>3. X:</strong> Listings with <strong>rewards over $1,000</strong> are amplified to reach a global audience via Superteam Earn's <a style="color: blue" href="http://x.com/superteamearn" target="_blank">X</a> profile.
<br />
<strong>4. Email Blasts:</strong> Listings may be included in curated newsletters depending on factors like reward size, sponsor reputation, and past engagement reaching, Earn's users' inbox directly.`,
      },
      {
        question: 'How can I get extra distribution for my listing?',
        answer: `Distribution is influenced primarily by the <strong>reward value</strong> and <strong>listing quality.</strong> For example:
<br />
<br />
• Listings with <strong>rewards under $100</strong> are not featured on the homepage.
<br />
• Listings with <strong>rewards above $1,000</strong> are amplified via our <a style="color: blue" href="http://x.com/superteamearn" target="_blank">X</a> and are more likely to be included in <strong>email blasts</strong> and other community channels.
<br />
<br />
<strong>Tip:</strong> Well-written scopes, clear evaluation criteria, and generous prizes tend to get more attention from both the community and the Earn distribution channels.`,
      },
    ],
  },
  {
    title: 'Creating & Managing Listings',
    subsections: [
      {
        question: 'How do I create a new listing?',
        answer: `On your dashboard, click the "Create New Listing" button. You'll be guided to the listing builder page where you can select the type (Bounty or Project), add scope of work, timeline, evaluation criteria, rewards, and more.`,
      },
      {
        question:
          'Do I need to verify my listing before publishing? How can I verify my listing?',
        answer: `<ul class="list-disc space-y-2 pl-5"><li>If you're a <strong>new sponsor</strong>, you'll need to verify your listing before it can be published.</li><li>If you're an <strong>existing sponsor</strong> but your profile has been flagged due to past activity — for example, having listings that already past their deadline and are "In Review" — you'll also be required to complete verification for new listings.</li></ul>
<br />
<strong>How to verify your listing:</strong>
<br />
After publishing your listing, you'll be prompted to fill out a short verification form. This helps us maintain trust on the platform and keep bad actors out. Once verified, your listing will automatically go live.
<br />
<br />
<strong>Pro tip:</strong> For faster verification, get referred by a <strong>Superteam Lead</strong> and mention their name in the <strong>"Reference"</strong> field of the form.
<br />
<em>Note: We aim to complete all verifications within 24 hours.</em>`,
      },
      {
        question: 'Can I edit a listing after it is published?',
        answer: `Yes, listings can be edited after publishing and until the deadline, but we discourage sponsors from making major changes, such as altering the scope of work, eligibility criteria, or judging guidelines, for the sake of fairness and transparency.`,
      },
      {
        question: 'How do I check the status of my listings?',
        answer: `All your listings are shown on your dashboard, each listing is labeled with statuses like Draft, In Progress, In Review, Payment Pending, or Completed. Use filters to sort and manage listings easily.`,
      },
      {
        question: 'Can I duplicate an existing listing?',
        answer: `Yes! Go to the three-dot menu on your dashboard on any previous listing and click <strong>"Duplicate"</strong> to reuse its structure. You can also choose from predefined templates using the <strong>Browse Templates</strong> option while creating a new listing.`,
      },
      {
        question: 'What is the difference between Podium and Bonus spots?',
        answer: `<ol class="list-decimal list-inside space-y-6">
<li>
  <strong>Podium:</strong>
  <ul class="list-disc space-y-2 pl-5 mt-2">
    <li>Ranked winners (1st, 2nd, 3rd, etc.). Each position can have a different reward / prize.</li>
    <li>You can add up to <strong>10 podium spots</strong>.</li>
  </ul>
</li>
<li>
  <strong>Bonus Spots:</strong>
  <ul class="list-disc space-y-2 pl-5 mt-2">
    <li>Multiple winners will receive the same reward amount.</li>
    <li>You can add up to <strong>300 bonus spots</strong>.</li>
  </ul>
</li>
</ol>`,
      },
      {
        question: 'Where can I see all submissions?',
        answer: `Click on the listing you want to view in your dashboard to see all submissions, or the "Submissions" button along side the title. You'll be able to view submission details like the user's wallet address, email, or application, etc.`,
      },
      {
        question: 'Can I label or categorize submissions?',
        answer: `Yes! Use custom labels such as <span class="inline-flex items-center rounded-full border border-amber-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-amber-600 capitalize select-none whitespace-nowrap">Unreviewed</span>, <span class="inline-flex items-center rounded-full border border-blue-300 bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-600 capitalize select-none whitespace-nowrap">Reviewed</span>, <span class="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-600 capitalize select-none whitespace-nowrap">Winner</span>, <span class="inline-flex items-center rounded-full border border-purple-300 bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-600 capitalize select-none whitespace-nowrap">Shortlisted</span>, and <span class="inline-flex items-center rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600 capitalize select-none whitespace-nowrap">Spam</span> to manage and organize submissions before announcing winners.`,
      },
      {
        question: 'What happens if I mark a submission as "Spam"?',
        answer: `Marking a submission as spam deducts one submission credit from the applicant's total credits and flags it in our system.
<br />
Read more about Submission Credits <a style="color: blue" href="https://superteamdao.notion.site/submission-credits" target="_blank">here</a>.`,
      },
    ],
  },
  {
    title: 'Winners and Distributing Rewards',
    subsections: [
      {
        question: 'How do I select winners for a listing?',
        answer: `In the <strong>Submission review</strong> tab, assign your preferred submissions to the appropriate Podium or Bonus spots. Once finalized, click "<strong>Announce Winners</strong>" and proceed to the Payments tab.`,
      },
      {
        question: 'How do I pay the winners?',
        answer: `<div><strong>Option 1: Pay via Earn</strong>
<ol class="list-decimal list-inside space-y-2 pl-5 mt-2">
<li>Go to the <strong>Payments</strong> tab in the listing and click on <strong>"Pay"</strong>.</li>
<li>Connect your wallet when prompted and initiate the transaction using your preferred wallet.</li>
</ol>
</div>
<div class="my-4 text-center font-bold">OR</div>
<div><strong>Option 2: Pay outside of Earn</strong>
<ol class="list-decimal list-inside space-y-2 pl-5 mt-2">
<li>Copy the winner's wallet address from the dashboard and transfer the reward using your preferred method.</li>
<li>To mark the listing as completed on Earn, you'll need to upload the payment link:
    <ul class="list-disc list-inside space-y-2 pl-5 mt-2">
        <li>Go to the <strong>Payments</strong> tab</li>
        <li>Click on <strong>"Paid externally? Click here"</strong></li>
        <li>Add the transaction link for verification</li>
    </ul>
</li>
</ol>
</div>
<br>
<em>Note: To verify the transaction, <strong>the wallet address must match the winners', and the transferred token and token amount must match the specified reward.</strong></em>`,
      },
      {
        question: 'What if I sent a payment outside the platform?',
        answer: `<ol class="list-decimal list-inside space-y-2">
<li>Go to the <strong>Payments</strong> tab</li>
<li>Click on <strong>"Paid externally? Click here"</strong></li>
<li>Add the transaction link for verification</li>
</ol>
<br>
To verify the transaction, the wallet address must match the winner's, and the transferred amount must match the specified reward. Once verified, the listing status will update to Completed.`,
      },
    ],
  },
  {
    title: 'Team & Access Management',
    subsections: [
      {
        question:
          'How can I add or remove team members from my sponsor profile?',
        answer: `Go to <a href="/dashboard/team-settings" style="text-decoration: underline;"><strong>Team Settings</strong></a> in your dashboard. Use the "<strong>Invite Members</strong>" button to send an invitation email to your teammate to add them as a collaborator. You can also remove members at any time.`,
      },
    ],
  },
  {
    title: 'Troubleshooting & Support',
    subsections: [
      {
        question: "I can't connect my wallet. What should I do?",
        answer: `Ensure your wallet is supported and unlocked. Try refreshing the page or reconnecting. If the issue persists, contact <a style="color: blue" href="mailto:support@superteamearn.com" target="_blank">support@superteamearn.com</a>`,
      },
      {
        question: 'I need help with my listing. How can I get in touch?',
        answer: `Email us at <a style="color: blue" href="mailto:support@superteamearn.com" target="_blank">support@superteamearn.com</a> and we'll get back to you ASAP.`,
      },
    ],
  },
] as const;

export default function FAQ() {
  return (
    <SponsorLayout>
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
    </SponsorLayout>
  );
}
