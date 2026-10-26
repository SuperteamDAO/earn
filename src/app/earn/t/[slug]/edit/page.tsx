import * as Effect from 'effect/Effect';
import { redirect } from 'next/navigation';

import type { PoW } from '@/interface/pow';
import { Default } from '@/layouts/Default';
import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { signInHref } from '@/lib/safe-next';
import { canResume, getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as TalentDirectory from '@/server/talent-directory';
import * as TalentProfile from '@/server/talent-profile';

import { EditProfileForm } from './edit-profile-form';

export const metadata = pageMetadata({
  title: 'Superteam Earn',
  description: 'Every Solana opportunity in one place!',
});

export default async function EditProfilePage({
  params,
}: PageProps<'/earn/t/[slug]/edit'>) {
  const { slug } = await params;
  const here = `/earn/t/${slug}/edit/`;
  const viewer = await getViewer();
  if (!viewer) {
    if (await canResume()) {
      return (
        <Default>
          <ResumingPage signIn={signInHref(here)} />
        </Default>
      );
    }
    redirect(signInHref(here));
  }
  // Only their own profile; anyone else sees the profile itself.
  if (viewer.username !== decodeURIComponent(slug)) {
    redirect(`/earn/t/${slug}/`);
  }

  const [chapterNames, projects] = await Promise.all([
    runtime.runPromise(
      TalentDirectory.TalentDirectory.use(
        (directory) => directory.chapterNames,
      ).pipe(Effect.orElseSucceed((): ReadonlyArray<string> => [])),
    ),
    runtime.runPromise(
      TalentProfile.TalentProfile.use((profiles) =>
        profiles.projects(viewer.id),
      ),
    ),
  ]);
  const initialPow = projects.map((project): PoW => ({
    ...project,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Earn's stored skill lists
    skills: (project.skills ?? []) as PoW['skills'],
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Earn's stored skill lists
    subSkills: (project.subSkills ?? []) as PoW['subSkills'],
  }));

  return (
    <Default>
      <EditProfileForm chapterNames={chapterNames} initialPow={initialPow} />
    </Default>
  );
}
