import * as Effect from 'effect/Effect';

import type { ChapterRegionData } from '@/interface/chapter';
import { canResume, getViewer } from '@/lib/session';
import * as Credits from '@/server/credits';
import * as HomeChapters from '@/server/home-chapters';
import { runtime } from '@/server/runtime';

import { ShellDataProvider } from '@/features/navbar/shell-data';

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
