'use client';

import Link from 'next/link';
import { posthog } from 'posthog-js';

import MdArrowForward from '@/components/icons/MdArrowForward';

// A sidebar section's title with its View All link.
export const SectionHeader = ({
  title,
  href,
  event,
}: {
  title: string;
  href: string;
  // Captured on the link's click.
  event?: string;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-400">{title}</span>
    <Link
      href={href}
      className="text-brand-purple flex items-center text-xs font-semibold"
      onClick={event ? () => posthog.capture(event) : undefined}
    >
      View All
      <MdArrowForward className="ml-1" />
    </Link>
  </div>
);
