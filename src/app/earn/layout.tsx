import * as Effect from 'effect/Effect';
import { redirect } from 'next/navigation';

import type { ChapterRegionData } from '@/interface/chapter';
import { requestPath } from '@/lib/request-path';
import { canResume, getViewer } from '@/lib/session';
import * as Credits from '@/server/credits';
import * as HomeChapters from '@/server/home-chapters';
import { runtime } from '@/server/runtime';

import { ShellDataProvider } from '@/features/navbar/shell-data';

// Pages a viewer without a profile may stay on.
const PROFILE_EXEMPT = ['/earn/new', '/earn/sponsor', '/earn/signup'];

// The footer's region picker: Earn's active chapters.
const footerChapters = () =>
  runtime.runPromise(
    HomeChapters.HomeChapters.use((chapters) => chapters.all).pipe(
      Effect.map((all) =>
        all.map((chapter): ChapterRegionData => ({
          ...chapter,
          country: [...chapter.country],
        })),
      ),
      Effect.orElseSucceed((): ChapterRegionData[] => []),
    ),
  );

const creditsOf = (userId: string) =>
  runtime.runPromise(
    Credits.Credits.use((credits) => credits.balance(userId)).pipe(
      Effect.orElseSucceed(() => 0),
    ),
  );

// Every Earn page's shell data (src/layouts/Default.tsx renders the shell
// itself, inside each page): loaded here once, on the server.
export default async function EarnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();
  if (viewer) {
    // Sent on before the page renders; ShellRedirects does the same on
    // client-side navigations, which don't run this layout again.
    const path = (await requestPath()) ?? '';
    const pathname = path.split('?')[0] ?? '';
    if (viewer.isBlocked) {
      if (path && !pathname.startsWith('/earn/blocked')) {
        redirect('/earn/blocked/');
      }
    } else if (
      path &&
      !viewer.isTalentFilled &&
      !viewer.currentSponsorId &&
      !PROFILE_EXEMPT.some((page) => pathname.startsWith(page))
    ) {
      redirect(`/earn/new/?type=forced&originUrl=${encodeURIComponent(path)}`);
    }
  }
  const [resuming, creditBalance, chapters] = await Promise.all([
    viewer ? false : canResume(),
    viewer?.isTalentFilled ? creditsOf(viewer.id) : 0,
    footerChapters(),
  ]);
  return (
    <ShellDataProvider value={{ resuming, creditBalance, chapters }}>
      {children}
    </ShellDataProvider>
  );
}
